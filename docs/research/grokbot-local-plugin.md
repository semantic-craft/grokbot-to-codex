# Grok Bot personal plugin and local-command research

Research date: 2026-10-07. Scope: official Grok Bot (the persistent personal Bot), local Shell/command invocation of an already-installed bridge, and the public repositories named below. Grok Build is treated as a separate product. This is source research, not an installation or runtime test.

## Findings

1. **The documented personal-Bot install path is Marketplace.** xAI's Grok Bot documentation says to open Marketplace, browse supported plugins, choose **Add**, authenticate if prompted, and then use `@` to attach a connector. Installed connectors are account-wide. For reusable instructions, ask a Bot to save a skill; saved private skills are in a library shared by the account's Bots, referenced with `/`, and listed under **Marketplace → Your plugins → Manage plugins and skills → Private skills**. These docs do not describe importing an arbitrary local directory or uploading a personal plugin manifest. This is an undocumented/unknown capability, not evidence that the app cannot support it. [xAI: Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps) · [xAI: Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)

2. **A personal private Skill is the evidenced local-shell integration route.** xAI says Grok Bot normally works on a persistent cloud computer; the user's Mac/Windows computer is separate. A Bot can run commands locally only when local-computer execution is enabled and the user approves under that policy. The documented setting is **Settings → General → Bot → Execution on Local Computer**, default **Ask every time**; first-use confirmation offers **Always allow**, **Allow once**, **Never**, and **Deny once (Esc)**. A private Skill can describe how to invoke an existing local bridge CLI, its permitted arguments, expected output, and when to stop. The actual bridge command and its safety boundary must come from that bridge's own contract; these sources do not establish this repository's exact invocation. [xAI: Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps) · [xAI: Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)

3. **Local command execution is different from cloud execution and plugin installation.** If the Bot runs a command on its cloud computer, it cannot thereby reach the Mac's local bridge. A skill that depends on a local command also depends on the local computer being reachable and the command being approved. A private Skill stores instructions; it is not itself a local executable, bridge daemon, MCP server, or plugin import. Do not describe a cloud routine as a local bridge wakeup mechanism. [xAI: Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps) · [xAI: Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)

4. **The CUA project gives a concrete, third-party example of the local-command pattern.** Its Grok Bot page explicitly distinguishes Grok Bot from Grok Build, documents installing Cua Driver on the computer it will control, and has Grok Bot invoke `cua-driver call …` via local-command execution with approval. It instructs users to save a private skill/workflow that points to the installed command because `cua-driver skills install` does not auto-link Grok Bot. Its example starts with a read-only `list_apps` command and requires fresh state and verification around UI actions. This is a useful pattern, not an xAI guarantee or a requirement for this bridge. Its setting label says **Settings → General → Agent → Execution on Local Computer**; xAI's current personal-Bot documentation says **… → Bot → …**, so follow the label actually shown by the installed app. [Cua: Grok Bot](https://github.com/trycua/cua/blob/main/docs/content/docs/use-cua-with/grok-bot.mdx)

