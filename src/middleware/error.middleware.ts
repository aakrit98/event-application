import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";

// Express recognizes this as an error-handling middleware specifically
// because it takes 4 arguments (err first). This must be registered
// LAST, after all routes, in server.ts.

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Image is too large. Maximum size is 5MB." });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }

  if (err instanceof Error) {
    if (err.message === "EMAIL_ALREADY_IN_USE") {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    if (err.message === "EVENT_START_TOO_SOON") {
      res.status(400).json({ error: "Events can only be created to start from tomorrow or later." });
      return;
    }

    if (err.message === "Only image files are allowed.") {
      res.status(400).json({ error: err.message });
      return;
    }

    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
    return;
  }

  console.error("Unknown error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}