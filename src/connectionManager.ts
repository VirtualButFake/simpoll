import crypto from "crypto";

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

    private requestCallback: (() => void) | null = null;
    private currentQueue: queueItem[] = [];

    constructor(id: string, token: string) {
        this.id = id;
        this.token = token;
    }

    queue(topic: string, payload: string) {
        this.currentQueue.push({
            topic,
            payload,
        });
        this.lastUpdated = new Date();

        if (this.requestCallback) {
            this.requestCallback();
        }
    }

    _onQueue(callback: () => void) {
        this.requestCallback = callback;
    }

    _getPayload():
        | {
              topic: string;
              payload: string;
          }[]
        | null {
        const queue = [...this.currentQueue];

        if (queue.length === 0) {
            return null;
        }

        this.currentQueue = [];
        return queue;
    }

    destroy() {
        this.requestCallback = null;
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

    broadcast(topic: string, data: string) {
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
}
