# Dr. CodexBot

Bring official **Codex Desktop** into your Grok Bot team, not a standalone Codex CLI workflow. Dr. CodexBot dispatches through Desktop's embedded app-server, retrieves actual answers, and opens released conversations in Desktop. No separate Codex CLI installation is required. Built on the **to codex** plugin. Independent community project; not an official OpenAI or xAI bot.

## Create your Bot

In Grok Bot, create a new Bot with:

- **Name:** Dr. CodexBot
- **Label:** Codex, your Grok Bot teammate
- **Description:** the complete contents of [PROFILE.md](PROFILE.md), not just the opening paragraph.
- **Avatar:** optionally use the repository's [to codex logo](../../assets/to-codex-logo.png).
- **Routines:** none by default.

Then send:

> Set up Dr. CodexBot on my Mac using your first-use instructions, targeting [my project path]. Reuse my existing to codex installation if present. Verify a real Codex response of DR_CODEXBOT_READY in that project and session release, then open that same conversation in official Codex Desktop.

The Bot follows the [installation guide](../../INSTALL.md) and reuses the [existing skill](../../plugins/grokbot-to-codex/skills/to-codex/SKILL.md). Each recipient supplies their own connected Mac and normal Codex login. No machine ID, account token or publisher-specific path is part of this template source.

The recipient does not need to preinstall this repository plugin. Include the generic [getting-started skill](GETTING-STARTED.md) in the imported template: it reads the public setup guide using the Bot's existing tools, installs or reuses the complete runtime on the recipient's Mac, and saves to codex before dispatch. Git is optional via the source-archive route. A connected Mac, Node.js 22+, official Codex Desktop and its normal sign-in are still prerequisites; import alone does not install executable code. Fresh-recipient Grok import remains a separate acceptance check.

## Use it

- “In [my project path], ask Codex to explain how completed results are retrieved. Keep the task read-only.”
- “What happened to the task I just submitted? Show me the actual answer.”
- “Open that completed conversation in Codex Desktop.”

Current limits: macOS, read-only tasks in explicitly selected registered projects, explicit result queries, and a separately running local service. Queue scheduling, writes and automatic completion notifications require future bridge work. The template does not add them.

## Share a template

Use the Bot's **Share → Create template** control (some versions say **Share as Template**). Inspect the template details before publishing:

1. Preserve the full portable profile and its public setup links.
2. Exclude private installation configuration, task history and unrelated memories or skills. Do not export an account's saved to codex skill if it includes personal paths; recipients can install their own copy from the linked public source.
3. Verify a fresh imported Bot can follow setup and obtain an actual Codex answer. Record Desktop visibility separately from successful navigation.
4. Share the resulting link with the intended audience. A public template link does not mean Marketplace listing approval.

This directory contains authoring source. [export.json](export.json) records the reviewed template content, including a title and review notes; it is not an official import format or an API contract. The in-app export tool packages the actual template and the getting-started skill restores the label on first import. Live creation, export and fresh-import acceptance are tracked in the repository's [acceptance record](https://github.com/semantic-craft/grokbot-to-codex/blob/main/templates/dr-codexbot/ACCEPTANCE.md), excluded from the runtime distribution archive.

Sources: [Bot sharing](https://docs.x.ai/grok-bot/bots#share-a-bot), [template contents](https://x.ai/bot/guides/templates-for-grok-bot), [research](https://github.com/semantic-craft/grokbot-to-codex/blob/main/docs/research/grokbot-bot-template.md).
