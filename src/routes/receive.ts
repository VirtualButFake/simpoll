import { Router } from "express";
import logger from "../logger";

export const receiveRouter = Router();

function parseData(data: string): any {
    try {
        return JSON.parse(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return data;
    }
}

receiveRouter.post("/receive", (req, res) => {
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

        const events = connectionManager.events(event);

        logger.debug(
            `Received event from connection ${connection.id} on channel "${event}": ${JSON.stringify(data)}`,
        );

        if (events) {
            events.forEach((callback) => callback(connection, data));
        }

        return res.send({
            success: true,
        });
    }

    logger.debug(`Connection not found with token: ${req.body.id}`);
    res.send({
        success: false,
        message: "Connection not found",
    });
});
