import { Request, Response } from "express";
import { signupSchema, loginSchema } from "../validation/auth.validation";
import {
  createUser,
  verifyCredentials,
  getUserById,
  generateTwoFactorSetup,
  confirmTwoFactorSetup as confirmTwoFactorSetupService,
  verifyTwoFactorCode,
  disableTwoFactor,
} from "../services/auth.service";
import {
  signToken,
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken,
} from "../utils/jwt";
import { env } from "../config/env";

// Matches JWT_EXPIRES_IN's default of "1h". Kept as a separate constant
// because cookie maxAge needs milliseconds, not a string like "1h".
const AUTH_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

function setAuthCookie(res: Response, userId: number): void {
  const token = signToken({ userId });
  res.cookie(env.cookie.name, token, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password } = signupSchema.parse(req.body);

  const user = await createUser(name, email, password);
  setAuthCookie(res, user.id);

  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await verifyCredentials(email, password);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (user.twoFactorEnabled) {
    const pendingToken = signTwoFactorPendingToken(user.id);
    res.status(200).json({ requires2FA: true, pendingToken });
    return;
  }

  setAuthCookie(res, user.id);
  res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
}

export async function verifyLoginTwoFactor(req: Request, res: Response): Promise<void> {
  const { pendingToken, code } = req.body as { pendingToken?: string; code?: string };

  if (!pendingToken || !code) {
    res.status(400).json({ error: "Both pendingToken and code are required." });
    return;
  }

  let userId: number;
  try {
    userId = verifyTwoFactorPendingToken(pendingToken).userId;
  } catch {
    res.status(401).json({ error: "This login attempt has expired. Please log in again." });
    return;
  }

  const isValid = await verifyTwoFactorCode(userId, code);
  if (!isValid) {
    res.status(401).json({ error: "Invalid 2FA code." });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  setAuthCookie(res, user.id);
  res.status(200).json({ user });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(env.cookie.name);
  res.status(200).json({ message: "Logged out." });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.status(200).json({ user });
}

export async function setupTwoFactor(req: Request, res: Response): Promise<void> {
  const user = await getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const { qrCodeDataUrl } = await generateTwoFactorSetup(user.id, user.email);
  res.status(200).json({ qrCodeDataUrl });
}

export async function confirmTwoFactorSetup(req: Request, res: Response): Promise<void> {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ error: "Code is required." });
    return;
  }

  const confirmed = await confirmTwoFactorSetupService(req.user!.id, code);
  if (!confirmed) {
    res.status(400).json({ error: "Invalid code. Please try again." });
    return;
  }

  res.status(200).json({ message: "Two-factor authentication enabled." });
}

export async function disableTwoFactorAuth(req: Request, res: Response): Promise<void> {
  await disableTwoFactor(req.user!.id);
  res.status(200).json({ message: "Two-factor authentication disabled." });
}