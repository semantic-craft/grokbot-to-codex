---
name: to-codex
description: 当用户说“to codex”、要求给 Codex 派活、查询 Codex 任务或在官方 Desktop 接手时使用。在已配置的用户 Mac 上执行只读派活与实际结果查询。
---

# to codex

通过 Grok Bot 的本机 Shell，或 Cursor 已确认在用户 Mac 上的本地终端，调用插件自带的任务桥。技能无需注册原生 MCP 连接。

## 首次配置与运行前检查

本仓库根目录同时是插件根目录，运行时只有一份。首次使用先发现实际路径：若宿主提供已加载技能文件路径，从该技能目录向上四层取得插件根目录；核实其中存在 `bridge.mjs` 和 `scripts/mcp-smoke.mjs`，不要把当前编辑项目误作插件根目录。私有技能副本没有文件定位信息时，使用安装时保存的 `repoPath`；确实找不到才询问用户安装位置。

在目标 Mac 核实 `node -p process.execPath` 和 `node --version`，保存 `nodePath`（Node 22+ 的绝对路径）、`repoPath`（插件根目录绝对路径）。检查官方 Desktop 内置 Codex 的实际安装位置；默认候选是 `/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex`，其他安装通过现有服务的 `CODEX_BINARY` 配置，不下载替代 CLI，也不读认证文件。可选 `stateDir` 必须与后台的 `BRIDGE_STATE_DIR` 一致。

1. **Grok Bot**：用 `ListMachines` 找到用户指定的 Mac，核对在线状态和身份，取得本次 machine ID，并记录 `machineName`。所有 Shell 调用显式指定此机器。重名或身份不明时先核实，云端容器或其他电脑不是替代执行地。**Cursor 本地终端**：无需 ListMachines；先核实 `uname -s` 为 Darwin、当前主机与用户指定电脑一致、没有远程 SSH/云端执行上下文。若为远程工作区，停止并要求切换到目标 Mac 的本地窗口。
2. 在该机器执行配置的 Node 和插件根目录的 `bridge.mjs health`。用原生参数数组（若支持），否则按下述安全引号规则传路径。自定义 `stateDir` 向子进程传 `BRIDGE_STATE_DIR`，不更改全局环境。
3. 只有返回 `alive: true` 且 `cwd` 与插件根目录的实际路径一致才派活。失败时报告主机、路径或服务不可达；首次安装按插件包的 `INSTALL.md` 启动一次后台，日常运行不要因失败重复启动实例或改监听地址。

本版仅支持该桥项目的只读任务。写入、审批、取消、续接及跨项目调度尚未实现；相关请求明确说明缺口，不以 shell 命令绕过权限。

## 提交与查询

- 为每次新任务生成一次稳定 `requestId`，例如 `grok-` 加 UUID；记录用户目标、原始 prompt、可选 title 和返回 `id`。同一请求重试保持全部内容和 ID 不变；新目标用新 ID。本版对相同 ID 不校验内容冲突，因此改变目标时绝不能复用旧 ID。
- `submit_task` 参数：`requestId`、`prompt`、可选 `title`。成功只表示已受理；立即记录 job ID，thread ID 可能稍后补齐。
- `get_task` 参数：`taskId`。返回该任务实际状态和 `messages`。
- `list_tasks` 参数：空对象。用于找回不确定或遗忘的任务；提交响应丢失时优先查询原 ID，不能换新 ID 盲目重派。
- `wait_task` 参数：`taskId`、`timeoutMs`（0–30000；通常 10000）。默认同时等待执行终态和释放；`timedOut: true` 只表示本次等待结束。继续查询原任务，不取消或重新提交。聊天结束不影响后台执行。
- `open_in_desktop` 参数：`taskId`。用户要求打开或接手时，先确认已有 `threadId` 和 `releasedAt`，再调用。运行中报告仍待释放；不要另行 resume、抢占或 fork。

## 安全调用

若 Shell 支持原生 argv/stdin，直接运行 `nodePath`，argv 为 `[repoPath + "/scripts/mcp-smoke.mjs", toolName, JSON.stringify(arguments)]`，无需 shell 拼接。

若 Shell 只收命令文本，用固定包装器从标准输入读取 JSON，再以参数数组启动 smoke 客户端。**任务文本只能进入 JSON 数据，不能拼进 JavaScript 或 shell 源码。** 使用标准 JSON 序列化：文本换行编码成 `\n`，整个 envelope 占一个物理行。下例路径必须换成安装配置；路径的 POSIX 引号规则为：整体单引号包围，路径内每个单引号替换为 `'"'"'`，不得使用 JSON.stringify 充当 shell 转义。

```sh
'/absolute/path/to/node' --input-type=module -e 'import {readFileSync} from "node:fs"; import {spawnSync} from "node:child_process"; const data=JSON.parse(readFileSync(0,"utf8")); const child=spawnSync(process.execPath,[process.argv[1],data.tool,JSON.stringify(data.arguments)],{stdio:"inherit"}); if(child.error) console.error("Local bridge client could not start"); process.exit(child.status ?? 1);' '/absolute/path/to/repo/scripts/mcp-smoke.mjs' <<'BRIDGE_REQUEST_JSON'
{"tool":"submit_task","arguments":{"requestId":"grok-example-001","prompt":"不要调用工具或读写文件。只回复 CODEX_LOCAL_OK","title":"本机派活验证"}}
BRIDGE_REQUEST_JSON
```

保持 heredoc 分隔符带引号；JSON 中不允许未转义的物理换行。若无法可靠序列化，暂停并报告，不能尝试执行未转义文本。自定义 stateDir 可通过 Shell 环境参数传入；仅有命令文本时使用同样的 POSIX 引号规则为该次进程设置环境。

## 结果与交接

smoke stdout 是 MCP 工具结果：先检查进程退出码和 `isError`，再解析 `content[0].text` 内的 JSON。工具错误不是任务成功；保留返回的具体错误，不能凭提示词推测结果。

`wait_task` 的任务在 `task` 字段中，其他任务查询直接返回任务。`completed`、`failed`、`interrupted` 是执行终态；`releasedAt` 独立表示桥已经释放会话。完成但未释放时继续等待，不能宣称可接手。

回复包含 job ID、thread ID（若有）、实际 status、释放状态及模型 `messages` 中的实际答复。用户要完整结果时完整呈现；只做摘要时注明摘要。失败/中断明确报告，不把终态统一叫成功。

打开成功只证明系统接受导航。只有实际 Desktop 正文或用户确认才证明同一会话可见；不得凭 `desktopUrl` 宣称界面验收通过。无需读取 token、Codex 认证文件或打印环境；任务正文与结果仍会分别进入 Codex 和 Grok 的模型服务。
