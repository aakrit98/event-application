import apiClient from "./client";
import type { Event, EventFormInput, PaginatedEvents, EventType } from "../types";

export interface ListEventsParams {
  page?: number;
  limit?: number;
  timeframe?: "upcoming" | "past" | "all";
  event_type?: EventType;
  tagIds?: number[];
  search?: string;
  sortBy?: "start_at" | "created_at" | "title";
  sortOrder?: "asc" | "desc";
  mine?: boolean;
}

export async function createEvent(input:EventFormInput):Promise<Event> {
    const res = await apiClient.post<{event: Event}>("/events" , input);
    return res.data.event; 
} 

export async function getEvent(id:Number):Promise<Event> {
    const res = await apiClient.get<{event:Event}>(`/events/${id}` );
    return res.data.event;
}


export async function deleteEvent(id:Number):Promise<void> {
    await apiClient.delete(`/events/${id}`);
}

export async function updateEvent(id:Number , input:Partial<EventFormInput>) : Promise<Event>{ 
    const res = await apiClient.put<{event :Event}>(`events/${id}` , input); 
    return res.data.event;
}


export async function listEvents(params: ListEventsParams={}): Promise<PaginatedEvents> {
    const res = await apiClient.get<PaginatedEvents>(`events/` , {params}); 
    return res.data;
}









//  id: number;
//   title: string;
//   description: string;
//   location: string;
//   start_at: string;
//   end_at: string | null;
//   event_type: EventType;
//   creator_id: number;
//   created_at: string;
//   updated_at: string;
//   tags: Tag[];