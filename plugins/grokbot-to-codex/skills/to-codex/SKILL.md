---
name: to-codex
description: Use when the user says "to codex", assigns work to Codex, queries a Codex task, or requests handoff to official Codex Desktop. Dispatch read-only tasks and retrieve actual results on the user's configured Mac.
---

# to codex

Use Grok Bot's local-computer Shell, or Cursor's terminal verified to run on the user's Mac, to call this package's task bridge. Native MCP registration is not required.

## Setup and preflight

This skill is reusable across users. Distribute the generic procedure and placeholder examples; keep each recipient's machine, paths and project registry in their installation configuration. The repository root is also the plugin root, with one runtime. If the host supplies the loaded skill's file path, ascend four directories from its skill directory to find the root. Verify `bridge.mjs` and `scripts/mcp-smoke.mjs` exist there; the currently edited project is not necessarily the installation. For a saved skill without file-location information, use the installation's recorded `repoPath`. Ask for the installation location only if discovery fails.

If no runtime is installed, read https://raw.githubusercontent.com/semantic-craft/grokbot-to-codex/main/INSTALL.md and execute its Grok Bot setup steps on the user's Mac before dispatch. A Marketplace skill supplies instructions, not a running local bridge. Use available web and local Shell tools for setup; it does not depend on native MCP registration or an already working bridge.

On the target Mac, verify `node -p process.execPath` and `node --version`. Record `nodePath` (absolute Node.js 22+ executable) and `repoPath` (absolute plugin root). Locate the installed official Desktop's embedded Codex executable; the default candidate is `/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex`. A different installation uses the existing service's `CODEX_BINARY` configuration. Do not download a replacement CLI or read authentication files. Optional `stateDir` must match the backend's `BRIDGE_STATE_DIR`.

1. **Grok Bot:** use `ListMachines` to identify the requested Mac, verify its identity and online status, obtain its current machine ID, and record `machineName`. Explicitly target that machine in every Shell call. Resolve ambiguous names or identity before execution; a cloud container or another computer is not a substitute. **Cursor local terminal:** verify `uname -s` returns Darwin, the host matches the requested Mac, and execution is not in SSH or a cloud workspace. For a remote workspace, stop and request the target Mac's local window.
2. On that machine, invoke the configured Node executable with the installation's `bridge.mjs health`. Use native argv when available; otherwise quote paths as described below. Pass a configured `BRIDGE_STATE_DIR` to that process without changing the global environment.
3. Continue to project selection only when health returns `alive: true`, `projectSelection: registered-project-id`, and `cwd` matching the installation's actual path. If an old service lacks `projectSelection`, follow INSTALL.md to update and restart after active tasks finish. Report an unreachable host, installation or service. For first installation, follow the package's INSTALL.md to start one backend; routine failures do not justify duplicate instances or changing the listener address.

This release supports read-only tasks in registered projects. Installation `repoPath` locates the client; target `cwd` locates task execution. Verify them separately. Writes, approval forwarding, cancellation, resume and queue scheduling are not implemented.

## Select the target project

Call `list_projects` first. Match the user's explicitly requested path against canonical `cwd` and obtain its `projectId`. A project name must match uniquely; ask only when selection is genuinely ambiguous. Installation `repoPath` and health `cwd` are not default task targets. A path mentioned in the prompt does not select the execution project.

If the explicitly requested directory is not registered, verify it exists on the same Mac, expand `~/` using that user's home, resolve its realpath, and run argv `[repoPath + "/bridge.mjs", "register-project", stableProjectId, absoluteProjectPath, projectTitle]`. Register once, then query again. This configures only the authorized target locally. If an ID identifies another directory, reuse the correct existing ID or choose a new one; preserve the old registration.

Submission must return the selected `projectId` and the same canonical `cwd`. On a mismatch, stop dispatch and report it. Do not submit a second task or bypass routing with a prompt or direct shell execution. Project selection retains read-only permissions.

## Submit and query

