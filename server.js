const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { exec, spawn } = require('child_process');

const PORT = 3000;
const GATEWAY = 'http://127.0.0.1:18789';
const NUL = process.platform === 'win32' ? '2>NUL' : '2>/dev/null';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGINS || `http://localhost:${PORT}`;
const JSON_H = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Cache-Control': 'no-store' };
const MAX_BODY = 64 * 1024; // 64 KB max request body

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon'
};

/* Cache for CLI results (5-min TTL, auto-sweep) */
const cache = {};
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 50; // max entries — hard cap against unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const key in cache) {
    if (now - cache[key].ts >= CACHE_TTL) delete cache[key];
  }
}, CACHE_TTL);

function cleanJson(raw) {
  if (!raw) return null;
  // Strip ANSI escape codes
  raw = raw.replace(/\x1b\[[0-9;]*m/g, '');
  // Find first { or JSON array [ (skip leading plugin log lines like [plugins])
  const firstObj = raw.indexOf('\n{');
  // For arrays, ensure it's actually JSON (e.g. \n[\n or \n[{) not log lines like \n[plugins]
  let firstArr = -1;
  const arrMatch = raw.match(/\n(\[[\s\n{"])/);
  if (arrMatch) firstArr = raw.indexOf(arrMatch[0]);
  let start = -1;
  if (firstObj >= 0 && firstArr >= 0) start = Math.min(firstObj, firstArr);
  else if (firstObj >= 0) start = firstObj;
  else if (firstArr >= 0) start = firstArr;
  // Also check if the raw string itself starts with { or [
  const trimmed = raw.trim();
  if (start < 0 && (trimmed.startsWith('{') || trimmed.startsWith('['))) start = raw.indexOf(trimmed[0]);
  if (start < 0) return null;
  let json = raw.substring(start).trim();
  // Strip trailing non-JSON lines
  const endObj = json.lastIndexOf('\n}');
  const endArr = json.lastIndexOf('\n]');
  const endPos = Math.max(endObj, endArr);
  if (endPos > 0) json = json.substring(0, endPos + 2);
  json = json.trim();
  if (!json.startsWith('{') && !json.startsWith('[')) return null;
  return json;
}

/* Helper: run openclaw CLI with caching */
function clawExec(cmd, res, timeout = 60000, retries = 1) {
  // Check cache
  const cached = cache[cmd];
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
    res.writeHead(200, JSON_H);
    res.end(cached.data);
    return;
  }
  exec(`openclaw ${cmd} ${NUL}`, { timeout, maxBuffer: 1024 * 1024 }, (err, stdout) => {
    const json = cleanJson(stdout);
    if (!json && retries > 0) {
      setTimeout(() => clawExec(cmd, res, timeout, retries - 1), 3000);
      return;
    }
    if (json) {
      if (Object.keys(cache).length < CACHE_MAX) cache[cmd] = { data: json, ts: Date.now() };
      res.writeHead(200, JSON_H);
      res.end(json);
    } else {
      res.writeHead(500, JSON_H);
      res.end(JSON.stringify({ ok: false, error: err?.message || 'No output' }));
    }
  });
}

/* Pre-warm cache on startup — CLI is slow on first call */
function warmCache() {
  console.log('  Warming cache: skills, agents, config...');
  ['skills list --json', 'agents list --json'].forEach(cmd => {
    exec(`openclaw ${cmd} ${NUL}`, { timeout: 120000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      const json = cleanJson(stdout);
      if (json) { cache[cmd] = { data: json, ts: Date.now() }; console.log('  Cache ready:', cmd.split(' ')[0]); }
    });
  });
}
warmCache();

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]; // Strip query strings for matching

  // ── CLI-backed endpoints ──

  if (urlPath === '/api/skills') {
    clawExec('skills list --json', res);
    return;
  }

  if (urlPath === '/api/agents') {
    clawExec('agents list --json', res);
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
      res.writeHead(200, JSON_H);
      res.end(JSON.stringify({ agents: agentsData || {}, channels: channelsData || {} }));
    };
    exec(`openclaw config get agents --json ${NUL}`, { timeout: 30000 }, (err, stdout) => {
      agentsData = parseJson(stdout);
      if (!agentsData) setTimeout(() => exec(`openclaw config get agents --json ${NUL}`, { timeout: 30000 }, (e2, s2) => { agentsData = parseJson(s2); finish(); }), 3000);
      else finish();
    });
    exec(`openclaw config get channels --json ${NUL}`, { timeout: 30000 }, (err, stdout) => {
      channelsData = parseJson(stdout);
      if (!channelsData) setTimeout(() => exec(`openclaw config get channels --json ${NUL}`, { timeout: 30000 }, (e2, s2) => { channelsData = parseJson(s2); finish(); }), 3000);
      else finish();
    });
    return;
  }

  // ── Agent chat ──

  if (urlPath === '/api/agent' && req.method === 'POST') {
    let body = '';
    let bodySize = 0;
    req.on('data', c => {
      bodySize += c.length;
      if (bodySize > MAX_BODY) { req.destroy(); return; }
      body += c;
    });
    req.on('end', () => {
      if (bodySize > MAX_BODY) {
        res.writeHead(413, JSON_H);
        res.end(JSON.stringify({ ok: false, error: 'Request body too large' }));
        return;
      }
      try {
        const parsed = JSON.parse(body);
        const message = parsed.message;
        const agent = parsed.agent;
        // Input validation
        if (typeof message !== 'string' || !message.trim()) {
          res.writeHead(400, JSON_H);
          res.end(JSON.stringify({ ok: false, error: 'message must be a non-empty string' }));
          return;
        }
        if (message.length > 10000) {
          res.writeHead(400, JSON_H);
          res.end(JSON.stringify({ ok: false, error: 'message too long (max 10000 chars)' }));
          return;
        }
        // Validate agent name — alphanumeric, hyphens, underscores only
        const agentName = (typeof agent === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(agent)) ? agent : 'main';
        // FIX: use spawn with args array — no shell, no injection, streaming output
        const child = spawn('openclaw', ['agent', '--message', message.trim(), '--agent', agentName, '--json']);
        let stdout = '', stderr = '';
        let timedOut = false;
        const killTimer = setTimeout(() => { timedOut = true; child.kill(); }, 120000);
        child.stdout.on('data', c => { if (stdout.length < 1024 * 1024) stdout += c; });
        child.stderr.on('data', c => { if (stderr.length < 64 * 1024) stderr += c; });
        child.on('close', (code) => {
          clearTimeout(killTimer);
          if (res.headersSent) return;
          // Timeout
          if (timedOut) {
            res.writeHead(504, JSON_H);
            res.end(JSON.stringify({ ok: false, error: 'Agent request timed out (120s)' }));
            return;
          }
          // Non-zero exit code = process failure
          if (code !== 0 && code !== null) {
            const errMsg = stderr.trim() || stdout.trim() || 'openclaw exited with code ' + code;
            res.writeHead(502, JSON_H);
            res.end(JSON.stringify({ ok: false, error: errMsg }));
            return;
          }
          const json = cleanJson(stdout);
          if (json) {
            try {
              const parsed = JSON.parse(json);
              const payloads = parsed.result?.payloads || [];
              const text = payloads.map(p => p.text || '').filter(Boolean).join('\n') || parsed.summary || '';
              res.writeHead(200, JSON_H);
              res.end(JSON.stringify({ ok: true, text, raw: parsed }));
            } catch(e) {
              res.writeHead(500, JSON_H);
              res.end(JSON.stringify({ ok: false, error: 'Invalid JSON from openclaw' }));
            }
          } else {
            // No JSON found — check if stdout looks like an error
            const out = stdout?.trim() || '';
            if (!out || out.toLowerCase().includes('error') || out.toLowerCase().includes('not found')) {
              res.writeHead(502, JSON_H);
              res.end(JSON.stringify({ ok: false, error: out || 'No response from openclaw' }));
            } else {
              res.writeHead(200, JSON_H);
              res.end(JSON.stringify({ ok: true, text: out }));
            }
          }
        });
        child.on('error', (err) => {
          clearTimeout(killTimer);
          if (!res.headersSent) {
            res.writeHead(500, JSON_H);
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
      } catch(e) {
        res.writeHead(400, JSON_H);
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // ── GitHub Trending ──

  if (urlPath === '/api/trending') {
    const d = new Date(); d.setDate(d.getDate() - 7);
    const since = d.toISOString().split('T')[0];
    const url = `https://api.github.com/search/repositories?q=stars:>5000+topic:ai-agents&sort=stars&order=desc&per_page=12`;
    https.get(url, { headers: { 'User-Agent': 'AgentHub/5.0', 'Accept': 'application/json' } }, (ghRes) => {
      let data = '';
      ghRes.on('data', c => data += c);
      ghRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const repos = (parsed.items || []).map(r => ({
            name: r.full_name, description: r.description || '',
            language: r.language || 'Unknown', stars: r.stargazers_count,
            url: r.html_url, forks: r.forks_count, updated: r.pushed_at
          }));
          res.writeHead(200, JSON_H);
          res.end(JSON.stringify(repos));
        } catch(e) {
          res.writeHead(500, JSON_H);
          res.end(JSON.stringify({ ok: false, error: 'Failed to parse GitHub response' }));
        }
      });
    }).on('error', (e) => {
      res.writeHead(500, JSON_H);
      res.end(JSON.stringify({ ok: false, error: e.message }));
    });
    return;
  }

  // ── Gateway proxy: /api/* → gateway ──

  if (urlPath.startsWith('/api/')) {
    const target = GATEWAY + req.url.replace('/api', '');
    let body = '';
    let bodySize = 0;
    req.on('data', c => {
      bodySize += c.length;
      if (bodySize > MAX_BODY) { req.destroy(); return; }
      body += c;
    });
    req.on('end', () => {
      if (bodySize > MAX_BODY) {
        res.writeHead(413, JSON_H);
        res.end(JSON.stringify({ ok: false, error: 'Request body too large' }));
        return;
      }
      let u;
      try { u = new URL(target); } catch(e) {
        res.writeHead(400, JSON_H);
        res.end(JSON.stringify({ ok: false, error: 'Invalid proxy target' }));
        return;
      }
      const headers = { 'Content-Type': 'application/json' };
      if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
      const proxy = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: req.method, headers }, (pRes) => {
        // FIX: only forward safe response headers
        const safeHeaders = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN };
        if (pRes.headers['content-type']) safeHeaders['Content-Type'] = pRes.headers['content-type'];
        if (pRes.headers['content-length']) safeHeaders['Content-Length'] = pRes.headers['content-length'];
        res.writeHead(pRes.statusCode, safeHeaders);
        pRes.pipe(res);
      });
      proxy.on('error', () => {
        if (!res.headersSent) { res.writeHead(502, JSON_H); res.end(JSON.stringify({ ok: false, error: 'Gateway unavailable' })); }
      });
      if (body) proxy.write(body);
      proxy.end();
    });
    return;
  }

  // ── CORS preflight ──

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' });
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
