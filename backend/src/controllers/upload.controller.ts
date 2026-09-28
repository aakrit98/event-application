import { Request, Response } from "express";
import { uploadImageBuffer } from "../services/upload.service";

export async function uploadEventImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No image file was provided." });
    return;
  }

  const imageUrl = await uploadImageBuffer(req.file.buffer);
  res.status(200).json({ imageUrl });
}