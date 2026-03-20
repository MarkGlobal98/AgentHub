const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { exec, spawn } = require('child_process');

const PORT = 3000;
const GATEWAY = 'http://127.0.0.1:18789';
const NUL = process.platform === 'win32' ? '2>NUL' : '2>/dev/null';

/* FIX #12: Validate ALLOWED_ORIGINS — must be non-empty and contain valid URLs */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || `http://localhost:${PORT}`)
  .split(',').map(s => s.trim()).filter(s => {
    try { new URL(s); return true; } catch(e) { return false; }
  });
if (!ALLOWED_ORIGINS.length) {
  console.error('FATAL: ALLOWED_ORIGINS is empty or contains only invalid URLs. Defaulting to localhost.');
  ALLOWED_ORIGINS.push(`http://localhost:${PORT}`);
}
function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return ALLOWED_ORIGINS[0]; // same-origin requests (no Origin header)
  return ALLOWED_ORIGINS.includes(origin) ? origin : 'null'; // 'null' = deny
}
const JSON_H_BASE = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const MAX_BODY = 64 * 1024; // 64 KB max request body

/* FIX #13: Request logger — unique ID per request, structured output */
let _reqSeq = 0;
function reqLog(req) {
  const id = `r-${Date.now().toString(36)}-${(++_reqSeq).toString(36)}`;
  const start = Date.now();
  return {
    id,
    log(status, extra) {
      const ms = Date.now() - start;
      console.log(JSON.stringify({
        ts: new Date().toISOString(), rid: id,
        method: req.method, path: req.url?.split('?')[0],
        status, ms, ip: req.socket?.remoteAddress,
        ...(extra || {})
      }));
    }
  };
}

/* FIX #15: Normalize cache keys — whitelist allowed CLI subcommands, hash the rest */
const ALLOWED_CACHE_CMDS = new Set([
  'skills list --json',
  'agents list --json',
  'config get agents --json',
  'config get channels --json'
]);
function cacheKey(cmd) {
  if (ALLOWED_CACHE_CMDS.has(cmd)) return `cli:${cmd}`;
  return `cli:${crypto.createHash('sha256').update(cmd).digest('hex').slice(0, 16)}`;
}

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon'
};

/* Cache for CLI results (5-min TTL, auto-sweep, integrity-checked) */
const cache = {};
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 50; // max entries — hard cap against unbounded growth
function _cacheHash(data) { return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16); }
function cacheSet(key, data) {
  if (Object.keys(cache).length >= CACHE_MAX) return;
  cache[key] = { data, ts: Date.now(), hash: _cacheHash(data) };
}
function cacheGet(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts >= CACHE_TTL) { delete cache[key]; return null; }
  // FIX #10: Integrity check — discard corrupted entries
  if (_cacheHash(entry.data) !== entry.hash) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'cache_corrupt', key }));
    delete cache[key];
    return null;
  }
  return entry.data;
}
setInterval(() => {
  const now = Date.now();
  for (const key in cache) {
    if (now - cache[key].ts >= CACHE_TTL) delete cache[key];
  }
}, CACHE_TTL);

function cleanJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  // Strip ANSI escape codes (full CSI sequences)
  raw = raw.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
  // Find first { that looks like JSON start (must be at line start or after newline)
  const firstObj = raw.search(/(?:^|\n)\s*\{/);
  // For arrays, require [ followed by JSON-like content: whitespace/newline then { or " or digit
  // This avoids matching log lines like [plugins] or [info]
  let firstArr = -1;
  const arrMatch = raw.match(/(?:^|\n)\s*\[[\s\n]*[{\["0-9ntf]/);
  if (arrMatch) firstArr = raw.indexOf(arrMatch[0]);
  let start = -1;
  if (firstObj >= 0 && firstArr >= 0) start = Math.min(firstObj, firstArr);
  else if (firstObj >= 0) start = firstObj;
  else if (firstArr >= 0) start = firstArr;
  if (start < 0) return null;
  let json = raw.substring(start).trim();
  // Find the matching closing bracket — scan for balanced braces/brackets
  const opener = json[0];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0, inStr = false, escape = false, endIdx = -1;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inStr) { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  if (endIdx < 0) return null; // unbalanced — not valid JSON
  json = json.substring(0, endIdx + 1);
  // Final validation: must actually parse as JSON
  try { JSON.parse(json); return json; }
  catch(e) { return null; }
}

/* Unified safe response writer — prevents write-after-close crashes */
function safeEnd(res, statusCode, headers, body) {
  if (res.headersSent || res.destroyed || res.writableEnded) return false;
  try { res.writeHead(statusCode, headers); res.end(body); return true; }
  catch(e) { return false; }
}

/* Helper: run openclaw CLI with caching */
function clawExec(cmd, res, headers, rl, timeout = 60000, retries = 1) {
  const key = cacheKey(cmd);
  // Check cache (with integrity verification)
  const cached = cacheGet(key);
  if (cached) {
    rl.log(200, { cache: 'hit' });
    safeEnd(res, 200, headers, cached);
    return;
  }
  exec(`openclaw ${cmd} ${NUL}`, { timeout, maxBuffer: 1024 * 1024 }, (err, stdout) => {
    if (res.destroyed || res.writableEnded) return; // response already closed — abort
    const json = cleanJson(stdout);
    if (!json && retries > 0) {
      if (res.headersSent || res.destroyed) return; // don't retry if response is gone
      setTimeout(() => clawExec(cmd, res, headers, rl, timeout, retries - 1), 3000);
      return;
    }
    if (json) {
      cacheSet(key, json);
      rl.log(200, { cache: 'miss' });
      safeEnd(res, 200, headers, json);
    } else {
      rl.log(500, { reason: 'cli_no_output' });
      safeEnd(res, 500, headers, JSON.stringify({ ok: false, error: 'Service temporarily unavailable' }));
    }
  });
}

/* Pre-warm cache on startup — CLI is slow on first call */
function warmCache() {
  console.log('  Warming cache: skills, agents, config...');
  ['skills list --json', 'agents list --json'].forEach(cmd => {
    exec(`openclaw ${cmd} ${NUL}`, { timeout: 120000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      const json = cleanJson(stdout);
      if (json) { cacheSet(cacheKey(cmd), json); console.log('  Cache ready:', cmd.split(' ')[0]); }
    });
  });
}
warmCache();

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]; // Strip query strings for matching
  const JSON_H = { ...JSON_H_BASE, 'Access-Control-Allow-Origin': getCorsOrigin(req) };
  const rl = reqLog(req); // FIX #13: per-request logging

  // ── CLI-backed endpoints ──

  if (urlPath === '/api/skills') {
    clawExec('skills list --json', res, JSON_H, rl);
    return;
  }

  if (urlPath === '/api/agents') {
    clawExec('agents list --json', res, JSON_H, rl);
    return;
  }

  if (urlPath === '/api/config') {
    // Run two CLI commands and merge results
    function parseJson(raw) {
      const s = cleanJson(raw);
      if (!s) return null;
      try { return JSON.parse(s); } catch(e) { return null; }
    }
    let done = 0, agentsData = null, channelsData = null;
    const finish = () => {
      if (++done < 2) return;
      rl.log(200);
      safeEnd(res, 200, JSON_H, JSON.stringify({ agents: agentsData || {}, channels: channelsData || {} }));
    };
    exec(`openclaw config get agents --json ${NUL}`, { timeout: 30000 }, (err, stdout) => {
      if (res.destroyed || res.writableEnded) return;
      agentsData = parseJson(stdout);
      if (!agentsData) setTimeout(() => {
        if (res.destroyed || res.writableEnded) return;
        exec(`openclaw config get agents --json ${NUL}`, { timeout: 30000 }, (e2, s2) => { agentsData = parseJson(s2); finish(); });
      }, 3000);
      else finish();
    });
    exec(`openclaw config get channels --json ${NUL}`, { timeout: 30000 }, (err, stdout) => {
      if (res.destroyed || res.writableEnded) return;
      channelsData = parseJson(stdout);
      if (!channelsData) setTimeout(() => {
        if (res.destroyed || res.writableEnded) return;
        exec(`openclaw config get channels --json ${NUL}`, { timeout: 30000 }, (e2, s2) => { channelsData = parseJson(s2); finish(); });
      }, 3000);
      else finish();
    });
    return;
  }

  // ── Agent chat ──

  if (urlPath === '/api/agent' && req.method === 'POST') {
    // Reject oversized Content-Length upfront before buffering any data
    const declaredLen = parseInt(req.headers['content-length'], 10);
    if (declaredLen > MAX_BODY) {
      rl.log(413);
      safeEnd(res, 413, JSON_H, JSON.stringify({ ok: false, error: 'Request body too large' }));
      req.destroy();
      return;
    }
    let body = '';
    let bodySize = 0;
    let rejected = false;
    req.on('data', c => {
      bodySize += c.length;
      if (bodySize > MAX_BODY) {
        if (!rejected) {
          rejected = true;
          rl.log(413);
          safeEnd(res, 413, JSON_H, JSON.stringify({ ok: false, error: 'Request body too large' }));
          req.destroy();
        }
        return;
      }
      body += c;
    });
    req.on('end', () => {
      if (rejected || res.writableEnded) return;
      try {
        const parsed = JSON.parse(body);
        const message = parsed.message;
        const agent = parsed.agent;
        // Input validation
        if (typeof message !== 'string' || !message.trim()) {
          rl.log(400, { reason: 'empty_message' });
          safeEnd(res, 400, JSON_H, JSON.stringify({ ok: false, error: 'message must be a non-empty string' }));
          return;
        }
        if (message.length > 10000) {
          rl.log(400, { reason: 'message_too_long' });
          safeEnd(res, 400, JSON_H, JSON.stringify({ ok: false, error: 'message too long (max 10000 chars)' }));
          return;
        }
        // Validate agent name — alphanumeric, hyphens, underscores only
        const agentName = (typeof agent === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(agent)) ? agent : 'main';
        // FIX: use spawn with args array — no shell, no injection, streaming output
        const child = spawn('openclaw', ['agent', '--message', message.trim(), '--agent', agentName, '--json']);
        const MAX_STDOUT = 1024 * 1024; // 1MB cap
        const MAX_STDERR = 64 * 1024;   // 64KB cap
        const stdoutChunks = [];
        const stderrChunks = [];
        let stdoutLen = 0, stderrLen = 0;
        let timedOut = false;
        const killTimer = setTimeout(() => { timedOut = true; child.kill(); }, 120000);
        child.stdout.on('data', c => {
          if (stdoutLen >= MAX_STDOUT) { child.stdout.pause(); return; } // stop reading to apply backpressure
          stdoutLen += c.length;
          stdoutChunks.push(c);
        });
        child.stderr.on('data', c => {
          if (stderrLen >= MAX_STDERR) return;
          stderrLen += c.length;
          stderrChunks.push(c);
        });
        child.on('close', (code) => {
          clearTimeout(killTimer);
          if (res.headersSent || res.destroyed || res.writableEnded) return;
          const stdout = Buffer.concat(stdoutChunks).toString('utf8');
          const stderr = Buffer.concat(stderrChunks).toString('utf8');
          // Timeout
          if (timedOut) {
            rl.log(504, { reason: 'agent_timeout' });
            safeEnd(res, 504, JSON_H, JSON.stringify({ ok: false, error: 'Agent request timed out' }));
            return;
          }
          // FIX #11: Non-zero exit — log internal details server-side, send generic message to client
          if (code !== 0 && code !== null) {
            rl.log(502, { reason: 'cli_exit', code, stderr: stderr.slice(0, 200) });
            safeEnd(res, 502, JSON_H, JSON.stringify({ ok: false, error: 'Agent processing failed' }));
            return;
          }
          const json = cleanJson(stdout);
          if (json) {
            try {
              const parsed = JSON.parse(json);
              const payloads = parsed.result?.payloads || [];
              const text = payloads.map(p => p.text || '').filter(Boolean).join('\n') || parsed.summary || '';
              rl.log(200);
              safeEnd(res, 200, JSON_H, JSON.stringify({ ok: true, text, raw: parsed }));
            } catch(e) {
              rl.log(500, { reason: 'invalid_json' });
              safeEnd(res, 500, JSON_H, JSON.stringify({ ok: false, error: 'Agent returned invalid response' }));
            }
          } else {
            const out = stdout?.trim() || '';
            if (!out || out.toLowerCase().includes('error') || out.toLowerCase().includes('not found')) {
              rl.log(502, { reason: 'no_json_output' });
              safeEnd(res, 502, JSON_H, JSON.stringify({ ok: false, error: 'No response from agent' }));
            } else {
              rl.log(200);
              safeEnd(res, 200, JSON_H, JSON.stringify({ ok: true, text: out }));
            }
          }
        });
        child.on('error', (err) => {
          clearTimeout(killTimer);
          rl.log(500, { reason: 'spawn_error', detail: err.message });
          safeEnd(res, 500, JSON_H, JSON.stringify({ ok: false, error: 'Agent service unavailable' }));
        });
      } catch(e) {
        rl.log(400, { reason: 'bad_json' });
        safeEnd(res, 400, JSON_H, JSON.stringify({ ok: false, error: 'Invalid request body' }));
      }
    });
    return;
  }

  // ── GitHub Trending ──

  if (urlPath === '/api/trending') {
    // Check cache first (60s TTL for trending)
    const trendKey = 'gh:trending';
    const trendCached = cacheGet(trendKey);
    if (trendCached) { rl.log(200, { cache: 'hit' }); safeEnd(res, 200, JSON_H, trendCached); return; }

    const d = new Date(); d.setDate(d.getDate() - 7);
    const since = d.toISOString().split('T')[0];
    const ghUrl = `https://api.github.com/search/repositories?q=stars:>5000+topic:ai-agents&sort=stars&order=desc&per_page=12`;

    function fetchGH(retryCount) {
      const ghReq = https.get(ghUrl, { headers: { 'User-Agent': 'AgentHub/5.0', 'Accept': 'application/json' }, timeout: 15000 }, (ghRes) => {
        // FIX #14: Handle GitHub rate limiting (403 with Retry-After or X-RateLimit headers)
        if (ghRes.statusCode === 403 || ghRes.statusCode === 429) {
          ghRes.resume(); // drain response
          const retryAfter = parseInt(ghRes.headers['retry-after'], 10);
          const rateLimitReset = parseInt(ghRes.headers['x-ratelimit-reset'], 10);
          let waitMs = 60000; // default 60s
          if (retryAfter > 0) waitMs = retryAfter * 1000;
          else if (rateLimitReset > 0) waitMs = Math.max(0, (rateLimitReset * 1000) - Date.now());
          waitMs = Math.min(waitMs, 120000); // cap at 2min
          if (retryCount > 0) {
            rl.log(429, { reason: 'gh_rate_limit', retryIn: Math.round(waitMs / 1000) });
            setTimeout(() => { if (!res.destroyed && !res.writableEnded) fetchGH(retryCount - 1); }, waitMs);
          } else {
            rl.log(429, { reason: 'gh_rate_limit_exhausted' });
            safeEnd(res, 429, JSON_H, JSON.stringify({ ok: false, error: 'GitHub API rate limit exceeded. Try again later.' }));
          }
          return;
        }
        const MAX_GH_DATA = 512 * 1024;
        let data = '';
        let dataLen = 0;
        ghRes.on('data', c => {
          dataLen += c.length;
          if (dataLen > MAX_GH_DATA) { ghRes.destroy(); return; }
          data += c;
        });
        ghRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const repos = (parsed.items || []).map(r => ({
              name: r.full_name, description: r.description || '',
              language: r.language || 'Unknown', stars: r.stargazers_count,
              url: r.html_url, forks: r.forks_count, updated: r.pushed_at
            }));
            const body = JSON.stringify(repos);
            cacheSet(trendKey, body); // cache trending results
            rl.log(200, { cache: 'miss', remaining: ghRes.headers['x-ratelimit-remaining'] });
            safeEnd(res, 200, JSON_H, body);
          } catch(e) {
            rl.log(500, { reason: 'gh_parse_error' });
            safeEnd(res, 500, JSON_H, JSON.stringify({ ok: false, error: 'Failed to process trending data' }));
          }
        });
      });
      ghReq.on('timeout', () => {
        ghReq.destroy();
        rl.log(504, { reason: 'gh_timeout' });
        safeEnd(res, 504, JSON_H, JSON.stringify({ ok: false, error: 'GitHub API timeout' }));
      });
      ghReq.on('error', (e) => {
        rl.log(500, { reason: 'gh_error' });
        safeEnd(res, 500, JSON_H, JSON.stringify({ ok: false, error: 'Could not reach GitHub API' }));
      });
    }
    fetchGH(1); // allow 1 retry on rate limit
    return;
  }

  // ── Gateway proxy: /api/* → gateway ──

  if (urlPath.startsWith('/api/')) {
    const target = GATEWAY + req.url.replace('/api', '');
    // Reject oversized Content-Length upfront
    const declaredLen = parseInt(req.headers['content-length'], 10);
    if (declaredLen > MAX_BODY) {
      rl.log(413);
      safeEnd(res, 413, JSON_H, JSON.stringify({ ok: false, error: 'Request body too large' }));
      req.destroy();
      return;
    }
    let body = '';
    let bodySize = 0;
    let rejected = false;
    req.on('data', c => {
      bodySize += c.length;
      if (bodySize > MAX_BODY) {
        if (!rejected) {
          rejected = true;
          safeEnd(res, 413, JSON_H, JSON.stringify({ ok: false, error: 'Request body too large' }));
          req.destroy();
        }
        return;
      }
      body += c;
    });
    req.on('end', () => {
      if (rejected || res.writableEnded) return;
      let u;
      try { u = new URL(target); } catch(e) {
        rl.log(400, { reason: 'bad_proxy_target' });
        safeEnd(res, 400, JSON_H, JSON.stringify({ ok: false, error: 'Invalid request' }));
        return;
      }
      // Whitelist safe request headers — never forward Authorization, Cookie, etc.
      const SAFE_REQ_HEADERS = ['content-type', 'accept', 'accept-language'];
      const proxyHeaders = {};
      for (const h of SAFE_REQ_HEADERS) {
        if (req.headers[h]) proxyHeaders[h] = req.headers[h];
      }
      if (!proxyHeaders['content-type']) proxyHeaders['content-type'] = 'application/json';
      const proxy = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: req.method, headers: proxyHeaders, timeout: 30000 }, (pRes) => {
        // Only forward safe response headers
        const safeRespHeaders = { 'Access-Control-Allow-Origin': getCorsOrigin(req) };
        if (pRes.headers['content-type']) safeRespHeaders['Content-Type'] = pRes.headers['content-type'];
        if (pRes.headers['content-length']) safeRespHeaders['Content-Length'] = pRes.headers['content-length'];
        if (!res.headersSent && !res.destroyed) {
          res.writeHead(pRes.statusCode, safeRespHeaders);
          pRes.pipe(res);
        } else {
          pRes.resume(); // drain response to free resources
        }
      });
      proxy.on('timeout', () => {
        proxy.destroy();
        rl.log(504, { reason: 'gateway_timeout' });
        safeEnd(res, 504, JSON_H, JSON.stringify({ ok: false, error: 'Gateway timeout' }));
      });
      proxy.on('error', () => {
        rl.log(502, { reason: 'gateway_error' });
        safeEnd(res, 502, JSON_H, JSON.stringify({ ok: false, error: 'Gateway unavailable' }));
      });
      if (body) proxy.write(body);
      proxy.end();
    });
    return;
  }

  // ── CORS preflight ──

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': getCorsOrigin(req), 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' });
    res.end();
    return;
  }

  // ── Static files ──

  const reqPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  // FIX: prevent path traversal — resolved path must be within __dirname
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(__dirname))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const ext = path.extname(resolved);
  fs.readFile(resolved, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  AgentHub running at http://localhost:${PORT}`);
  console.log(`  API endpoints: /api/skills, /api/agents, /api/config, /api/trending, /api/agent`);
  console.log(`  Gateway proxy: /api/* → ${GATEWAY}`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
