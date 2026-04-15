import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboard } from "../controllers/dashboardController.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const dashboardRouter = Router();

dashboardRouter.use(verifyToken);
dashboardRouter.get("/", asyncHandler(getDashboard));
