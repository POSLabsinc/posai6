import { supabase } from "@/integrations/supabase/client";
import {
  alertNewOrder,
  alertOrderCancelled,
  alertOrderStatusChange,
  alertPinUpdated,
  alertSystemError,
} from "@/lib/alertService";

/**
 * Centralized notification service.
 * Inserts persistent notifications into the database so they appear
 * in the "All Notifications" list and sync across devices via realtime.
 * Also triggers sound alerts and browser push notifications.
 */

interface CreateNotificationParams {
  title: string;
  preview: string;
  headline: string;
  body: string;
  category?: string;
  bullets?: { label: string; text: string }[];
  footer?: string | null;
  has_update?: boolean;
}

function timeLabel(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function dateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    title: params.title,
    preview: params.preview,
    headline: params.headline,
    body: params.body,
    category: params.category ?? "system",
    bullets: (params.bullets ?? []) as any,
    footer: params.footer ?? null,
    has_update: params.has_update ?? false,
    time: timeLabel(),
    version: "POS",
    version_date: dateLabel(),
    is_read: false,
  });

  if (error) {
    console.error("Failed to create notification:", error.message);
  }
}

// ── Pre-built notification helpers ──────────────────────────────

/** New order received */
export async function notifyNewOrder(orderNumber: number | string, customerName: string) {
  alertNewOrder(orderNumber, customerName);
  await createNotification({
    title: "New Order Received",
    preview: `Order #${orderNumber} from ${customerName}`,
    headline: "New Order Received",
    body: `A new order (#${orderNumber}) has been placed by ${customerName}. Please review and accept the order.`,
    category: "system",
  });
}

/** Order cancelled */
export async function notifyOrderCancelled(orderNumber: number | string, reason?: string) {
  alertOrderCancelled(orderNumber);
  await createNotification({
    title: "Order Cancelled",
    preview: `Order #${orderNumber} has been cancelled`,
    headline: "Order Cancelled",
    body: `Order #${orderNumber} has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
    category: "system",
  });
}

/** Order status change (accepted, ready, delivered, etc.) */
export async function notifyOrderStatusChange(
  orderNumber: number | string,
  status: string
) {
  alertOrderStatusChange(orderNumber, status);
  await createNotification({
    title: `Order ${status}`,
    preview: `Order #${orderNumber} – ${status}`,
    headline: `Order ${status}`,
    body: `Order #${orderNumber} status has been updated to "${status}".`,
    category: "system",
  });
}

/** PIN updated */
export async function notifyPinUpdated() {
  alertPinUpdated();
  await createNotification({
    title: "PIN Updated",
    preview: "Your manager PIN has been changed",
    headline: "Security: PIN Updated",
    body: "The manager PIN for this device has been successfully updated. All future authentications will use the new PIN.",
    category: "system",
  });
}

/** System error */
export async function notifySystemError(errorMessage: string, context?: string) {
  alertSystemError(errorMessage);
  await createNotification({
    title: "System Error",
    preview: errorMessage.slice(0, 80),
    headline: "System Error Detected",
    body: `${context ? `${context}: ` : ""}${errorMessage}`,
    category: "system",
  });
}

/** Generic custom notification */
export { createNotification as createCustomNotification };
