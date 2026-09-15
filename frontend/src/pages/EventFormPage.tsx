import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  Typography,
  message,
  Spin,
  Result,
  Row,
  Col,
  Upload,
  Space,
  Tag,
} from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../context/AuthContext";
import * as eventsApi from "../api/events";
import * as tagsApi from "../api/tags";
import * as ticketApi from "../api/ticket";
import { uploadEventImage } from "../api/upload"; // adjust path if needed
import type { Tag as TagType, EventFormInput, TicketFormInput } from "../types";
import type { AxiosError } from "axios";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface FormValues {
  title: string;
  description: string;
  location: string;
  start_at: Dayjs;
  end_at?: Dayjs | null;
  event_type: "public" | "private";
  tagIds: number[];
}

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm<FormValues>();

  const [currentStep, setCurrentStep] = useState(0);
  const [stepOneValues, setStepOneValues] = useState<FormValues | null>(null);

  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Ticket creation state (Step 3)
  const [ticketSeats, setTicketSeats] = useState<number>(100);
  const [ticketDrafts, setTicketDrafts] = useState<TicketFormInput[]>([]);
  const [draft, setDraft] = useState<TicketFormInput>({
    name: "",
    price: 0,
    quantity_available: 1,
    description: "",
  });

  useEffect(() => {
    tagsApi.listTags().then(setAvailableTags).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoading(true);

    eventsApi
      .getEvent(Number(id))
      .then((event) => {
        if (user && event.creator_id !== user.id) {
          setForbidden(true);
          return;
        }
        form.setFieldsValue({
          title: event.title,
          description: event.description,
          location: event.location,
          start_at: dayjs(event.start_at),
          end_at: event.end_at ? dayjs(event.end_at) : null,
          event_type: event.event_type,
          tagIds: event.tags.map((t) => t.id),
        });
        if (event.image_url) {
          setExistingImageUrl(event.image_url);
          setPreviewUrl(event.image_url);
        }
      })
      .catch((err: AxiosError) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          message.error("Failed to load event.");
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEditMode, user, form]);

  // Proceed to Step 2
  async function handleNextStep() {
    try {
      const values = await form.validateFields();
      setStepOneValues(values);
      setCurrentStep(1);
    } catch {
      message.error("Please fill in all required fields before proceeding.");
    }
  }

  const uploadProps: UploadProps = {
    name: "image",
    multiple: false,
    showUploadList: false,
    accept: "image/png,image/jpeg,image/jpg,image/webp",
    beforeUpload: (file) => {
      const isValidType = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ].includes(file.type);
      if (!isValidType) {
        message.error("Only JPG, PNG, and WEBP formats are allowed.");
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Image file must be smaller than 5MB.");
        return Upload.LIST_IGNORE;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      return false;
    },
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingImageUrl(null);
  };

  // Final Submit
  async function handleSubmit() {
    setSubmitting(true);

    try {
      // Use saved values from step 1 or fallback to form.getFieldsValue()
      const values = stepOneValues || form.getFieldsValue();

      if (!values.title || !values.start_at) {
        message.error("Please complete the event details in Step 1.");
        setCurrentStep(0);
        setSubmitting(false);
        return;
      }

      let finalImageUrl: string | undefined = existingImageUrl || undefined;

      // Upload image to Cloudinary/server if selected
      if (selectedFile) {
        const hideLoading = message.loading("Uploading banner image...", 0);
        try {
          finalImageUrl = await uploadEventImage(selectedFile);
          hideLoading();
        } catch (uploadErr) {
          hideLoading();
          console.error("Upload error:", uploadErr);
          message.error("Failed to upload image. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      const input: EventFormInput & { image_url?: string } = {
        title: values.title,
        description: values.description,
        location: values.location,
        start_at: values.start_at.toISOString(),
        end_at: values.end_at ? values.end_at.toISOString() : null,
        event_type: values.event_type,
        tagIds: values.tagIds ?? [],
        image_url: finalImageUrl,
      };

      let createdId: number | undefined;
      if (isEditMode && id) {
        const updated = await eventsApi.updateEvent(Number(id), input);
        message.success("Event updated successfully.");
        createdId = updated.id;
      } else {
        const created = await eventsApi.createEvent(input);
        message.success("Event created successfully.");
        createdId = created.id;

        // Ticket creation (Step 3): public events get one auto-generated
        // free "General Admission" ticket with the chosen number of seats;
        // private events get the manually configured ticket tiers.
        if (createdId) {
          try {
            if (values.event_type === "public") {
              await ticketApi.createTicket(createdId, {
                name: "General Admission",
                price: 0,
                quantity_available: ticketSeats,
                description: "Free seat for this public event.",
              });
            } else {
              for (const t of ticketDrafts) {
                await ticketApi.createTicket(createdId, t);
              }
            }
            message.success("Tickets were generated successfully.");
          } catch {
            message.warning("Event created, but tickets could not be generated. You can add tickets later from the event page.");
          }
        }
      }
      if (createdId) navigate(`/events/${createdId}`);
    } catch (err: unknown) {
      console.error("Save event error:", err);
      const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
      const errorMsg =
        axiosErr.response?.data?.error ||
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to save event.");
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" tip="Loading event..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <Result
        status="404"
        title="Event not found"
        extra={
          <Link to="/events">
            <Button type="primary">Back to Events</Button>
          </Link>
        }
      />
    );
  }

  if (forbidden) {
    return (
      <Result
        status="403"
        title="You don't have permission to edit this event"
        extra={
          <Link to="/events">
            <Button type="primary">Back to Events</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 820,
        margin: "0 auto",
        padding: "40px 24px 60px",
      }}
    >
      {/* Multi-step Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          padding: "0 8px",
        }}
      >
        {/* Step 1 */}
        <div
          onClick={() => setCurrentStep(0)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: currentStep > 0 ? "pointer" : "default",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(244, 63, 94, 0.35)",
            }}
          >
            {currentStep > 0 ? <CheckOutlined style={{ fontSize: 13 }} /> : "01"}
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: currentStep === 0 ? "#0f172a" : "#64748b",
            }}
          >
            Event Details
          </span>
        </div>

        {/* Connector Line */}
        <div
          style={{
            flex: 1,
            height: 2,
            background:
              currentStep >= 1
                ? "linear-gradient(90deg, #f43f5e 0%, #8b5cf6 100%)"
                : "#e2e8f0",
            margin: "0 16px",
            transition: "all 0.3s ease",
          }}
        />

        {/* Step 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                currentStep === 1
                  ? "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)"
                  : "#e0e7ff",
              color: currentStep === 1 ? "#ffffff" : "#6366f1",
              fontSize: 13,
              fontWeight: currentStep === 1 ? 700 : 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                currentStep === 1
                  ? "0 2px 8px rgba(244, 63, 94, 0.35)"
                  : "none",
              transition: "all 0.3s ease",
            }}
          >
            02
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: currentStep === 1 ? 700 : 500,
              color: currentStep === 1 ? "#0f172a" : "#94a3b8",
              transition: "all 0.3s ease",
            }}
          >
            Media Assets
          </span>
        </div>

        {/* Connector Line */}
        <div
          style={{
            flex: 1,
            height: 2,
            background:
              currentStep >= 2
                ? "linear-gradient(90deg, #f43f5e 0%, #8b5cf6 100%)"
                : "#e2e8f0",
            margin: "0 16px",
            transition: "all 0.3s ease",
          }}
        />

        {/* Step 3 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                currentStep === 2
                  ? "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)"
                  : "#e0e7ff",
              color: currentStep === 2 ? "#ffffff" : "#6366f1",
              fontSize: 13,
              fontWeight: currentStep === 2 ? 700 : 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                currentStep === 2
                  ? "0 2px 8px rgba(244, 63, 94, 0.35)"
                  : "none",
              transition: "all 0.3s ease",
            }}
          >
            {currentStep > 2 ? <CheckOutlined style={{ fontSize: 13 }} /> : "03"}
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: currentStep === 2 ? 700 : 500,
              color: currentStep === 2 ? "#0f172a" : "#94a3b8",
              transition: "all 0.3s ease",
            }}
          >
            Ticket Creation
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <Card
        style={{
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 6px 28px rgba(15, 23, 42, 0.05)",
          background: "#ffffff",
        }}
        styles={{ body: { padding: "36px 40px" } }}
      >
        {/* Form component remains mounted at all times to preserve field values */}
        <Form<FormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ event_type: "public", tagIds: [] }}
        >
          {/* STEP 1: EVENT DETAILS (Hidden with CSS when in Step 2) */}
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            <Title
              level={3}
              style={{
                margin: "0 0 28px",
                fontWeight: 800,
                fontSize: 24,
                color: "#0f172a",
                letterSpacing: -0.4,
              }}
            >
              {isEditMode ? "Edit Event Details" : "Event Details"}
            </Title>

            {/* Event Title */}
            <Form.Item
              name="title"
              label={<Text strong style={{ color: "#334155" }}>Event Title</Text>}
              rules={[
                { required: true, message: "Title is required" },
                { min: 3, message: "Title must be at least 3 characters" },
              ]}
            >
              <Input
                placeholder="e.g. Electronic Skyline Session"
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontSize: 14,
                  border: "1px solid #e2e8f0",
                }}
              />
            </Form.Item>

            {/* Row: Category & Tags */}
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="event_type"
                  label={<Text strong style={{ color: "#334155" }}>Category</Text>}
                  rules={[{ required: true, message: "Please select a category" }]}
                >
                  <Select
                    style={{ height: 46, width: "100%" }}
                    options={[
                      { value: "public", label: "Public Event" },
                      { value: "private", label: "Private Event" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="tagIds"
                  label={<Text strong style={{ color: "#334155" }}>Tags</Text>}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select tags (e.g. music, tech)"
                    maxTagCount="responsive"
                    style={{ minHeight: 46, width: "100%" }}
                    options={availableTags.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row: Start & End Date/Time */}
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="start_at"
                  label={<Text strong style={{ color: "#334155" }}>Start Date/Time</Text>}
                  rules={[
                    { required: true, message: "Start date/time is required" },
                    // Only enforce "from tomorrow" when creating a new event
                    // (not editing an existing one whose start date may be past)
                    ...(!isEditMode
                      ? [
                          {
                            validator(_: unknown, value: Dayjs | undefined) {
                              if (!value) return Promise.resolve();
                              const tomorrow = dayjs().startOf("day").add(1, "day");
                              if (value.isBefore(tomorrow)) {
                                return Promise.reject(
                                  new Error("Events can only be created to start from tomorrow or later.")
                                );
                              }
                              return Promise.resolve();
                            },
                          },
                        ]
                      : []),
                  ]}
                >
                  <DatePicker
                    showTime
                    format="MMM D, YYYY - h:mm A"
                    placeholder="Select start date & time"
                    style={{
                      width: "100%",
                      height: 46,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="end_at"
                  label={<Text strong style={{ color: "#334155" }}>End Date/Time (Optional)</Text>}
                  dependencies={["start_at"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value: Dayjs | null | undefined) {
                        const start = getFieldValue("start_at") as Dayjs | undefined;
                        if (!value || !start || value.isAfter(start) || value.isSame(start)) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("End date/time cannot be before the start date/time")
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    showTime
                    format="MMM D, YYYY - h:mm A"
                    placeholder="Select end date & time"
                    style={{
                      width: "100%",
                      height: 46,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Location Venue */}
            <Form.Item
              name="location"
              label={<Text strong style={{ color: "#334155" }}>Location Venue</Text>}
              rules={[{ required: true, message: "Location is required" }]}
            >
              <Input
                placeholder="e.g. Skyline Rooftop Lounge, NY"
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontSize: 14,
                  border: "1px solid #e2e8f0",
                }}
              />
            </Form.Item>

            {/* Description */}
            <Form.Item
              name="description"
              label={<Text strong style={{ color: "#334155" }}>Description</Text>}
              rules={[{ required: true, message: "Description is required" }]}
            >
              <Input.TextArea
                rows={5}
                placeholder="Provide a detailed description of what attendees can expect..."
                style={{
                  borderRadius: 12,
                  fontSize: 14,
                  border: "1px solid #e2e8f0",
                  padding: "12px 14px",
                }}
              />
            </Form.Item>

            {/* Step 1 Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 32,
                paddingTop: 20,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Button
                onClick={() => navigate("/events")}
                style={{
                  height: 44,
                  padding: "0 22px",
                  borderRadius: 10,
                  fontWeight: 600,
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                Cancel
              </Button>

              <Button
                type="primary"
                onClick={handleNextStep}
                style={{
                  height: 44,
                  padding: "0 32px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 14px rgba(244, 63, 94, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Next <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        </Form>

        {/* STEP 2: MEDIA ASSETS */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title
                level={3}
                style={{
                  margin: "0 0 6px",
                  fontWeight: 800,
                  fontSize: 24,
                  color: "#0f172a",
                  letterSpacing: -0.4,
                }}
              >
                Upload Event Banner
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Add an engaging banner image to make your event stand out on the discover page.
              </Text>
            </div>

            {!previewUrl ? (
              <Dragger
                {...uploadProps}
                style={{
                  background: "#f8fafc",
                  border: "2px dashed #cbd5e1",
                  borderRadius: 16,
                  padding: "44px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 12 }}>
                  <InboxOutlined style={{ color: "#8b5cf6", fontSize: 48 }} />
                </p>
                <Title level={5} style={{ margin: "0 0 6px", color: "#0f172a" }}>
                  Click or drag banner image here
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 18, fontSize: 13 }}>
                  Supported formats: <strong>JPG, PNG, WEBP</strong> (Max 5MB)
                  <br />
                  Recommended ratio: <strong>16:9</strong> (e.g. 1200 × 675)
                </Paragraph>
                <Button
                  shape="round"
                  style={{
                    borderColor: "#8b5cf6",
                    color: "#8b5cf6",
                    fontWeight: 600,
                    padding: "0 22px",
                  }}
                >
                  Choose File
                </Button>
              </Dragger>
            ) : (
              /* Banner Preview */
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  background: "#0f172a",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 280,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Event Banner Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.85) 100%)",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: 14,
                          display: "block",
                        }}
                      >
                        {selectedFile?.name || "Uploaded Banner"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                        {selectedFile
                          ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready`
                          : "Current event banner"}
                      </span>
                    </div>

                    <Space>
                      <Upload {...uploadProps}>
                        <Button
                          size="small"
                          ghost
                          style={{
                            borderColor: "#ffffff",
                            color: "#ffffff",
                            borderRadius: 8,
                            fontWeight: 500,
                          }}
                        >
                          Change
                        </Button>
                      </Upload>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleRemoveImage}
                        style={{ borderRadius: 8 }}
                      >
                        Remove
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 32,
                paddingTop: 20,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Button
                onClick={() => setCurrentStep(0)}
                icon={<ArrowLeftOutlined />}
                disabled={submitting}
                style={{
                  height: 44,
                  padding: "0 22px",
                  borderRadius: 10,
                  fontWeight: 600,
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                Back to Details
              </Button>

              <Button
                type="primary"
                loading={isEditMode ? submitting : false}
                onClick={() => (isEditMode ? handleSubmit() : setCurrentStep(2))}
                style={{
                  height: 44,
                  padding: "0 32px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 14px rgba(244, 63, 94, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isEditMode ? "Save Changes" : <>Next: Ticket Creation <ArrowRightOutlined /></>}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: TICKET CREATION (create mode only) */}
        {currentStep === 2 && !isEditMode && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title
                level={3}
                style={{
                  margin: "0 0 6px",
                  fontWeight: 800,
                  fontSize: 24,
                  color: "#0f172a",
                  letterSpacing: -0.4,
                }}
              >
                {stepOneValues?.event_type === "public" ? "Set Seats" : "Create Ticket Tiers"}
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {stepOneValues?.event_type === "public"
                  ? "For a public event there are no VIP / Early Bird / General tiers — just a single free ticket with a set number of seats."
                  : "Add paid ticket tiers for your private event (General, VIP, Early Bird, etc.)."}
              </Text>
            </div>

            {stepOneValues?.event_type === "public" ? (
              /* Public events: single free ticket with a seat count */
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "22px 24px",
                }}
              >
                <Text strong style={{ color: "#0f172a", fontSize: 15, display: "block", marginBottom: 6 }}>
                  Number of seats available
                </Text>
                <InputNumber
                  id="public-seats"
                  min={1}
                  max={100000}
                  value={ticketSeats}
                  onChange={(val) => setTicketSeats(val ?? 100)}
                  style={{
                    width: 180,
                    height: 46,
                    borderRadius: 10,
                    fontSize: 15,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                    FREE
                  </Tag>
                  <span>
                    A "<strong>General Admission</strong>" ticket with{" "}
                    <strong>{ticketSeats}</strong> seat{ticketSeats !== 1 ? "s" : ""} will be
                    generated automatically.
                  </span>
                </div>
              </div>
            ) : (
              /* Private events: configurable ticket tiers */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {ticketDrafts.length === 0 ? (
                  <div
                    style={{
                      padding: "16px 20px",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px dashed #cbd5e1",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    No ticket tiers added yet. Add a tier below (e.g. General Admission, VIP, Early Bird).
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ticketDrafts.map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {Number(t.price) === 0 ? "Free" : `NPR ${t.price}`} &middot; {t.quantity_available} seat{t.quantity_available !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setTicketDrafts((prev) => prev.filter((_, i) => i !== idx))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tier builder */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "18px 20px",
                  }}
                >
                  <Text strong style={{ color: "#0f172a", fontSize: 14, display: "block", marginBottom: 12 }}>
                    Add Ticket Tier
                  </Text>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Input
                      placeholder="Tier Name (e.g. General Admission)"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      style={{ height: 42, borderRadius: 10, border: "1px solid #e2e8f0" }}
                    />
                    <Row gutter={12}>
                      <Col xs={12}>
                        <Text style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>
                          PRICE (NPR)
                        </Text>
                        <InputNumber
                          min={0}
                          value={draft.price}
                          onChange={(val) => setDraft({ ...draft, price: val ?? 0 })}
                          style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #e2e8f0" }}
                        />
                      </Col>
                      <Col xs={12}>
                        <Text style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>
                          SEATS
                        </Text>
                        <InputNumber
                          min={1}
                          value={draft.quantity_available}
                          onChange={(val) => setDraft({ ...draft, quantity_available: val ?? 1 })}
                          style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #e2e8f0" }}
                        />
                      </Col>
                    </Row>
                    <Input
                      placeholder="Short perk description (optional)"
                      value={draft.description ?? ""}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      style={{ height: 42, borderRadius: 10, border: "1px solid #e2e8f0" }}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => {
                        if (!draft.name.trim()) {
                          message.error("Please enter a ticket tier name.");
                          return;
                        }
                        if ((draft.quantity_available ?? 0) < 1) {
                          message.error("Seats must be at least 1.");
                          return;
                        }
                        setTicketDrafts((prev) => [...prev, { ...draft }]);
                        setDraft({ name: "", price: 0, quantity_available: 1, description: "" });
                      }}
                      style={{
                        height: 40,
                        borderRadius: 10,
                        fontWeight: 600,
                        border: "1px solid #c7d2fe",
                        color: "#6366f1",
                        background: "#eef2ff",
                      }}
                    >
                      Add Tier
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 32,
                paddingTop: 20,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Button
                onClick={() => setCurrentStep(1)}
                icon={<ArrowLeftOutlined />}
                disabled={submitting}
                style={{
                  height: 44,
                  padding: "0 22px",
                  borderRadius: 10,
                  fontWeight: 600,
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                Back to Media
              </Button>

              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                style={{
                  height: 44,
                  padding: "0 32px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 14px rgba(244, 63, 94, 0.3)",
                }}
              >
                Create Event
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
