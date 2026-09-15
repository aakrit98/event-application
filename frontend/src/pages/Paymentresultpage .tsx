import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getOrder } from "../api/payment";
import type { TicketOrder } from "../types";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const orderId = orderIdParam ? Number(orderIdParam) : null;

  const [order, setOrder] = useState<TicketOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const lastCompletedRef = useRef(false);

  useEffect(() => {
    if (orderId == null || Number.isNaN(orderId)) {
      setError("Missing order reference.");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const data = await getOrder(orderId as number);
        if (cancelled) return;
        setOrder(data);

        // Once the order has been finalized, nudge the Navbar to fetch
        // fresh notifications (purchase confirmed notification for buyer).
        if (!lastCompletedRef.current && data.status === "completed") {
          lastCompletedRef.current = true;
          window.dispatchEvent(new Event("notifications:updated"));
        }

        // The backend may still be finalizing verification with eSewa
        // right as we land here — poll briefly while status is pending.
        if (data.status === "pending" && attemptsRef.current < MAX_POLL_ATTEMPTS) {
          attemptsRef.current += 1;
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setError("Couldn't look up your order.");
      }
    }

    void poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-gray-500">{error}</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="p-6 text-center text-sm text-gray-500">Checking your payment…</p>;
  }

  if (order.status === "completed") {
    return (
      <div className="mx-auto max-w-md space-y-3 p-6 text-center">
        <h1 className="text-lg font-semibold text-green-700">Payment successful</h1>
        <p className="text-sm text-gray-600">
          {order.quantity} ticket{order.quantity > 1 ? "s" : ""} confirmed · Rs.{" "}
          {order.total_amount}
        </p>
        {order.esewa_transaction_code && (
          <p className="text-xs text-gray-400">Ref: {order.esewa_transaction_code}</p>
        )}
        <Link to="/" className="inline-block text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (order.status === "failed") {
    return (
      <div className="mx-auto max-w-md space-y-3 p-6 text-center">
        <h1 className="text-lg font-semibold text-red-700">Payment failed</h1>
        <p className="text-sm text-gray-600">
          Your payment wasn't completed. No amount has been charged for this order.
        </p>
        <Link to="/" className="inline-block text-sm text-blue-600 hover:underline">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Confirming your payment…</h1>
      <p className="text-sm text-gray-500">This can take a few seconds. Don't close this page.</p>
    </div>
  );
}