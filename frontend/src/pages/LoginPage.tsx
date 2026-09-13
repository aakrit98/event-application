import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Alert, Typography } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import type { AxiosError } from "axios";

type Step = "credentials" | "twoFactor";
interface CredentialsFormValues { email: string; password: string; }
interface TwoFactorFormValues { code: string; }

function getErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ error?: string }>;
  return axiosErr.response?.data?.error ?? fallback;
}

const NAVY = "#0d1b3e";
const NAVY_HOVER = "#162a5c";
const SOFT_BG = "#f0f4fa";

export default function LoginPage() {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("credentials");
  const [pendingToken, setPendingToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCredentialsSubmit(values: CredentialsFormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(values.email, values.password);
      if ("requires2FA" in res) {
        setPendingToken(res.pendingToken);
        setStep("twoFactor");
      } else {
        navigate("/events");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTwoFactorSubmit(values: TwoFactorFormValues) {
    setError(null);
    setSubmitting(true);
    try {
      await verifyTwoFactor(pendingToken, values.code);
      navigate("/events");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code. Please try again"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 1040, minHeight: 620, background: "#fff", borderRadius: 20, overflow: "hidden", display: "flex", boxShadow: "0 20px 50px rgba(13,27,62,0.08)" }}>
        
        {/* LEFT BRAND SECTION */}
        <div style={{ width: "48%", background: SOFT_BG, padding: "48px 44px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          {/* Subtle Background Glows */}
          <div style={{ position: "absolute", top: -90, left: -90, width: 280, height: 280, borderRadius: "50%", background: "#e2ebf7" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "#e6eefa" }} />

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: NAVY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
              E
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>Eventify</span>
          </div>

          {/* Center Graphic & Headlines */}
          <div style={{ position: "relative", zIndex: 2, margin: "30px 0" }}>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.2, color: NAVY, fontWeight: 700 }}>
              Your events.<br />Your moments.
            </h1>
            <p style={{ margin: "14px 0 32px", color: "#5d6d85", fontSize: 15, lineHeight: 1.6, maxWidth: 360 }}>
              Discover, organize, and experience unforgettable live events in one place.
            </p>

            {/* Event Badge Card */}
            <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 22px", width: 280, boxShadow: "0 16px 36px rgba(13,27,62,0.1)", transform: "rotate(-2deg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#8a9ab0", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                <span>FEATURED EVENT</span><span>✦</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eef2fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  🎟️
                </div>
                <div>
                  <strong style={{ display: "block", color: NAVY, fontSize: 14 }}>Live Concert 2026</strong>
                  <span style={{ fontSize: 12, color: "#7a8ba2" }}>Arena Stage • 8:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          <span style={{ position: "relative", zIndex: 2, fontSize: 12, color: "#8898ae" }}>
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </span>
        </div>

        {/* RIGHT FORM SECTION */}
        <div style={{ width: "52%", padding: "50px 65px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 20, borderRadius: 8 }} />}

          {step === "credentials" ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Typography.Title level={2} style={{ margin: 0, color: NAVY, fontSize: 26, fontWeight: 700 }}>
                  Welcome Back
                </Typography.Title>
                <Typography.Text style={{ color: "#7a8ba2", fontSize: 14 }}>
                  Sign in to manage and view your events
                </Typography.Text>
              </div>

              <Form<CredentialsFormValues> layout="vertical" onFinish={handleCredentialsSubmit} requiredMark={false}>
                <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
                  <Input size="large" prefix={<UserOutlined style={{ color: "#9caec4" }} />} placeholder="you@example.com" style={{ borderRadius: 9 }} />
                </Form.Item>

                <Form.Item name="password" label="Password" rules={[{ required: true, message: "Password is required" }]}>
                  <Input.Password size="large" prefix={<LockOutlined style={{ color: "#9caec4" }} />} placeholder="Enter your password" style={{ borderRadius: 9 }} />
                </Form.Item>

                <div style={{ textAlign: "right", marginTop: -6, marginBottom: 22 }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, color: NAVY }}>Forgot Password?</Link>
                </div>

                <Button type="primary" htmlType="submit" block size="large" loading={submitting}
                  style={{ height: 46, borderRadius: 9, background: NAVY, borderColor: NAVY, fontSize: 15, fontWeight: 600 }}>
                  Sign In
                </Button>
              </Form>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6c7d93" }}>
                <span>Don't have an account? </span>
                <Link to="/signup" style={{ color: NAVY, fontWeight: 600 }}>Sign Up</Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 30 }}>
                <div style={{ width: 52, height: 52, margin: "0 auto 14px", borderRadius: "50%", background: "#eef2fa", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  <SafetyOutlined />
                </div>
                <Typography.Title level={2} style={{ margin: 0, color: NAVY, fontSize: 24, fontWeight: 700 }}>
                  Two-Factor Authentication
                </Typography.Title>
                <Typography.Text style={{ color: "#7a8ba2", fontSize: 13 }}>
                  Enter the 6-digit verification code from your app
                </Typography.Text>
              </div>

              <Form<TwoFactorFormValues> layout="vertical" onFinish={handleTwoFactorSubmit} requiredMark={false}>
                <Form.Item name="code" label="Verification Code" rules={[{ required: true, message: "Code is required" }, { len: 6, message: "Must be 6 digits" }, { pattern: /^\d{6}$/, message: "Digits only" }]}>
                  <Input size="large" prefix={<SafetyOutlined style={{ color: "#9caec4" }} />} placeholder="123456" maxLength={6} autoFocus style={{ borderRadius: 9, letterSpacing: 3, textAlign: "center" }} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large" loading={submitting}
                  style={{ height: 46, borderRadius: 9, background: NAVY, borderColor: NAVY, fontSize: 15, fontWeight: 600 }}>
                  Verify Code
                </Button>
              </Form>

              <button onClick={() => { setStep("credentials"); setError(null); }}
                style={{ border: "none", background: "transparent", color: NAVY, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, margin: "18px auto 0", fontSize: 13, fontWeight: 500 }}>
                <ArrowLeftOutlined /> Back to Sign In
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
