#!/usr/bin/env node
// Explicit smoke client. With no arguments, only discover tools (no task execution).
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
const child = spawn(process.execPath, [fileURLToPath(new URL('../mcp.mjs', import.meta.url))], { stdio: ['pipe', 'pipe', 'inherit'], env: process.env });
let sequence = 0;
const pending = new Map();
const request = (method, params) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error('MCP request timed out')); }, 40000);
  pending.set(id, { resolve, reject, timeout });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
});
createInterface({ input: child.stdout }).on('line', line => {
  const message = JSON.parse(line); const item = pending.get(message.id);
  if (!item) return;
  clearTimeout(item.timeout); pending.delete(message.id);
  message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
});
child.on('error', error => { for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(error); } pending.clear(); });
child.on('exit', () => { for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(new Error('MCP exited')); } pending.clear(); });
try {
  await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'bridge-smoke', version: '1' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const name = process.argv[2];
  const result = name ? await request('tools/call', { name, arguments: JSON.parse(process.argv[3] || '{}') }) : await request('tools/list', {});
  console.log(JSON.stringify(result, null, 2));
  if (result.isError) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { child.stdin.end(); }
