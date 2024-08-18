import express, { Express, Application } from "express";

import {
    Connection,
    ConnectionManager,
    eventCallback,
} from "./connectionManager";
import { routes } from "./routes";

class Server {
    app: Express = express();
    connectionManager: ConnectionManager = new ConnectionManager();

    constructor(secret: string) {
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

        this.app.use("/api", routes);
    }

    subscribe(event: string, callback: eventCallback) {
        this.connectionManager.subscribe(event, callback);
    }

    broadcast(data: string) {
        this.connectionManager.broadcast(data);
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