- Generate one stable `requestId` for each new assignment, for example `grok-` plus a UUID. Retain the user's target, `projectId`, canonical `cwd`, original prompt, optional title and returned job `id`. Retries keep all contents and the ID unchanged; a new target needs a new ID. Reusing an ID with a changed project, prompt or title is rejected. Query legacy tasks as before; use a new ID for new submissions.
- `list_projects`: empty arguments object. Returns registered project `id`, `title` and canonical `cwd`.
- `submit_task`: `requestId`, `projectId`, `prompt`, optional `title`. Success means accepted only. Retain the job ID immediately; its thread ID may arrive later.
- `get_task`: `taskId`. Returns actual task state and model `messages`.
- `list_tasks`: empty arguments object. Returns summary metadata for recovery. Select the requested task, then use `get_task` for its answer. If a submission response is lost, recover the original ID instead of blindly dispatching again with a new ID.
- `wait_task`: `taskId`, `timeoutMs` (0–30000; normally 10000). By default it waits for execution termination and release. `timedOut: true` ends only that wait. Query the same task again; do not cancel or resubmit. Ending the chat does not stop backend execution.
- `open_in_desktop`: `taskId`. When the user requests opening or handoff, verify both `threadId` and `releasedAt` first. For an active task, report that release is pending; do not resume, seize or fork it separately.

## Safe invocation

If Shell supports native argv/stdin, execute `nodePath` with argv `[repoPath + "/scripts/mcp-smoke.mjs", toolName, JSON.stringify(arguments)]`; no shell concatenation is needed.

Replace `selected-project-id` below with the actual selected ID.

If Shell accepts only command text, use a fixed wrapper that reads JSON from stdin and launches the smoke client with an argument array. **Task text belongs only in JSON data, never in JavaScript or shell source.** Serialize standard JSON: encode text newlines as `\n`, keeping the envelope on one physical line. Replace the example paths with installation settings. POSIX quoting wraps each path in single quotes and replaces each embedded single quote with `'"'"'`; `JSON.stringify` is not shell escaping.

```sh
'/absolute/path/to/node' --input-type=module -e 'import {readFileSync} from "node:fs"; import {spawnSync} from "node:child_process"; const data=JSON.parse(readFileSync(0,"utf8")); const child=spawnSync(process.execPath,[process.argv[1],data.tool,JSON.stringify(data.arguments)],{stdio:"inherit"}); if(child.error) console.error("Local bridge client could not start"); process.exit(child.status ?? 1);' '/absolute/path/to/repo/scripts/mcp-smoke.mjs' <<'BRIDGE_REQUEST_JSON'
{"tool":"submit_task","arguments":{"requestId":"grok-example-001","projectId":"selected-project-id","prompt":"Do not call tools or read/write files. Reply only CODEX_LOCAL_OK.","title":"Local dispatch verification"}}
BRIDGE_REQUEST_JSON
```

Keep the heredoc delimiter quoted and physical newlines escaped inside JSON. If reliable serialization is unavailable, stop and report it rather than execute unescaped text. Pass custom `stateDir` through Shell's environment argument when supported; with command text, use the same POSIX quoting for that process's environment assignment.

## Results and handoff

Smoke stdout is an MCP tool result. Check the process exit code and `isError`, then parse JSON inside `content[0].text`. Preserve specific tool errors; never infer a successful answer from the prompt.

`wait_task` returns the task under `task`; other task queries return it directly. `completed`, `failed` and `interrupted` are execution terminal states. `releasedAt` independently confirms that the bridge released the conversation. Keep waiting if execution completed without release; it is not ready for handoff yet.

Return the selected project and canonical `cwd`, job ID, thread ID when available, actual status, release state, and the actual answer from model `messages`. Present the full result when requested; label an excerpt or summary. Report failure or interruption explicitly instead of calling every terminal state successful.

Successful opening proves navigation was accepted. Only visible Desktop conversation content or user confirmation proves the same thread is displayed; `desktopUrl` alone is insufficient. Never read tokens, Codex authentication files or dump environment variables. Task text and retrieved results still enter the respective Codex and host model services.

## Distribution and privacy

Publish or share the repository's generic skill source, not an installed copy with personal configuration appended. Generate distribution archives through INSTALL.md's packaging entry. Local `.bridge` state, project registration, task records, conversations and account memories belong to the recipient and stay outside public skills, templates, archives and support reports. Ordinary replies include only information needed for the current task; after listing, read only the task the user selected. Redact personal paths, identifiers, business content and credentials from outbound support material. During setup, explain that tasks and necessary context enter Codex, while queried information enters Grok or Cursor; a local bridge does not mean offline inference.
