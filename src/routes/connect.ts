import { Router } from "express";
import logger from "../logger";

export const connectRouter = Router();

connectRouter.post("/connect", (req, res) => {
    const id = req.body.id;
    const connectionManager = req.connectionManager;

    logger.debug(`Connection request received for connection ID: ${id}`);

    if (
        connectionManager.connections.find((connection) => connection.id === id)
    ) {
        logger.debug(`Connection ID ${id} already exists`);
        res.send({
            success: false,
            message: "Connection already exists",
        });
    }

    const connection = connectionManager.createConnection(id);
    logger.debug(`Established connection with ID: ${id}`);

    res.send({
        success: true,
        token: connection.token,
    });
});
