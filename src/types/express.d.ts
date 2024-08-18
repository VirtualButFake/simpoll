import { ConnectionManager } from "../connectionManager";

declare global {
    namespace Express {
        export interface Request {
            connectionManager: ConnectionManager;
        }
    }
}
