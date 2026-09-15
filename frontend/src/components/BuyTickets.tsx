import { useEffect, useState } from "react";
import { Button, InputNumber, Typography, message, Empty, Spin, Tag } from "antd";
import { CheckCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";
import * as ticketApi from "../api/ticket";
import * as paymentApi from "../api/payment";
import type { Ticket } from "../types";
import type { AxiosError } from "axios";

const NAVY = "#0d1b3e";
const isFree = (ticket: Ticket) => Number(ticket.price) === 0;

interface BuyTicketsProps {
  eventId: number;
  eventFinished?: boolean;
  eventType: "public" | "private";
}

export default function BuyTickets({
  eventId,
  eventFinished = false,
  eventType,
}: BuyTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);

  useEffect(() => {
    ticketApi
      .listEventTickets(eventId)
      .then(setTickets)
      .catch(() => message.error("Failed to load tickets."))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleBuy(ticket: Ticket) {
    const quantity = quantities[ticket.id] ?? 1;
    setBuyingId(ticket.id);
    try {
      const result = await paymentApi.initiatePayment(ticket.id, quantity);

      if ("free" in result) {
        message.success("Your ticket has been purchased successfully!");
        setBuyingId(null);
        const refreshed = await ticketApi.listEventTickets(eventId);
        setTickets(refreshed);
        window.dispatchEvent(new Event("notifications:updated"));
        return;
      }

      paymentApi.submitToEsewa(result.paymentUrl, result.formFields as unknown as Record<string, string>);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      message.error(axiosErr.response?.data?.error ?? "Failed to start payment.");
      setBuyingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <Spin size="medium" tip="Loading passes..." />
      </div>
    );
  }

  if (eventFinished) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <Empty description="This event has already finished. Tickets are no longer available." />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <Empty description="No tickets currently available for this event." />
      </div>
    );
  }

  // Public event flow: no ticket tiers to pick from — just choose how
  // many seats you want and confirm. The purchase is processed as free
  // (NPR 0) so it completes instantly.
  if (eventType === "public") {
    const ticket = tickets[0];
    const remaining = ticket.quantity_available - (ticket.quantity_sold ?? 0);
    const soldOut = remaining <= 0;
    const currentQty = quantities[ticket.id] ?? 1;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
        <Typography.Text strong style={{ color: NAVY, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Free Admission
        </Typography.Text>

        <div
          style={{
            padding: "18px 20px",
            borderRadius: 14,
            border: soldOut ? "1px dashed #cbd5e1" : "1px solid #e2e8f0",
            background: soldOut ? "#f8fafc" : "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: soldOut ? "#94a3b8" : NAVY }}>
                {ticket.name}
              </span>
              <Tag
                color={soldOut ? "default" : isFree(ticket) ? "green" : "volcano"}
                style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}
              >
                {soldOut ? "SOLD OUT" : isFree(ticket) ? "FREE" : `NPR ${ticket.price}`}
              </Tag>
            </div>

            <div style={{ fontSize: 12, color: soldOut ? "#ef4444" : "#10b981", fontWeight: 600 }}>
              {soldOut ? "No seats remaining" : `${remaining} seat${remaining !== 1 ? "s" : ""} available`}
            </div>
          </div>

          {!soldOut && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <InputNumber
                min={1}
                max={remaining}
                value={currentQty}
                onChange={(val) => setQuantities((prev) => ({ ...prev, [ticket.id]: val ?? 1 }))}
                style={{ width: 68, borderRadius: 8 }}
              />
              <Button
                type="primary"
                loading={buyingId === ticket.id}
                onClick={() => handleBuy(ticket)}
                icon={<CheckCircleOutlined />}
                style={{
                  borderRadius: 8,
                  fontWeight: 700,
                  height: 36,
                  padding: "0 24px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                }}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>

        <Typography.Text style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
          No payment required — your seat is reserved instantly.
        </Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
      <Typography.Text strong style={{ color: NAVY, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Select Ticket Type
      </Typography.Text>

      {tickets.map((ticket) => {
        const remaining = ticket.quantity_available - (ticket.quantity_sold ?? 0);
        const soldOut = remaining <= 0;
        const isFree = Number(ticket.price) === 0;
        const currentQty = quantities[ticket.id] ?? 1;

        return (
          <div
            key={ticket.id}
            style={{
              padding: "16px 18px",
              borderRadius: 14,
              border: soldOut ? "1px dashed #cbd5e1" : "1px solid #e2e8f0",
              background: soldOut ? "#f8fafc" : "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              transition: "box-shadow 0.2s ease",
            }}
          >
            {/* Ticket Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: soldOut ? "#94a3b8" : NAVY }}>
                  {ticket.name}
                </span>

                <Tag
                  color={soldOut ? "default" : isFree ? "green" : "volcano"}
                  style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}
                >
                  {soldOut ? "SOLD OUT" : isFree ? "FREE" : `NPR ${ticket.price}`}
                </Tag>
              </div>

              {ticket.description && (
                <p style={{ margin: "2px 0 6px", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
                  {ticket.description}
                </p>
              )}

              <div style={{ fontSize: 12, color: soldOut ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                {soldOut ? "No spots remaining" : `${remaining} spots left`}
              </div>
            </div>

            {/* Actions: Quantity + Button */}
            {!soldOut && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <InputNumber
                  min={1}
                  max={remaining}
                  value={currentQty}
                  onChange={(val) => setQuantities((prev) => ({ ...prev, [ticket.id]: val ?? 1 }))}
                  style={{ width: 68, borderRadius: 8 }}
                />

                <Button
                  type="primary"
                  loading={buyingId === ticket.id}
                  onClick={() => handleBuy(ticket)}
                  icon={isFree ? <CheckCircleOutlined /> : <ThunderboltOutlined />}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 36,
                    border: "none",
                    background: isFree
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                    boxShadow: isFree
                      ? "0 2px 8px rgba(16, 185, 129, 0.25)"
                      : "0 2px 8px rgba(244, 63, 94, 0.25)",
                  }}
                >
                  {isFree ? "Claim Pass" : `Pay NPR ${Number(ticket.price) * currentQty}`}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
