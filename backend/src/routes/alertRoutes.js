import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { getAlerts } from "../controllers/alertController.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const alertRouter = Router();

alertRouter.use(verifyToken);
alertRouter.get("/", asyncHandler(getAlerts));
