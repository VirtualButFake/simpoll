# 0.3.0

-   Add `simpoll:get`, which allows the client to request data from the server. While working with the library, I realized that I used a pattern where I used polling and `simpoll:send` to get data from the server, which couldn't really be implemented cleanly. This is a more elegant solution to that problem.
-   Added `Server.registerHandler` to allow handling of get requests. Returned data will be serialized as JSON and sent to the client.
-   Add error handling on the server side to prevent crashes when the client sends invalid data

# 0.2.6

-   `simpoll:send` will now retry if `retry` is true, even if no connection exists .

# 0.2.5

-   Increase `retry` delay to 5 seconds to prevent rate limiting on Cloudflare's end

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
