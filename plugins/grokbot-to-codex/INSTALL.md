# 在你自己的 Mac 上安装

整个仓库是插件根目录，包含 `.cursor-plugin/plugin.json`、[codex-local 技能](skills/codex-local/SKILL.md)及根目录 Node 运行时。只复制技能子目录无法取得运行时。本包不安装其他后台、不复制用户登录信息，也不修改官方 Codex。

## 1. 取得完整包并启动桥

需要 macOS、Node.js 22+、已安装并登录的官方 Codex Desktop。下载本仓库的完整源码或 clone 到你选择的位置（以下目录仅是示例）：

```sh
git clone https://github.com/semantic-craft/grokbot-to-codex.git "$HOME/Projects/grokbot-to-codex"
cd "$HOME/Projects/grokbot-to-codex"
node -p process.execPath
node --version
```

记录实际 Node 路径。默认 Codex 候选为 `/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex`；先核实该可执行文件。若 Desktop 安装在其他位置，找到实际应用包内的 Codex，再以 `CODEX_BINARY` 指定。不要用他人的机器路径或凭据。

在独立本地终端启动后台并保持终端运行：

```sh
node bridge.mjs serve
```

默认路径不同的情况，替换下面占位符后启动：

```sh
CODEX_BINARY='/absolute/path/to/official/codex' node bridge.mjs serve
```

另一个终端在同一目录执行 `node bridge.mjs health`，核对 `alive`、`cwd` 和 `binary`。第一次初始化失败时修复实际路径，不绕过失败继续派活。服务仍须手动运行；技能安装不等于后台常驻安装。

默认状态在插件根目录 `.bridge`。若宿主安装目录会随升级替换，可将 `BRIDGE_STATE_DIR` 指向你自己的稳定目录，并在服务和客户端使用同一个值。停止服务并确认无活动任务后再移动已有状态；本指南不自动迁移记录。

## 2A. Grok Bot：保存私有技能

让 Bot 在已连接的目标 Mac 上读取完整包中的技能源码，保存为共享私有技能 `codex-local`。可发给 Bot：

```text
请在我指定的 Mac 上找到已下载的 grokbot-to-codex 插件包，读取 plugins/grokbot-to-codex/skills/codex-local/SKILL.md，保存私有技能 codex-local，显示为“Codex 本机派活”。保留流程与安全边界，发现并记录本机 machineName、插件根目录 repoPath、nodePath，以及服务使用的自定义 stateDir（若有）。不要读取凭据。先检查同名技能；仅更新本接入包的原有版本，同名他源不要覆盖。保存后确认私有技能可发现。
```

使用官方聊天保存机制；若 Bot 暴露 `UpdateSkill`，按该工具当前字段写入共享私有库。核实输入框 `/` 菜单中的技能；找不到时查看 **Marketplace → Your plugins → Manage plugins and skills → Private skills**。

这是 Grok Bot 私有技能安装，**不是 Marketplace 插件发布或任意本地包导入**。目前尚未证实 Grok Bot 能直接导入 `.cursor-plugin` 本地目录，不能把 Cursor 的安装路径套给 Grok Bot，也不要写入 Grok CLI 配置。

## 2B. Cursor：加载完整本地插件包

Cursor 官方文档支持 `~/.cursor/plugins/local/<name>` 本地插件目录并在重载后发现。将完整干净源码放在 `~/.cursor/plugins/local/grokbot-to-codex`；例如首次安装时可直接 clone 到那里，而不是再建另一份技能或运行时：

```sh
mkdir -p "$HOME/.cursor/plugins/local"
git clone https://github.com/semantic-craft/grokbot-to-codex.git "$HOME/.cursor/plugins/local/grokbot-to-codex"
```

目标已存在时先检查，不覆盖。此时第 1 步的运行目录和 `repoPath` 都使用这一插件根目录。在 Cursor 本地窗口重载，检查插件及 `codex-local` 技能是否发现，再调用技能。团队/企业可能需要管理员允许 Local Plugin Imports；同名 Marketplace 安装可能优先于本地包，应核实实际加载来源。

这是有文档依据的 Cursor 本地加载流程；本项目尚未在你的 Cursor 上完成实机验收。无需 Grok 的 ListMachines；技能在本机终端核对主机与 runtime，远程窗口不自动改为远程执行。

仓库是单插件包，不需要额外 `marketplace.json`。Marketplace 发布是独立流程，当前未创建团队或提交审核；Grok 的技能发布菜单可能要求 Cursor 团队，不能将本地打包当成市场已经上架。

## 3. 验证一次，之后自然语言派活

在新消息显式选择技能，让它执行：“不要调用工具或读写文件，只回复 CODEX_LOCAL_OK。”应看到本机 health、稳定 job ID、实际答复和 `releasedAt`。要求打开后，独立核对官方 Desktop 中同一 thread 的完整问答。

仅保存技能、manifest 合法、工具返回已受理或打开链接均不等于闭环成功。分别记录包文件、宿主发现、实际调用和 Desktop 显示证据。

本版执行目录固定为插件根目录且只读。取消、续接、写入审批、项目选择、主动通知和常驻安装尚未交付。每个 Bot 仍需目标 Mac 的现有工具权限；技能保存不会授予额外电脑权限。

## 更新与停用

以版本库源码为原件更新；Grok 私有技能需重新读取源码并更新对应条目，Cursor 核实重载后实际版本。停用插件/技能不会删除官方会话；升级或移除完整包前保留需要的 `.bridge` 历史状态。不要把该目录、登录凭据或个人配置放进分发包。

依据：[Cursor Plugins reference](https://cursor.com/docs/reference/plugins)、[官方 manifest schema](https://github.com/cursor/plugins/blob/main/schemas/plugin.schema.json)、[Grok Bot Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)，2026-10-07 核查。未执行 Cursor 安装或 Marketplace 发布。
