# Codex Task Bridge：官方 Desktop 可见性最小验证

目标：chatbot 调用一个本机小服务，由官方 Desktop 自带的 Codex app-server 执行一句测试提示，并在官方 Desktop 打开同一持久会话。没有 T3 代码或依赖。

## 运行

需要 Node.js 22+、macOS、已登录的官方 Codex/ChatGPT Desktop。默认使用桌面安装包中的 `codex-cli/bin/codex`，可用 `CODEX_BINARY` 指定其他位置。

```sh
cd /Users/xianweizhang/Projects/codex-task-bridge
node bridge.mjs serve
```

客户端另开终端：

```sh
node bridge.mjs health
node bridge.mjs submit chatbot-probe-001 '不要调用工具或读取文件。请只回复：CHATBOT_TO_CODEX_OK' 'Chatbot 派活验证'
node bridge.mjs read chatbot-probe-001
node bridge.mjs open chatbot-probe-001
```

`submit` 异步返回，继续 `read` 直到 `completed`/`failed`/`interrupted`。创建成功会带 `threadId` 和 `desktopUrl`。同一个 request ID 重试只返回原任务；新测试必须使用新的 ID。`open` 用系统注册的 `codex://threads/<id>` 链接打开官方 Desktop，不是另一个自制界面。

## 可复制到本机 chatbot 的提示词

```text
请在这台 Mac 的本地终端执行以下命令，验证我已启动的 Codex 桥接服务：

cd /Users/xianweizhang/Projects/codex-task-bridge
node bridge.mjs health
node bridge.mjs submit chatbot-probe-001 '不要调用工具，不要读取或修改文件。请只回复：CHATBOT_TO_CODEX_OK' 'Chatbot 派活验证'

然后每隔几秒执行 node bridge.mjs read chatbot-probe-001，直到完成或报错。
成功后执行 node bridge.mjs open chatbot-probe-001。
把 threadId、status 和模型实际回复告诉我，不要把 starting/running 当成完成。
如果你不能访问这台 Mac 的终端，明确告诉我；不要在云端另起服务，也不要假装已经运行。
不要读取 .bridge/token、Codex auth.json 或其他凭据文件。
```

这段提示词要求 chatbot 已有**这台 Mac 的本地命令执行能力**。仅能访问云端终端或远程 MCP 的 chatbot 无法通过文字提示访问本机 `127.0.0.1`；该情况下尚需配置连接器，本原型不偷偷开放公网。

## GrokBot 本地 MCP 入口

薄适配器已提供 `submit_task`、`get_task`、`list_tasks`、`wait_task`、`open_in_desktop`。
后台仍单独运行 `node bridge.mjs serve`；MCP 只转发请求，断开它不会停止任务。
此版本仍限于本项目只读派活，不包含常驻安装、写入审批或续接。

在 GrokBot 的本机 Command MCP 配置中，命令填写 **Node 的绝对路径**（可用 `node -p process.execPath` 查询），参数填写本仓库 **mcp.mjs 的绝对路径**。例如常见 MCP 配置形状如下；具体字段依客户端表单填写，不宣称这是 GrokBot 的可导入 manifest：

```json
{
  "mcpServers": {
    "grokbot-to-codex": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/grokbot-to-codex/mcp.mjs"]
    }
  }
}
```

必须选择运行桥的这台 Mac。无需填 token：适配器从本机私有状态目录读取，不把凭据暴露给模型。不要把 `npm run mcp` 当作命令入口，npm 的额外 stdout 会干扰协议。

`BRIDGE_STATE_DIR` 可为后台、CLI 和 MCP 指定同一个绝对状态目录；默认仓库内 `.bridge`。隔离测试还可指定 `BRIDGE_PORT`，它只改变 loopback 端口。连接配置只接受 `http://127.0.0.1`，拒绝向远端或重定向地址发送本机凭据。

验证命令（第一条只列工具，不派活；后面的命令会实际执行）：

```sh
node scripts/mcp-smoke.mjs
node scripts/mcp-smoke.mjs submit_task '{"requestId":"mcp-probe-001","prompt":"不要调用工具或读写文件。只回复 MCP_TO_CODEX_OK","title":"MCP 派活验证"}'
node scripts/mcp-smoke.mjs wait_task '{"taskId":"mcp-probe-001","timeoutMs":10000}'
node scripts/mcp-smoke.mjs get_task '{"taskId":"mcp-probe-001"}'
node scripts/mcp-smoke.mjs open_in_desktop '{"taskId":"mcp-probe-001"}'
```

