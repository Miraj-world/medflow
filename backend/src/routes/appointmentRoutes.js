import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAppointmentHandler,
  getAppointmentHandler,
  updateAppointmentStatusHandler,
  updateAppointmentHandler,
  deleteAppointmentHandler,
  getPatientAppointmentsHandler,
} from "../controllers/appointmentController.js";
import { checkRole } from "../middleware/checkRole.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const appointmentRouter = Router();

appointmentRouter.use(verifyToken);
appointmentRouter.post("/", checkRole("doctor", "admin"), asyncHandler(createAppointmentHandler));
appointmentRouter.get("/:appointmentId", asyncHandler(getAppointmentHandler));
appointmentRouter.put("/:appointmentId/status", checkRole("doctor", "admin"), asyncHandler(updateAppointmentStatusHandler));
appointmentRouter.put("/:appointmentId", checkRole("doctor", "admin"), asyncHandler(updateAppointmentHandler));
appointmentRouter.delete("/:appointmentId", checkRole("doctor", "admin"), asyncHandler(deleteAppointmentHandler));
appointmentRouter.get("/patient/:patientId", asyncHandler(getPatientAppointmentsHandler));
