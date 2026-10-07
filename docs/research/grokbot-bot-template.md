# Grok Bot template for to codex

Research date: 2026-10-07. Repository inspected: `303e0e2`. Scope: feasibility and proposed experience, not template implementation, installation, publication, or runtime acceptance.

## Conclusion

The existing plugin can be the runtime behind a dedicated, shareable **to codex** Grok Bot. The template supplies the role and setup workflow; the recipient still installs or reuses the complete bridge on their own Mac. A template link does not distribute our executable runtime or prove it is connected. This follows from the official template exclusions and the repository's installation contract. [Template guide](https://x.ai/bot/guides/templates-for-grok-bot) · [INSTALL.md](../../INSTALL.md)

## Primary-source findings

### Official template mechanism

- The September 29 Bot documentation describes **Share → Create template**, followed by template details/update controls and a public or team-only link. Recipients preview the shared configuration and add a copy to their own account; the creator's computer, logins, and conversation history do not transfer. [Create and manage Bots](https://docs.x.ai/grok-bot/bots#share-a-bot)
- The September 8 guide shows the earlier **Share as Template → review → Publish → Copy Link** flow. Use the actual installed UI to resolve the label difference. It describes packaging instructions, relevant memories, skills and supported plugins, while excluding custom code/scripts and non-standard MCP components. It recommends encoding setup instructions for complex dependencies. [Templates for Grok Bot](https://x.ai/bot/guides/templates-for-grok-bot)
- The guide also says personal/private skills are excluded. Do not assume the current account's saved private `to codex` skill will survive export. Put portable setup instructions in the Bot profile, then inspect the generated template and test a fresh import. A link to our public skill source can bootstrap a recipient-specific saved skill. This is a proposed implementation, not an already verified export behavior. [Template guide](https://x.ai/bot/guides/templates-for-grok-bot) · [Skill source](../../plugins/grokbot-to-codex/skills/to-codex/SKILL.md)
- Saved private skills are available across an account's Bots. A dedicated Bot gives this workflow a stable role and conversation; it does not create a separate permission boundary. Local-computer commands depend on local execution availability and the user's existing approval policy. [Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations) · [Computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)

### Dr Eggbot reference

The official marketplace lists **dr eggbot**, by **Lauren Tan**, and explicitly references `poteto-mode`. Its stated job is designing focused Bots and creating them with `CreateAgent`. The profile emphasizes a clear job, voice, exclusions and verified work. It also includes first-run setup instructions, and notes that packed routines may need checking after import. Its template advice is to preserve the full live profile description. These are useful design precedents; its pstack integration and scheduled healthchecks are not dependencies of our bridge. [Official Dr Eggbot page](https://x.ai/bot/marketplace/bots/dr-eggbot-v2)

The public page establishes this behavior, not its complete internal tool schema or every skill's source. The researched official pages do not document a downloadable template schema or a public REST API for creating/publishing these templates. `CreateAgent` in a Bot profile is not evidence of an externally callable API. A public sharing link also does not establish marketplace listing acceptance.

## Proposed dedicated Bot

This section is a recommendation, not shipped behavior.

**Name:** Dr. CodexBot

**Role:** Send supported tasks to Codex on the user's Mac, retrieve actual answers, and hand released conversations to Codex Desktop.

Suggested user-visible introduction:

> 我负责把任务交给你 Mac 上的 Codex，取回实际结果，并在需要时打开同一段 Codex 对话。第一次使用时，我会先检查本机连接和插件安装。当前版本支持插件目录内的只读任务。

| Moment | Proposed behavior |
| --- | --- |
| First conversation | Find the intended Mac and reuse a healthy installation. If missing, follow the repository's installation guide and save recipient-specific paths. |
| New task | Clarify only missing task requirements; use the existing skill to submit one stable request and keep its job ID. |
| Progress/result request | Query the recorded task; show the actual status and answer. A wait timeout does not create a new task. |
| Desktop handoff | Wait for session release, then open that same conversation when requested. |
| Unsupported request | Explain the current missing capability without bypassing the bridge through arbitrary shell execution. |

The portable profile should point to the public installation guide and skill source. Machine IDs, local paths, task history, tokens and account-specific memories belong in recipient setup, not the shared blueprint. Keep technical call details in the existing skill to avoid two drifting implementations.

Public setup entry: [Agent installation guide](https://github.com/semantic-craft/grokbot-to-codex/blob/main/INSTALL.md).

## Current implementation boundaries

Source inspection, not new runtime testing:

- [bridge.mjs](../../bridge.mjs) starts Codex with `cwd: ROOT`, `sandbox: 'read-only'`, and `approvalPolicy: 'never'`; it has a 180-second execution guard. This is not yet a general multi-project coding worker.
- [mcp.mjs](../../mcp.mjs) exposes submit/get/list/wait/open. Result retrieval is pull; no bridge completion push or Grok wakeup is implemented.
- [INSTALL.md](../../INSTALL.md) requires macOS, Node 22+, signed-in official Codex Desktop, and a separately running bridge. It does not install automatic startup.
- [README.md](../../README.md) identifies the current Grok route as a saved private skill plus local Shell. Arbitrary local plugin import is unverified, and the package is not listed on Marketplace.

For a first template, preserve those boundaries and keep routines absent by default. Cross-project selection, write approvals and reliable unattended completion notification would be separate runtime work if the intended product becomes a general Codex coding assistant.

## Implementation and acceptance proposal

1. Add a portable Bot profile and first-run setup prompt alongside the plugin documentation, referencing the existing skill.
2. Create one dedicated Bot through the supported Grok UI or the actual in-app Bot-creation tool, inspecting the available schema rather than guessing.
3. Verify a real read-only task produces the expected Codex answer and that the released thread is visible in Desktop.
4. Generate and inspect the template details, especially full profile content, skill inclusion and absence of publisher-specific configuration.
5. Test a fresh imported copy through setup and the same actual-result/handoff checks. Then obtain its intended sharing link through the current UI; marketplace discovery is a separate outcome.

This research changed only this note. No Bot was created, imported, installed or published; no model task or runtime test was run.
