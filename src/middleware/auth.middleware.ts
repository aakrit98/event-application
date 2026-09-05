import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { env } from "../config/env";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.cookie.name];

  if (!token) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}