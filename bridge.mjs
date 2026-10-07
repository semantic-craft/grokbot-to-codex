#!/usr/bin/env node
// Local proof of concept: no third-party packages, telemetry, or cloud relay.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { connect, BINARY } from './codex.mjs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const STATE = join(ROOT, '.bridge');
const PORT = Number(process.env.BRIDGE_PORT || 43187);
const BASE = `http://127.0.0.1:${PORT}`;
const tokenPath = join(STATE, 'token');
const discoveryPath = join(STATE, 'connection.json');
const dataPath = join(STATE, 'jobs.json');
const mode = process.argv[2] || 'help';

function readJSON(path, fallback) { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback; }
function privateWrite(path, data) { writeFileSync(path, data, { mode: 0o600 }); }
function loadToken() { return readFileSync(tokenPath, 'utf8').trim(); }
function equal(a, b) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
function openThread(id) { spawn('/usr/bin/open', [`codex://threads/${id}`], { stdio: 'ignore' }).unref(); }

async function serve() {
  mkdirSync(STATE, { recursive: true, mode: 0o700 });
  if (!existsSync(tokenPath)) privateWrite(tokenPath, randomBytes(32).toString('hex'));
  const token = loadToken();
  const jobs = Object.assign(Object.create(null), readJSON(dataPath, {}));
  for (const job of Object.values(jobs)) if (['starting', 'running'].includes(job.status)) job.status = 'interrupted';
  const save = () => { privateWrite(dataPath + '.tmp', JSON.stringify(jobs, null, 2)); renameSync(dataPath + '.tmp', dataPath); };
  save();
  const clients = new Set();
  const probe = await connect(ROOT);
  const initialized = probe.initialized;
  await probe.close();

  async function launch(job, prompt) {
    let client;
    let timeout;
    let settled = false;
    let finish;
    const done = new Promise(resolve => { finish = resolve; });
    try {
      client = await connect(ROOT, msg => {
        const params = msg.params || {};
        if (params.threadId !== job.threadId) return;
        if (msg.method === 'item/completed' && params.item?.type === 'agentMessage') {
          job.messages.push(params.item.text); save();
        }
        if (msg.method === 'turn/completed') {
          settled = true;
          job.status = params.turn.status;
          job.error = params.turn.error?.message;
          job.finishedAt = new Date().toISOString();
          save(); finish();
        }
      });
      clients.add(client);
      client.closed.then(() => { if (!settled) finish(); });
      const result = await client.request('thread/start', {
        cwd: ROOT, historyMode: 'paginated', ephemeral: false,
        sandbox: 'read-only', approvalPolicy: 'never',
      });
      job.threadId = result.thread.id;
      job.desktopUrl = `codex://threads/${job.threadId}`;
      save();
      await client.request('thread/name/set', { threadId: job.threadId, name: job.title });
      job.status = 'running'; save();
      const turn = await client.request('turn/start', { threadId: job.threadId, input: [{ type: 'text', text: prompt }] });
      job.turnId = turn.turn.id; save();
      timeout = setTimeout(finish, 180000);
      await done;
      if (!settled) { job.status = 'interrupted'; job.error = 'Probe timed out or app-server exited'; }
    } catch (error) { job.status = 'failed'; job.error = error.message; }
    finally {
      clearTimeout(timeout);
      if (client) { await client.close(); clients.delete(client); }
      job.releasedAt = new Date().toISOString(); save();
    }
  }

  const server = http.createServer(async (req, res) => {
    const reply = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    // No browser origins, non-loopback hostnames, public listener, or unauthenticated mutations.
    if (req.headers.origin || req.headers.host !== `127.0.0.1:${PORT}`) return reply(403, { error: 'Local CLI access only' });
    if (!equal(req.headers.authorization || '', `Bearer ${token}`)) return reply(401, { error: 'Unauthorized' });
    const path = req.url;
    if (req.method === 'GET' && path === '/health') return reply(200, { alive: true, cwd: ROOT, binary: BINARY, userAgent: initialized.userAgent, mode: 'read-only-visibility-probe' });
    if (req.method === 'GET' && path === '/jobs') return reply(200, Object.values(jobs));
    const match = /^\/jobs\/([a-zA-Z0-9_-]+)$/.exec(path);
    if (req.method === 'GET' && match) return reply(jobs[match[1]] ? 200 : 404, jobs[match[1]] || { error: 'Unknown job' });
    if (req.method === 'POST' && path === '/jobs') {
      try {
        let body = '';
        for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 16384) return reply(413, { error: 'Body too large' }); }
        const input = JSON.parse(body);
        if (typeof input.prompt !== 'string' || !input.prompt.trim() || typeof input.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.requestId)) return reply(400, { error: 'prompt and a stable requestId are required' });
        if (jobs[input.requestId]) return reply(200, jobs[input.requestId]);
        const job = { id: input.requestId, title: String(input.title || 'Chatbot → Codex Desktop 验证').slice(0, 100), status: 'starting', createdAt: new Date().toISOString(), messages: [] };
        jobs[job.id] = job; save();
        void launch(job, input.prompt);
        return reply(202, job);
      } catch (error) { return reply(400, { error: error.message }); }
    }
    reply(404, { error: 'Not found' });
  });
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(PORT, '127.0.0.1', () => {
    privateWrite(discoveryPath, JSON.stringify({ baseUrl: BASE, pid: process.pid }));
    console.log(`Local bridge ready at ${BASE}; no public listener; read-only probe.`);
  });
  const shutdown = async () => { server.close(); await Promise.all([...clients].map(client => client.close())); process.exit(0); };
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
}

async function call(path, body) {
  const { baseUrl } = readJSON(discoveryPath, { baseUrl: BASE });
  const response = await fetch(baseUrl + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${loadToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error);
  return value;
}

try {
  if (mode === 'serve') await serve();
  else if (mode === 'health') console.log(JSON.stringify(await call('/health'), null, 2));
  else if (mode === 'list') console.log(JSON.stringify(await call('/jobs'), null, 2));
  else if (mode === 'read' || mode === 'open') {
    const job = await call(`/jobs/${encodeURIComponent(process.argv[3])}`);
    if (mode === 'open') { if (!job.threadId || !job.releasedAt) throw new Error('Wait for the task to finish and release its thread first'); openThread(job.threadId); }
    console.log(JSON.stringify(job, null, 2));
  } else if (mode === 'submit') {
    const requestId = process.argv[3];
    const prompt = process.argv[4];
    const title = process.argv[5];
    console.log(JSON.stringify(await call('/jobs', { requestId, prompt, title }), null, 2));
  } else console.log('node bridge.mjs serve|health|list|submit REQUEST_ID PROMPT [TITLE]|read REQUEST_ID|open REQUEST_ID');
} catch (error) { console.error(error.message); process.exitCode = 1; }
