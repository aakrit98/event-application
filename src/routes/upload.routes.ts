import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { uploadEventImage } from "../controllers/upload.controller";

const router = Router();

router.post("/image", requireAuth, upload.single("image"), uploadEventImage);

export default router;