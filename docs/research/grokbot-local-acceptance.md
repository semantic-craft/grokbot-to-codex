# GrokBot 本机入口实测

2026-10-07，插件技能源码基线 `e72e84d`；本机桥运行时代码 `913bbf3`。官方 app-server 为 `0.162.0-alpha.2`。本记录不替代其他机器或客户端的验收。

## 已通过

- 用户指定亚里士多德为测试 Bot。它通过本机 Shell 执行 health，确认目标 Mac 上的桥可达。
- 经实际 MCP 客户端提交的首个任务 `aristotle-mcp-acceptance-001` 完成，真实答复为 `ARISTOTLE_MCP_TO_CODEX_OK`，会话释放后调用 Desktop 打开入口。
- 用 GrokBot 自身 `UpdateSkill` 保存 `codex-local`，技能正文来自版本库源码，本机配置只追加在该用户的私有安装中。
- GrokBot 的技能设置页面显示该技能及正文；输入框 `/codex-local` 显示可选择的技能项，证明宿主发现，而不只证明文件存在。
- 从菜单选择技能后，只发送自然语言目标：“给本机 Codex 派只读测试，不调用工具或读写文件，只回复 GROKBOT_PLUGIN_LOCAL_OK；查结果后打开官方 Desktop。”请求没有路径或命令。
- GrokBot 自行选择本机、检查 health、提交、等待、读取实际结果并调用打开入口。桥记录为 `completed` 且包含 `releasedAt`；实际答复 `GROKBOT_PLUGIN_LOCAL_OK`。官方 Desktop 读取接口返回同一 thread 的完整用户消息及最终答复，状态为 idle。

自然语言任务标识：job `grok-6863af4d-a076-4200-b87f-6621517abd5b`；thread `01a11682-12be-75a2-bcb0-b03a2572d9f9`。仅为公开测试标记任务，不含真实业务内容。

## 尚未通过或不在本次证据内

- 本次新会话的 Desktop 界面正文及人工接手尚待用户确认；读取接口和导航成功不等于目视验收。先前原型 V2 的 Desktop 可见性已有用户确认。
- 当前接入是 GrokBot 私有技能调用本机程序，不是其原生 MCP 插件在本机运行的证明。
- 当前 GrokBot 技能页面的“发布”菜单提示需要 Cursor 团队；未创建团队或发布技能。Cursor 格式源码包、市场审核及实际上架是不同状态。
- 其他用户机器、Cursor 实际安装、登录自启、写入审批、取消/续接和主动通知未由这次测试覆盖。
