import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Switch,
  Input,
  Button,
  Popconfirm,
  message,
  Spin,
} from "antd";
import {
  UserOutlined,
  BellOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import * as eventsApi from "../api/events";
import type { Event } from "../types";

const NAVY = "#0d1b3e";
const NAVY_BG = "#f4f6fb";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "privacy" | "help">("account");
  const [loading, setLoading] = useState(true);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notification states (Email toggle removed)
  const [pushNotif, setPushNotif] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [followerAlerts, setFollowerAlerts] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await eventsApi.listEvents({ timeframe: "all" });
        const eventList: Event[] = Array.isArray(res) ? res : (res as any)?.events || [];
        const userEvents = eventList.filter((e: Event) => e.creator_id === user?.id);
        setMyEvents(userEvents);
      } catch {
        // Fallback gracefully if network/API fails
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) loadStats();
  }, [user?.id]);

  const totalCreated = myEvents.length;
  const privateEvents = myEvents.filter((e) => e.event_type === "private");
  const privateTicketsSold = privateEvents.reduce(
    (acc, curr) => acc + ((curr as any).tickets_sold ?? 0),
    0
  );

  async function handleLogout() {
    try {
      if (logout) await logout();
      message.success("Logged out successfully");
      navigate("/login");
    } catch {
      navigate("/login");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: NAVY_BG, padding: "36px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Typography.Title level={2} style={{ color: NAVY, fontWeight: 700, marginBottom: 28 }}>
          Settings
        </Typography.Title>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* LEFT SIDEBAR NAVIGATION */}
          <div
            style={{
              width: 230,
              background: "#fff",
              borderRadius: 16,
              padding: "16px 12px",
              boxShadow: "0 4px 20px rgba(13,27,62,0.04)",
              flexShrink: 0,
            }}
          >
            {[
              { key: "account", label: "Account", icon: <UserOutlined /> },
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
                    gap: 12,
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
                  <span style={{ fontSize: 16 }}>{tab.icon}</span>
                  {tab.label}
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

          {/* MAIN SETTINGS CONTENT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 1. ACCOUNT DETAILS & EVENT STATS */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 20px rgba(13,27,62,0.04)" }}>
              <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: "0 0 20px" }}>
                Account Details
              </Typography.Title>

              {/* STATS OVERVIEW: Events Created & Private Ticket Sales */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#627d98" }}>
                    <CalendarOutlined style={{ color: NAVY, fontSize: 18 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Events Created</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginTop: 8 }}>
                    {loading ? <Spin size="small" /> : totalCreated}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#0ea5e9" }}>
                    <ShoppingOutlined style={{ color: "#0ea5e9", fontSize: 18 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Private Event Tickets Sold</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginTop: 8 }}>
                    {loading ? <Spin size="small" /> : `${privateTicketsSold} (${privateEvents.length} private)`}
                  </div>
                </div>
              </div>

              {/* User Name & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                    Full Name
                  </label>
                  <Input size="large" value={user?.name || "User"} readOnly style={{ borderRadius: 8, background: "#f8fafc" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                    Email Address
                  </label>
                  <Input size="large" value={user?.email || ""} readOnly style={{ borderRadius: 8, background: "#f8fafc" }} />
                </div>
              </div>

              {/* Change Password */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                  Change Password
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <Input.Password size="large" placeholder="••••••••" style={{ borderRadius: 8, maxWidth: 440 }} />
                  <Button size="large" icon={<KeyOutlined />} style={{ color: NAVY, borderColor: NAVY, borderRadius: 8, fontWeight: 500 }}>
                    Update
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. NOTIFICATION PREFERENCES */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 20px rgba(13,27,62,0.04)" }}>
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

            {/* 3. DANGER ZONE */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "26px 32px", border: "1px solid #fee2e2", boxShadow: "0 4px 20px rgba(239,68,68,0.03)" }}>
              <Typography.Title level={4} style={{ color: "#dc2626", fontWeight: 700, margin: "0 0 6px" }}>
                Danger Zone
              </Typography.Title>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <strong style={{ color: NAVY, fontSize: 14 }}>Delete Eventify Account</strong>
                  <p style={{ margin: "4px 0 0", color: "#8b98a9", fontSize: 13 }}>
                    Permanently purge all hosted profiles, bookings, and ticket history. This cannot be undone.
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

            {/* 4. LOGOUT CONFIRMATION BANNER */}
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
                    <strong style={{ fontSize: 15, display: "block" }}>
                      {user?.name || "User"}, are you leaving?
                    </strong>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      Confirm if you want to sign out of Eventify on this web session.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)", borderRadius: 8 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={handleLogout}
                    style={{ borderRadius: 8, fontWeight: 600 }}
                  >
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
