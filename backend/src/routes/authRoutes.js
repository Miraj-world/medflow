import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  getDoctors,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(login));
authRouter.post("/forgot-password", asyncHandler(forgotPassword));
authRouter.post("/reset-password", asyncHandler(resetPassword));
authRouter.post("/register", (req, res, next) => {
  if (req.headers.authorization) {
    return verifyToken(req, res, () => asyncHandler(register)(req, res, next));
  }

  return asyncHandler(register)(req, res, next);
});
authRouter.get("/me", verifyToken, asyncHandler(me));
authRouter.get("/doctors", verifyToken, asyncHandler(getDoctors));
