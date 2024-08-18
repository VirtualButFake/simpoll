import { Router } from "express";

export const subscribeRouter = Router();

subscribeRouter.post("/subscribe", (req, res) => {
    const connection = req.connectionManager.connections.find(
        (connection) => connection.token === req.body.token,
    );

    if (connection) {
        res.setTimeout(100000, function () {
            return res.send({ success: false, message: "Timeout" });
        });

        const currentPayload = connection._getPayload();

        if (currentPayload) {
            return res.send({
                success: true,
                payload: currentPayload,
            });
        } else {
            let sent = false;

            connection._onQueue(() => {
                if (res.headersSent || sent) {
                    return;
                }

                const payload = connection._getPayload();

                if (!payload) {
                    return null;
                }

                res.send({
                    success: true,
                    payload: payload,
                });

                sent = true;
            });
        }

        return;
    }

    res.send({
        success: false,
        message: "Connection not found",
    });
});
