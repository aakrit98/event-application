import { Router } from "express";
import {deleteEvent,updateEvent,getEvent,listEvents,createEvent } from "../controllers/event.controller";
import { requireAuth} from "../middleware/auth.middleware"; 
import { requireEventOwnership} from "../middleware/ownership.middleware";


const router = Router(); 

router.post("/createEvent" , createEvent); 

export default router;