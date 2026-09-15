import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown, Badge, Empty, Spin } from "antd";
import type { MenuProps } from "antd";
import { BellOutlined, UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import * as notificationsApi from "../api/notifications";
import type { Notification } from "../types";
import { message } from "antd";

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NavbarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user , logout } = useAuth();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
 
  const handleLogout = async() =>{ 
    try { 
      await logout();
      message.success("Logout sucessfully");
      navigate("/login");
    } catch { 
      message.error("Failed to log out"); 
      navigate("/login");
    }
  }
  useEffect(() => {
    loadNotifications();

    // Refetch whenever the user navigates (Navbar sits outside <Routes>,
    // so this ensures fresh data after journeys like purchasing tickets).
    window.addEventListener("notifications:updated", loadNotifications);

    // Safety net: a purchase can complete without any navigation (e.g. a
    // free ticket confirmed inside the BuyTickets modal), so poll quietly.
    const poll = window.setInterval(loadNotifications, 20000);

    return () => {
      window.removeEventListener("notifications:updated", loadNotifications);
      window.clearInterval(poll);
    };
  }, [location.pathname]);

  async function loadNotifications() {
    setNotifLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Logged-out visitors simply don't see a badge; ignore silently.
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleNotifOpen(open: boolean) {
    setNotifOpen(open);
    if (open && unreadCount > 0) {
      try {
        await notificationsApi.markAllRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch {
        // Non-critical: keep the unread badge until the next fetch.
      }
    }
  }

  function handleNotifClick(n: Notification) {
    setNotifOpen(false);
    if (n.event_id) {
      navigate(`/events/${n.event_id}`);
    }
  }

  const profileItems: MenuProps["items"] = [
    { key: "settings", icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> },
    { type: "divider" },
    { key: "logout",
       icon: <LogoutOutlined />,
        label: "Logout", 
        onClick : handleLogout,
        danger: true },
  ];

  const navLinks = [
    { name: "Home", path: "/events" },
    ...(user ? [{ name: "My Events", path: "/my-events" }, { name: "Create Event", path: "/events/new" }] : []),
  ];

  const displayName =
    (user as { name?: string; username?: string; email?: string })?.name ||
    (user as { name?: string; username?: string; email?: string })?.username ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header style={{ width: "100%", background: "#0d1b3e", borderBottom: "1px solid #1e2952", boxShadow: "0 4px 16px rgba(7,15,38,0.3)" }}>
      {/* Full-width container across the whole screen */}
      <nav style={{ width: "100%", height: 64, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
        
        {/* Brand */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.8-6.2l-2.1 2.1m-8.2 8.2l-2.1 2.1m0-12.4l2.1 2.1m8.2 8.2l2.1 2.1" />
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>Eventify</span>
        </Link>

        {/* Center Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.path || hoveredNav === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onMouseEnter={() => setHoveredNav(link.path)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#94a3b8",
                  textShadow: active ? "0 0 10px rgba(255,255,255,0.4)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Badge count={unreadCount} size="small" offset={[-2, 4]}>
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              open={notifOpen}
              onOpenChange={handleNotifOpen}
              dropdownRender={() => (
                <div
                  style={{
                    width: 360,
                    maxHeight: 440,
                    overflowY: "auto",
                    background: "#ffffff",
                    borderRadius: 14,
                    boxShadow: "0 16px 40px rgba(7, 15, 38, 0.25)",
                    padding: 10,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid #f1f5f9",
                      marginBottom: 6,
                    }}
                  >
                    <strong style={{ color: "#0d1b3e", fontSize: 14 }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <span style={{ fontSize: 11, color: "#f43f5e", fontWeight: 700 }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {notifLoading ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <Spin size="small" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "28px 0" }}>
                      <Empty description="No notifications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          cursor: n.event_id ? "pointer" : "default",
                          borderRadius: 10,
                          padding: "10px 12px",
                          marginBottom: 4,
                          background: n.is_read ? "#ffffff" : "#eef2ff",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = n.is_read ? "#ffffff" : "#eef2ff")
                        }
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#0d1b3e",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {n.title}
                          {!n.is_read && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#f43f5e",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            lineHeight: 1.45,
                            marginTop: 2,
                          }}
                        >
                          {n.message}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          {formatTimeAgo(n.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            >
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                  borderRadius: 8,
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <BellOutlined style={{ fontSize: 18, color: "#94a3b8" }} />
              </div>
            </Dropdown>
          </Badge>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />

          {user ? (
            <Dropdown menu={{ items: profileItems }} placement="bottomRight" arrow>
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </span>
                <DownOutlined style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }} />
              </div>
            </Dropdown>
          ) : (
            <Link to="/login" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              <span>👤</span>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
