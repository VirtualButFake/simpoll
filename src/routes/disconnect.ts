import { Router } from "express";
import logger from "../logger";

export const disconnectRouter = Router();

disconnectRouter.post("/disconnect", (req, res) => {
    const connection = req.connectionManager.connections.find(
        (connection) => connection.token === req.body.token,
    );

    if (connection) {
        logger.debug(`Disconnecting connection with id: ${connection.id}`);
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
