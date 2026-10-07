# Grok Bot 私有技能安装

本接入包使用 Grok Bot 的私有技能库和已连接 Mac 的 Shell。源码为 [codex-local/SKILL.md](skills/codex-local/SKILL.md)，没有 marketplace manifest，也不依赖个人 Bot 能添加 Command MCP。

## 安装一次

前提：目标 Mac 已有本仓库、Node 和正在运行的桥；Bot 能列出并在这台 Mac 上执行 Shell。

在该 Bot 聊天中要求它读取源文件，保存为私有技能 `codex-local`，并把以下非秘密配置加入保存的技能内容：

- `machineName`：你的目标 Mac 名称，以 `ListMachines` 当前返回为准。
- `repoPath`：仓库的绝对路径。
- `nodePath`：在目标 Mac 用 `node -p process.execPath` 得到的绝对路径。
- `stateDir`：仅当现有后台使用自定义 `BRIDGE_STATE_DIR` 时填写。

可直接发给 Bot：

```text
请在我指定的 Mac 上读取仓库内 plugins/grokbot-to-codex/skills/codex-local/SKILL.md，按该源码保存私有技能 codex-local，显示为“Codex 本机派活”。保留流程与安全边界，并记录我指定的 machineName、repoPath，以及你在同一 Mac 核实的 nodePath。不要读取凭据。先检查同名技能，更新本接入包原有版本；若同名属于其他用途，告诉我，不覆盖。保存后确认私有技能可发现，不要只保存一个本地文件，也不要配置 Grok CLI。
```

官方支持通过聊天保存技能；若 Bot 提供 `UpdateSkill`，使用它的当前工具字段写入共享私有库，不猜测隐藏 API。核实桌面输入框 `/` 能发现 `codex-local`；找不到时在 **Marketplace → Your plugins → Manage plugins and skills → Private skills** 检查。保存成功、宿主发现和执行成功分别记录。

当前本机实例配置：目标 Mac 为 Helios；仓库为 `/Users/xianweizhang/Projects/codex-task-bridge`。machine ID 不写入源码；安装时重新列举，Node 路径在同机核实。这些本机事实不是其他用户的默认配置。

## 一次实际验收

在新消息中显式选择 `/codex-local`，要求派一个只读任务：“不要调用工具或读写文件，只回复 CODEX_LOCAL_OK。”Bot 应选择同一 Mac，检查 health，提交并记录 job ID，通过等待和查询取得实际答复，确认 releasedAt 后按用户要求打开官方 Desktop。

独立核对 Desktop 中同一 thread 的用户消息和答复。仅保存技能、只有任务标题或 `open` 成功都不算闭环通过。后续日常只需选择技能并描述任务，不必粘贴命令。

## 更新、停用与范围

更新时重新读取版本库的源码，再更新对应私有技能；本仓库是维护原件。停用该私有技能不删除桥中的历史任务或官方 Codex 会话。此入口当前只读；取消、续接、写入审批、通知和常驻安装依各自工单另行交付。

私有技能库由 Bots 共享，但每个 Bot 仍必须拥有目标 Mac 的工具权限；保存技能不会授予新的电脑访问权。

依据：[Grok Bot 官方 Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)，2026-10-07 核查。
