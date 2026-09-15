import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Typography,
  Switch,
  Input,
  Button,
  Popconfirm,
  message,
  Spin,
  Tabs,
  Tag as AntTag,
  Empty,
  Badge,
} from "antd";
import {
  UserOutlined,
  BellOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  CalendarOutlined,
  GlobalOutlined,
  LockFilled,
  KeyOutlined,
  TagOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import * as eventsApi from "../api/events";
import * as paymentApi from "../api/payment";
import type { Event, OrderWithDetails } from "../types";

const NAVY = "#0d1b3e";
const NAVY_BG = "#f4f6fb";

function statusColor(status: OrderWithDetails["status"]): string {
  if (status === "completed") return "green";
  if (status === "pending") return "orange";
  return "red";
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"account" | "tickets" | "notifications" | "privacy" | "help">("account");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notification toggles
  const [pushNotif, setPushNotif] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [followerAlerts, setFollowerAlerts] = useState(false);

  const currentUserId =
    user?.id ??
    (user as any)?._id ??
    (user as any)?.userId ??
    (user as any)?.user_id ??
    (user as any)?.sub;

  const username =
    (user as { name?: string; username?: string; email?: string })?.username ||
    (user as { name?: string; username?: string; email?: string })?.name ||
    user?.email?.split("@")[0] ||
    "User";

  // 1. Fetch hosted events
  useEffect(() => {
    async function loadStats() {
      if (currentUserId == null) return;

      try {
        setLoading(true);
        const res: any = await eventsApi.listEvents({
          timeframe: "all",
          limit: 100,
        } as any);

        let rawList: any[] = [];
        if (Array.isArray(res)) {
          rawList = res;
        } else if (Array.isArray(res?.data)) {
          rawList = res.data;
        } else if (Array.isArray(res?.data?.data)) {
          rawList = res.data.data;
        } else if (Array.isArray(res?.events)) {
          rawList = res.events;
        }

        const userCreated = rawList.filter((item: any) => {
          const creatorId = item.creator_id ?? item.creatorId ?? item.user_id;
          return Number(creatorId) === Number(currentUserId);
        });

        setMyEvents(userCreated);
      } catch (err) {
        console.error("Failed to load user events stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [currentUserId]);

  // 2. Fetch user ticket orders
  useEffect(() => {
    async function loadOrders() {
      try {
        setOrdersLoading(true);
        const data: any = await paymentApi.getMyOrders();

        if (Array.isArray(data)) {
          setOrders(data);
        } else if (Array.isArray(data?.data)) {
          setOrders(data.data);
        } else if (Array.isArray(data?.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch {
        message.error("Failed to load your tickets.");
      } finally {
        setOrdersLoading(false);
      }
    }

    loadOrders();
  }, []);

  const totalCreated = myEvents.length;
  const publicEvents = myEvents.filter((e) => e.event_type === "public").length;
  const privateEvents = myEvents.filter((e) => e.event_type === "private").length;

  const now = new Date();
  const heldOrders = orders.filter((o) => o.status === "completed");
  const upcoming = heldOrders.filter((o) => new Date(o.event_start_at) >= now);
  const past = heldOrders.filter((o) => new Date(o.event_start_at) < now);
  const other = orders.filter((o) => o.status !== "completed");

  async function handleLogout() {
    try {
      if (logout) await logout();
      message.success("Logged out successfully");
      navigate("/login");
    } catch {
      navigate("/login");
    }
  }

  // Groups orders by event and renders an "event card" for each, so the
  // user sees a true ticket collection — including both free (public)
  // and paid (private) purchases — sorted with upcoming events first.
  function renderCollection(list: OrderWithDetails[]) {
    if (ordersLoading) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="medium" />
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <Empty description="No tickets found in this section" />
        </div>
      );
    }

    // Group by event_id
    const groups: {
      event_id: number;
      event_title: string;
      event_start_at: string;
      event_location: string;
      event_image_url: string | null;
      totalTickets: number;
      orders: OrderWithDetails[];
    }[] = [];
    const byEvent = new Map<number, (typeof groups)[number]>();
    for (const order of list) {
      let g = byEvent.get(order.event_id);
      if (!g) {
        g = {
          event_id: order.event_id,
          event_title: order.event_title,
          event_start_at: order.event_start_at,
          event_location: order.event_location,
          event_image_url: order.event_image_url,
          totalTickets: 0,
          orders: [],
        };
        byEvent.set(order.event_id, g);
        groups.push(g);
      }
      g.orders.push(order);
      g.totalTickets += order.quantity;
    }

    groups.sort(
      (a, b) => new Date(b.event_start_at).getTime() - new Date(a.event_start_at).getTime()
    );

    const eventNow = new Date();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((g) => {
          const isUpcoming = new Date(g.event_start_at) >= eventNow;

          return (
            <div
              key={g.event_id}
              style={{
                background: "#ffffff",
                border: "1px solid #e8eff6",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* Event banner strip */}
              <Link
                to={`/events/${g.event_id}`}
                style={{
                  position: "relative",
                  display: "block",
                  height: 108,
                  background: "#0d1b3e",
                  overflow: "hidden",
                }}
              >
                {g.event_image_url ? (
                  <img
                    src={g.event_image_url}
                    alt={g.event_title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #0d1b3e 0%, #1e293b 100%)",
                    }}
                  >
                    <TagOutlined style={{ fontSize: 24, color: "#475569" }} />
                  </div>
                )}
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: isUpcoming
                      ? "rgba(16,185,129,0.9)"
                      : "rgba(100,116,139,0.9)",
                  }}
                >
                  {isUpcoming ? "Upcoming" : "Past"}
                </span>
              </Link>

              {/* Event info + ticket line items */}
              <div style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to={`/events/${g.event_id}`}
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: NAVY,
                      textDecoration: "none",
                    }}
                  >
                    {g.event_title}
                  </Link>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6366f1",
                      background: "#eef2ff",
                      padding: "3px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {g.totalTickets} ticket{g.totalTickets !== 1 ? "s" : ""}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    marginTop: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <span>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {formatDate(g.event_start_at)}
                  </span>
                  {g.event_location && (
                    <span>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {g.event_location}
                    </span>
                  )}
                </div>

                {/* Per-order ticket lines inside the same event */}
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    marginTop: 12,
                    paddingTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {g.orders.map((o) => (
                    <div
                      key={o.id || `${o.event_id}-${o.created_at}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#334155" }}>
                        <strong>{o.ticket_name}</strong> &times; {o.quantity}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                          {Number(o.total_amount) === 0
                            ? "FREE"
                            : `NPR ${o.total_amount}`}
                        </span>
                        <AntTag
                          color={statusColor(o.status)}
                          style={{
                            textTransform: "uppercase",
                            fontWeight: 700,
                            fontSize: 10,
                            borderRadius: 6,
                            margin: 0,
                          }}
                        >
                          {o.status}
                        </AntTag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: NAVY_BG, padding: "36px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header Greeting */}
        <div style={{ marginBottom: 28 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Settings & Profile
          </span>
          <Typography.Title level={2} style={{ color: NAVY, fontWeight: 800, margin: "4px 0 0" }}>
            Hello, {username}! 👋
          </Typography.Title>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* LEFT SIDEBAR */}
          <div
            style={{
              width: 240,
              background: "#fff",
              borderRadius: 16,
              padding: "16px 12px",
              boxShadow: "0 4px 20px rgba(13,27,62,0.04)",
              flexShrink: 0,
            }}
          >
            {[
              { key: "account", label: "Account", icon: <UserOutlined /> },
              {
                key: "tickets",
                label: "My Tickets",
                icon: <TagOutlined />,
                badge: heldOrders.length,
              },
              { key: "notifications", label: "Notifications", icon: <BellOutlined /> },
              { key: "privacy", label: "Privacy", icon: <LockOutlined /> },
              { key: "help", label: "Help & Support", icon: <QuestionCircleOutlined /> },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: isActive ? "#eaf0fa" : "transparent",
                    color: isActive ? NAVY : "#6b7a90",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: 4,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16 }}>{tab.icon}</span>
                    {tab.label}
                  </div>
                  {typeof tab.badge === "number" && tab.badge > 0 && (
                    <Badge
                      count={tab.badge}
                      style={{
                        backgroundColor: isActive ? NAVY : "#94a3b8",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </button>
              );
            })}

            <div style={{ height: 1, background: "#edf2f7", margin: "14px 10px 10px" }} />

            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 16px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "#ff4d4f",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogoutOutlined />
              Logout
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* TAB: ACCOUNT OVERVIEW */}
            {activeTab === "account" && (
              <>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "28px 32px",
                    boxShadow: "0 4px 20px rgba(13,27,62,0.04)",
                  }}
                >
                  <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: "0 0 20px" }}>
                    Account Details
                  </Typography.Title>

                  {/* 4 STATS: HOSTED EVENTS + TICKETS HELD */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 16,
                      marginBottom: 28,
                    }}
                  >
                    <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                        <CalendarOutlined style={{ color: NAVY, fontSize: 15 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Total Created</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginTop: 8 }}>
                        {loading ? <Spin size="small" /> : totalCreated}
                      </div>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                        <GlobalOutlined style={{ color: "#16a34a", fontSize: 15 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Public Events</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", marginTop: 8 }}>
                        {loading ? <Spin size="small" /> : publicEvents}
                      </div>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                        <LockFilled style={{ color: "#ea580c", fontSize: 15 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Private Events</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#ea580c", marginTop: 8 }}>
                        {loading ? <Spin size="small" /> : privateEvents}
                      </div>
                    </div>

                    {/* Quick Link Card to Tickets */}
                    <div
                      onClick={() => setActiveTab("tickets")}
                      style={{
                        background: "#f8fafc",
                        padding: "16px 18px",
                        borderRadius: 12,
                        border: "1px solid #e8eff6",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                        <TagOutlined style={{ color: "#6366f1", fontSize: 15 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Tickets Booked</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#6366f1", marginTop: 8 }}>
                        {ordersLoading ? <Spin size="small" /> : heldOrders.length}
                      </div>
                    </div>
                  </div>

                  {/* Name & Email Fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                        Full Name
                      </label>
                      <Input
                        size="large"
                        value={user?.name || username}
                        readOnly
                        style={{ borderRadius: 8, background: "#f8fafc" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                        Email Address
                      </label>
                      <Input
                        size="large"
                        value={user?.email || ""}
                        readOnly
                        style={{ borderRadius: 8, background: "#f8fafc" }}
                      />
                    </div>
                  </div>

                  {/* Change Password */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                      Change Password
                    </label>
                    <div style={{ display: "flex", gap: 12 }}>
                      <Input.Password size="large" placeholder="••••••••" style={{ borderRadius: 8, maxWidth: 440 }} />
                      <Button
                        size="large"
                        icon={<KeyOutlined />}
                        style={{ color: NAVY, borderColor: NAVY, borderRadius: 8, fontWeight: 500 }}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                {/* DANGER ZONE */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "26px 32px",
                    border: "1px solid #fee2e2",
                    boxShadow: "0 4px 20px rgba(239,68,68,0.03)",
                  }}
                >
                  <Typography.Title level={4} style={{ color: "#dc2626", fontWeight: 700, margin: "0 0 6px" }}>
                    Danger Zone
                  </Typography.Title>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <strong style={{ color: NAVY, fontSize: 14 }}>Delete Eventify Account</strong>
                      <p style={{ margin: "4px 0 0", color: "#8b98a9", fontSize: 13 }}>
                        Permanently purge all hosted profiles, bookings, and ticket history.
                      </p>
                    </div>
                    <Popconfirm
                      title="Are you absolutely sure?"
                      description="This will delete your account and all associated events."
                      okText="Yes, delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger type="primary" style={{ borderRadius: 8, height: 40, fontWeight: 600 }}>
                        Delete Account
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </>
            )}

            {/* TAB: MY TICKETS */}
            {activeTab === "tickets" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "28px 32px",
                  boxShadow: "0 4px 20px rgba(13,27,62,0.04)",
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: 0 }}>
                    My Tickets & Bookings
                  </Typography.Title>
                  <Typography.Text style={{ color: "#64748b", fontSize: 14 }}>
                    Your ticket collection for both free (public) and paid (private) events, including past events.
                  </Typography.Text>
                </div>

                <Tabs
                  defaultActiveKey="upcoming"
                  items={[
                    {
                      key: "upcoming",
                      label: `Upcoming (${upcoming.length})`,
                      children: renderCollection(upcoming),
                    },
                    {
                      key: "past",
                      label: `Past (${past.length})`,
                      children: renderCollection(past),
                    },
                    {
                      key: "other",
                      label: `Pending / Failed (${other.length})`,
                      children: renderCollection(other),
                    },
                  ]}
                />
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "28px 32px",
                  boxShadow: "0 4px 20px rgba(13,27,62,0.04)",
                }}
              >
                <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: "0 0 16px" }}>
                  Notification Preferences
                </Typography.Title>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>Push notifications</div>
                      <div style={{ fontSize: 12, color: "#7a8ba2" }}>Instant notifications right on your device browser</div>
                    </div>
                    <Switch checked={pushNotif} onChange={setPushNotif} style={{ background: pushNotif ? NAVY : undefined }} />
                  </div>

                  <div style={{ height: 1, background: "#edf2f7" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>Event reminders before starts</div>
                      <div style={{ fontSize: 12, color: "#7a8ba2" }}>Alerts for upcoming schedules and ticket check-ins</div>
                    </div>
                    <Switch checked={eventReminders} onChange={setEventReminders} style={{ background: eventReminders ? NAVY : undefined }} />
                  </div>

                  <div style={{ height: 1, background: "#edf2f7" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>New follower activity alerts</div>
                      <div style={{ fontSize: 12, color: "#7a8ba2" }}>Get notified when people RSVP or follow your hosted events</div>
                    </div>
                    <Switch checked={followerAlerts} onChange={setFollowerAlerts} style={{ background: followerAlerts ? NAVY : undefined }} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRIVACY */}
            {activeTab === "privacy" && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 20px rgba(13,27,62,0.04)" }}>
                <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: "0 0 16px" }}>
                  Privacy & Data
                </Typography.Title>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                  Your privacy settings determine whether your profile appears in attendee lists and if public events display your organizer credentials.
                </p>
              </div>
            )}

            {/* TAB: HELP & SUPPORT */}
            {activeTab === "help" && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 20px rgba(13,27,62,0.04)" }}>
                <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: "0 0 16px" }}>
                  Help & Support
                </Typography.Title>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                  For ticketing support, refund queries, or payment disputes via eSewa, reach out to our team at support@eventify.com.
                </p>
              </div>
            )}

            {/* LOGOUT CONFIRMATION BANNER */}
            {showLogoutConfirm && (
              <div
                style={{
                  background: NAVY,
                  borderRadius: 16,
                  padding: "22px 28px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#fff",
                  boxShadow: "0 10px 30px rgba(13,27,62,0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    <LogoutOutlined />
                  </div>
                  <div>
                    <strong style={{ fontSize: 15, display: "block" }}>{username}, are you leaving?</strong>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Confirm if you want to sign out of Eventify.</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{
                      background: "transparent",
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.3)",
                      borderRadius: 8,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" danger onClick={handleLogout} style={{ borderRadius: 8, fontWeight: 600 }}>
                    Log Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
