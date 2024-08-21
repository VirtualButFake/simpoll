# 0.2.4

-   Connections now contain an `ip` field to allow for more detailed logging. This value is resolved at connection time, and if connections come from multiple sources, only the first one will be logged.

# 0.2.3

-   `data` in `eventCallback` is now typed as `any`, to allow the user to specify their own types

# 0.2.2

-   I forgot to build the npm package before publishing... oops

# 0.2.1

-   Improve typing
-   `Server.subscribe`'s callback now returns the connection instead of it's id

# 0.2.0

-   Update log level updating guide
-   Allow concurrent connections from same client on same ID by treating them as the same connection
-   Added `overwrite` parameter to `simpoll:connect` to allow overwriting existing connections
-   Convert `onMessage` to use events instead of callbacks to allow for multiple listeners
-   `disconnect` now disconnects all listeners
-   Either side now supports sending JSON with primitives (string, number, boolean, object) as data. These will be automatically serialized and deserialized. Do not send non-suppoorted data types, as this is undefined behavior.
-   Improved reconnection logic - it will now overwrite existing connections to account for failed disconnections and retry infinitely. This may result in dropped data but ensures that the connection is always maintained.
-   Improved general network stability - fewer dropped connections should occur
-   Add `onConnection` and `onDisconnect` events to allow for more control over connections

# 0.1.3

-   Set default log level to "info"
-   Expose logger so the user can view debug logs

# 0.1.2

-   Made server -> client messages support topics
-   Increased general stability

# 0.1.1

-   Bugfixes

# 0.1.0

-   Initial release
