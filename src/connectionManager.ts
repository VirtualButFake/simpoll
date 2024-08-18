import crypto from "crypto";

const CLEANUP_THRESHOLD = 1000 * 60;

export type eventCallback = (id: string, data: string) => void;
type eventCallbacks = {
    [key: string]: eventCallback[];
};

export class Connection {
    id: string;
    token: string;

    lastUpdated: Date = new Date();

    private requestCallback: (() => void) | null = null;
    private currentQueue: string[] = [];

    constructor(
        id: string,
        token: string,
        private eventCallbacks: eventCallbacks,
    ) {
        this.id = id;
        this.token = token;
    }

    queue(payload: string) {
        this.currentQueue.push(payload);
        this.lastUpdated = new Date();

        if (this.requestCallback) {
            this.requestCallback();
        }
    }

    onQueue(callback: () => void) {
        this.requestCallback = callback;
    }

    getPayload(): string[] | null {
        const queue = this.currentQueue;

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
        const connection = new Connection(id, token, this.eventCallbacks);
        this.connections.push(connection);
        return connection;
    }

    broadcast(data: string) {
        this.connections.forEach((connection) => {
            connection.queue(data);
        });
    }

    subscribe(event: string, callback: eventCallback) {
        if (!this.eventCallbacks[event]) {
            this.eventCallbacks[event] = [];
        }

        this.eventCallbacks[event].push(callback);
    }

    events(event: string): eventCallback[] {
        return this.eventCallbacks[event] || [];
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
