import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware"; 
import { requireEventOwnership} from "../middleware/ownership.middleware";
import * as ticketController from "../controllers/ticket.controller";

const router = Router(); 

//public viewing 
router.get("/", optionalAuth, eventController.listEvents); 
router.get("/:id", eventController.getEvent);

//login to create event
router.post("/" ,requireAuth ,eventController.createEvent); 

router.put("/:id", requireAuth, requireEventOwnership, eventController.updateEvent);
router.delete("/:id", requireAuth, requireEventOwnership, eventController.deleteEvent);

router.post("/:id/tickets", requireAuth, requireEventOwnership, ticketController.createTicket);

export default router;