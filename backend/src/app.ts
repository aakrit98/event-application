import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes"; 
import eventRoutes from "./routes/event.routes" 
import tagRoutes from "./routes/tag.routes";
import uploadRoutes from "./routes/upload.routes";
import { errorHandler } from "./middleware/error.middleware";
import ticketRoutes from "./routes/ticket.routes"; 
import paymentRoutes from "./routes/payment.routes";
import notificationRoutes from "./routes/notification.routes";


const app = express();

// Allows the frontend (different port = different origin) to call this
// API WITH cookies attached. Both this and the frontend's fetch calls
// need credentials enabled for the login cookie to actually travel.
app.use(cors({ origin: env.frontendOrigin, credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes); 
app.use("/api/events", eventRoutes); 
app.use("/api/tags" , tagRoutes); 
app.use("/api/uploads" , uploadRoutes);
app.use("/api/tickets" , ticketRoutes); 
app.use("/api/payments", paymentRoutes);
// Must be registered LAST, after every route — this is what catches
// thrown/rejected errors from any controller above and turns them
// into clean JSON responses instead of crashing the server. 
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);

export default app;