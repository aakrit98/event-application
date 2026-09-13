import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Alert, Typography } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import type { AxiosError } from "axios";

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ error?: string }>;
  return axiosErr.response?.data?.error ?? fallback;
}

const NAVY = "#0d1b3e";
const SOFT_BG = "#f0f4fa";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: SignupFormValues) {
    setError(null);
    setSubmitting(true);
    try {
      await signup(values.name, values.email, values.password);
      navigate("/events");
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed. Please try again"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 1040, minHeight: 620, background: "#fff", borderRadius: 20, overflow: "hidden", display: "flex", boxShadow: "0 20px 50px rgba(13,27,62,0.08)" }}>
        
        {/* LEFT BRAND SECTION */}
        <div style={{ width: "48%", background: SOFT_BG, padding: "48px 44px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -90, left: -90, width: 280, height: 280, borderRadius: "50%", background: "#e2ebf7" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "#e6eefa" }} />

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: NAVY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
              E
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>Eventify</span>
          </div>

          {/* Graphic & Copy */}
          <div style={{ position: "relative", zIndex: 2, margin: "24px 0" }}>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.2, color: NAVY, fontWeight: 700 }}>
              Join the crowd.<br />Create memories.
            </h1>
            <p style={{ margin: "14px 0 28px", color: "#5d6d85", fontSize: 15, lineHeight: 1.6, maxWidth: 360 }}>
              Create an account to host your own events, book tickets, and connect with people.
            </p>

            <div style={{ background: "#ffffff", borderRadius: 16, padding: "18px 22px", width: 280, boxShadow: "0 16px 36px rgba(13,27,62,0.1)", transform: "rotate(-2deg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#8a9ab0", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                <span>COMMUNITY</span><span>✦</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eef2fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  🎉
                </div>
                <div>
                  <strong style={{ display: "block", color: NAVY, fontSize: 14 }}>Unlimited Events</strong>
                  <span style={{ fontSize: 12, color: "#7a8ba2" }}>Host & join in seconds</span>
                </div>
              </div>
            </div>
          </div>

          <span style={{ position: "relative", zIndex: 2, fontSize: 12, color: "#8898ae" }}>
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </span>
        </div>

        {/* RIGHT FORM SECTION */}
        <div style={{ width: "52%", padding: "45px 65px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Typography.Title level={2} style={{ margin: 0, color: NAVY, fontSize: 26, fontWeight: 700 }}>
              Create an Account
            </Typography.Title>
            <Typography.Text style={{ color: "#7a8ba2", fontSize: 14 }}>
              Sign up to get started with Eventify
            </Typography.Text>
          </div>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 18, borderRadius: 8 }} />}

          <Form<SignupFormValues> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }, { min: 2, message: "At least 2 characters" }]}>
              <Input size="large" prefix={<UserOutlined style={{ color: "#9caec4" }} />} placeholder="John Doe" style={{ borderRadius: 9 }} />
            </Form.Item>

            <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
              <Input size="large" prefix={<MailOutlined style={{ color: "#9caec4" }} />} placeholder="you@example.com" style={{ borderRadius: 9 }} />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 8, message: "At least 8 characters" },
                { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: "Must include a letter and a number" }
              ]}
              extra={<span style={{ fontSize: 12, color: "#8a9ab0" }}>At least 8 characters with a letter and a number</span>}
            >
              <Input.Password size="large" prefix={<LockOutlined style={{ color: "#9caec4" }} />} placeholder="Create a password" style={{ borderRadius: 9 }} />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large" loading={submitting}
                style={{ height: 46, borderRadius: 9, background: NAVY, borderColor: NAVY, fontSize: 15, fontWeight: 600 }}>
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6c7d93" }}>
            <span>Already have an account? </span>
            <Link to="/login" style={{ color: NAVY, fontWeight: 600 }}>Log In</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
