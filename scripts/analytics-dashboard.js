#!/usr/bin/env node
// HabiCard Analytics Dashboard — zero npm dependencies
// Usage: node analytics-dashboard.js
// Opens at: http://localhost:3001

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Env ──────────────────────────────────────────────────────────────────────

function loadEnv() {
  const content = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

let env;
try { env = loadEnv(); }
catch { console.error('Error: Could not read .env file.'); process.exit(1); }

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY  = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

function httpsRequest(method, urlStr, bodyObj, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const body = bodyObj ? JSON.stringify(bodyObj) : null;
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
        ...extraHeaders,
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(text) }); }
        catch { reject(new Error(`JSON parse error (HTTP ${res.statusCode}): ${text.slice(0, 400)}`)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const get  = (url, h)      => httpsRequest('GET',  url, null, h);
const post = (url, body, h) => httpsRequest('POST', url, body, h);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}

async function fetchAllAuthUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { status, data } = await get(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`
    );
    if (status !== 200) throw new Error(`Auth API ${status}: ${JSON.stringify(data).slice(0, 300)}`);
    const batch = Array.isArray(data.users) ? data.users : [];
    users.push(...batch);
    if (batch.length < 200) break;
    page++;
  }
  return users;
}

async function resendInvite(email) {
  const { status, data } = await post(
    `${SUPABASE_URL}/auth/v1/admin/generate_link`,
    { type: 'invite', email }
  );
  if (status !== 200) {
    const msg = data?.msg || data?.message || data?.error_description || JSON.stringify(data);
    throw new Error(msg);
  }
  return data;
}

async function fetchRecentCompletions(days = 30) {
  const since = daysAgo(days);
  const rows = [];
  let offset = 0;
  const limit = 2000;
  while (true) {
    const { status, data } = await get(
      `${SUPABASE_URL}/rest/v1/completions?select=date_key,user_id&date_key=gte.${since}&is_completed=eq.true&limit=${limit}&offset=${offset}`
    );
    if (status !== 200) throw new Error(`Completions API ${status}: ${JSON.stringify(data).slice(0, 300)}`);
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

// ── Stats computation ─────────────────────────────────────────────────────────

async function computeStats() {
  const [authUsers, completions] = await Promise.all([
    fetchAllAuthUsers(),
    fetchRecentCompletions(30),
  ]);

  const totalUsers    = authUsers.length;
  const neverSignedInUsers = authUsers
    .filter(u => !u.last_sign_in_at)
    .map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const neverSignedIn = neverSignedInUsers.length;

  const activeSet    = new Set(completions.map(c => c.user_id));
  const activeUsers  = activeSet.size;
  const inactiveUsers = totalUsers - activeUsers;
  const dormantUsers  = Math.max(0, inactiveUsers - neverSignedIn);

  // signups per day (last 30 days)
  const since = daysAgo(30);
  const signupsByDay = {};
  for (const u of authUsers) {
    const day = u.created_at?.split('T')[0];
    if (day && day >= since) signupsByDay[day] = (signupsByDay[day] || 0) + 1;
  }

  // daily completions + DAU
  const dailyMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    dailyMap[d] = { date: d, completions: 0, users: new Set() };
  }
  for (const c of completions) {
    if (dailyMap[c.date_key]) {
      dailyMap[c.date_key].completions++;
      dailyMap[c.date_key].users.add(c.user_id);
    }
  }
  const daily = Object.values(dailyMap).map(d => ({
    date:        d.date,
    completions: d.completions,
    dau:         d.users.size,
    signups:     signupsByDay[d.date] || 0,
  }));

  const totalSignups30d = daily.reduce((s, d) => s + d.signups, 0);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    neverSignedIn,
    neverSignedInUsers,
    dormantUsers,
    totalCompletions30d: completions.length,
    avgCompletions: activeUsers > 0 ? Math.round(completions.length / activeUsers) : 0,
    totalSignups30d,
    daily,
  };
}

// ── HTML template ─────────────────────────────────────────────────────────────

function renderHTML(stats) {
  const labels     = JSON.stringify(stats.daily.map(d => d.date.slice(5)));
  const dauData    = JSON.stringify(stats.daily.map(d => d.dau));
  const compData   = JSON.stringify(stats.daily.map(d => d.completions));
  const signupData = JSON.stringify(stats.daily.map(d => d.signups));
  const now        = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HabiCard Analytics</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0b0b12;color:#e2e8f0;min-height:100vh}
header{padding:22px 28px 16px;border-bottom:1px solid #181827}
header h1{font-size:1.25rem;font-weight:700;color:#c084fc;letter-spacing:-.01em}
header p{color:#475569;font-size:.78rem;margin-top:3px}
.metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px;padding:20px 28px}
.m{background:#111120;border:1px solid #1c1c32;border-radius:10px;padding:14px 16px}
.m .l{font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:#475569;margin-bottom:8px}
.m .v{font-size:1.85rem;font-weight:700;line-height:1.1}
.m .s{font-size:.7rem;color:#475569;margin-top:4px;line-height:1.4}
.pu .v{color:#c084fc}.gr .v{color:#4ade80}.ye .v{color:#fbbf24}
.re .v{color:#f87171}.bl .v{color:#60a5fa}.te .v{color:#2dd4bf}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 28px 28px}
.cc{background:#111120;border:1px solid #1c1c32;border-radius:10px;padding:16px 18px}
.cc h3{font-size:.69rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px}
canvas{max-height:175px}
@media(max-width:680px){.charts{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}}
.refresh{position:fixed;bottom:18px;right:18px;background:#c084fc;color:#0b0b12;border:none;padding:7px 16px;border-radius:7px;cursor:pointer;font-weight:700;font-size:.78rem;letter-spacing:.02em}
.refresh:hover{background:#d8b4fe}
.note{color:#334155;font-size:.68rem;padding:0 28px 8px}
.panel{margin:0 28px 32px;background:#111120;border:1px solid #1c1c32;border-radius:10px;overflow:hidden}
.panel-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #1c1c32}
.panel-hd h2{font-size:.82rem;font-weight:700;color:#e2e8f0}
.panel-hd .badge{background:#f8717122;color:#f87171;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px}
.panel-hd .send-all{background:#c084fc;color:#0b0b12;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:.75rem}
.panel-hd .send-all:hover{background:#d8b4fe}
.panel-hd .send-all:disabled{opacity:.4;cursor:not-allowed}
.panel-note{padding:8px 18px;font-size:.7rem;color:#475569;border-bottom:1px solid #181827}
table{width:100%;border-collapse:collapse}
th{font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#475569;padding:9px 18px;text-align:left;border-bottom:1px solid #181827}
td{font-size:.8rem;padding:9px 18px;border-bottom:1px solid #181827;color:#cbd5e1}
td.email{color:#e2e8f0;font-weight:500}
td.date{color:#475569;font-size:.75rem}
td.status span{font-size:.72rem;padding:2px 8px;border-radius:20px;font-weight:600}
.st-idle{background:#1c1c32;color:#475569}
.st-sending{background:#fbbf2422;color:#fbbf24}
.st-ok{background:#4ade8022;color:#4ade80}
.st-err{background:#f8717122;color:#f87171}
.send-btn{background:transparent;border:1px solid #2d2d44;color:#94a3b8;padding:4px 12px;border-radius:5px;cursor:pointer;font-size:.75rem}
.send-btn:hover:not(:disabled){border-color:#c084fc;color:#c084fc}
.send-btn:disabled{opacity:.35;cursor:not-allowed}
tr:last-child td{border-bottom:none}
</style>
</head>
<body>
<header>
  <h1>HabiCard Analytics</h1>
  <p>Last 30 days &mdash; ${now}</p>
</header>
<div class="metrics">
  <div class="m pu">
    <div class="l">Total Users</div>
    <div class="v">${stats.totalUsers.toLocaleString()}</div>
    <div class="s">all time registrations</div>
  </div>
  <div class="m gr">
    <div class="l">Active Users</div>
    <div class="v">${stats.activeUsers.toLocaleString()}</div>
    <div class="s">tracked a habit in last 30d</div>
  </div>
  <div class="m ye">
    <div class="l">Dormant Users</div>
    <div class="v">${stats.dormantUsers.toLocaleString()}</div>
    <div class="s">signed in, no activity in 30d</div>
  </div>
  <div class="m re">
    <div class="l">Never Signed In</div>
    <div class="v">${stats.neverSignedIn.toLocaleString()}</div>
    <div class="s">registered but never logged in</div>
  </div>
  <div class="m bl">
    <div class="l">Habit Events (30d)</div>
    <div class="v">${stats.totalCompletions30d.toLocaleString()}</div>
    <div class="s">total habit completions logged</div>
  </div>
  <div class="m te">
    <div class="l">New Signups (30d)</div>
    <div class="v">${stats.totalSignups30d.toLocaleString()}</div>
    <div class="s">avg ${stats.avgCompletions} completions / active user</div>
  </div>
</div>
<p class="note">DAU = users who tracked &ge;1 habit that day (best usage proxy without session logging)</p>
<div class="charts">
  <div class="cc"><h3>Daily Active Users (DAU)</h3><canvas id="c1"></canvas></div>
  <div class="cc"><h3>Daily Habit Completions</h3><canvas id="c2"></canvas></div>
  <div class="cc"><h3>New Signups Per Day</h3><canvas id="c3"></canvas></div>
  <div class="cc"><h3>User Breakdown</h3><canvas id="c4"></canvas></div>
</div>
<div class="panel">
  <div class="panel-hd">
    <div style="display:flex;align-items:center">
      <h2>Never Signed In</h2>
      <span class="badge">${stats.neverSignedIn}</span>
    </div>
    <button class="send-all" id="sendAllBtn" onclick="sendAll()" ${stats.neverSignedIn === 0 ? 'disabled' : ''}>
      Send Invite to All
    </button>
  </div>
  <p class="panel-note">Sends a Supabase invite email — users get a one-click link to set their password and sign in. Customize the template in Supabase Dashboard → Authentication → Email Templates → Invite.</p>
  <table>
    <thead><tr><th>Email</th><th>Signed Up</th><th>Status</th><th></th></tr></thead>
    <tbody id="inviteTable">
      ${stats.neverSignedInUsers.map((u, i) => `
      <tr id="row-${i}">
        <td class="email">${u.email}</td>
        <td class="date">${u.created_at.split('T')[0]}</td>
        <td class="status"><span class="st-idle" id="st-${i}">—</span></td>
        <td><button class="send-btn" id="btn-${i}" onclick="sendOne(${i},'${u.email.replace(/'/g, "\\'")}')">Send Invite</button></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>
<button class="refresh" onclick="location.reload()">&#8635; Refresh</button>
<script>
Chart.defaults.color = '#475569';
const base = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#475569', maxTicksLimit: 10, font: { size: 10 } }, grid: { color: '#181827' } },
    y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: '#1c1c32' }, beginAtZero: true },
  },
};
const L = ${labels};
new Chart('c1', { type: 'bar', data: { labels: L, datasets: [{ data: ${dauData},    backgroundColor: '#c084fc44', borderColor: '#c084fc', borderWidth: 1, borderRadius: 2 }] }, options: base });
new Chart('c2', { type: 'bar', data: { labels: L, datasets: [{ data: ${compData},   backgroundColor: '#4ade8044', borderColor: '#4ade80', borderWidth: 1, borderRadius: 2 }] }, options: base });
new Chart('c3', { type: 'bar', data: { labels: L, datasets: [{ data: ${signupData}, backgroundColor: '#60a5fa44', borderColor: '#60a5fa', borderWidth: 1, borderRadius: 2 }] }, options: base });
new Chart('c4', {
  type: 'doughnut',
  data: {
    labels: ['Active (30d)', 'Dormant', 'Never signed in'],
    datasets: [{ data: [${stats.activeUsers}, ${stats.dormantUsers}, ${stats.neverSignedIn}], backgroundColor: ['#c084fc', '#fbbf24', '#f87171'], borderWidth: 0, hoverOffset: 6 }],
  },
  options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8', padding: 14, font: { size: 11 } } } } },
});

