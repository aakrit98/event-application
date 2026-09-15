import { useEffect, useState } from "react";
import { Button, Input, InputNumber, Popconfirm, Tag, Spin, message, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { listEventTickets, createTicket, updateTicket, deleteTicket } from "../api/ticket";
import type { Ticket, TicketFormInput } from "../types";

const NAVY = "#0d1b3e";
const emptyForm: TicketFormInput = { name: "", price: 0, quantity_available: 0, description: "" };

export default function TicketManager({ eventId }: { eventId: number }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TicketFormInput>(emptyForm);

  useEffect(() => {
    loadTickets();
  }, [eventId]);

  async function loadTickets() {
    try {
      setLoading(true);
      const data = await listEventTickets(eventId);
      setTickets(data);
    } catch {
      message.error("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(t: Ticket) {
    setEditingId(t.id);
    setForm({ name: t.name, price: Number(t.price), quantity_available: t.quantity_available, description: t.description ?? "" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return message.warning("Ticket name is required.");
    try {
      setSaving(true);
      if (editingId != null) {
        const updated = await updateTicket(editingId, form);
        setTickets((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
        message.success("Ticket updated.");
      } else {
        const created = await createTicket(eventId, form);
        setTickets((prev) => [...prev, created]);
        message.success("Ticket type added.");
      }
      resetForm();
    } catch {
      message.error("Couldn't save ticket. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ticketId: number) {
    try {
      await deleteTicket(ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      if (editingId === ticketId) resetForm();
      message.success("Ticket deleted.");
    } catch {
      message.error("Failed to delete ticket.");
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Existing Ticket Tiers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tickets.length === 0 ? (
          <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", fontSize: 13 }}>
            No ticket tiers created yet. Add one below.
          </div>
        ) : (
          tickets.map((t) => {
            const remaining = t.quantity_available - (t.quantity_sold ?? 0);
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: editingId === t.id ? `1.5px solid ${NAVY}` : "1px solid #e2e8f0",
                  background: editingId === t.id ? "#f0f4ff" : "#ffffff",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{t.name}</span>
                    <Tag color={Number(t.price) === 0 ? "green" : "blue"} style={{ borderRadius: 6, fontWeight: 600 }}>
                      {Number(t.price) === 0 ? "Free" : `Rs. ${t.price}`}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {remaining} / {t.quantity_available} remaining {t.description && `• ${t.description}`}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => startEdit(t)} />
                  <Popconfirm title="Delete this ticket tier?" onConfirm={() => handleDelete(t.id)} okText="Delete" okButtonProps={{ danger: true }}>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Create / Edit Form */}
      <form onSubmit={handleSubmit} style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
        <Typography.Text strong style={{ display: "block", color: NAVY, marginBottom: 12, fontSize: 13 }}>
          {editingId != null ? "Edit Ticket Tier" : "Add Ticket Tier"}
        </Typography.Text>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input
            placeholder="Tier Name (e.g. Early Bird, VIP)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ borderRadius: 8 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>PRICE (RS.)</span>
              <InputNumber
                min={0}
                value={form.price}
                onChange={(val) => setForm({ ...form, price: val || 0 })}
                style={{ width: "100%", borderRadius: 8, marginTop: 4 }}
              />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>QUANTITY</span>
              <InputNumber
                min={1}
                value={form.quantity_available}
                onChange={(val) => setForm({ ...form, quantity_available: val || 0 })}
                style={{ width: "100%", borderRadius: 8, marginTop: 4 }}
              />
            </div>
          </div>

          <Input
            placeholder="Short perk description (optional)"
            value={form.description??""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ borderRadius: 8 }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              icon={editingId != null ? <CheckOutlined /> : <PlusOutlined />}
              style={{
                background: editingId != null ? NAVY : "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                flex: 1,
              }}
            >
              {editingId != null ? "Save Changes" : "Add Ticket"}
            </Button>
            {editingId != null && (
              <Button icon={<CloseOutlined />} onClick={resetForm} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
