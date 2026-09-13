import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Button,
  Popconfirm,
  Spin,
  Result,
  message,
  Card,
  Tooltip,
  Row,
  Col,
  Tag as AntTag,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  InfoCircleOutlined,
  CompassOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import * as eventsApi from "../api/events";
import type { Event } from "../types";
import type { AxiosError } from "axios";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const eventId = Number(id);

    if (!id || Number.isNaN(eventId) || eventId <= 0) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let isMounted = true;

    async function loadEvent() {
      setLoading(true);
      setNotFound(false);
      setEvent(null);

      try {
        const data = await eventsApi.getEvent(eventId);
        if (isMounted) {
          setEvent(data);
        }
      } catch (err) {
        if (!isMounted) return;
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          setNotFound(true);
        } else {
          message.error("Failed to load the event. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!event) return;

    try {
      await eventsApi.deleteEvent(event.id);
      message.success("Event deleted successfully.");
      navigate("/events");
    } catch {
      message.error("Failed to delete the event. Please try again.");
    }
  }

  function formatHeroDate(dateStr: string) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  }

  function formatTimeOnly(dateStr: string) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px 24px" }}>
        <Spin size="large" tip="Loading event details..." />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div style={{ padding: "80px 24px" }}>
        <Result
          status="404"
          title="Event not found"
          subTitle="This event may have been deleted or the link is incorrect."
          extra={
            <Link to="/events">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                Back to Events
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = user?.id === event.creator_id;
  const primaryTag = event.tags?.[0]?.name; 
  const eventType = event.event_type;
  const eventImageUrl = (event as { image_url?: string }).image_url;


   const uploadedImage =
    (event as { image_url?: string; imageUrl?: string }).image_url ||
    (event as { image_url?: string; imageUrl?: string }).imageUrl ||
    null;
  
  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero Header: Shows the user's uploaded image if present, otherwise clean dark navy */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: 320,
          backgroundColor: "#0d1b3e",
          backgroundImage: uploadedImage
            ? `linear-gradient(180deg, rgba(13, 27, 62, 0.75) 0%, rgba(13, 27, 62, 0.95) 100%), url(${uploadedImage})`
            : "linear-gradient(180deg, #0d1b3e 0%, #0a1329 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "#ffffff",
          padding: "36px 0 50px",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 28px",
          }}
        >
          {/* Top navigation back button & owner tools */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Link
              to="/events"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#e2e8f0",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                background: "rgba(15, 23, 42, 0.5)",
                padding: "6px 14px",
                borderRadius: 8,
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <ArrowLeftOutlined /> Back to Events
            </Link>

            {isOwner && (
              <div style={{ display: "flex", gap: 10 }}>
                <Link to={`/events/edit/${event.id}`}>
                  <Button
                    icon={<EditOutlined />}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      borderColor: "rgba(255,255,255,0.25)",
                      borderRadius: 8,
                    }}
                  >
                    Edit Event
                  </Button>
                </Link>

                <Popconfirm
                  title="Delete event?"
                  description="This action cannot be undone."
                  onConfirm={handleDelete}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                    Delete
                  </Button>
                </Popconfirm>
              </div>
            )}
          </div>

          {/* Category Badges */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            {primaryTag && (
              <span
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  padding: "5px 14px",
                  borderRadius: 6,
                }}
              >
                {primaryTag}
              </span>
            )}

            <span
              style={{
                display: "inline-block",
                backgroundColor:
                  event.event_type === "public"
                    ? "rgba(16, 185, 129, 0.85)"
                    : "rgba(245, 158, 11, 0.85)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                padding: "5px 12px",
                borderRadius: 6,
              }}
            >
              {event.event_type === "private" ? "Private Event" : "Public Event"}
            </span>
          </div>

          {/* Event Title */}
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 16px",
              lineHeight: 1.25,
              maxWidth: 960,
            }}
          >
            {event.title}
          </h1>

          {/* Date & Location */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
              color: "#e2e8f0",
              fontSize: 15,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarOutlined style={{ color: "#f43f5e", fontSize: 17 }} />
              <span>{formatHeroDate(event.start_at)}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <EnvironmentOutlined style={{ color: "#f43f5e", fontSize: 17 }} />
              <span>{event.location || "Venue TBA"}</span>
            </div>
          </div>  
          <div> 
            <div style={{ marginTop : "20px"}}>
          <strong> 
  {event.event_type === "private" ? "Private Event" : "Public Event"}
</strong>
</div>
</div>
        </div> 
        
      </section>

      {/* Main 2-Column Content Body */}
      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "44px 28px 80px",
        }}
      >
        <Row gutter={[40, 32]}>
          {/* Left Column: Details, Agenda, Tags */}
          <Col xs={24} lg={15}>
            {/* About the Event */}
            <section style={{ marginBottom: 44 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 16px",
                }}
              >
                About the Event
              </h2>
              
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "#475569",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {event.description || "No description provided for this event."}
              </p>
            </section>

            {/* Event Agenda / Timeline */}
            <section style={{ marginBottom: 44 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 20px",
                }}
              >
                Event Schedule
              </h2>

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                {/* Agenda Row 1: Start */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 28,
                    padding: "20px 0",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      width: 90,
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#6366f1",
                      flexShrink: 0,
                    }}
                  >
                    {formatTimeOnly(event.start_at)}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      Doors Open & Check-In
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                      Attendee badge collection and initial welcome reception.
                    </p>
                  </div>
                </div>

                {/* Agenda Row 2: Main Event */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 28,
                    padding: "20px 0",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      width: 90,
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#6366f1",
                      flexShrink: 0,
                    }}
                  >
                    Main Event
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {event.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                      Primary showcase, presentations, and interactive experiences.
                    </p>
                  </div>
                </div>

                {/* Agenda Row 3: Conclude */}
                {event.end_at && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 28,
                      padding: "20px 0",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#6366f1",
                        flexShrink: 0,
                      }}
                    >
                      {formatTimeOnly(event.end_at)}
                    </div>
                    <div>
                      <h4
                        style={{
                          margin: "0 0 4px",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        Event Concludes
                      </h4>
                      <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                        Networking wrap-up and departures.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Tags & Categories */}
            {event.tags && event.tags.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 16px",
                  }}
                >
                  Tags & Topics
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {event.tags.map((tag) => (
                    <AntTag
                      key={tag.id}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#475569",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      #{tag.name}
                    </AntTag>
                  ))}
                </div>
              </section>
            )}
          </Col>

          {/* Right Column: Ticket Card & Venue Box */}
          <Col xs={24} lg={9}>
            <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Ticket Card */}
              <Card
                style={{
                  borderRadius: 20,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)",
                  background: "#ffffff",
                }}
                styles={{ body: { padding: 28 } }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  Standard General Admission
                </span>

                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: -1,
                    marginBottom: 24,
                  }}
                >
                  Free
                </div>

                {/* Quantity Control */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                    Quantity
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "4px 8px",
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MinusOutlined style={{ fontSize: 12 }} />}
                      disabled={ticketQuantity <= 1}
                      onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                    />
                    <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center" }}>
                      {ticketQuantity}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined style={{ fontSize: 12 }} />}
                      onClick={() => setTicketQuantity((q) => q + 1)}
                    />
                  </div>
                </div>

                {/* Get Tickets CTA */}
                <Button
                  type="primary"
                  block
                  style={{
                    height: 50,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 16,
                    border: "none",
                    background: "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                    boxShadow: "0 4px 16px rgba(244, 63, 94, 0.35)",
                    marginBottom: 20,
                  }}
                  onClick={() => message.success(`Selected ${ticketQuantity} ticket(s)`)}
                >
                  Get Tickets
                </Button>

                {/* Meta details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13 }}>
                    <UserOutlined style={{ color: "#94a3b8" }} />
                    <span>Hosted by Eventify</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13 }}>
                    <InfoCircleOutlined style={{ color: "#94a3b8" }} />
                    <span>Free cancellation up to 24h before event</span>
                  </div>
                </div>
              </Card>

              {/* Venue / Location Card */}
              <Card
                style={{
                  borderRadius: 20,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
                  background: "#ffffff",
                }}
                styles={{ body: { padding: 20 } }}
                cover={
                  <div
                    style={{
                      height: 140,
                      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38bdf8",
                      gap: 8,
                    }}
                  >
                    <CompassOutlined style={{ fontSize: 32 }} />
                    <span style={{ fontSize: 12, color: "#94a3b8", letterSpacing: 0.5 }}>VENUE MAP</span>
                  </div>
                }
              >
                <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {event.location || "Location Venue"}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  {event.location ? `${event.location}` : "Detailed address provided upon registration."}
                </p>
              </Card>
            </div>
          </Col>
        </Row>
      </main>
    </div>
  );
}
