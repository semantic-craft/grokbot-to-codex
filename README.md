# GrokBot to Codex

Send a read-only task from Grok Bot to Codex running on **your Mac**, retrieve its actual response, then open the released conversation in official **Codex Desktop**. No extra interface, third-party backend, telemetry, or public listener.

**Install with your agent:** “Read https://raw.githubusercontent.com/semantic-craft/grokbot-to-codex/main/INSTALL.md and install GrokBot to Codex on my Mac. Follow its host and verification steps.”

[Agent installation guide](INSTALL.md) · [Skill source](plugins/grokbot-to-codex/skills/to-codex/SKILL.md) · [Privacy](PRIVACY.md) · [MIT license](LICENSE)

## What you get

- **Grok Bot:** a saved private skill using its existing local-computer Shell tools. Say **“to codex”** and describe the task (or select the saved **to codex** skill).
- **Cursor:** a distributable Cursor-format local plugin with `/to-codex`, sharing the same skill and runtime.
- **Local bridge:** submit, get, list, bounded wait and open-in-Desktop tools. MCP clients may disconnect while work continues in the separately running backend.

The entire repository is the plugin root. Installing only the skill file omits its runtime. Grok Bot's arbitrary local plugin-package import is unverified; its private-skill route works independently of native MCP registration. **The package is not yet listed on Marketplace.**

## MVP boundaries

Requires macOS, Node.js 22+ and an installed, signed-in official Codex Desktop. **Keep the bridge service running** in a local terminal; this release does not install automatic startup. Work is read-only and fixed to the plugin directory. Writing approvals, project selection, cancellation, resume, proactive notifications and Windows support are not included.

Codex must finish and release a thread before Desktop takes it over. There is no simultaneous live control of the same conversation. A task and its result still reach the respective Codex and Grok model services; a local bridge does not mean offline inference.

## Developers

```sh
node bridge.mjs serve        # separate local terminal
node bridge.mjs health
node scripts/mcp-smoke.mjs  # tool discovery only
npm test                    # isolated contract tests, no model calls
```

The bridge binds to `127.0.0.1` and uses local bearer authentication. `.bridge/` holds private state and is excluded from Git. See the [installation guide](INSTALL.md) for safe configuration, real acceptance, updates and uninstalling.

## 中文

在 Grok Bot 中说 **“to codex”** 给自己 Mac 上的 Codex 派活，查询实际答复，释放会话后在官方 Codex Desktop 打开。也提供符合 Cursor 格式的完整本地插件包。

把上面的安装指南链接发给你的 Agent 即可开始安装。本版是**只读 MVP**，需要本机服务持续运行；尚未上架 Marketplace。Grok Bot 使用私有技能＋本机 Shell，不要求先安装原生 MCP。安装、宿主发现、真实执行和 Desktop 显示分别验收。
