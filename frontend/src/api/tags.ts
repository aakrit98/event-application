import apiClient from "./client";

import type { Tag } from "../types"; 


export async function listTags(): Promise<Tag[]> {
    const res = await apiClient.get<{tags : Tag[]}>("/tags") 
    return res.data.tags;
}

