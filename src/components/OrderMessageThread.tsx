import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, Send, Clock, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";

const CHAT_SUGGESTIONS_KEY = 'chat-message-suggestions';

const DEFAULT_SUGGESTIONS = [
  'Rush this order',
  'Hold this order',
  'Fire this order',
  '86 this item',
  'Make it priority',
  'Customer waiting',
  'Allergic to nuts',
  'Allergic to dairy',
  'Allergic to gluten',
  'No onions',
  'Extra sauce',
  'Well done',
  'On the side',
  'Light on salt',
  'Double portion',
  'Customer complaint',
  'Remake needed',
  'Check temperature',
];


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
  version: string | null;
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
  onClose: () => void;
}

export default function OrderMessageThread({ orderId, orderNumber, onClose }: OrderMessageThreadProps) {
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [kitchenReplies, setKitchenReplies] = useState<KitchenReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;

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
        .select("id, body, created_at, is_read, version")
        .like("title", `%Order #${orderNumber}%`)
        .eq("category", "kitchen")
        .order("created_at", { ascending: true });
      setKitchenReplies(data || []);
    };

    fetchSent();
    fetchReplies();
  }, [orderId, orderNumber]);

  // Realtime subscriptions
  useEffect(() => {
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
          .select("id, body, created_at, is_read, version")
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
  }, [orderId, orderNumber]);

  // Mark replies as read
  useEffect(() => {
    if (kitchenReplies.length === 0) return;
    const unread = kitchenReplies.filter((r) => !r.is_read);
    if (unread.length === 0) return;
    Promise.all(
      unread.map((r) =>
        (supabase as any).from("notifications").update({ is_read: true }).eq("id", r.id)
      )
    );
  }, [kitchenReplies]);

  const thread: ThreadMessage[] = useMemo(() => {
    const items: ThreadMessage[] = [];
    sentMessages.forEach((m) => {
      items.push({ id: m.id, type: "sent", text: m.message_text, sender: m.employee_name, device: m.terminal_name, timestamp: m.created_at });
    });
    kitchenReplies.forEach((r) => {
      items.push({ id: r.id, type: "reply", text: r.body, sender: "Kitchen", device: r.version || "KDS", timestamp: r.created_at, isRead: r.is_read });
    });
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return items;
  }, [sentMessages, kitchenReplies]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.length]);

  const formatTime = (ts: string) => {
    try { return format(new Date(ts), "h:mm a"); } catch { return ""; }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const msgId = crypto.randomUUID();
      await (supabase as any).from("kds_messages").insert({
        message_id: msgId,
        message_text: replyText.trim(),
        store_id: "default",
        terminal_id: "dashboard",
        terminal_name: "Dashboard",
        employee_id: "dashboard-user",
        employee_name: "You",
        employee_role: "Manager",
        linked_order_id: orderId,
        linked_order_number: orderNumber,
        link_type: "single",
        status: "pending",
      });
      setReplyText("");
    } catch (e) {
      console.error("Failed to send reply:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute top-full right-0 mt-1 z-[100] border border-white/10 bg-[#1a1a1a] flex flex-col rounded-xl shadow-2xl shadow-black/60" style={{ width: "350px", maxHeight: "400px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-white font-semibold text-xs">Messages</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {thread.length === 0 && (
          <p className="text-white/40 text-xs text-center py-4">No messages yet</p>
        )}
        {thread.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 ${msg.type === "sent" ? "bg-orange-600/80 text-white" : "bg-white/10 text-white"}`}>
              <p className="text-xs leading-relaxed">{msg.text}</p>
              <div className={`flex items-center gap-1 mt-0.5 text-[9px] ${msg.type === "sent" ? "text-white/60" : "text-white/40"}`}>
                <span className="font-medium">{msg.sender}</span>
                {msg.device && (<><span>·</span><span>{msg.device}</span></>)}
                <span>·</span>
                <span>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      <div className="px-3 py-2 border-t border-white/10 flex gap-2 shrink-0">
        <Input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
          placeholder="Type a reply..."
          className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        <Button
          onClick={handleSendReply}
          disabled={!replyText.trim() || sending}
          size="sm"
          className="h-7 px-2 bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
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
