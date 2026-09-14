import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as paymentController from "../controllers/payment.controller";

const router = Router();

router.post("/initiate", requireAuth, paymentController.initiatePayment);
router.get("/success", paymentController.handlePaymentSuccess);
router.get("/failure", paymentController.handlePaymentFailure);
router.get("/orders/:id", requireAuth, paymentController.getOrder);

export default router;