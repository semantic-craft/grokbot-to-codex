#!/usr/bin/env node
// Stage only reviewed distributable source, never the installation directory.
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const files = [
  '.cursor-plugin/plugin.json', 'package.json', 'bridge.mjs', 'bridge-client.mjs',
  'codex.mjs', 'mcp.mjs', 'projects.mjs', 'scripts/mcp-smoke.mjs', 'scripts/package-plugin.mjs',
  'README.md', 'README.zh-CN.md', 'INSTALL.md', 'PRIVACY.md', 'LICENSE',
  'assets/to-codex-logo.png', 'plugins/grokbot-to-codex/INSTALL.md',
  'plugins/grokbot-to-codex/skills/to-codex/SKILL.md',
  'templates/dr-codexbot/PROFILE.md', 'templates/dr-codexbot/GETTING-STARTED.md', 'templates/dr-codexbot/README.md',
  'templates/dr-codexbot/export.json', 'test/mcp.test.mjs', 'test/distribution.test.mjs',
  'test/fixtures/app-server.mjs',
];
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid package version');
const output = resolve(process.argv[2] || join(root, 'dist', `grokbot-to-codex-${version}.tgz`));
if (existsSync(output)) throw new Error('Output already exists; choose a new archive path');
const stage = mkdtempSync(join(tmpdir(), 'to-codex-package-'));
try {
  for (const file of files) {
    const source = join(root, file);
    if (!lstatSync(source).isFile() || realpathSync(source) !== source) throw new Error('Distribution source must be a regular local file: ' + file);
    if (/\.(?:md|json|mjs)$/.test(file)) {
      const content = readFileSync(source, 'utf8');
      if (/\/(?:Users|home)\/[^/\s]+\//.test(content) || /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/.test(content)) throw new Error('Remove personal paths or credentials from distribution source: ' + file);
    }
    const target = join(stage, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
  mkdirSync(dirname(output), { recursive: true });
  const result = spawnSync('tar', ['-czf', output, '-C', stage, ...files], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Archive creation failed');
  console.log(output);
} finally { rmSync(stage, { recursive: true, force: true }); }
