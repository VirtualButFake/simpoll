<div align="center">

# simpoll

A light-weight, simple bidirectional long-polling library for Roblox.

[![License](https://img.shields.io/github/license/virtualbutfake/simpoll?style=flat)](https://github.com/VirtualButFake/simpoll/blob/master/LICENSE.md)
[![CI](https://github.com/virtualbutfake/simpoll/actions/workflows/ci.yaml/badge.svg)](https://github.com/virtualbutfake/simpoll/actions)
[![Luau CI](https://github.com/virtualbutfake/simpoll/actions/workflows/luau-ci.yaml/badge.svg)](https://github.com/virtualbutfake/simpoll/actions)
[![NPM Version](https://img.shields.io/npm/v/simpoll)](https://www.npmjs.com/package/simpoll)
[![NPM Downloads](https://img.shields.io/npm/d18m/simpoll)](https://www.npmjs.com/package/simpoll)

</div>

## What is simpoll?

Simpoll is exactly what it's name suggests; a simple polling library designed for effective communication between a Node backend and a Roblox server, designed to be lightweight, extensible, and easy to use.

It features 2 main components:

-   A server that can be used to listen for incoming connections and send and receive messages, through long-polling and plain HTTP requests.
-   A client that can be used to connect to a server and poll for messages, while also being able to send messages to the server.

## Examples

### Roblox

1. Add the latest version of the [library via Wally](https://wally.run/package/virtualbutfake/simpoll) to your `wally.toml` file
2. To get started, use the following code:

```lua
local simpoll = require(path.to.simpoll)
local poll = simpoll.new("https://your.simpoll.server", "your_very_safe_seceret_here")

if poll:connect() then
	poll:onMessage(function(data)
		print(data)
	end)

	poll:send("topic", "Hello, world!")
end
```

### NPM

1. Install the package using npm:

```bash
npm install simpoll
```

2. To get started, use the following code:

```typescript
import { Server } from "simpoll";

const server = new Server("your_very_safe_secret_here");

server.subscribe("topic", (connectionId, data) => {
    console.log(`Received data from ${connectionId}: ${data}`);
});

// Any arguments that express.listen accepts can be passed here.
server.listen(3000, () => {
    console.log(`Server listening!`);
});
```

## Luau Documentation

### `simpoll.new`

```luau
simpoll.new(server: string, secret: string): simpoll
```

Creates a new simpoll client. The server URL should start with `http://` or `https://` and should be running a simpoll server.

### `simpoll:connect`

```luau
simpoll:connect(): boolean
```

Connects to the simpoll server. Returns whether the connection was successful. If this function succeeds, the client immediately starts polling for messages.

### `simpoll:send`

```luau
simpoll:send(topic: string, data: any): boolean
```

Sends a message to the simpoll server with the given topic. Returns whether the message was sent successfully.

### `simpoll:onMessage`

```luau
simpoll:onMessage(topic: string, callback: (data: string) -> ())
```

Sets a callback to be called when a message is received from the simpoll server with the given topic. The callback should take a single argument, which is the data received from the server. Please note that calling this function multiple times will overwrite the previous callback.

### `simpoll:disconnect`

```luau
simpoll:disconnect()
```

Disconnects from the simpoll server. This function should be called when the connection is no longer needed. Calling `simpoll:connect()` after calling this function will re-establish the connection.

## TypeScript Documentation

### Server

A server can be constructed using the `Server` class. The server can be used to listen for incoming connections and send and receive messages. The server can be constructed using the following code:

```typescript
import { Server } from "simpoll";

const server = new Server("your_very_safe_secret_here", "an_optional_api_path");
```

API path is optional and defaults to `/`.

### Server.subscribe

```typescript
server.subscribe(topic: string, callback: (id: string, data: string) => void)
```

Subscribes to a topic. The callback will be called when a message is received from the client. The callback should take two arguments: the connection ID and the data received from the client.

### Server.broadcast

```typescript
server.broadcast(topic: string, data: string)
```

Broadcasts a message to all connected clients, with the given topic.

### Server.getConnections

```typescript
server.getConnections(): Connection[]
```

Returns all currently connected clients.

### Server.listen

```typescript
server.listen(...args: any[]): void
```

Starts the server. Any arguments that `express.listen` accepts can be passed here. A list of possible arguments can be found [here](https://expressjs.com/en/4x/api.html#app.listen).

### Server.app

This is the underlying Express app that the server is using. You can use this to add middleware.

### Connection

A connection object represents a connection to a client.

### Connection.id

```typescript
connection.id: string
```

The ID of the connection.

### Connection.token

```typescript
connection.token: string
```

The token used to validate the connection.

### Connection.lastUpdated

```typescript
connection.lastUpdated: Date
```

The last time the connection was updated. This is internally used to determine if a connection has timed out and should be removed. This should not be modified.

### Connection.queue

```typescript
connection.queue(topic: string, payload: string): void
```

Adds data to the connection's queue. This data will be sent to the client immediately if the client is currently polling, and will otherwise be sent when the client next polls.

## Changelog

The changelog can be found [here](CHANGELOG.md).

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/virtualbutfake/fusion-autocomplete/blob/master/LICENSE.md) file for details.
