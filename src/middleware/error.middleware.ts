import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Express recognizes this as an error-handling middleware specifically
// because it takes 4 arguments (err first). This must be registered
// LAST, after all routes, in server.ts.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Validation errors from Zod (bad request body/params)
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

  // Known application errors we throw ourselves with a specific code
  if (err instanceof Error) {
    if (err.message === "EMAIL_ALREADY_IN_USE") {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    // Log the real error server-side for debugging, but never send
    // internal details (stack traces, SQL errors, etc.) to the client.
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
    return;
  }

  console.error("Unknown error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}