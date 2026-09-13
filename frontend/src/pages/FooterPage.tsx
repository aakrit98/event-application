import { Layout, Row, Col, Typography, Space, Divider, Input, Button, message } from "antd";
import {
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";

const { Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const footerStyle: CSSProperties = {
  background: "#141414",
  color: "rgba(255, 2, 2, 0.75)",
  padding: "48px 24px 16px",
};

const innerStyle: CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
};

const headingStyle: CSSProperties = {
  color: "#ffffff",
  marginBottom: 16,
};

const linkStyle: CSSProperties = {
  color: "rgba(255, 255, 255, 0.75)",
  display: "block",
  marginBottom: 8,
};

const socialButtonStyle: CSSProperties = {
  color: "#ffffff",
  borderColor: "rgba(255, 255, 255, 0.25)",
  background: "transparent",
};

const bottomBarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "center",
};

export default function FooterPage() {
  function handleSubscribe(email: string) {
    if (!email || !email.includes("@")) {
      message.warning("Enter a valid email to subscribe.");
      return;
    }
    message.success("You’re subscribed to Eventify updates.");
  }

  return (
    <Footer style={footerStyle}>
      <div style={innerStyle}>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={8}>
            <Space align="center" style={{ marginBottom: 12 }}>
              <CalendarOutlined style={{ color: "#1677ff", fontSize: 22 }} />
              <Title level={4} style={{ ...headingStyle, marginBottom: 0 }}>
                Eventify
              </Title>
            </Space>
            <Paragraph style={{ color: "rgba(255, 255, 255, 0.65)", marginBottom: 16 }}>
              Plan, discover, and manage public and private events in one place — from
              community meetups to ticketed conferences.
            </Paragraph>
            <Space direction="vertical" size={8}>
              <Text style={{ color: "rgba(255, 255, 255, 0.75)" }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                Kathmandu, Nepal
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.75)" }}>
                <MailOutlined style={{ marginRight: 8 }} />
                hello@eventify.app
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.75)" }}>
                <PhoneOutlined style={{ marginRight: 8 }} />
                +977 9800000000
              </Text>
            </Space>
          </Col>

          <Col xs={12} sm={12} md={4}>
            <Title level={5} style={headingStyle}>
              Explore
            </Title>
            <Link to="/events" style={linkStyle}>
              Browse events
            </Link>
            <Link to="/signup" style={linkStyle}>
              Create an account
            </Link>
            <Link to="/login" style={linkStyle}>
              Sign in
            </Link>
          </Col>

          <Col xs={12} sm={12} md={4}>
            <Title level={5} style={headingStyle}>
              Organizers
            </Title>
            <span style={linkStyle}>Create events</span>
            <span style={linkStyle}>Invite guests</span>
            <span style={linkStyle}>Tags &amp; categories</span>
            <span style={linkStyle}>Private events</span>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Title level={5} style={headingStyle}>
              Stay in the loop
            </Title>
            <Paragraph style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              Get upcoming events and planning tips in your inbox.
            </Paragraph>
            <Input.Search
              placeholder="Email address"
              enterButton={
                <Button type="primary" htmlType="button">
                  Subscribe
                </Button>
              }
              onSearch={handleSubscribe}
              style={{ marginBottom: 16 }}
            />
            <Space size={8}>
              <Button
                shape="circle"
                icon={<TwitterOutlined />}
                aria-label="Twitter"
                style={socialButtonStyle}
              />
              <Button
                shape="circle"
                icon={<FacebookOutlined />}
                aria-label="Facebook"
                style={socialButtonStyle}
              />
              <Button
                shape="circle"
                icon={<InstagramOutlined />}
                aria-label="Instagram"
                style={socialButtonStyle}
              />
              <Button
                shape="circle"
                icon={<LinkedinOutlined />}
                aria-label="LinkedIn"
                style={socialButtonStyle}
              />
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: "rgba(216, 0, 0, 0.12)", margin: "32px 0 16px" }} />

        <div style={bottomBarStyle}>
          <Text style={{ color: "rgba(255, 255, 255, 0.45)" }}>
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </Text>
          <Space size="middle" wrap>
            <span style={{ color: "rgba(255, 255, 255, 0.55)" }}>Privacy</span>
            <span style={{ color: "rgba(255, 255, 255, 0.55)" }}>Terms</span>
            <span style={{ color: "rgba(255, 255, 255, 0.55)" }}>Cookies</span>
            <span style={{ color: "rgba(255, 255, 255, 0.55)" }}>Accessibility</span>
          </Space>
        </div>
      </div>
    </Footer>
  );
}
