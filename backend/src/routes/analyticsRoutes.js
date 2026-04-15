import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { getAnalyticsOverview } from "../controllers/analyticsController.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const analyticsRouter = Router();

analyticsRouter.use(verifyToken);
analyticsRouter.get("/", asyncHandler(getAnalyticsOverview));
