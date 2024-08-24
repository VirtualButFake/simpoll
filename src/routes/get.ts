import { Router } from "express";
import logger from "../logger";

export const getRouter = Router();

function parseData(data: string): any {
    try {
        return JSON.parse(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return data;
    }
}

getRouter.post("/get", async (req, res) => {
    const connectionManager = req.connectionManager;

    const connection = connectionManager.connections.find(
        (connection) => connection.token === req.body.token,
    );

    if (connection) {
        if (!req.body.data) {
            return res.send({
                success: false,
                message: "Data is required",
            });
        }

        if (!req.body.event) {
            return res.send({
                success: false,
                message: "Event is required",
            });
        }

        const data = parseData(req.body.data);
        const event = req.body.event;

        const handler = connectionManager.handler(event);

        logger.debug(
            `Received "get" event from connection ${connection.id} on channel "${event}": ${JSON.stringify(data)}`,
        );

        if (handler) {
            let handlerResponse

            try {
                handlerResponse = await handler(connection, data)
            } catch (e) {
                logger.error(`Error while processing handler for event ${event}: ${e}`)
                return res.send({
                    success: false,
                    message: "Error while processing handler",
                });
            }

            return res.send({
                success: true,
                data: JSON.stringify(handlerResponse),
            });
        }

        return res.send({
            success: true,
            message: "No handler found",
        });
    }

    logger.debug(`Connection not found with token: ${req.body.id}`);
    res.send({
        success: false,
        message: "Connection not found",
    });
});
