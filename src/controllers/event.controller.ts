import { Request , Response } from "express";
import {createEventSchema , updateEventSchema , listEventsQuerySchema } from "../validation/event.validation"
import * as eventService from "../services/event.service"; 
import { error } from "node:console";

export async function createEvent(req:Request , res:Response): Promise<void> { 
    const input = createEventSchema.parse(req.body);
    const event = await eventService.createEvent(req.user!.id , input);
    res.status(201).json({event});
} 
    

export async function listEvents(req:Request , res: Response): Promise<void> {
    const query = listEventsQuerySchema.parse(req.query); 
    const result = await eventService.listEvents(query); 
    res.status(200).json(result);
} 


export async function getEvent(req:Request , res:Response) : Promise<void> {
    const id = Number(req.params.id); 
    if(Number.isNaN(id)) { 
        res.status(400).json({error : "Invalid event id"}); 
    } 

    const event = await eventService.getEventById(id); 
    if (!event) { 
        res.status(404).json({error : "Event not found"}); 
        return; 
    } 

    res.status(200).json({event}); 
}


// By the time this runs, requireAuth + requireEventOwnership have
// already confirmed the event exists AND belongs to req.user, so we
// don't need to re-check either of those things here.
export async function updateEvent(req : Request , res: Response): Promise<void> {
    const id = Number(req.params.id); 
    const input = updateEventSchema.parse(req.body); 

    const event = await eventService.updateEvent(id , input);  
    res.status(200).json({event});

} 


export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await eventService.deleteEvent(id);
  res.status(200).json({ message: "Event deleted." });
}