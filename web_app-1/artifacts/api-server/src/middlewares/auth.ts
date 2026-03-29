import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* JWT secret — must be set in environment */
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me_in_production";

export interface JwtPayload {
  userId: number;
  role: "student" | "instructor";
}

/* Extend Express request to carry decoded user info */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: verifies Bearer token and attaches user payload to req.user.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization token required" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: restricts access to instructor role only.
 * Must be used after requireAuth.
 */
export function requireInstructor(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "instructor") {
    res.status(403).json({ error: "Instructor access required" });
    return;
  }
  next();
}

/**
 * Sign a new JWT for the given user.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
