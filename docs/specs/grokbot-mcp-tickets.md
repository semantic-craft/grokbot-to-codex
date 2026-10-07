# GrokBot MCP 工单索引

规格父工单：[规格：GrokBot MCP 派活、结果查询与通知扩展](https://github.com/semantic-craft/grokbot-to-codex/issues/1)。

用户已确认 13 张工单拆分；所有工单已发布并标记 `ready-for-agent`。依赖以 GitHub 原生阻塞关系为准，下面记录发布时的映射。

| 拆分序号 | GitHub 工单 | 阶段 | 被哪些工单阻塞 |
|---|---|---|---|
| 01 | [#2 GrokBot MCP 最小派活闭环](https://github.com/semantic-craft/grokbot-to-codex/issues/2) | 1 | 无 |
| 02 | [#3 任务持久化与可靠去重](https://github.com/semantic-craft/grokbot-to-codex/issues/3) | 1 | #2 |
| 03 | [#4 取消任务并交给 Desktop](https://github.com/semantic-craft/grokbot-to-codex/issues/4) | 1 | #3 |
| 04 | [#5 在原会话继续派活](https://github.com/semantic-craft/grokbot-to-codex/issues/5) | 1 | #3 |
| 05 | [#6 选择项目与有界排队](https://github.com/semantic-craft/grokbot-to-codex/issues/6) | 1 | #3 |
| 06 | [#7 受控写入、问题与人工审批](https://github.com/semantic-craft/grokbot-to-codex/issues/7) | 1 | #6 |
| 07 | [#8 后台常驻与故障恢复](https://github.com/semantic-craft/grokbot-to-codex/issues/8) | 1 | #3 |
| 08 | [#9 版本升级与第一阶段交付验收](https://github.com/semantic-craft/grokbot-to-codex/issues/9) | 1 | #4, #5, #7, #8 |
| 09 | [#10 验证 GrokBot 主动通知能力](https://github.com/semantic-craft/grokbot-to-codex/issues/10) | 2 | #2 |
| 10 | [#11 可靠投递任务通知](https://github.com/semantic-craft/grokbot-to-codex/issues/11) | 2 | #3, #7, #10 |
| 11 | [#12 Codex Desktop 可选工具入口](https://github.com/semantic-craft/grokbot-to-codex/issues/12) | 3 | #5, #7 |
| 12 | [#13 验证 ChatGPT 接入方式](https://github.com/semantic-craft/grokbot-to-codex/issues/13) | 3 | #2 |
| 13 | [#14 ChatGPT 共享任务入口](https://github.com/semantic-craft/grokbot-to-codex/issues/14) | 3 | #5, #7, #13 |

执行顺序按三个阶段推进。阶段 2 的技术依赖不表示应提前跳过阶段 1；阶段 3 按用户实际需求启用。通知和 ChatGPT 实现工单还须满足能力验证成功条件，不能把探索工单关闭当成能力已支持。

发布时可立即开始的是 #2：GrokBot MCP 最小派活闭环。此索引不表示工单已领取或实施。

发布验证：13 张实施工单、20 条原生阻塞关系，父工单保持打开；没有追加或修改父工单正文。
