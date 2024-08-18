import express, { Express, Application } from "express";

import {
    Connection,
    ConnectionManager,
    eventCallback,
} from "./connectionManager";
import { routes } from "./routes";

class Server {
    app: Express = express();
    private connectionManager: ConnectionManager = new ConnectionManager();

    constructor(secret: string, apiPath: string = "/") {
        this.app.use((req, res, next) => {
            const auth = req.headers.secret;
            if (auth === secret) {
                next();
            } else {
                res.send({
                    success: false,
                    message: "Unauthorized",
                });
            }
        });

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, _, next) => {
            req.connectionManager = this.connectionManager;
            next();
        });

        this.app.use(apiPath, routes);
    }

    subscribe(topic: string, callback: eventCallback) {
        this.connectionManager.subscribe(topic, callback);
    }

    broadcast(topic: string, data: string) {
        this.connectionManager.broadcast(topic, data);
    }

    getConnections(): Connection[] {
        return this.connectionManager.connections;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    listen: Application["listen"] = ((...args: any[]) => {
        this.app.listen(...args);
    }) as any;
    /* eslint-enable */
}

export default Server;