async function sendOne(idx, email) {
  const st  = document.getElementById('st-' + idx);
  const btn = document.getElementById('btn-' + idx);
  st.className = 'st-sending'; st.textContent = 'Sending…';
  btn.disabled = true;
  try {
    const r = await fetch('/api/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.statusText);
    st.className = 'st-ok'; st.textContent = '✓ Sent';
  } catch(e) {
    st.className = 'st-err'; st.textContent = '✗ ' + e.message.slice(0, 40);
    btn.disabled = false;
  }
}

async function sendAll() {
  const btn = document.getElementById('sendAllBtn');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  const rows = document.querySelectorAll('#inviteTable tr');
  for (let i = 0; i < rows.length; i++) {
    const sendBtn = document.getElementById('btn-' + i);
    if (!sendBtn || sendBtn.disabled) continue;
    const email = rows[i].querySelector('.email')?.textContent?.trim();
    if (email) {
      await sendOne(i, email);
      await new Promise(r => setTimeout(r, 400)); // small delay between requests
    }
  }
  btn.textContent = 'All Done';
}
</script>
</body>
</html>`;
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const t = Date.now();
  process.stdout.write(`[${new Date().toLocaleTimeString()}] ${req.url} — `);

  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    try {
      const stats = await computeStats();
      console.log(`done (${Date.now() - t}ms)`);
      res.writeHead(200);
      res.end(renderHTML(stats));
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error fetching data:\n\n${err.message}\n\n${err.stack}`);
    }
  } else if (req.url === '/api/resend' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { email } = JSON.parse(await readBody(req));
      if (!email) throw new Error('email is required');
      await resendInvite(email);
      console.log(`sent invite → ${email} (${Date.now() - t}ms)`);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.log(`RESEND ERROR: ${err.message}`);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (req.url === '/api/stats') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const stats = await computeStats();
      console.log(`done (${Date.now() - t}ms)`);
      res.writeHead(200);
      res.end(JSON.stringify(stats, null, 2));
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    console.log('404');
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  HabiCard Analytics Dashboard\n`);
  console.log(`  → http://localhost:${PORT}\n`);
  console.log('  Each page load fetches fresh data from Supabase.\n');
  console.log('  Ctrl+C to stop.\n');
});
