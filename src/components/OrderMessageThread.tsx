import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface SentMessage {
  id: string;
  message_text: string;
  employee_name: string;
  employee_role: string | null;
  terminal_name: string | null;
  created_at: string;
}

interface KitchenReply {
  id: string;
  body: string;
  created_at: string;
  is_read: boolean;
}

interface ThreadMessage {
  id: string;
  type: "sent" | "reply";
  text: string;
  sender: string;
  device?: string | null;
  timestamp: string;
  isRead?: boolean;
}

interface OrderMessageThreadProps {
  orderId: string;
  orderNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderMessageThread({ orderId, orderNumber, open, onOpenChange }: OrderMessageThreadProps) {
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [kitchenReplies, setKitchenReplies] = useState<KitchenReply[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch sent messages for this order
  useEffect(() => {
    if (!open || !orderId) return;

    const fetchSent = async () => {
      const { data } = await (supabase as any)
        .from("kds_messages")
        .select("id, message_text, employee_name, employee_role, terminal_name, created_at")
        .eq("linked_order_id", orderId)
        .order("created_at", { ascending: true });
      setSentMessages(data || []);
    };

    const fetchReplies = async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("id, body, created_at, is_read")
        .like("title", `%Order #${orderNumber}%`)
        .eq("category", "kitchen")
        .order("created_at", { ascending: true });
      setKitchenReplies(data || []);
    };

    fetchSent();
    fetchReplies();
  }, [open, orderId, orderNumber]);

  // Realtime subscriptions
  useEffect(() => {
    if (!open) return;

    const ch1 = supabase
      .channel(`thread-kds-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "kds_messages" }, () => {
        (supabase as any)
          .from("kds_messages")
          .select("id, message_text, employee_name, employee_role, terminal_name, created_at")
          .eq("linked_order_id", orderId)
          .order("created_at", { ascending: true })
          .then(({ data }: any) => setSentMessages(data || []));
      })
      .subscribe();

    const ch2 = supabase
      .channel(`thread-notif-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        (supabase as any)
          .from("notifications")
          .select("id, body, created_at, is_read")
          .like("title", `%Order #${orderNumber}%`)
          .eq("category", "kitchen")
          .order("created_at", { ascending: true })
          .then(({ data }: any) => setKitchenReplies(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [open, orderId, orderNumber]);

  // Mark replies as read when opening
  useEffect(() => {
    if (!open || kitchenReplies.length === 0) return;
    const unread = kitchenReplies.filter((r) => !r.is_read);
    if (unread.length === 0) return;

    Promise.all(
      unread.map((r) =>
        (supabase as any).from("notifications").update({ is_read: true }).eq("id", r.id)
      )
    );
  }, [open, kitchenReplies]);

  // Build unified thread
  const thread: ThreadMessage[] = useMemo(() => {
    const items: ThreadMessage[] = [];

    sentMessages.forEach((m) => {
      items.push({
        id: m.id,
        type: "sent",
        text: m.message_text,
        sender: m.employee_name,
        device: m.terminal_name,
        timestamp: m.created_at,
      });
    });

    kitchenReplies.forEach((r) => {
      items.push({
        id: r.id,
        type: "reply",
        text: r.body,
        sender: "Kitchen",
        timestamp: r.created_at,
        isRead: r.is_read,
      });
    });

    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return items;
  }, [sentMessages, kitchenReplies]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.length, open]);

  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), "h:mm a");
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-neutral-700 p-0 max-w-md w-[95vw] sm:w-[400px] rounded-2xl overflow-hidden" hideCloseButton>
        <DialogTitle className="sr-only">Message Thread - Order #{orderNumber}</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <span className="text-white font-semibold text-sm">Messages - Order #{orderNumber}</span>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[400px] min-h-[200px]">
          {thread.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">No messages yet</p>
          )}
          {thread.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.type === "sent" ? "bg-orange-600/80 text-white" : "bg-white/10 text-white"}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${msg.type === "sent" ? "text-white/60" : "text-white/40"}`}>
                  <span className="font-medium">{msg.sender}</span>
                  {msg.device && (
                    <>
                      <span>·</span>
                      <span>{msg.device}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if an order has messages and unread replies
export function useOrderMessageStatus(orderId: string | undefined, orderNumber: number | undefined) {
  const [hasMessages, setHasMessages] = useState(false);
  const [hasUnreadReply, setHasUnreadReply] = useState(false);

  useEffect(() => {
    if (!orderId || !orderNumber) {
      setHasMessages(false);
      setHasUnreadReply(false);
      return;
    }

    const checkMessages = async () => {
      const { data: msgs } = await (supabase as any)
        .from("kds_messages")
        .select("id")
        .eq("linked_order_id", orderId)
        .limit(1);
      setHasMessages((msgs || []).length > 0);
    };

    const checkUnread = async () => {
      const { data: notifs } = await (supabase as any)
        .from("notifications")
        .select("id")
        .like("title", `%Order #${orderNumber}%`)
        .eq("category", "kitchen")
        .eq("is_read", false)
        .limit(1);
      setHasUnreadReply((notifs || []).length > 0);
    };

    checkMessages();
    checkUnread();

    const ch1 = supabase
      .channel(`msg-status-kds-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "kds_messages" }, () => checkMessages())
      .subscribe();

    const ch2 = supabase
      .channel(`msg-status-notif-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => checkUnread())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [orderId, orderNumber]);

  return { hasMessages, hasUnreadReply };
}
