import winston from "winston";
import chalk from "chalk";

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: winston.format.combine(
                winston.format((info) => {
                    const date = new Date();
                    info.level = info.level.toUpperCase();
                    info.timestamp = date.toLocaleTimeString();
                    return info;
                })(),
                winston.format.colorize(),
                winston.format.printf(function (info) {
                    const timestamp = chalk.dim(`[${info.timestamp}]`);
                    const message =
                        typeof info.message === "string"
                            ? info.message
                            : JSON.stringify(info.message, null, 4);

                    return `${timestamp} ${info.level} ${message}`;
                }),
            ),
        }),
    ],
});

export default logger;
