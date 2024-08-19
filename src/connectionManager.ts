import crypto from "crypto";
import logger from "./logger";

const CLEANUP_THRESHOLD = 1000 * 60;

type queueItem = {
    topic: string;
    payload: string;
};

export type eventCallback = (id: string, data: string) => void;
type eventCallbacks = {
    [key: string]: eventCallback[];
};

export class Connection {
    id: string;
    token: string;

    lastUpdated: Date = new Date();

    constructor(id: string, token: string) {
        this.id = id;
        this.token = token;
    }

    queue(topic: string, payload: any) {
        this._currentQueue.push({
            topic,
            payload: JSON.stringify(payload),
        });

        this.lastUpdated = new Date();

        if (this._requestCallback) {
            this._requestCallback();
        }
    }

    destroy() {
        this._requestCallback = null;
    }

    _requestCallback: (() => void) | null = null;
    _currentQueue: queueItem[] = [];

    _getPayload():
        | {
              topic: string;
              payload: string;
          }[]
        | null {
        const queue = [...this._currentQueue];

        if (queue.length === 0) {
            return null;
        }

        this._currentQueue = [];
        return queue;
    }
}

export class ConnectionManager {
    connections: Connection[] = [];
    private eventCallbacks: eventCallbacks = {};
    private intervalId: NodeJS.Timeout | null = null;

    constructor() {
        this.intervalId = setInterval(() => {
            const now = new Date();

            this.connections = this.connections.filter((connection) => {
                const diff = now.getTime() - connection.lastUpdated.getTime();
                const allowed = diff < CLEANUP_THRESHOLD;

                if (!allowed) {
                    logger.debug(`Destroying connection ${connection.id}`);
                    connection.destroy();
                }

                return allowed;
            });
        }, 5000);
    }

    createConnection(id: string): Connection {
        const token = crypto.randomBytes(64).toString("hex");
        const connection = new Connection(id, token);
        this.connections.push(connection);
        return connection;
    }

    broadcast(topic: string, data: any) {
        this.connections.forEach((connection) => {
            connection.queue(topic, data);
        });
    }

    subscribe(topic: string, callback: eventCallback) {
        if (!this.eventCallbacks[topic]) {
            this.eventCallbacks[topic] = [];
        }

        this.eventCallbacks[topic].push(callback);
    }

    events(topic: string): eventCallback[] {
        return this.eventCallbacks[topic] || [];
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        for (const connection of this.connections) {
            connection.destroy();
        }
    }

    _onConnection:
        | ((connection: Connection, overwroteExisting: boolean) => void)
        | null = null;
    _onDisconnect: ((connection: Connection) => void) | null = null;
}
