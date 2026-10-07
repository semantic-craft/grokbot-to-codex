#!/usr/bin/env node
import { createInterface } from 'node:readline';
const send = message => process.stdout.write(JSON.stringify(message) + '\n');
const threadId = '00000000-0000-4000-8000-000000000001';
createInterface({ input: process.stdin }).on('line', line => {
  const { id, method } = JSON.parse(line);
  if (id === undefined) return;
  const results = { initialize: { userAgent: 'fixture-app-server' }, 'thread/start': { thread: { id: threadId } }, 'thread/name/set': {}, 'turn/start': { turn: { id: 'turn-1' } } };
  send({ id, result: results[method] || {} });
  if (method === 'turn/start') setTimeout(() => {
    send({ method: 'item/completed', params: { threadId, item: { type: 'agentMessage', text: 'FIXTURE_TASK_COMPLETE' } } });
    send({ method: 'turn/completed', params: { threadId, turn: { status: 'completed' } } });
  }, 1000);
});
process.on('SIGTERM', () => setTimeout(() => process.exit(0), 250));
