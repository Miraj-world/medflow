import { Router } from "express";

import { authRouter } from "./authRoutes.js";
import { patientRouter } from "./patientRoutes.js";
import { analyticsRouter } from "./analyticsRoutes.js";
import { dashboardRouter } from "./dashboardRoutes.js";
import { alertRouter } from "./alertRoutes.js";
import { appointmentRouter } from "./appointmentRoutes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/appointments", appointmentRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/alerts", alertRouter);
