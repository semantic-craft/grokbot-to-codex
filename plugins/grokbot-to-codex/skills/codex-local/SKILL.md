---
name: codex-local
description: 在已配置的用户 Mac 上派活给 Codex、查询实际结果，并在会话释放后用官方 Codex Desktop 打开。用于用户要求 Codex 本机派活、查看任务或桌面接手。
---

# Codex 本机派活

通过 Grok Bot 的本机 Shell 调用既有任务桥；任务执行归独立后台服务。技能无需注册原生 MCP 连接。

## 绑定与检查

安装时保存三项非秘密配置：`machineName`（用户指定 Mac 的名称）、`repoPath`（仓库绝对路径）、`nodePath`（Node 绝对路径）。未配置时只询问缺项；已经配置就直接使用。可选 `stateDir` 仅在服务使用自定义状态目录时设置。

1. 使用 `ListMachines` 找到配置的 Mac，核对在线状态和本机身份，取得本次实际 machine ID。所有 Shell 调用显式指定它。重名或身份不明时先核实；云端容器或另一台电脑不是替代执行地。
2. 在该机器执行配置的 Node 和仓库中的 `bridge.mjs health`。用 Shell 的参数数组（若支持），否则按下述安全引号规则传路径。自定义 `stateDir` 时向子进程传 `BRIDGE_STATE_DIR`，不更改全局环境。
3. 只有返回 `alive: true` 且 `cwd` 与配置仓库的实际路径一致才派活。失败时报告主机、路径或服务不可达，让用户恢复已有服务；不要另起实例、安装依赖或改监听地址。

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
