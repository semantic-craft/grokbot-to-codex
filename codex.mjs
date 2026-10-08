import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export const BINARY = process.env.CODEX_BINARY || '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex';
export async function connect(cwd, onEvent = () => {}) {
  const env = Object.fromEntries(['HOME', 'PATH', 'TMPDIR', 'LANG', 'LC_ALL', 'USER', 'LOGNAME'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
  const child = spawn(BINARY, ['app-server', '--listen', 'stdio://', '-c', 'analytics.enabled=false'], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
  let sequence = 0;
  let alive = true;
  const pending = new Map();
  const send = message => child.stdin.write(JSON.stringify(message) + '\n');
  const closed = new Promise(resolve => child.once('close', resolve));
  const failPending = message => {
    alive = false;
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(message)); }
    pending.clear();
  };
  child.on('error', e => failPending(e.message));
  child.on('exit', () => failPending('app-server exited'));
  child.stdin.on('error', () => failPending('app-server stdin closed'));
  child.stderr.resume(); // Never log protocol stderr or credentials.
  const request = (method, params) => new Promise((resolve, reject) => {
    if (!alive) return reject(new Error('app-server unavailable'));
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out; do not blindly resubmit`)); }, 60000);
    pending.set(id, { resolve, reject, timer }); send({ id, method, params });
  });
  createInterface({ input: child.stdout }).on('line', line => {
    let msg; try { msg = JSON.parse(line); } catch { return; }
    if (msg.id !== undefined && !msg.method) {
      const p = pending.get(msg.id);
      if (p) { clearTimeout(p.timer); pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
    } else if (msg.id !== undefined && msg.method) {
      send({ id: msg.id, error: { code: -32601, message: 'This read-only visibility probe does not grant interactive requests.' } });
    } else onEvent(msg);
  });
  const close = async () => {
    if (alive) { child.stdin.end(); child.kill('SIGTERM'); }
    const force = setTimeout(() => child.kill('SIGKILL'), 3000); force.unref();
    await closed; clearTimeout(force);
  };
  try {
    const initialized = await request('initialize', {
      clientInfo: { name: 'grokbot_to_codex', title: 'GrokBot to Codex', version: '0.3.1' },
      capabilities: { experimentalApi: true },
    });
    send({ method: 'initialized', params: {} });
    return { request, close, closed, initialized };
  } catch (e) { await close(); throw e; }
}
