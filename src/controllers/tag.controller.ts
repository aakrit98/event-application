import { Request, Response } from "express";
import * as tagService from "../services/tag.service";

export async function listTags(_req: Request, res: Response): Promise<void> {
  const tags = await tagService.listTags();
  res.status(200).json({ tags });
}