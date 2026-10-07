// Regression probe. No model turn; acquires then releases the specified test thread.
import { connect } from './codex.mjs';
const id = process.argv[2];
if (!id) throw new Error('Usage: node verify-history.mjs THREAD_ID');
const client = await connect(import.meta.dirname);
try {
  const items = await client.request('thread/items/list', { threadId: id, limit: 100 });
  if (!JSON.stringify(items).includes('BRIDGE_DESKTOP_OK')) throw new Error('Expected probe response absent from persisted history');
  const resumed = await client.request('thread/resume', { threadId: id, initialTurnsPage: { limit: 10, itemsView: 'full' } });
  if (resumed.thread.id !== id) throw new Error('Wrong thread resumed');
  console.log(JSON.stringify({ threadId:id, historyReadable:true, independentResume:true }));
} finally { await client.close(); }
