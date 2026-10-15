## Agent skills

### Issue tracker
使用 GitHub Issues。见 docs/agents/issue-tracker.md。

### Triage labels
使用五个默认分流标签。见 docs/agents/triage-labels.md。

### Domain docs
使用 single-context 布局。见 docs/agents/domain.md。

## Development navigation

| Change | Source |
| --- | --- |
| Local service and ownership lifecycle | [bridge.mjs](bridge.mjs), [codex.mjs](codex.mjs) |
| CLI/client and project discovery | [bridge-client.mjs](bridge-client.mjs), [projects.mjs](projects.mjs) |
| stdio MCP adapter | [mcp.mjs](mcp.mjs) |
| Plugin packaging | [scripts/package-plugin.mjs](scripts/package-plugin.mjs), [plugins](plugins/) |

Run `npm test` from the root; tests live in [test](test/). Read [README](README.md) for MVP ownership boundaries and [INSTALL](INSTALL.md) for installation. Unit tests do not establish Desktop handoff or real task completion.
Read relevant [lessons](lessons.md) before implementation, review, or acceptance; update the matching entry after an observed correction or missed case.
