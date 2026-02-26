import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationItem {
  id: string;
  title: string;
  preview: string;
  version: string;
  version_date: string;
  time: string;
  headline: string;
  body: string;
  bullets: { label: string; text: string }[];
  footer: string | null;
  has_update: boolean;
  is_read: boolean;
  created_at: string;
  category: string;
}

export interface NotificationGroup {
  version: string;
  date: string;
  notifications: NotificationItem[];
  unreadCount: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      const mapped = (data || []).map((n: any) => ({
        ...n,
        bullets: Array.isArray(n.bullets) ? n.bullets : [],
      }));
      setNotifications(mapped);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const n = payload.new as any;
            setNotifications((prev) => [
              { ...n, bullets: Array.isArray(n.bullets) ? n.bullets : [] },
              ...prev,
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const n = payload.new as any;
            setNotifications((prev) =>
              prev.map((existing) =>
                existing.id === n.id
                  ? { ...n, bullets: Array.isArray(n.bullets) ? n.bullets : [] }
                  : existing
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            setNotifications((prev) => prev.filter((n) => n.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const groups: NotificationGroup[] = [];
  const groupMap = new Map<string, NotificationGroup>();

  notifications.forEach((n) => {
    if (!groupMap.has(n.version)) {
      const group: NotificationGroup = {
        version: n.version,
        date: n.version_date,
        notifications: [],
        unreadCount: 0,
      };
      groupMap.set(n.version, group);
      groups.push(group);
    }
    const group = groupMap.get(n.version)!;
    group.notifications.push(n);
    if (!n.is_read) group.unreadCount++;
  });

  const totalUnread = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .eq("id", id);

    if (!err) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const { error: err } = await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .eq("is_read", false);

    if (!err) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }, []);

  return {
    notifications,
    groups,
    totalUnread,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
