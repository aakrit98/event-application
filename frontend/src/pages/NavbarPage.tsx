import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

export default function NavbarPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [profileHover, setProfileHover] = useState(false);

  const profileItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/profile">My Profile</Link>,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <Link to="/logout">Logout</Link>,
      danger: true,
    },
  ];

  const navLinks = [
    { name: "Home", path: "/events" },
    ...(user ? [{ name: "My Events", path: "/my-events" }] : []),
    ...(user ? [{ name: "Create Event", path: "/events/new" }] : []),
  ];

  // Resolve user display name
  const displayName =
    (user as { name?: string; username?: string; email?: string })?.name ||
    (user as { name?: string; username?: string; email?: string })?.username ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        backgroundColor: "#0d1b3e", // Rich dark navy blue
        borderBottom: "1px solid #1e2952",
        boxShadow: "0 4px 20px rgba(7, 15, 38, 0.45)",
      }}
    >
      <nav
        style={{
          maxWidth: 1400,
          height: 64,
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* Left Side: Brand Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            userSelect: "none",
          }}
        >
          {/* Gradient Square Icon with Sparkle */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(244, 63, 94, 0.35)",
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.8-6.2l-2.1 2.1m-8.2 8.2l-2.1 2.1m0-12.4l2.1 2.1m8.2 8.2l2.1 2.1" />
            </svg>
          </div>

          <span
            style={{
              fontSize: 21,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.4px",
            }}
          >
            Eventify
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const isHovered = hoveredNav === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                onMouseEnter={() => setHoveredNav(link.path)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isHovered || isActive ? "#ffffff" : "#94a3b8",
                  textShadow:
                    isHovered || isActive
                      ? "0 0 12px rgba(255, 255, 255, 0.45)"
                      : "none",
                  transition: "color 0.2s ease, text-shadow 0.2s ease",
                  padding: "6px 0",
                  cursor: "pointer",
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right Side: Notification Bell & Profile with Emoji */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 18,
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <BellOutlined />
          </button>

          {/* Thin Vertical Divider */}
          <div
            style={{
              width: 1,
              height: 22,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
            }}
          />

          {/* User Profile Badge */}
          {user ? (
            <Dropdown menu={{ items: profileItems }} placement="bottomRight" arrow>
              <div
                onMouseEnter={() => setProfileHover(true)}
                onMouseLeave={() => setProfileHover(false)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px 6px 10px",
                  borderRadius: 999,
                  background: profileHover
                    ? "rgba(255, 255, 255, 0.14)"
                    : "rgba(255, 255, 255, 0.08)",
                  border: profileHover
                    ? "1px solid rgba(255, 255, 255, 0.28)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  transition: "all 0.2s ease",
                  userSelect: "none",
                }}
              >
                {/* Person emoji avatar */}
                <span
                  role="img"
                  aria-label="User"
                  style={{
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  👤
                </span>

                {/* Logged-in User Name */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#ffffff",
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </span>

                <DownOutlined
                  style={{
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.65)",
                    marginLeft: 2,
                  }}
                />
              </div>
            </Dropdown>
          ) : (
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span role="img" aria-label="User" style={{ fontSize: 16 }}>
                👤
              </span>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
