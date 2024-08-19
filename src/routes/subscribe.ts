import { Router } from "express";
import logger from "../logger";

export const subscribeRouter = Router();

subscribeRouter.post("/subscribe", (req, res) => {
    const connection = req.connectionManager.connections.find(
        (connection) => connection.token === req.body.token,
    );

    if (connection) {
        // set last updated to current time + timeout

        res.setTimeout(100000, function () {
            return res.send({ success: false, message: "Timeout" });
        });

        const currentPayload = connection._getPayload();

        if (currentPayload) {
            logger.debug(
                `Sending payload ${JSON.stringify(currentPayload)} to connection ${connection.id} (was immediately available)`,
            );
            connection.lastUpdated = new Date();

            return res.send({
                success: true,
                payload: currentPayload,
            });
        } else {
            // prevent the connection from being destroyed
            connection.lastUpdated = new Date(Date.now() + 100000);
            let sent = false;

            connection._requestCallback = () => {
                if (res.headersSent || sent) {
                    return;
                }

                const payload = connection._getPayload();

                if (!payload) {
                    return null;
                }

                connection.lastUpdated = new Date();

                logger.debug(
                    `Sending payload ${JSON.stringify(payload)} to connection ${connection.id} (was queued)`,
                );

                res.send({
                    success: true,
                    payload: payload,
                });

                sent = true;
            };
        }

        return;
    }

    res.send({
        success: false,
        message: "Connection not found",
    });
});
