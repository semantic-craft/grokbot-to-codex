import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const STATE = resolve(process.env.BRIDGE_STATE_DIR || join(ROOT, '.bridge'));
export const PORT = Number(process.env.BRIDGE_PORT || 43187);
export const BASE = `http://127.0.0.1:${PORT}`;
export async function call(path, body) {
  const discovery = join(STATE, 'connection.json');
  let baseUrl = BASE;
  let token;
  try {
    if (existsSync(discovery)) ({ baseUrl } = JSON.parse(readFileSync(discovery, 'utf8')));
    const url = new URL(baseUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid local bridge address');
    token = readFileSync(join(STATE, 'token'), 'utf8').trim();
  } catch { throw new Error('Local bridge configuration unavailable or invalid. Start bridge.mjs serve on this Mac with the same BRIDGE_STATE_DIR.'); }
  let response;
  try {
    response = await fetch(baseUrl + path, { method: body !== undefined ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  } catch { throw new Error('Local bridge unavailable on this Mac. Start bridge.mjs serve and verify BRIDGE_STATE_DIR.'); }
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `Bridge HTTP ${response.status}`);
  return value;
}
