import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { BellOutlined, UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

export default function NavbarPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const profileItems: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: <Link to="/profile">My Profile</Link> },
    { key: "settings", icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: <Link to="/logout">Logout</Link>, danger: true },
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
          <BellOutlined style={{ fontSize: 18, color: "#94a3b8", cursor: "pointer", padding: 6 }} />
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
