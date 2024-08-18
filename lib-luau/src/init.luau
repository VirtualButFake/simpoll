local HttpService = game:GetService("HttpService")
local simpoll = {}
simpoll.__index = simpoll

local ENDPOINTS = {
	CONNECT = "connect",
	SUBSCRIBE = "subscribe",
	SEND = "receive",
	DISCONNECT = "disconnect",
}

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

function simpoll.new(server: string, secret: string)
	return setmetatable({
		server = server,
		connection = nil,
		secret = secret,
	}, simpoll)
end

function simpoll.request(self: simpoll, endpoint: string, data: any?, needsAuth: boolean?): any?
	if not self.connection and needsAuth ~= false then
		warn("No connection established")
		return
	end

	local isRequestSuccessful, response = pcall(function()
		return HttpService:PostAsync(
			mergeUrl(self.server, endpoint),
			HttpService:JSONEncode(data),
			Enum.HttpContentType.ApplicationJson,
			false,
			{
				["Authorization"] = self.connection and self.connection.token or nil,
				["Secret"] = self.secret,
			}
		)
	end)

	if not isRequestSuccessful then
		warn(`Failed to request server: {parseResponseError(response)}`)
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
		local response = self:request(ENDPOINTS.SUBSCRIBE, {
			token = self.connection.token,
		}, true)

		if response then
			if response.success then
				for _, payload in response.payload do
					if self.callback then
						self.callback(payload)
					end
				end
			elseif response.message ~= "Timeout" and self.connection then
				warn(`Failed to poll server, reconnecting: {parseResponseError(response)}`)

				-- throw away the connection
				-- try to reconnect
				self:disconnect()
				self:connect()
				return
			end
		end

		task.wait()
	end
end

function simpoll.connect(self: simpoll, id: string?, retry: (boolean | number)?)
	local connection = {}

	-- contact the server
	id = id or game.JobId ~= "" and game.JobId or HttpService:GenerateGUID(false)
	local response = self:request(ENDPOINTS.CONNECT, { id = id }, false)

	if response and response.success then
		connection.id = id
		connection.token = response.token
		self.connection = connection

		task.spawn(simpoll._poll, self)

		return true
	end

	if retry then
		if type(retry) == "number" then
			retry = retry - 1
		end

		if retry == true or retry > 0 then
			task.wait(1)
			return self:connect(id, retry)
		end
	end

	warn(`Failed to connect to server: {parseResponseError(response)}`)
	return false
end

function simpoll.disconnect(self: simpoll)
	if not self.connection then
		warn("No connection established")
		return
	end

	local response = self:request(ENDPOINTS.DISCONNECT, {
		token = self.connection.token,
	}, true)

	if response and response.success then
		self.connection = nil
		return true
	end

	warn(`Failed to disconnect from server: {parseResponseError(response)}`)
	return false
end

function simpoll.send(self: simpoll, event: string, data: any)
	if not self.connection then
		warn("No connection established")
		return
	end

	local response = self:request(ENDPOINTS.SEND, {
		token = self.connection.token,
		event = event,
		data = data,
	}, true)

	if response and response.success then
		return true
	end

	warn(`Failed to send data to server: {parseResponseError(response)}`)
	return false
end

function simpoll.onMessage(self: simpoll, callback: (data: string) -> ())
	if not self.connection then
		warn("No connection established")
		return
	end

	self.callback = callback
end

export type simpoll = typeof(setmetatable(
	{} :: {
		server: string,
		connection: connection?,
		secret: string,
		callback: (string) -> any?,
	},
	simpoll
))

export type connection = {
	id: string,
	token: string,
}

return simpoll
