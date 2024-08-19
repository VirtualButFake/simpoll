import { Router } from "express";
import logger from "../logger";

export const disconnectRouter = Router();

disconnectRouter.post("/disconnect", (req, res) => {
    const connectionManager = req.connectionManager;
    const connection = connectionManager.connections.find(
        (connection) => connection.token === req.body.token,
    );

    if (connection) {
        logger.debug(`Disconnecting connection with id: ${connection.id}`);

        if (connectionManager._onDisconnect) {
            connectionManager._onDisconnect(connection);
        }

        connection.destroy();

        return res.send({
            success: true,
        });
    }

    logger.debug(`Connection not found with token: ${req.body.token}`);
    res.send({
        success: false,
        message: "Connection not found",
    });
});
