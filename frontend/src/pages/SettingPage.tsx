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
  GlobalOutlined,
  LockFilled,
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

  // Notification toggles (email notification removed)
  const [pushNotif, setPushNotif] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [followerAlerts, setFollowerAlerts] = useState(false);

  // Extract user ID safely across all possible auth shapes
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

  useEffect(() => {
    async function loadStats() {
      if (currentUserId == null) return;

      try {
        setLoading(true);
        // Request with high limit so all events are retrieved
        const res: any = await eventsApi.listEvents({
          timeframe: "all",
          limit: 100,
        } as any);

        // Robust unpacking for { data: [...] }, { data: { data: [...] } }, or direct array
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

        console.log("Settings - Current User ID:", currentUserId);
        console.log("Settings - All events from API:", rawList);

        // Filter by creator_id matching current user's ID
        const userCreated = rawList.filter((item: any) => {
          const creatorId = item.creator_id ?? item.creatorId ?? item.user_id;
          return Number(creatorId) === Number(currentUserId);
        });

        console.log("Settings - User created events:", userCreated);
        setMyEvents(userCreated);
      } catch (err) {
        console.error("Failed to load user events stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [currentUserId]);

  // Real event counts
  const totalCreated = myEvents.length;
  const publicEvents = myEvents.filter((e) => e.event_type === "public").length;
  const privateEvents = myEvents.filter((e) => e.event_type === "private").length;

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
        
        {/* Header Greeting */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Settings
          </span>
          <Typography.Title level={2} style={{ color: NAVY, fontWeight: 800, margin: "4px 0 0" }}>
            Hello, {username}! 👋
          </Typography.Title>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          
          {/* LEFT SIDEBAR */}
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
            
            {/* ACCOUNT DETAILS & STATS */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 20px rgba(13,27,62,0.04)" }}>
              <Typography.Title level={4} style={{ color: NAVY, fontWeight: 700, margin: "0 0 20px" }}>
                Account Details
              </Typography.Title>

              {/* REAL DATA COUNTS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {/* Total Events Created */}
                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                    <CalendarOutlined style={{ color: NAVY, fontSize: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Total Created</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginTop: 8 }}>
                    {loading ? <Spin size="small" /> : totalCreated}
                  </div>
                </div>

                {/* Public Events */}
                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                    <GlobalOutlined style={{ color: "#16a34a", fontSize: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Public Events</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 8 }}>
                    {loading ? <Spin size="small" /> : publicEvents}
                  </div>
                </div>

                {/* Private Events */}
                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e8eff6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#627d98" }}>
                    <LockFilled style={{ color: "#ea580c", fontSize: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Private Events</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#ea580c", marginTop: 8 }}>
                    {loading ? <Spin size="small" /> : privateEvents}
                  </div>
                </div>
              </div>

              {/* Name & Email Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                    Full Name
                  </label>
                  <Input size="large" value={user?.name || username} readOnly style={{ borderRadius: 8, background: "#f8fafc" }} />
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

            {/* NOTIFICATION PREFERENCES */}
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

            {/* DANGER ZONE */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "26px 32px", border: "1px solid #fee2e2", boxShadow: "0 4px 20px rgba(239,68,68,0.03)" }}>
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

            {/* LOGOUT CONFIRMATION */}
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
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    <LogoutOutlined />
                  </div>
                  <div>
                    <strong style={{ fontSize: 15, display: "block" }}>{username}, are you leaving?</strong>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Confirm if you want to sign out of Eventify.</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Button onClick={() => setShowLogoutConfirm(false)} style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)", borderRadius: 8 }}>
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
