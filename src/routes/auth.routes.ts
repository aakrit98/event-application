import { Router } from "express";
import {
  signup,
  login,
  verifyLoginTwoFactor,
  logout,
  me,
  setupTwoFactor,
  confirmTwoFactorSetup,
  disableTwoFactorAuth,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Public routes — no login required
router.post("/signup", signup);
router.post("/login", login);
router.post("/login/2fa", verifyLoginTwoFactor);
router.post("/logout", logout);

// Protected routes — requireAuth runs first, blocks the request
// with a 401 if there's no valid session cookie
router.get("/me", requireAuth, me);
router.post("/2fa/setup", requireAuth, setupTwoFactor);
router.post("/2fa/confirm", requireAuth, confirmTwoFactorSetup);
router.post("/2fa/disable", requireAuth, disableTwoFactorAuth);

export default router;