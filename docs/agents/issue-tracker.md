# Issue tracker: GitHub

仓库：semantic-craft/grokbot-to-codex。
规格和工单发布到 GitHub Issues，使用 gh CLI 操作。
多行正文使用 --body-file，读取工单时包含正文、评论和标签。

每张实施工单独立发布，使用 ready-for-agent 标签。
依赖优先使用 GitHub 原生 blocking 关系；
不可用时，在正文 Blocked by 中引用阻塞工单。

只有所有阻塞项完成的工单可以开始实施。
发布子工单不自动关闭或修改父工单。

PRs as a request surface: no.
