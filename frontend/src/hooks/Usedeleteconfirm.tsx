import { useCallback, useState } from "react";
import { Modal, message } from "antd";

interface UseDeleteConfirmOptions {
  title?: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  /** Shown via antd message on success. Omit to skip the toast. */
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Reusable "are you sure you want to delete this?" flow, backed by one
 * antd Modal.
 *
 * `T` is whatever piece of data your delete function needs to identify
 * the target — usually an id. Call `requestDelete(value)` from as many
 * buttons as you like (e.g. once per row in a list); the hook remembers
 * whichever value was passed most recently and hands it back to
 * `onDelete` when the user confirms in the modal.
 *
 * Single-item usage (no id needed — e.g. a page that IS the item):
 *   const { requestDelete, modal } = useDeleteConfirm(async () => {
 *     await eventsApi.deleteEvent(event.id);
 *     navigate("/events");
 *   });
 *   <Button onClick={() => requestDelete()}>Delete</Button>
 *   {modal}
 *
 * List usage (one hook call serves every row):
 *   const { requestDelete, modal } = useDeleteConfirm<number>(async (id) => {
 *     await eventsApi.deleteEvent(id);
 *     fetchEvents();
 *   });
 *   {events.map((event) => (
 *     <Button key={event.id} onClick={() => requestDelete(event.id)}>Delete</Button>
 *   ))}
 *   {modal}
 */
export function useDeleteConfirm<T = void>(
  onDelete: (target: T) => Promise<void>,
  options: UseDeleteConfirmOptions = {}
) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const {
    title = "Delete this item?",
    description = "This action cannot be undone.",
    okText = "Delete",
    cancelText = "Cancel",
    successMessage,
    errorMessage = "Something went wrong. Please try again.",
  } = options;

  // Remember which item was clicked, then open the modal.
  const requestDelete = useCallback((value?: T) => {
    setTarget(value as T);
    setOpen(true);
  }, []);

  const cancel = useCallback(() => {
    if (!loading) setOpen(false);
  }, [loading]);

  // Runs when the user clicks "Delete" inside the modal.
  const confirmDelete = useCallback(async () => {
    setLoading(true);
    try {
      await onDelete(target as T);
      if (successMessage) message.success(successMessage);
      setOpen(false);
    } catch {
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onDelete, target, successMessage, errorMessage]);

  const modal = (
    <Modal
      title={title}
      open={open}
      onOk={confirmDelete}
      onCancel={cancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger: true, loading }}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      maskClosable={!loading}
      destroyOnClose
    >
      <p>{description}</p>
    </Modal>
  );

  return { requestDelete, modal, loading };
}