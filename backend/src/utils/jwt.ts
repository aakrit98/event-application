import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: number;
}

// A separate, short-lived token used ONLY between "password was correct"
// and "2FA code was correct". It deliberately carries a `purpose` field
// so it can never be mistaken for (or reused as) a real session token.
interface TwoFactorPendingPayload {
  userId: number;
  purpose: "2fa_pending";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.secret) as TokenPayload;
}

export function signTwoFactorPendingToken(userId: number): string {
  const payload: TwoFactorPendingPayload = { userId, purpose: "2fa_pending" };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: "5m" });
}

export function verifyTwoFactorPendingToken(token: string): TwoFactorPendingPayload {
  const payload = jwt.verify(token, env.jwt.secret) as TwoFactorPendingPayload;
  if (payload.purpose !== "2fa_pending") {
    throw new Error("Invalid token purpose");
  }
  return payload;
}