`wait_task` 最长等待 30 秒，超时返回 `timedOut: true` 和当前 `task`，不会取消任务。
默认等到终态且 `releasedAt` 已有值；`untilReleased: false` 只等执行结束，不能据此立即交给 Desktop。
`open_in_desktop` 在后端检查释放状态；打开请求成功仅表示系统接受导航，完整问答是否显示须在 Desktop 验收。
未知任务、无效参数、桥未启动或错误电脑通过 MCP `isError` 返回，stdout 仅输出协议。

```sh
npm test
```

合同测试运行真实 MCP 和后台进程，仅在 app-server 进程/JSON-RPC 边界替换夹具，不调用模型、不读用户 Codex 凭据，使用临时状态目录和 loopback 端口。
覆盖 MCP 初始化/工具发现、异步提交、等待超时、客户端断线/重连、真实协议结果收集、完成与释放区分、打开未释放会话拒绝、HTTP 认证/Origin 拒绝和 CLI 兼容。
真实 GrokBot 配置及 Desktop 验收需另行记录，合同测试不替代该证据。

协议依据：[MCP stdio 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)。

## 实际范围

- `bridge.mjs` HTTP/CLI 入口与 `codex.mjs` 协议客户端，只有 Node 内置模块，无 npm 安装和第三方遥测。
- 仅监听 `127.0.0.1:43187`；所有请求要求随机 bearer，CLI 自动读取本地私有文件，不输出令牌。
- 固定在本项目工作目录；线程为只读、禁止审批提升，目的是验证会话可见性，不是完整编码执行器。
- 不修改官方 Desktop 安装包、全局配置或后台 daemon 开关；不重启 Desktop。
- 每个任务独立启动 app-server，共享当前用户的 Codex 本地持久会话库，使用实验 `historyMode: paginated`。任务完成后退出执行进程并释放会话锁，再在 Desktop 打开。**这不等于与 Desktop 共用同一个正在执行的后端，不承诺运行中的实时接管。** `open` 会拒绝尚未释放的任务。
- 桥不会复制或显示 Codex 登录令牌，由官方 app-server 使用现有登录；提示词及其上下文仍会由 Codex 发给模型服务，本原型不意味着离线推理。
- `.bridge/` 存放连接信息、令牌、任务 ID 与模型返回内容，已加入 `.gitignore`。不记录原始 app-server stderr，不持久化请求提示词到桥的 jobs 文件（Codex 自身仍保存会话）。
- 退出服务会终止该桥的 app-server。重启后未完成任务标为 interrupted，不自动重放。已完成会话保留在 Codex 原有存储内。

## 验收记录（2026-10-07）

- 官方二进制：`0.162.0-alpha.2`。
- V1 失败：legacy 历史模式 + 常驻执行进程。用户截图确认 Desktop 能看到标题，但显示 `Couldn't load messages` 和 `This is open in another app`。
- 回归程序 `verify-history.mjs` 对 V1 重现 `thread/items/list is not supported yet`。
- V2 修复：paginated 历史，每任务执行进程在结束后退出。
- HTTP/JSON-RPC 真实派活：`desktop-probe-002` 完成。
- thread ID：`01a1163e-4073-7070-b3a0-7704f5bf9ab9`。
- 模型实际回复：`BRIDGE_DESKTOP_OK_V2`。
- 回归程序从独立 app-server 读取消息、resume 同一 thread 成功，之后退出释放锁。
- 官方 Desktop `read_thread` 返回同一 thread 的完整用户消息、模型答复和 completed 状态；导航接口接受 ID。
- 用户已在官方 Desktop 看到回复并回传 `BRIDGE_DESKTOP_OK_V2`，可见性验收通过。chatbot 发起链路尚需把上述提示词交给 chatbot 验证。
- 未认证读取返回 401；带浏览器 Origin 的提交返回 403；无效提交返回 400；重复 request ID 返回原任务且不启动新 turn。

回归检查（无模型调用；读取并短暂 resume 已存在的测试会话）：

```sh
node verify-history.mjs 01a1163e-4073-7070-b3a0-7704f5bf9ab9
```

先关闭该测试会话的活跃执行，再运行检查。不要在用户正在执行的其他会话上运行此脚本。

## 停止

前台终端按 Ctrl-C。当前实例 PID 可查看 `.bridge/connection.json`，不要误杀其他 Codex 进程。代码和 `.bridge` 状态均位于本目录；没有安装自启动项。

协议参考：[官方 app-server 文档](https://learn.chatgpt.com/docs/app-server)。实验历史格式可能随桌面版升级变化。
