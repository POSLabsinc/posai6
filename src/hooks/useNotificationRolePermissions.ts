import { useEffect, useState, useCallback } from "react";
import type { NotificationItem } from "./useNotifications";

// AI notification topics. Non-AI notifications are unaffected by this filter.
export type NotificationTopic =
  | "sales"        // Sales pace / revenue insights
  | "weather"      // Weather reports
  | "price"        // Commodity price alerts (onion, tomato, chicken, beef, milk, eggs)
  | "upsell"       // Upselling suggestions
  | "kitchen"      // Kitchen / KDS delays, prep insights
  | "operations";  // Generic operational tips, staff utilisation

export type RoleKey = "manager" | "cook" | "server" | "other";

// Default role -> allowed topics mapping per spec.
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, NotificationTopic[]> = {
  manager: ["sales", "weather", "price", "upsell", "kitchen", "operations"],
  cook: ["price", "kitchen"],
  server: ["upsell", "weather"],
  other: ["sales", "weather", "price", "upsell", "kitchen", "operations"],
};

const STORAGE_KEY = "pos_notification_role_permissions";

export function loadRolePermissions(): Record<RoleKey, NotificationTopic[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
    }
  } catch {}
  return DEFAULT_ROLE_PERMISSIONS;
}

export function saveRolePermissions(perms: Record<RoleKey, NotificationTopic[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
  window.dispatchEvent(new Event("pos:notif-perms-changed"));
}

// Normalise a free-form jobType string into a RoleKey
export function normaliseRole(jobType?: string | null): RoleKey {
  if (!jobType) return "other";
  const t = jobType.toLowerCase();
  if (t.includes("manager") || t.includes("admin") || t.includes("owner")) return "manager";
  if (t.includes("cook") || t.includes("chef") || t.includes("kitchen")) return "cook";
  if (t.includes("server") || t.includes("waiter") || t.includes("waitress") || t.includes("host")) return "server";
  return "other";
}

// Classify any notification into a topic. Returns null if the notification
// is not an AI notification we want to gate.
export function classifyNotification(n: NotificationItem): NotificationTopic | null {
  if (n.category !== "ai" && n.category !== "weather") return null;
  if (n.category === "weather") return "weather";

  const text = `${n.title || ""} ${n.headline || ""} ${n.preview || ""}`.toLowerCase();

  if (text.includes("upsell") || text.includes("combo") || text.includes("promote")) return "upsell";
  if (text.includes("kitchen") || text.includes("kds") || text.includes("prep") || text.includes("delay")) return "kitchen";
  if (
    text.includes("price") ||
    text.includes("onion") || text.includes("tomato") || text.includes("chicken") ||
    text.includes("beef") || text.includes("milk") || text.includes("egg") ||
    text.includes("stock") || text.includes("ingredient")
  ) return "price";
  if (text.includes("sales") || text.includes("revenue") || text.includes("ticket avg")) return "sales";
  if (text.includes("weather") || text.includes("rain") || text.includes("storm")) return "weather";
  return "operations";
}

interface PosSession {
  employeeId?: string;
  employeeName?: string;
  jobType?: string;
}

export function useNotificationRolePermissions() {
  const [role, setRole] = useState<RoleKey>("other");
  const [jobType, setJobType] = useState<string>("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [perms, setPerms] = useState<Record<RoleKey, NotificationTopic[]>>(() => loadRolePermissions());

  const refreshSession = useCallback(() => {
    try {
      const raw = localStorage.getItem("pos_session");
      if (!raw) {
        setRole("other");
        setJobType("");
        setEmployeeName("");
        return;
      }
      const s: PosSession = JSON.parse(raw);
      setJobType(s.jobType || "");
      setEmployeeName(s.employeeName || "");
      setRole(normaliseRole(s.jobType));
    } catch {
      setRole("other");
    }
  }, []);

  useEffect(() => {
    refreshSession();
    // Poll the session like Header does, so role changes (clock in/out, switch role) reflect instantly.
    const t = setInterval(refreshSession, 2000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pos_session") refreshSession();
      if (e.key === STORAGE_KEY) setPerms(loadRolePermissions());
    };
    const onPermsChanged = () => setPerms(loadRolePermissions());
    window.addEventListener("storage", onStorage);
    window.addEventListener("pos:notif-perms-changed", onPermsChanged);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pos:notif-perms-changed", onPermsChanged);
    };
  }, [refreshSession]);

  const allowedTopics = perms[role] || [];

  const isAllowed = useCallback(
    (n: NotificationItem) => {
      const topic = classifyNotification(n);
      if (topic === null) return true; // non-AI notifications always pass
      return allowedTopics.includes(topic);
    },
    [allowedTopics]
  );

  return {
    role,
    jobType,
    employeeName,
    permissions: perms,
    setPermissions: (next: Record<RoleKey, NotificationTopic[]>) => {
      saveRolePermissions(next);
      setPerms(next);
    },
    allowedTopics,
    isAllowed,
  };
}
