import multer from "multer";
import type { Request } from "express";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image files are allowed."));
    return;
  }
  callback(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});