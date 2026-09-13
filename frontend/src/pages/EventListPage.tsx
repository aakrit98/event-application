import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Input,
  Select,
  Button,
  Pagination,
  Popconfirm,
  Typography,
  Space,
  Empty,
  Spin,
  Row,
  Col,
  message,
} from "antd";
import {
  SearchOutlined,
  ControlOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import * as eventsApi from "../api/events";
import * as tagsApi from "../api/tags";
import type { Event, Tag } from "../types";
import type { ListEventsParams } from "../api/events";

const { Title, Text, Paragraph } = Typography;

interface Filters {
  search: string;
  locationSearch: string;
  event_type: "public" | "private" | undefined;
  timeframe: "upcoming" | "past" | "all";
  tagIds: number[];
  sortBy: "start_at" | "created_at" | "title";
  sortOrder: "asc" | "desc";
  page: number;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  locationSearch: "",
  event_type: undefined,
  timeframe: "all",
  tagIds: [],
  sortBy: "start_at",
  sortOrder: "asc",
  page: 1,
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80";

export default function EventListPage() {
  const { user } = useAuth();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination calculation: Page 1 shows 3, subsequent pages show 6
  const getPageLimit = (page: number) => (page === 1 ? 3 : 6);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const limit = getPageLimit(filters.page);
      const offset = filters.page === 1 ? 0 : 3 + (filters.page - 2) * 6;

      const params: ListEventsParams & { offset?: number; location?: string } = {
        page: filters.page,
        limit,
        offset,
        timeframe: filters.timeframe,
        event_type: filters.event_type,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        search: filters.search || undefined,
        location: filters.locationSearch || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const result = await eventsApi.listEvents(params);
      setEvents(result.data);
      setTotal(result.pagination?.total ?? result.data.length);
    } catch {
      message.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    tagsApi
      .listTags()
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

  function handleSearchSubmit() {
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim(),
      locationSearch: locationInput.trim(),
      page: 1,
    }));
  }

  function updateFilters(partial: Partial<Omit<Filters, "page">>) {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  }

  function handleResetFilters() {
    setSearchInput("");
    setLocationInput("");
    setFilters(DEFAULT_FILTERS);
  }

  async function handleDelete(id: number) {
    try {
      await eventsApi.deleteEvent(id);
      message.success("Event deleted.");
      fetchEvents();
    } catch {
      message.error("Failed to delete event.");
    }
  }

  // Active filter count indicator for the control button
  const activeFiltersCount =
    (filters.event_type ? 1 : 0) +
    (filters.timeframe !== "all" ? 1 : 0) +
    filters.tagIds.length +
    (filters.sortBy !== "start_at" || filters.sortOrder !== "asc" ? 1 : 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* HERO SECTION */}
      <div
        style={{
          position: "relative",
          background:
            "linear-gradient(180deg, rgba(13, 27, 62, 0.88) 0%, rgba(13, 27, 62, 0.96) 100%), url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "70px 24px 60px",
          color: "#ffffff",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <Title
            level={1}
            style={{
              color: "#ffffff",
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 800,
              letterSpacing: -0.6,
              margin: 0,
            }}
          >
            Discover Events That Inspire You
          </Title>
          <Paragraph
            style={{
              color: "rgba(255, 255, 255, 0.75)",
              fontSize: 16,
              maxWidth: 620,
              margin: "12px auto 32px",
            }}
          >
            Explore live concerts, tech summits, nightlife gatherings, and exclusive masterclasses happening around you.
          </Paragraph>

          {/* Search Capsule & Filter Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              maxWidth: 780,
              margin: "0 auto",
            }}
          >
            {/* Pill Search Capsule */}
            <div
              style={{
                flex: "1 1 500px",
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 999,
                padding: "6px 8px 6px 18px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              <SearchOutlined style={{ color: "#94a3b8", fontSize: 18, marginRight: 10 }} />
              <Input
                bordered={false}
                placeholder="Search event name, keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={handleSearchSubmit}
                style={{ flex: 1, fontSize: 14 }}
              />

              <div
                style={{
                  width: 1,
                  height: 24,
                  backgroundColor: "#e2e8f0",
                  margin: "0 12px",
                }}
              />

              <EnvironmentOutlined style={{ color: "#94a3b8", fontSize: 16, marginRight: 8 }} />
              <Input
                bordered={false}
                placeholder="Location..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onPressEnter={handleSearchSubmit}
                style={{ width: 140, fontSize: 14 }}
              />

              <Button
                type="primary"
                onClick={handleSearchSubmit}
                style={{
                  borderRadius: 999,
                  height: 42,
                  padding: "0 24px",
                  fontWeight: 600,
                  border: "none",
                  background: "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 12px rgba(244, 63, 94, 0.35)",
                }}
              >
                Search
              </Button>
            </div>

            {/* Filter Toggle Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                height: 52,
                padding: "0 20px",
                borderRadius: 999,
                fontWeight: 600,
                border: "1px solid rgba(255, 255, 255, 0.25)",
                backgroundColor: showFilters ? "#ffffff" : "rgba(255, 255, 255, 0.12)",
                color: showFilters ? "#0d1b3e" : "#ffffff",
                backdropFilter: "blur(8px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ControlOutlined />
              Filters
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#f43f5e",
                    color: "#ffffff",
                    borderRadius: 999,
                    fontSize: 11,
                    padding: "2px 7px",
                    fontWeight: 700,
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Smooth Collapsible Filters Panel */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: showFilters ? "1fr" : "0fr",
              transition: "grid-template-rows 0.3s ease",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  marginTop: 24,
                  backgroundColor: "#ffffff",
                  borderRadius: 18,
                  padding: "20px 24px",
                  maxWidth: 780,
                  margin: "24px auto 0",
                  textAlign: "left",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                  color: "#0f172a",
                }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      TIMEFRAME
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      value={filters.timeframe}
                      onChange={(timeframe) => updateFilters({ timeframe })}
                      options={[
                        { label: "All Events", value: "all" },
                        { label: "Upcoming Events", value: "upcoming" },
                        { label: "Past Events", value: "past" },
                      ]}
                    />
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      ACCESS TYPE
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      allowClear
                      placeholder="All Access"
                      value={filters.event_type}
                      onChange={(event_type) => updateFilters({ event_type })}
                      options={[
                        { label: "Public", value: "public" },
                        { label: "Private", value: "private" },
                      ]}
                    />
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      TAGS
                    </Text>
                    <Select
                      mode="multiple"
                      maxTagCount="responsive"
                      placeholder="Filter by tags"
                      style={{ width: "100%" }}
                      value={filters.tagIds}
                      onChange={(tagIds) => updateFilters({ tagIds })}
                      options={availableTags.map((t) => ({
                        label: t.name,
                        value: t.id,
                      }))}
                    />
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      SORT BY
                    </Text>
                    <Select
                      style={{ width: "100%" }}
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(val) => {
                        const [sortBy, sortOrder] = val.split("-") as [Filters["sortBy"], Filters["sortOrder"]];
                        updateFilters({ sortBy, sortOrder });
                      }}
                      options={[
                        { label: "Date: Soonest", value: "start_at-asc" },
                        { label: "Date: Furthest", value: "start_at-desc" },
                        { label: "Recently Added", value: "created_at-desc" },
                        { label: "Title: A-Z", value: "title-asc" },
                      ]}
                    />
                  </Col>
                </Row>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleResetFilters}
                    style={{ color: "#64748b" }}
                  >
                    Reset All Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN EVENT LIST SECTION */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Results Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
              Explore Events
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Showing {events.length} of {total} available events
            </Text>
          </div>

          <Link to="/events/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                borderRadius: 10,
                height: 42,
                fontWeight: 600,
                background: "#0d1b3e",
                borderColor: "#0d1b3e",
                padding: "0 20px",
              }}
            >
              Create Event
            </Button>
          </Link>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <Spin size="large" tip="Loading events..." />
          </div>
        ) : events.length === 0 ? (
          <Empty
            description={
              <span style={{ color: "#64748b", fontSize: 15 }}>
                No events found matching your criteria.
              </span>
            }
            style={{ padding: "60px 0" }}
          >
            <Button onClick={handleResetFilters} style={{ borderRadius: 8 }}>
              Clear Filters
            </Button>
          </Empty>
        ) : (
          /* EVENT GRID */
          <Row gutter={[28, 28]}>
            {events.map((event) => {
              const isOwner = user?.id === event.creator_id;
              const eventDate = new Date(event.start_at);
              const month = eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
              const day = eventDate.getDate();
              const bannerUrl = (event as { image_url?: string }).image_url || FALLBACK_IMAGE;

              return (
                <Col xs={24} sm={12} lg={8} key={event.id}>
                  <div
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 23, 42, 0.06)";
                    }}
                  >
                    {/* Event Banner Image with Date and Type badges */}
                    <Link
                      to={`/events/${event.id}`}
                      style={{
                        position: "relative",
                        display: "block",
                        width: "100%",
                        height: 220,
                        overflow: "hidden",
                        backgroundColor: "#0d1b3e",
                      }}
                    >
                      <img
                        src={bannerUrl}
                        alt={event.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.4s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      />

                      {/* Access type badge */}
                      <span
                        style={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#ffffff",
                          background:
                            event.event_type === "public"
                              ? "rgba(16, 185, 129, 0.9)"
                              : "rgba(245, 158, 11, 0.9)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        {event.event_type}
                      </span>

                      {/* Date Badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: 14,
                          right: 14,
                          background: "rgba(255, 255, 255, 0.95)",
                          borderRadius: 12,
                          padding: "6px 12px",
                          textAlign: "center",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", lineHeight: 1.1 }}>
                          {month}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                          {day}
                        </div>
                      </div>
                    </Link>

                    {/* Card Content */}
                    <div
                      style={{
                        padding: "20px 22px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      {/* Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          {event.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#6366f1",
                                background: "#eef2ff",
                                padding: "2px 8px",
                                borderRadius: 6,
                              }}
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Event Title */}
                      <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
                        <h3
                          style={{
                            margin: "0 0 8px",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: 1.35,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {event.title}
                        </h3>
                      </Link>

                      {/* Location & Time */}
                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <EnvironmentOutlined style={{ color: "#94a3b8" }} />
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {event.location}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <ClockCircleOutlined style={{ color: "#94a3b8" }} />
                          <span>
                            {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      {/* Short Description */}
                      <p
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          margin: "0 0 16px",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          flex: 1,
                        }}
                      >
                        {event.description}
                      </p>

                      {/* Card Bottom Actions */}
                      <div
                        style={{
                          paddingTop: 14,
                          borderTop: "1px solid #f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Link
                          to={`/events/${event.id}`}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#6366f1",
                            textDecoration: "none",
                          }}
                        >
                          View Details &rarr;
                        </Link>

                        {isOwner && (
                          <Space size={8}>
                            <Link to={`/events/edit/${event.id}`}>
                              <Button size="small">Edit</Button>
                            </Link>
                            <Popconfirm
                              title="Delete this event?"
                              description="This action cannot be undone."
                              onConfirm={() => handleDelete(event.id)}
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                            >
                              <Button size="small" danger>
                                Delete
                              </Button>
                            </Popconfirm>
                          </Space>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Custom Pagination (Page 1 = 3 items, later pages = 6 items) */}
        {total > 3 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
            <Pagination
              current={filters.page}
              pageSize={filters.page === 1 ? 3 : 6}
              total={total}
              onChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
