import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createPatient,
  getPatientById,
  getPatientPrediction,
  getPatients,
} from "../controllers/patientController.js";
import { checkRole } from "../middleware/checkRole.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const patientRouter = Router();

patientRouter.use(verifyToken);
patientRouter.get("/", asyncHandler(getPatients));
patientRouter.get("/:patientId", asyncHandler(getPatientById));
patientRouter.get("/:patientId/prediction", asyncHandler(getPatientPrediction));
patientRouter.post("/", checkRole("doctor", "admin"), asyncHandler(createPatient));
