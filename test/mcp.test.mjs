import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function mcp(env = {}) {
  const child = spawn(process.execPath, ['mcp.mjs'], { cwd: root, env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
  let seq = 0;
  const pending = new Map();
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => { const msg = JSON.parse(line); pending.get(msg.id)?.(msg); pending.delete(msg.id); });
  child.on('exit', () => { for (const resolve of pending.values()) resolve({ error: 'MCP process exited' }); });
  return { child, async request(method, params = {}) { const id = ++seq; return new Promise(resolve => { pending.set(id, resolve); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); }); }, close() { child.stdin.end(); } };
}

test('MCP initializes and advertises callable task tools without starting work', { timeout: 5000 }, async () => {
  const client = mcp();
  try {
    const initialized = await client.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'contract-test', version: '1' } });
    assert.equal(initialized.result?.protocolVersion, '2024-11-05');
    assert.equal(initialized.result.capabilities.tools.listChanged, false);
    const list = await client.request('tools/list');
    assert.deepEqual(list.result.tools.map(t => t.name), ['submit_task', 'get_task', 'list_tasks', 'wait_task', 'open_in_desktop']);
  } finally { client.close(); }
});

import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';
async function backend(t) {
  const state = await mkdtemp(join(tmpdir(), 'bridge-contract-'));
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const env = { BRIDGE_STATE_DIR: state, BRIDGE_PORT: String(port), CODEX_BINARY: join(root, 'test/fixtures/app-server.mjs') };
  const child = spawn(process.execPath, ['bridge.mjs', 'serve'], { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { child.kill(); await new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve)); await rm(state, { recursive: true, force: true }); });
  await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('exit', () => reject(new Error('backend failed to start'))); });
  return { env, state, port };
}
async function tool(client, name, args = {}) {
  const response = await client.request('tools/call', { name, arguments: args });
  assert.ok(response.result, JSON.stringify(response));
  return response.result;
}
const payload = result => JSON.parse(result.content[0].text);

test('MCP task survives disconnect, wait timeout preserves execution, reconnect returns real result and released thread', { timeout: 12000 }, async t => {
  const { env } = await backend(t);
  const first = mcp(env);
  let second;
  t.after(() => { first.close(); second?.close(); });
  const submitted = payload(await tool(first, 'submit_task', { requestId: 'disconnect-task', prompt: 'Return fixture result' }));
  assert.equal(submitted.id, 'disconnect-task');
  assert.ok(['starting', 'running'].includes(submitted.status));
  const waiting = payload(await tool(first, 'wait_task', { taskId: submitted.id, timeoutMs: 10 }));
  assert.equal(waiting.timedOut, true);
  assert.ok(['starting', 'running'].includes(waiting.task.status));
  const refused = await tool(first, 'open_in_desktop', { taskId: submitted.id });
  assert.equal(refused.isError, true);
  first.close();
  second = mcp(env);
  const completed = payload(await tool(second, 'wait_task', { taskId: submitted.id, timeoutMs: 5000 }));
  assert.equal(completed.timedOut, false);
  assert.equal(completed.task.status, 'completed');
  assert.deepEqual(completed.task.messages, ['FIXTURE_TASK_COMPLETE']);
  assert.ok(completed.task.releasedAt);
  const read = payload(await tool(second, 'get_task', { taskId: submitted.id }));
  assert.equal(read.threadId, '00000000-0000-4000-8000-000000000001');
  const list = payload(await tool(second, 'list_tasks'));
  assert.equal(list.filter(task => task.id === submitted.id).length, 1);
});

test('MCP distinguishes completed execution from release and rejects invalid input without killing transport', { timeout: 10000 }, async t => {
  const { env } = await backend(t);
  const client = mcp(env);
  t.after(() => client.close());
  assert.equal((await tool(client, 'wait_task', { taskId: 'a', timeoutMs: 30001 })).isError, true);
  assert.equal((await tool(client, 'submit_task', { requestId: '../a', prompt: 'bad' })).isError, true);
  assert.equal((await tool(client, 'get_task', { taskId: 'unknown' })).isError, true);
  await tool(client, 'submit_task', { requestId: 'release-task', prompt: 'Return fixture result' });
  const terminal = payload(await tool(client, 'wait_task', { taskId: 'release-task', timeoutMs: 5000, untilReleased: false }));
  assert.equal(terminal.task.status, 'completed');
  assert.equal(terminal.task.releasedAt, undefined);
  assert.equal((await tool(client, 'open_in_desktop', { taskId: 'release-task' })).isError, true);
  const released = payload(await tool(client, 'wait_task', { taskId: 'release-task', timeoutMs: 5000 }));
  assert.ok(released.task.releasedAt);
});

test('HTTP continues to reject unauthenticated and browser requests; existing CLI remains usable', { timeout: 10000 }, async t => {
  const { env, state, port } = await backend(t);
  const base = `http://127.0.0.1:${port}`;
  assert.equal((await fetch(base + '/jobs')).status, 401);
  const token = (await readFile(join(state, 'token'), 'utf8')).trim();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  assert.equal((await fetch(base + '/jobs', { method: 'POST', headers: { ...headers, Origin: 'https://example.org' }, body: '{}' })).status, 403);
  assert.equal((await fetch(base + '/jobs', { method: 'POST', headers, body: '{}' })).status, 400);
  const run = args => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['bridge.mjs', ...args], { cwd: root, env: { ...process.env, ...env } });
    let out = ''; let err = '';
    child.stdout.on('data', data => { out += data; }); child.stderr.on('data', data => { err += data; });
    child.on('exit', code => code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err)));
  });
  assert.equal((await run(['health'])).alive, true);
  const task = await run(['submit', 'cli-task', 'Return fixture result']);
  assert.equal(task.id, 'cli-task');
  const repeat = await run(['submit', 'cli-task', 'Return fixture result']);
  assert.equal(repeat.id, task.id);
  assert.equal((await run(['list'])).length, 1);
});

test('MCP reports wrong-machine or unavailable local bridge without exposing credentials', { timeout: 5000 }, async t => {
  const state = await mkdtemp(join(tmpdir(), 'missing-bridge-'));
  const client = mcp({ BRIDGE_STATE_DIR: state });
  t.after(async () => { client.close(); await rm(state, { recursive: true, force: true }); });
  const result = await tool(client, 'list_tasks');
  assert.equal(result.isError, true);
  assert.match(payload(result).error, /Start bridge.mjs serve on this Mac/);
});

test('invalid MCP requests receive protocol errors and leave the connection usable', { timeout: 5000 }, async t => {
  const client = mcp();
  t.after(() => client.close());
  assert.equal((await client.request(null)).error.code, -32600);
  assert.deepEqual((await client.request('ping')).result, {});
});
