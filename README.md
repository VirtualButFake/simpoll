<div align="center">

# simpoll

A light-weight, simple bidirectional long-polling library for Roblox.

[![License](https://img.shields.io/github/license/virtualbutfake/simpoll?style=flat)](https://github.com/VirtualButFake/simpoll/blob/master/LICENSE.md)
[![CI](https://github.com/virtualbutfake/simpoll/actions/workflows/ci.yaml/badge.svg)](https://github.com/virtualbutfake/simpoll/actions)
[![Luau CI](https://github.com/virtualbutfake/simpoll/actions/workflows/luau-ci.yaml/badge.svg)](https://github.com/virtualbutfake/simpoll/actions)
[![NPM Version](https://img.shields.io/npm/v/simpoll)](https://www.npmjs.com/package/simpoll)
[![NPM Downloads](https://img.shields.io/npm/d18m/simpoll)](https://www.npmjs.com/package/simpoll)

</div>

# Table of Contents
- [simpoll](#simpoll)
- [Table of Contents](#table-of-contents)
- [What is simpoll?](#what-is-simpoll)
- [Examples](#examples)
  - [Roblox](#roblox)
  - [NPM](#npm)
- [Luau Documentation](#luau-documentation)
    - [`simpoll.new`](#simpollnew)
    - [`simpoll:connect`](#simpollconnect)
    - [`simpoll:send`](#simpollsend)
    - [`simpoll:onMessage`](#simpollonmessage)
    - [`simpoll:destroy`](#simpolldestroy)
- [TypeScript Documentation](#typescript-documentation)
  - [Server](#server)
    - [``Server.subscribe``](#serversubscribe)
    - [``Server.broadcast``](#serverbroadcast)
    - [``Server.connections``](#serverconnections)
    - [``Server.onConnection``](#serveronconnection)
    - [``Server.onDisconnect``](#serverondisconnect)
    - [``Server.listen``](#serverlisten)
    - [``Server.app``](#serverapp)
  - [Connection](#connection)
    - [``Connection.id``](#connectionid)
    - [``Connection.token``](#connectiontoken)
    - [``Connection.lastUpdated``](#connectionlastupdated)
    - [``Connection.queue``](#connectionqueue)
  - [Changelog](#changelog)
  - [License](#license)


# What is simpoll?

Simpoll is exactly what it's name suggests; a simple polling library designed for effective communication between a Node backend and a Roblox server, designed to be lightweight, extensible, and easy to use.

It features 2 main components:

-   A server that can be used to listen for incoming connections and send and receive messages, through long-polling and plain HTTP requests.
-   A client that can be used to connect to a server and poll for messages, while also being able to send messages to the server.

# Examples

## Roblox

1. Add the latest version of the [library via Wally](https://wally.run/package/virtualbutfake/simpoll) to your `wally.toml` file and install it through `wally install` or a comparable command.
2. To get started, use the following code:

```lua
local simpoll = require(path.to.simpoll)
local poll = simpoll.new("https://your.simpoll.server", "your_very_safe_secret_here")

if poll:connect() then
	poll:onMessage("topicClient", function(data)
		print(data)
	end)

	poll:send("topicServer", "Hello, world!")
end
```

## NPM

1. Install the package using npm:

```bash
npm install simpoll
```

2. To get started, use the following code:

```typescript
import { Server } from "simpoll";

const server = new Server("your_very_safe_secret_here");

server.subscribe("topicClient", (connectionId, data) => {
    console.log(`Received data from ${connectionId}: ${data}`);
});

// Any arguments that express.listen accepts can be passed here.
server.listen(3000, () => {
    console.log(`Server listening!`);
});

setInterval(() => {
    server.broadcast("topicServer", "Hello, world!");
}, 1000);
```

3. (optional) In order to see debug logs, set the log level as follows:

```typescript
import { Logger } from "simpoll";
Logger.transports[0].level = "debug";
```

# Luau Documentation

### `simpoll.new`

```luau
simpoll.new(server: string, secret: string, id: string?): simpoll
```

Creates a new simpoll client. The server URL should start with `http://` or `https://` and should be running a simpoll server. The ID is optional and defaults to the game's Job ID. It will be used to identify the connection on the server and should be unique. The secret is a shared secret between the client and server, used to verify requests coming from the client.

Note that this function does not return an actual `simpoll` object, but instead returns a `subConnection`, a wrapper class allowing us to have multiple connections on the same ID work seamlessly. This ensures that multiple packages can use simpoll without interfering with each other. If you call `subConnection:destroy`, all events **created by this class** will be disconnected. If all subconnections are destroyed, the main connection will be destroyed as well.

### `simpoll:connect`

```luau
simpoll:connect(retry: (boolean | number)?, overwrite: boolean?): boolean
```

Connects to the simpoll server. Returns whether the connection was successful. If this function succeeds, the client immediately starts polling for messages. If retry is set to `true`, the client will automatically attempt to reconnect if the connection is lost. If retry is set to a number, the client try that many times to reconnect before giving up. If overwrite is set to `true`, the client will overwrite the existing connection with this ID if one exists, transferring over the current queue and request callback.

If polling fails, the server immediately tries to reconnect using `overwrite` set to true. This will refresh the connection and ensure that the client is always connected.

### `simpoll:send`

```luau
simpoll:send(topic: string, data: any): boolean
```

Sends a message to the simpoll server with the given topic. Returns whether the message was sent successfully.

### `simpoll:onMessage`

```luau
simpoll:onMessage(topic: string, callback: (data: string) -> ()): signal.Connection
```

Sets a callback to be called when a message is received from the simpoll server with the given topic. The callback should take a single argument, which is the data received from the server.

### `simpoll:destroy`

```luau
simpoll:destroy()
```

Destroys the simpoll server. This function should be called when the entire poller is no longer needed. While it is technically reversible by calling `simpoll:connect` again, this is not recommended. Under the hood, this function disconnects all events and disconnects from the server.

# TypeScript Documentation

## Server

A server can be constructed using the `Server` class. The server can be used to listen for incoming connections and send and receive messages. The server can be constructed using the following code:

```typescript
import { Server } from "simpoll";

const server = new Server("your_very_safe_secret_here", "an_optional_api_path");
```

API path is optional and defaults to `/`.

### ``Server.subscribe``

```typescript
server.subscribe(topic: string, callback: (id: string, data: string) => void)
```

Subscribes to a topic. The callback will be called when a message is received from the client. The callback should take two arguments: the connection ID and the data received from the client.

### ``Server.broadcast``

```typescript
server.broadcast(topic: string, data: string)
```

Broadcasts a message to all connected clients, with the given topic.

### ``Server.connections``

```typescript
server.connections(): Connection[]
```

Returns all currently connected clients.

### ``Server.onConnection``

```typescript
server.onConnection(callback: (connection: Connection, overwroteExisting: boolean) => void): void
```

Sets a callback to be called when a new connection is established. The callback should take two arguments: the connection object and a boolean indicating whether the connection overwrote an existing connection.

### ``Server.onDisconnect``

```typescript
server.onDisconnect(callback: (connection: Connection) => void): void
```

Sets a callback to be called when a connection is disconnected. The callback should take one argument: the connection object.

### ``Server.listen``

```typescript
server.listen(...args: any[]): void
```

Starts the server. Any arguments that `express.listen` accepts can be passed here. A list of possible arguments can be found [here](https://expressjs.com/en/4x/api.html#app.listen).

### ``Server.app``

This is the underlying Express app that the server is using. You can use this to add middleware.

## Connection

A connection object represents a connection to a client.

### ``Connection.id``

```typescript
connection.id: string
```

The ID of the connection.

### ``Connection.token``

```typescript
connection.token: string
```

The token used to validate the connection.

### ``Connection.lastUpdated``

```typescript
connection.lastUpdated: Date
```

The last time the connection was updated. This is internally used to determine if a connection has timed out and should be removed. This should not be modified.

### ``Connection.queue``

```typescript
connection.queue(topic: string, payload: string): void
```

Adds data to the connection's queue. This data will be sent to the client immediately if the client is currently polling, and will otherwise be sent when the client next polls.

## Changelog

The changelog can be found [here](CHANGELOG.md).

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/virtualbutfake/fusion-autocomplete/blob/master/LICENSE.md) file for details.
