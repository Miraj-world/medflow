import { AppError } from "../utils/AppError.js";

export const checkRole = (...allowedRoles) => (req, _res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError("You do not have access to this resource.", 403));
  }

  return next();
};
