import { Router } from "express";

export const routes = Router();

import { connectRouter } from "./connect";
import { receiveRouter } from "./receive";
import { subscribeRouter } from "./subscribe";
import { disconnectRouter } from "./disconnect";

routes.use(connectRouter);
routes.use(receiveRouter);
routes.use(subscribeRouter);
routes.use(disconnectRouter);
