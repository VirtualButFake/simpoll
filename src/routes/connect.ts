import { Router } from "express";
import logger from "../logger";

export const connectRouter = Router();

connectRouter.post("/connect", (req, res) => {
    const id = req.body.id;
    const connectionManager = req.connectionManager;

    logger.debug(`Connection request received for connection ID: ${id}`);

    const foundConnection = connectionManager.connections.find(
        (connection) => connection.id === id,
    );

    if (foundConnection) {
        if (!req.body.overwrite) {
            logger.debug(`Connection ID ${id} already exists`);
            res.send({
                success: false,
                message: "Connection already exists",
            });

            return;
        }
    }

    // resolve ip - this can be proxied, so get the real IP
    const ip = (req.headers["cf-connecting-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip) as string;

    const connection = connectionManager.createConnection(id, ip);
    logger.debug(`Established connection with ID: ${id}`);

    if (req.body.overwrite && foundConnection) {
        // data will be sent on next request
        connection._currentQueue = [...foundConnection._currentQueue];
        foundConnection.destroy();

        connectionManager.connections = connectionManager.connections.filter(
            (connection) => connection.token !== foundConnection.token,
        );

        logger.debug(
            `Overwrote connection ID: ${id}, queue contained ${connection._currentQueue.length} items`,
        );

        if (connectionManager._onConnection) {
            connectionManager._onConnection(connection, true);
        }
    } else if (connectionManager._onConnection) {
        connectionManager._onConnection(connection, false);
    }

    res.send({
        success: true,
        token: connection.token,
    });
});
