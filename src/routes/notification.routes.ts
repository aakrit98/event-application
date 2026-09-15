import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  listNotifications,
  markAllRead,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.post("/read-all", requireAuth, markAllRead);

export default router;