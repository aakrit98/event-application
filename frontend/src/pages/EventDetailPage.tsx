import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Button,
  Spin,
  Result,
  message,
  Card,
  Row,
  Col,
  Tag as AntTag,
  Modal,
  Typography,
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
  ExportOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import * as eventsApi from "../api/events";
import type { Event } from "../types";
import type { AxiosError } from "axios";
import TicketManager from "../components/TicketManager";
import BuyTickets from "../components/BuyTickets";
import { useDeleteConfirm } from "../hooks/Usedeleteconfirm";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

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

  const { requestDelete, modal: deleteModal } = useDeleteConfirm(
    async () => {
      if (!event) return;
      await eventsApi.deleteEvent(event.id);
      navigate("/events");
    },
    {
      title: "Delete event?",
      description: "This action cannot be undone.",
      successMessage: "Event deleted successfully.",
      errorMessage: "Failed to delete the event. Please try again.",
    }
  );

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

  // Robust ID normalization
  const isOwner = Number(user?.id) === Number(event.creator_id);
  const isPrivate = event.event_type === "private";
  const primaryTag = event.tags?.[0]?.name;

  const eventFinished = event.end_at
    ? Date.now() >= new Date(event.end_at).getTime()
    : Date.now() >= new Date(event.start_at).getTime();

  const uploadedImage =
    (event as { image_url?: string; imageUrl?: string }).image_url ||
    (event as { image_url?: string; imageUrl?: string }).imageUrl ||
    null;

  const googleMapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  function handleTicketAction() {
    if (!isOwner && !user) {
      navigate("/login");
      return;
    }
    setTicketModalOpen(true);
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero Header */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: 320,
          backgroundColor: "#0d1b3e",
          backgroundImage: uploadedImage
            ? `linear-gradient(180deg, rgba(13, 27, 62, 0.78) 0%, rgba(13, 27, 62, 0.96) 100%), url(${uploadedImage})`
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
                background: "rgba(15, 23, 42, 0.55)",
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
                <Link to={`/events/${event.id}/edit`}>
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

                <Button
                  danger
                  icon={<DeleteOutlined />}
                  style={{ borderRadius: 8 }}
                  onClick={() => requestDelete()}
                >
                  Delete
                </Button>
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
                backgroundColor: isPrivate
                  ? "rgba(245, 158, 11, 0.85)"
                  : "rgba(16, 185, 129, 0.85)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                padding: "5px 12px",
                borderRadius: 6,
              }}
            >
              {isPrivate ? "Private Event" : "Public Event"}
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

          {/* Date & Location with Google Maps link */}
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
              {googleMapsUrl ? (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#e2e8f0", textDecoration: "underline" }}
                >
                  {event.location} <ExportOutlined style={{ fontSize: 12, marginLeft: 2 }} />
                </a>
              ) : (
                <span>Venue TBA</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
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

              <div style={{ borderTop: "1px solid #e2e8f0" }}>
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
                      Main Event
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                      {event.title} — Key presentations, showcase, and networking.
                    </p>
                  </div>
                </div>

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
                        Wrap-up and attendee departures.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Tags */}
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

          {/* Right Column: Unified Ticket Card & Venue Box */}
          <Col xs={24} lg={9}>
            <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Unified Ticket Card (Works for BOTH Public and Private Events) */}
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
                  {isOwner ? "Organizer Ticketing" : "Event Passes"}
                </span>

                <div
                  style={{
                    fontSize: 15,
                    color: "#475569",
                    marginBottom: 20,
                    lineHeight: 1.6,
                  }}
                >
                  {isOwner
                    ? "Configure ticket tiers, pricing, capacity, and view attendee ticket sales."
                    : isPrivate
                    ? "Select ticket tier and reserve your spot. Paid via eSewa checkout."
                    : "Admission passes & ticket tiers available for this event."}
                </div>

                <Button
                  type="primary"
                  block
                  disabled={eventFinished && !isOwner}
                  style={{
                    height: 50,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 16,
                    border: "none",
                    background: eventFinished && !isOwner
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                    boxShadow: eventFinished && !isOwner
                      ? "none"
                      : "0 4px 16px rgba(244, 63, 94, 0.35)",
                    marginBottom: 20,
                    color: eventFinished && !isOwner ? "#94a3b8" : "#fff",
                  }}
                  onClick={handleTicketAction}
                >
                  {isOwner
                    ? "Manage Tickets"
                    : eventFinished
                    ? "Event Finished"
                    : user
                    ? "Get Tickets"
                    : "Log in to Get Tickets"}
                </Button>

                {/* Assurance details */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    paddingTop: 16,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13 }}>
                    <UserOutlined style={{ color: "#94a3b8" }} />
                    <span>Hosted on Eventify</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13 }}>
                    <SafetyCertificateOutlined style={{ color: "#10b981" }} />
                    <span>Instant digital ticket delivery</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13 }}>
                    <InfoCircleOutlined style={{ color: "#94a3b8" }} />
                    <span>Free cancellation up to 24h before event</span>
                  </div>
                </div>
              </Card>

              {/* Venue / Location Card with Google Maps search link */}
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
                <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {event.location || "Venue Location"}
                </h4>

                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: "#6366f1",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    Open in Google Maps <ExportOutlined style={{ fontSize: 12 }} />
                  </a>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                    Detailed address provided upon registration.
                  </p>
                )}
              </Card>
            </div>
          </Col>
        </Row>
      </main>

      {deleteModal}

      {/* Unified Ticketing Modal: active for BOTH public and private events */}
      <Modal
        title={isOwner ? "Manage Event Tickets" : "Select & Buy Tickets"}
        open={ticketModalOpen}
        onCancel={() => setTicketModalOpen(false)}
        footer={null}
        width={580}
        destroyOnClose
      >
        {isOwner ? (
          <TicketManager eventId={event.id} />
        ) : user ? (
          <BuyTickets eventId={event.id} eventFinished={eventFinished} eventType={event.event_type} />
        ) : (
          <Typography.Paragraph style={{ marginTop: 16 }}>
            <Link to="/login" onClick={() => setTicketModalOpen(false)}>
              Log in
            </Link>{" "}
            to get tickets for this event.
          </Typography.Paragraph>
        )}
      </Modal>
    </div>
  );
}
