#!/usr/bin/env node
// MCP stdio adapter. Execution belongs to the independently started bridge.
import { createInterface } from 'node:readline';
import { call } from './bridge-client.mjs';
import { setTimeout as sleep } from 'node:timers/promises';

const text = { type: 'string', minLength: 1 };
const id = { ...text, pattern: '^[a-zA-Z0-9_-]{1,100}$' };
const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const tools = [
  { name: 'list_projects', description: 'List registered projects with their stable ID and canonical working directory. Select the requested project before submitting.', inputSchema: schema({}) },
  { name: 'submit_task', description: 'Submit a read-only task to an explicitly selected registered project on this Mac. Returns immediately; retain the stable requestId for identical retries.', inputSchema: schema({ requestId: id, projectId: id, prompt: text, title: text }, ['requestId', 'projectId', 'prompt']) },
  { name: 'get_task', description: 'Read actual task state and model messages; releasedAt separately confirms Desktop handoff readiness.', inputSchema: schema({ taskId: id }, ['taskId']) },
  { name: 'list_tasks', description: 'Find existing tasks and their results on this Mac.', inputSchema: schema({}) },
  { name: 'wait_task', description: 'Wait up to timeoutMs (maximum 30000). Timeout never cancels execution. By default wait for session release too.', inputSchema: schema({ taskId: id, timeoutMs: { type: 'integer', minimum: 0, maximum: 30000, default: 10000 }, untilReleased: { type: 'boolean', default: true } }, ['taskId']) },
  { name: 'open_in_desktop', description: 'Open the same completed, released thread in official Codex Desktop. Refuses active sessions.', inputSchema: schema({ taskId: id }, ['taskId']) },
];
function validate(tool, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Tool arguments must be an object');
  for (const key of tool.inputSchema.required) if (!(key in args)) throw new Error(`Missing argument: ${key}`);
  for (const [key, value] of Object.entries(args)) {
    const rule = tool.inputSchema.properties[key];
    if (!rule) throw new Error(`Unknown argument: ${key}`);
    if (rule.type === 'string' && (typeof value !== 'string' || !value.trim() || (rule.pattern && !new RegExp(rule.pattern).test(value)))) throw new Error(`Invalid argument: ${key}`);
    if (rule.type === 'integer' && (!Number.isInteger(value) || value < rule.minimum || value > rule.maximum)) throw new Error(`Invalid argument: ${key}`);
    if (rule.type === 'boolean' && typeof value !== 'boolean') throw new Error(`Invalid argument: ${key}`);
  }
}
async function execute(name, args) {
  const path = `/jobs/${encodeURIComponent(args.taskId)}`;
  if (name === 'list_projects') return call('/projects');
  if (name === 'submit_task') return call('/jobs', args);
  if (name === 'get_task') return call(path);
  if (name === 'list_tasks') return call('/jobs');
  if (name === 'open_in_desktop') return call(path + '/open', {});
  if (name === 'wait_task') {
    const deadline = Date.now() + (args.timeoutMs ?? 10000);
    while (true) {
      const task = await call(path);
      const terminal = ['completed', 'failed', 'interrupted', 'cancelled'].includes(task.status);
      if (terminal && (args.untilReleased === false || task.releasedAt)) return { task, timedOut: false };
      if (Date.now() >= deadline) return { task, timedOut: true };
      await sleep(Math.min(100, deadline - Date.now()));
    }
  }
}
const send = value => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...value }) + '\n');
async function dispatch(message) {
  if (!message || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string' || (message.params !== undefined && (!message.params || typeof message.params !== 'object' || Array.isArray(message.params)))) return send({ id: message?.id ?? null, error: { code: -32600, message: 'Invalid Request' } });
  const { id, method, params = {} } = message;
  if (id === undefined) return;
  if (method === 'initialize') return send({ id, result: { protocolVersion: ['2024-11-05', '2025-03-26', '2025-06-18'].includes(params.protocolVersion) ? params.protocolVersion : '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'grokbot-to-codex', version: '0.3.0' } } });
  if (method === 'ping') return send({ id, result: {} });
  if (method === 'tools/list') return send({ id, result: { tools } });
  if (method === 'tools/call') {
    try {
      const tool = tools.find(tool => tool.name === params.name);
      if (!tool) throw new Error('Unknown tool');
      const args = params.arguments ?? {};
      validate(tool, args);
      const value = await execute(tool.name, args);
      return send({ id, result: { content: [{ type: 'text', text: JSON.stringify(value) }], isError: false } });
    } catch (error) { return send({ id, result: { content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }], isError: true } }); }
  }
  send({ id, error: { code: -32601, message: 'Method not found' } });
}
createInterface({ input: process.stdin }).on('line', line => {
  let message;
  try { message = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: 'Parse error' } }); return; }
  void dispatch(message).catch(() => send({ id: message?.id ?? null, error: { code: -32603, message: 'Internal error' } }));
});
