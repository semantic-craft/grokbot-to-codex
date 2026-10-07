# Dr. CodexBot

A dedicated Grok Bot for dispatching supported tasks to Codex on your Mac, retrieving actual answers, and opening released conversations in Codex Desktop. Built on the **to codex** plugin. Independent community project; not an official OpenAI or xAI bot.

## Create your Bot

In Grok Bot, create a new Bot with:

- **Name:** Dr. CodexBot
- **Label:** Codex on your Mac
- **Description:** the complete contents of [PROFILE.md](PROFILE.md), not just the opening paragraph.
- **Avatar:** optionally use the repository's [to codex logo](../../assets/to-codex-logo.png).
- **Routines:** none by default.

Then send:

> Set up Dr. CodexBot on my Mac using your first-use instructions. Reuse my existing to codex installation if present. Verify a real Codex response of DR_CODEXBOT_READY and session release, then open that same conversation in official Codex Desktop.

The Bot follows the [installation guide](../../INSTALL.md) and reuses the [existing skill](../../plugins/grokbot-to-codex/skills/to-codex/SKILL.md). Each recipient supplies their own connected Mac and normal Codex login. No machine ID, account token or publisher-specific path is part of this template source.

## Use it

- “Ask Codex to explain how this bridge retrieves completed results. Keep the task read-only.”
- “What happened to the task I just submitted? Show me the actual answer.”
- “Open that completed conversation in Codex Desktop.”

Current limits: macOS, read-only tasks with the working directory fixed to the plugin repository, explicit result queries, and a separately running local service. Cross-project coding, writes and automatic completion notifications require future bridge work. The template does not add them.

## Share a template

Use the Bot's **Share → Create template** control (some versions say **Share as Template**). Inspect the template details before publishing:

1. Preserve the full portable profile and its public setup links.
2. Exclude private installation configuration, task history and unrelated memories or skills. Do not export an account's saved to codex skill if it includes personal paths; recipients can install their own copy from the linked public source.
3. Verify a fresh imported Bot can follow setup and obtain an actual Codex answer. Record Desktop visibility separately from successful navigation.
4. Share the resulting link with the intended audience. A public template link does not mean Marketplace listing approval.

This directory contains authoring source, not an official Grok template file format. Live creation, export and fresh-import acceptance are tracked in [ACCEPTANCE.md](ACCEPTANCE.md).

Sources: [Bot sharing](https://docs.x.ai/grok-bot/bots#share-a-bot), [template contents](https://x.ai/bot/guides/templates-for-grok-bot), [research](../../docs/research/grokbot-bot-template.md).
