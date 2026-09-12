import { Router } from "express";
import * as tagController from "../controllers/tag.controller";

const router = Router();

// Public — anyone can see the list of available tags (needed to know
// what tagIds to send when creating/filtering events).
router.get("/", tagController.listTags);

export default router;