5. **The sample manifests describe marketplace packages, not a confirmed local personal-Bot install protocol.** The pipe0 repository says its Grok Bot install is **Plugins** in the sidebar → search `pipe0` → **Add**, followed by OAuth. Its `.cursor-plugin/plugin.json` references `skills` and `mcpServers`; its README calls that the Cursor Marketplace manifest used by Grok Bot and Cursor. The connected server is hosted at `https://api.pipe0.com/v1/mcp` (Streamable HTTP). The separate `.grok-plugin/plugin.json` is explicitly the Grok Build manifest. This proves a listed marketplace plugin and its package layout, not arbitrary local manifest import or local command execution by a personal Bot. [pipe0 README](https://github.com/pipe-0/grokbot-plugin/blob/main/README.md) · [pipe0 Cursor manifest](https://github.com/pipe-0/grokbot-plugin/blob/main/.cursor-plugin/plugin.json) · [pipe0 Grok Build manifest](https://github.com/pipe-0/grokbot-plugin/blob/main/.grok-plugin/plugin.json) · [pipe0 MCP config](https://github.com/pipe-0/grokbot-plugin/blob/main/mcp.json)

6. **The independent example itself flags local install as unconfirmed.** `grok-bot-plugin-example` uses root `plugin.json` with an Agent Plugins schema and `mcp.json` with a remote Streamable HTTP server plus bearer-token variables. Its README says Grok Bot's exact local plugin path is not confirmed and explicitly warns against assuming Cursor's `~/.cursor/plugins/local/` path applies. It describes team/private dashboard distribution as documented for Cursor but Grok Bot coverage as unverified. These statements are maintainer documentation, not xAI product documentation; they support caution, not a general protocol guarantee. [Example README](https://github.com/mrlynn/grok-bot-plugin-example/blob/main/README.md) · [Example manifest](https://github.com/mrlynn/grok-bot-plugin-example/blob/main/plugin.json) · [Example MCP config](https://github.com/mrlynn/grok-bot-plugin-example/blob/main/mcp.json)

7. **CoS Codex Bridge's Grok report does not prove the local-Shell route.** That repository documents a locally installed stdio MCP server, a generated client configuration, and an owner field test in which Grok Bot used the installed MCP for a Claude Code CLI handoff. It does not document a Grok Bot private Skill invoking the bridge through local Shell. It is evidence that a local bridge can be paired with Grok in that tested configuration, but the setup is specifically MCP and should not be treated as the requested Shell/plugin installation recipe. [CoS Codex Bridge README](https://github.com/AV-Labs-Co/cos-codex-bridge#install)

## Practical route supported by current evidence

For the personal Bot, first confirm the bridge already exists on the user's Mac and identify its documented, bounded CLI invocation. In Grok Bot, respect the existing **Execution on Local Computer** policy; this task does not require changing it. **Ask every time** is the documented default, not a new installation prerequisite. Ask the Bot to save a private skill that calls only that existing command, states allowed arguments and expected output, starts with a read-only status/doctor action if the bridge provides one, and stops for a human decision when a task would expand scope or perform consequential work. Test by invoking the skill in a direct Bot conversation and verify that the prompt explicitly requests local command execution and that the observed result came from the bridge. Do not claim success from a cloud-computer command, an installed Marketplace connector, a queued message, or a routine status alone.

This is an operational pattern derived from xAI's documented private-skill and local-approval features plus CUA's example. The available primary sources do **not** provide an official personal-Bot API or local path for installing an arbitrary plugin/skill package, nor an official shell-tool schema or local bridge tool name. No third-party package was installed and no Grok UI/runtime action was performed by this research.

## Cursor Plugin route for distributable Grok Bot skills

The current Cursor plugin schema provides stronger compatibility evidence than the example repositories: `minClientVersions` recognizes the client key `grokbot` (with a documented minimum-version value or `"never"` to hide the plugin). The Cursor docs say plugins are Git-repository bundles submitted for manual review, and describe both personal Grok Bot Marketplace installation and local-computer command approval elsewhere. Together these support a distributable Cursor Plugin that packages a skill intended for Grok Bot. They do not prove that a skill can bypass Grok Bot's local-command approval, that any private/local Grok Bot import path exists, or that a submission is already accepted/listed. [Cursor plugin schema](https://github.com/cursor/plugins/blob/main/schemas/plugin.schema.json) · [Cursor Plugins docs](https://cursor.com/docs/plugins) · [Cursor Plugins reference](https://cursor.com/docs/reference/plugins) · [xAI local-computer policy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)

### Minimal root-plugin manifest

Since this repository already contains the bridge and `mcp.json`, it can keep the repository root as the plugin root and add only the manifest plus an in-repository Skill directory. The Cursor schema's only required field is `name`; for marketplace readiness, also provide a useful `description`, semantic `version`, `author`, `repository`, and a valid Skill. `skills` accepts a relative path or array of paths and takes precedence over default skill-folder discovery. The Cursor reference calls these paths skill directories; each skill has its own directory and `SKILL.md` with `name` and `description` frontmatter. No MCP registration is needed for the Shell-based path. [Cursor schema](https://github.com/cursor/plugins/blob/main/schemas/plugin.schema.json) · [Cursor reference: manifest and skill paths](https://cursor.com/docs/reference/plugins)

Example for the current repository layout (adjust the skill path if it changes):

```json
{
  "$schema": "https://cursor.com/schemas/cursor-plugin/plugin.json",
  "name": "codex-task-bridge",
  "displayName": "Codex Task Bridge",
  "version": "0.1.0",
  "description": "Run the local Codex bridge from Grok Bot with per-command local approval.",
  "author": { "name": "Codex Task Bridge" },
  "repository": "https://github.com/<owner>/codex-task-bridge",
  "skills": "./plugins/grokbot-to-codex/skills"
}
```

The repository is the plugin root, so the skill path must resolve inside it. Cursor's submission checklist disallows absolute paths and parent traversal (`..`); a pointer to a skill outside this repository is not a valid distributable package. The path above follows the stated reusable directory location but still needs a local manifest/skill validation against the actual files before implementation is considered accepted. [Cursor reference: submission checklist and skill structure](https://cursor.com/docs/reference/plugins) · [official plugin review skill](https://github.com/cursor/plugins/blob/main/create-plugin/skills/review-plugin-submission/SKILL.md)

### Marketplace record and release status

For a **single plugin at the repository root**, Cursor's documented route is to host the public Git repository and submit its URL at `cursor.com/marketplace/publish`; a separate `.cursor-plugin/marketplace.json` is for a multi-plugin repository and is not needed merely to describe the one plugin. If the project later provides a multi-plugin marketplace, the official schema requires marketplace `name` and `plugins`; each entry requires a matching plugin `name` plus a relative `source` directory. Example shape for a root plugin:

```json
{
  "$schema": "https://cursor.com/schemas/cursor-plugin/marketplace.json",
  "name": "codex-task-bridge-marketplace",
  "owner": { "name": "Codex Task Bridge" },
  "plugins": [
    { "name": "codex-task-bridge", "source": "." }
  ]
}
```

Treat that as a schema example for a self-managed/multi-plugin marketplace, not a prerequisite for the one-plugin submission route. Submission is followed by Cursor's manual review; only approval and actual listing establish Marketplace availability. [Cursor reference: multi-plugin marketplaces and submit](https://cursor.com/docs/reference/plugins) · [marketplace schema](https://github.com/cursor/plugins/blob/main/schemas/marketplace.schema.json)

### Validation and distribution limits

For Cursor's local-development test, the docs say to copy the plugin to `~/.cursor/plugins/local/<plugin-name>`, reload Cursor, then confirm the skill in Customize. Team/Enterprise administrators can disable local plugin imports, and an installed marketplace plugin with the same name takes precedence over the local copy. This is a Cursor local-load test only; it does not establish a Grok Bot local-install directory. For Grok Bot, the distributable path to verify is its Marketplace after review/listing; use **Plugins → Add** or the currently surfaced equivalent, then test that the packaged Skill invokes the bridge on the user's local computer and receives the normal Grok Bot command approval. Keep the computer setting at Ask every time during that acceptance test. [Cursor local testing and submission docs](https://cursor.com/docs/plugins) · [xAI local-computer policy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)

The official Cursor schema's `grokbot` target makes the common Cursor Plugin proposal technically aligned with the plugin ecosystem. The remaining product-specific unknown is how a private Grok Bot exposes local shell execution to a packaged Skill on each supported desktop/version; validate that in the target Bot UI and on a second clean account before claiming distributable end-to-end behavior. A marketplace review acceptance alone does not prove the bridge CLI is installed, reachable, or approved on another person's computer.
