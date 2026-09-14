import { Link } from "react-router-dom";
import { TwitterOutlined, FacebookOutlined, InstagramOutlined } from "@ant-design/icons";

const SECTIONS = [
  {
    title: "EXPLORE",
    links: [
      { label: "Music Events", to: "/events?tag=Music" },
      { label: "Tech Conferences", to: "/events?tag=Tech" },
      { label: "Art Galleries", to: "/events?tag=Art" },
    ],
  },
  {
    title: "CREATE & HOST",
    links: [
      { label: "List Your Event", to: "/events/new" },
      { label: "Pricing & Fees", to: "/pricing" },
      { label: "Organizer Toolkit", to: "/toolkit" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
];

export default function FooterPage() {
  return (
    <footer style={{ width: "100%", background: "#0d1b3e", borderTop: "1px solid #1a2850", color: "#8a9bb2", padding: "48px 32px 28px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        
        {/* Main Content Grid */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 36, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          
          {/* Brand Info */}
          <div style={{ maxWidth: 320 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.8-6.2l-2.1 2.1m-8.2 8.2l-2.1 2.1m0-12.4l2.1 2.1m8.2 8.2l2.1 2.1" />
                </svg>
              </div>
              <span style={{ fontSize: 21, fontWeight: 800, color: "#fff" }}>Eventify</span>
            </Link>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#7e90a8" }}>
              Discover and book memorable experiences or create and host your own community events flawlessly.
            </p>
          </div>

          {/* 3 Link Columns */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "40px 64px" }}>
            {SECTIONS.map((sec) => (
              <div key={sec.title} style={{ minWidth: 120 }}>
                <span style={{ display: "block", color: "#ffffff", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>
                  {sec.title}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sec.links.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      style={{ color: "#8a9bb2", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#8a9bb2")}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 24 }}>
          <span style={{ fontSize: 12, color: "#697b93" }}>
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </span>

          <div style={{ display: "flex", gap: 18, fontSize: 16 }}>
            {[
              { icon: <TwitterOutlined />, href: "https://twitter.com" },
              { icon: <FacebookOutlined />, href: "https://facebook.com" },
              { icon: <InstagramOutlined />, href: "https://instagram.com" },
            ].map((s, idx) => (
              <a
                key={idx}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#7e90a8", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#7e90a8")}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
