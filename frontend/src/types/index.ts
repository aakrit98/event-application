export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Tag {
  id: number;
  name: string;
} 


export type EventType = "public" | "private"; 



export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string | null;
  event_type: EventType;
  creator_id: number;
  created_at: string;
  updated_at: string; 
  image_url: string | null;
  tags: Tag[];
}
 

export interface PaginatedEvents {
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export interface EventFormInput {
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at?: string | null;
  event_type: EventType;
  tagIds: number[]; 
image_url?: string | null;
}


