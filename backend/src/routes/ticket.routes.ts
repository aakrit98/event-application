import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTicketOwnership } from "../middleware/ticket-ownership";

const router = Router();

router.put("/:id", requireAuth, requireTicketOwnership, ticketController.updateTicket);
router.delete("/:id", requireAuth, requireTicketOwnership, ticketController.deleteTicket);

export default router;