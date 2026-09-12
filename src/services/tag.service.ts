import { db } from "../db/connection";

export interface TagRow {
  id: number;
  name: string;
}

export async function listTags(): Promise<TagRow[]> {
  return db<TagRow>("tags").select("id", "name").orderBy("name", "asc");
}