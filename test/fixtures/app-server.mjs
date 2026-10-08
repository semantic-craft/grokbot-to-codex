#!/usr/bin/env node
import { createInterface } from 'node:readline';
const send = message => process.stdout.write(JSON.stringify(message) + '\n');
const threadId = '00000000-0000-4000-8000-000000000001';
let threadCwd;
createInterface({ input: process.stdin }).on('line', line => {
  const { id, method, params } = JSON.parse(line);
  if (id === undefined) return;
  if (method === 'thread/start') threadCwd = params.cwd;
  const results = { initialize: { userAgent: 'fixture-app-server' }, 'thread/start': { thread: { id: threadId } }, 'thread/name/set': {}, 'turn/start': { turn: { id: 'turn-1' } } };
  send({ id, result: results[method] || {} });
  if (method === 'turn/start') setTimeout(() => {
    const text = params.input?.[0]?.text === 'REPORT_ROUTING' ? JSON.stringify({ processCwd: process.cwd(), threadCwd }) : 'FIXTURE_TASK_COMPLETE';
    send({ method: 'item/completed', params: { threadId, item: { type: 'agentMessage', text } } });
    send({ method: 'turn/completed', params: { threadId, turn: { status: 'completed' } } });
  }, 1000);
});
process.on('SIGTERM', () => setTimeout(() => process.exit(0), 250));
