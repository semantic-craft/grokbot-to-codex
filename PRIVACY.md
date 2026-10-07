# Privacy and local data

GrokBot to Codex is a local bridge and skill package. The maintainer operates no hosted task service for it. This package adds no telemetry or cloud relay; the bridge listens on loopback and requires a locally stored bearer token.

The default `<installation>/.bridge/` directory contains that token, connection information, task identifiers, status and model results. An explicit `BRIDGE_STATE_DIR` changes its location. This state is excluded from Git and should not be included in plugin archives or support reports. The bridge does not copy or print Codex login credentials; official Codex uses its existing authentication.

This is not offline inference. Tasks and the context official Codex uses are sent to its model service. When Grok Bot or Cursor retrieves results, those results enter that client's conversation and may be processed by its model service. Each application's own privacy terms and account settings govern that processing. Official Codex separately stores the conversation history used by Desktop; this package does not replace or delete that store.

You can stop the bridge and disable the host skill/plugin. Retain local bridge state to keep its task index, or delete your own state directory after stopping the service if you no longer need it. Removing bridge state does not remove official Codex conversation history; manage that separately in Codex. Avoid sharing tokens, private task contents or authentication files when reporting an issue.

This notice describes the package's current local behavior, not a guarantee about the privacy practices of Grok, Cursor, Codex or their model providers.
