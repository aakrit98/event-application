import bcrypt from "bcrypt";
import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import QRCode from "qrcode";
import { db } from "../db/connection";

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: number;
  name: string;
  email: string;
}

// Returned specifically at login time, so the controller knows whether
// to ask for a 2FA code before issuing the real session cookie.
export interface AuthenticatedUser extends PublicUser {
  twoFactorEnabled: boolean;
}

interface UserRow extends PublicUser {
  password_hash: string;
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
}

// Removes password_hash before returning a user to any caller.
// This makes it structurally impossible for a controller to
// accidentally leak the hash back to the client.
function toPublicUser(user: UserRow): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return db<UserRow>("users").where({ email }).first();
}

export async function getUserById(userId: number): Promise<PublicUser | null> {
  const user = await db<UserRow>("users").where({ id: userId }).first();
  return user ? toPublicUser(user) : null;
}

// Like getUserById but also exposes the 2FA state, needed by the
// "Settings -> Account" page so the UI can render the enable/disable
// toggle correctly from the very first load.
export async function getUserWithSecurityStatus(
  userId: number
): Promise<AuthenticatedUser | null> {
  const user = await db<UserRow>("users").where({ id: userId }).first();
  return user ? { ...toPublicUser(user), twoFactorEnabled: user.two_factor_enabled } : null;
}


export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<PublicUser> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_IN_USE");
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const [id] = await db("users").insert({ name, email, password_hash });

  return { id, name, email };
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return null;
  }

  return {
    ...toPublicUser(user),
    twoFactorEnabled: user.two_factor_enabled,
  };
}

// --- Two-Factor Authentication ---

// Step 1 of enabling 2FA: generate a new secret and a QR code the user
// scans into an authenticator app (Google Authenticator, Authy, etc.).
// The secret is saved but NOT enabled yet — enabling only happens once
// the user proves the scan worked by submitting a valid code.
export async function generateTwoFactorSetup(
  userId: number,
  email: string
): Promise<{ qrCodeDataUrl: string; secret: string }> {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: "EventPlanner", label: email, secret });

  await db("users").where({ id: userId }).update({ two_factor_secret: secret });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { qrCodeDataUrl, secret };
}

// Step 2 of enabling 2FA: user submits a code from their authenticator
// app. If it's valid, we flip two_factor_enabled to true permanently.
export async function confirmTwoFactorSetup(userId: number, token: string): Promise<boolean> {
  const user = await db<UserRow>("users").where({ id: userId }).first();
  if (!user || !user.two_factor_secret) {
    return false;
  }

  const result = await verifyOtp({ token, secret: user.two_factor_secret });
  if (!result.valid) {
    return false;
  }

  await db("users").where({ id: userId }).update({ two_factor_enabled: true });
  return true;
}

// Used during login: checks a submitted code against the user's
// already-confirmed secret. Does not change any enabled/disabled state.
export async function verifyTwoFactorCode(userId: number, token: string): Promise<boolean> {
  const user = await db<UserRow>("users").where({ id: userId }).first();
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    return false;
  }

  const result = await verifyOtp({ token, secret: user.two_factor_secret });
  return result.valid;
}

export async function disableTwoFactor(userId: number): Promise<void> {
  await db("users")
    .where({ id: userId })
    .update({ two_factor_enabled: false, two_factor_secret: null });
}