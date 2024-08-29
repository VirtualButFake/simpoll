local simpoll = {}
simpoll.__index = simpoll

local HttpService = game:GetService("HttpService")
local signal = require("@packages/signal")

local ENDPOINTS = {
	CONNECT = "connect",
	SUBSCRIBE = "subscribe",
	SEND = "receive",
	GET = "get",
	DISCONNECT = "disconnect",
}

local availablePollers: {
	[string]: simpoll,
} = {}

local function parseMaybeJson(data: string): any
	local isDecodingSuccessful, decoded = pcall(HttpService.JSONDecode, HttpService, data)

	if isDecodingSuccessful then
		return decoded
	end

	return data
end

local function parseResponseError(response: any): string
	if typeof(response) == "table" then
		return response.message
	end

	return response
end

local function mergeUrl(base: string, ...: string): string
	local url = base

	for _, path in { ... } do
		url = url .. "/" .. path
	end

	return url
end

function simpoll.new(server: string, secret: string, id: string?): subConnection
	local name = id or game.JobId ~= "" and game.JobId or HttpService:GenerateGUID(false)
	local poller = availablePollers[name]

	if not poller then
		poller = setmetatable({
			server = server,
			connection = nil,
			secret = secret,
			subConnections = {},
			id = name,
		}, simpoll) :: simpoll
	end

	local subConnection = setmetatable({
		events = {},
		parent = poller,
		destroy = function(self: subConnection)
			for topic, event in self.events do
				event:Destroy()
				self.events[topic] = nil
			end

			table.remove(poller.subConnections, table.find(poller.subConnections, self))

			if #poller.subConnections == 0 then
				availablePollers[poller.id] = nil
				poller:destroy()
			end
		end,
	}, {
		__index = poller,
	}) :: subConnection

	table.insert(poller.subConnections, subConnection)
	availablePollers[poller.id] = poller

	return subConnection
end

function simpoll._request(self: simpoll, endpoint: string, data: any?, needsAuth: boolean?): any?
	if not self.connection and needsAuth ~= false then
		warn("[SIMPOLL] No connection established")
		return
	end

	local isRequestSuccessful, response = pcall(function()
		local headers = {
			["Authorization"] = self.connection and self.connection.token or nil,
			["Secret"] = self.secret,
		}

		return HttpService:PostAsync(
			mergeUrl(self.server, endpoint),
			HttpService:JSONEncode(data),
			Enum.HttpContentType.ApplicationJson,
			false,
			next(headers) and headers or nil
		)
	end)

	if not isRequestSuccessful then
		return response
	end

	local isDecodingSuccessful, decoded = pcall(HttpService.JSONDecode, HttpService, response)

	if not isDecodingSuccessful then
		return response
	end

	return decoded
end

function simpoll._poll(self: simpoll)
	while self.connection do
		local response = self:_request(ENDPOINTS.SUBSCRIBE, {
			token = self.connection.token,
		}, true)

		if response then
			if response.success then
				for _, payload in response.payload do
					local topic = payload.topic
					local data = parseMaybeJson(payload.payload)

					for _, subConnection in self.subConnections do
						if subConnection.events[topic] then
							subConnection.events[topic]:Fire(data)
						end
					end
				end
			elseif (response.message ~= "Timeout" and response ~= "HTTP 524") and self.connection then
				warn(`[SIMPOLL] Failed to poll server, reconnecting: {parseResponseError(response)}`)

				-- We deliberately do not disconnect here, as we want to keep missed queue messages on the server
				self.connection = nil
				self:connect(true, true)
				return
			end
		end

		task.wait()
	end
end

function simpoll._disconnect(self: simpoll)
	if not self.connection then
		warn("[SIMPOLL] No connection established")
		return
	end

	local response = self:_request(ENDPOINTS.DISCONNECT, {
		token = self.connection.token,
	}, true)

	self.connection = nil

	if response and response.success then
		return true
	end

	warn(`[SIMPOLL] Failed to disconnect from server: {parseResponseError(response)}`)
	return false
end

function simpoll.connect(self: simpoll | subConnection, retry: (boolean | number)?, overwrite: boolean?): boolean
	if self.connection then
		return true
	end

	local connection = {}

	local response = self:_request(ENDPOINTS.CONNECT, { id = self.id, overwrite = overwrite }, false)

	if response and response.success then
		connection.id = self.id
		connection.token = response.token

		if self.parent then
			local subConnection = self :: subConnection
			subConnection.parent.connection = connection
			task.spawn(simpoll._poll, self.parent)
		else
			local simpollInstance = self :: simpoll
			simpollInstance.connection = connection
			task.spawn(simpoll._poll, self)
		end

		return true
	end

	if retry then
		if type(retry) == "number" then
			retry = retry - 1
		end

		if retry == true or retry > 0 then
			task.wait(5)
			return self:connect(retry)
		end
	end

	warn(`[SIMPOLL] Failed to connect to server: {parseResponseError(response)}`)
	return false
end

function simpoll.send(self: subConnection, topic: string, data: string | json, retry: boolean?): boolean
	if not self.connection then
		warn("[SIMPOLL] No connection established")

		if retry then
			task.delay(5, function()
				self:send(topic, data, retry)
			end)
		end

		return false
	end

	local response = self:_request(ENDPOINTS.SEND, {
		token = self.connection.token,
		event = topic,
		data = data,
	}, true)

	if response and response.success then
		return true
	end

	warn(`[SIMPOLL] Failed to send data to server: {parseResponseError(response)}`)

	if retry then
		task.delay(5, function()
			self:send(topic, data, retry)
		end)
	end

	return false
end

function simpoll.get(self: subConnection, topic: string, data: string | json, retry: boolean?): (string | json)?
	if not self.connection then
		warn("[SIMPOLL] No connection established")

		if retry then
			task.delay(5, function()
				self:get(topic, data, retry)
			end)
		end

		return
	end

	local response = self:_request(ENDPOINTS.GET, {
		token = self.connection.token,
		event = topic,
		data = data,
	}, true)

	if response and response.success then
		return parseMaybeJson(response.data)
	end

	warn(`[SIMPOLL] Failed to get data from server: {parseResponseError(response)}`)

	if retry then
		task.delay(5, function()
			self:get(topic, data, retry)
		end)
	end

	return
end

function simpoll.onMessage(
	self: subConnection,
	topic: string,
	callback: (data: string | json) -> ()
): signal.Connection?
	if not self.connection then
		warn("[SIMPOLL] No connection established")
		return nil
	end

	if not self.events[topic] then
		self.events[topic] = signal.new()
	end

	return self.events[topic]:Connect(callback)
end

function simpoll.destroy(self: simpoll)
	if self.connection then
		self:_disconnect()
	end

	for _, subConnection in self.subConnections do
		for i, event in subConnection.events do
			event:Destroy()
			subConnection.events[i] = nil
		end
	end
end

type json = {
	[string | number]: json | string | number | boolean | nil,
}

export type simpoll = typeof(setmetatable(
	{} :: {
		server: string,
		connection: connection?,
		secret: string,
		id: string,
		subConnections: { subConnection },
	},
	simpoll
))

export type subConnection = typeof(setmetatable(
	{} :: {
		events: { [string]: signal.Signal<string> },
		destroy: (self: subConnection) -> (),
		parent: simpoll,
	},
	{
		__index = simpoll,
	}
))

export type connection = {
	id: string,
	token: string,
}

return simpoll
