import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { withTransaction } from "../config/database.js";
import { createActivityLog } from "../models/activityLogModel.js";
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  invalidateActivePasswordResetTokens,
  markPasswordResetTokenUsed,
} from "../models/passwordResetModel.js";
import {
  countUsers,
  createUser,
  findUserByEmail,
  updateUserPassword,
} from "../models/userModel.js";
import { AppError } from "../utils/AppError.js";

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    env.jwtSecret,
    { expiresIn: "12h" }
  );

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const payload = await withTransaction(async (client) => {
    const user = await findUserByEmail(client, email);

    if (!user) {
      throw new AppError("Invalid credentials.", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      throw new AppError("Invalid credentials.", 401);
    }

    await createActivityLog(client, {
      userId: user.id,
      action: "login",
      entityType: "auth",
      details: { email: user.email },
    });

    return {
      token: signToken(user),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
      },
    };
  });

  res.json(payload);
};

export const register = async (req, res) => {
  const { firstName, lastName, email, password, role, specialization } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    throw new AppError("firstName, lastName, email, password, and role are required.", 400);
  }

  if (!["doctor", "nurse", "admin"].includes(role)) {
    throw new AppError("Role must be doctor, nurse, or admin.", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  const createdUser = await withTransaction(async (client) => {
    const existingUsers = await countUsers(client);
    const requester = req.user ?? null;

    if (existingUsers > 0) {
      if (role === "admin" && (!requester || requester.role !== "admin")) {
        throw new AppError("Only admins can create additional admin accounts.", 403);
      }

      if (!requester && role === "admin") {
        throw new AppError("Admin sign-up requires an authenticated admin.", 403);
      }
    }

    const existingUser = await findUserByEmail(client, email);
    if (existingUser) {
      throw new AppError("A user with that email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(client, {
      firstName,
      lastName,
      email,
      passwordHash,
      role,
      specialization,
    });

    await createActivityLog(client, {
      userId: user.id,
      action: "user_registered",
      entityType: "user",
      entityId: user.id,
      details: { role: user.role },
    });

    return user;
  });

  res.status(201).json(createdUser);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required.", 400);
  }

  const result = await withTransaction(async (client) => {
    const user = await findUserByEmail(client, email);

    if (!user) {
      return {
        message:
          "If an account exists for that email, a password reset link has been generated.",
      };
    }

    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(plainToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await invalidateActivePasswordResetTokens(client, user.id);
    await createPasswordResetToken(client, {
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await createActivityLog(client, {
      userId: user.id,
      action: "password_reset_requested",
      entityType: "auth",
      details: { email: user.email },
    });

    return {
      message:
        "If an account exists for that email, a password reset link has been generated.",
      resetToken: env.nodeEnv === "production" ? undefined : plainToken,
      expiresAt: env.nodeEnv === "production" ? undefined : expiresAt.toISOString(),
    };
  });

  res.json(result);
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError("Reset token and new password are required.", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  await withTransaction(async (client) => {
    const tokenRecord = await findValidPasswordResetToken(client, hashResetToken(token));

    if (!tokenRecord) {
      throw new AppError("Reset link is invalid or has expired.", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(client, tokenRecord.user_id, passwordHash);
    await markPasswordResetTokenUsed(client, tokenRecord.id);
    await invalidateActivePasswordResetTokens(client, tokenRecord.user_id);

    await createActivityLog(client, {
      userId: tokenRecord.user_id,
      action: "password_reset_completed",
      entityType: "auth",
      details: {},
    });
  });

  res.json({ message: "Password updated successfully. You can sign in now." });
};

export const me = async (req, res) => {
  res.json({
    id: req.user.sub,
    email: req.user.email,
    role: req.user.role,
    fullName: req.user.fullName,
  });
};
