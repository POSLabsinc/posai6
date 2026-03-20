import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Check, ArrowLeft, Bell, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import KDSReplyDialog from "@/components/KDSReplyDialog";
import { supabase } from "@/integrations/supabase/client";

interface KDSMessage {
  message_id: string;
  message_text: string;
  store_id: string;
  terminal_id: string;
  terminal_name?: string;
  employee_id: string;
  employee_name: string;
  employee_role?: string;
  table_id: string | null;
  table_number?: string | null;
  linked_order_id?: string | null;
  linked_order_number?: number | null;
  timestamp: string;
  status: "pending" | "acknowledged";
  acknowledged_at?: string;
}

const STORAGE_KEY = "kds_message_queue";

const REPLY_STORAGE_KEY = "kds_message_replies";
const POS_REPLY_NOTIFICATION_KEY = "pos_reply_notifications";

interface KDSReply {
  reply_id: string;
  message_id: string;
  reply_text: string;
  timestamp: string;
  source: "kds";
}

const readReplies = (): KDSReply[] => {
  try { return JSON.parse(localStorage.getItem(REPLY_STORAGE_KEY) || "[]"); } catch { return []; }
};

const saveReplyToStorage = (reply: KDSReply) => {
  const replies = readReplies();
  replies.push(reply);
  localStorage.setItem(REPLY_STORAGE_KEY, JSON.stringify(replies));
};

const pushPosNotification = (reply: KDSReply, originalMessage: KDSMessage) => {
  try {
    const queue = JSON.parse(localStorage.getItem(POS_REPLY_NOTIFICATION_KEY) || "[]");
    queue.push({
      id: reply.reply_id,
      title: "Reply from Kitchen",
      body: reply.reply_text,
      meta: `Re: ${originalMessage.message_text.slice(0, 30)}${originalMessage.message_text.length > 30 ? "..." : ""}`,
      timestamp: reply.timestamp,
      message_id: originalMessage.message_id,
      order_id: originalMessage.linked_order_id || null,
      order_number: originalMessage.linked_order_number || null,
      table_number: originalMessage.table_number || null,
      is_read: false,
    });
    localStorage.setItem(POS_REPLY_NOTIFICATION_KEY, JSON.stringify(queue));
  } catch {}
};

const loadMessages = (): KDSMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m: any) => ({
      ...m,
      status: m.status || "pending",
    }));
  } catch {
    return [];
  }
};

const saveMessages = (messages: KDSMessage[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

const KDSMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<KDSMessage[]>([]);
  const [filter, setFilter] = useState<"pending" | "acknowledged">("pending");
  const [flashId, setFlashId] = useState<string | null>(null);
  const prevCountRef = useRef(0);
  const [kdsReplies, setKdsReplies] = useState<KDSReply[]>(() => readReplies());
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyDialogMessage, setReplyDialogMessage] = useState<KDSMessage | null>(null);

  const handleOpenReplyDialog = useCallback((msg: KDSMessage) => {
    setReplyDialogMessage(msg);
    setReplyDialogOpen(true);
  }, []);

  const handleSendReply = useCallback((messageId: string, replyText: string) => {
    const originalMsg = messages.find(m => m.message_id === messageId);
    if (!originalMsg) return;
    const reply: KDSReply = {
      reply_id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message_id: messageId,
      reply_text: replyText,
      timestamp: new Date().toISOString(),
      source: "kds",
    };
    try {
      saveReplyToStorage(reply);
      pushPosNotification(reply, originalMsg);
      setKdsReplies(readReplies());
      toast.success("Reply sent \u2713", { duration: 3000 });
    } catch {
      toast.error("Failed to send reply. Try again.");
    }
  }, [messages]);

  const replyDialogHasReplied = replyDialogMessage ? kdsReplies.some(r => r.message_id === replyDialogMessage.message_id) : false;

  const refreshMessages = useCallback(() => {
    const all = loadMessages();
    setMessages(all);
    
    // Check for new messages
    const pendingCount = all.filter(m => m.status === "pending").length;
    if (pendingCount > prevCountRef.current && prevCountRef.current > 0) {
      // New message arrived - flash it
      const newest = all
        .filter(m => m.status === "pending")
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (newest) {
        setFlashId(newest.message_id);
        setTimeout(() => setFlashId(null), 2000);
        // Play notification sound
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJjiR0teleEQveli41NpzQSk0ep3M2o1YMCtqm8nbm2Q3LGmWyNudZzorZ5TG2p9qPi1omsbZo2s+LWiaxdqja0AuaJrF2aNrQC5o");
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }
    }
    prevCountRef.current = pendingCount;
  }, []);

  // Poll localStorage for new messages (simulating realtime)
  useEffect(() => {
    refreshMessages();
    const interval = setInterval(refreshMessages, 2000);
    return () => clearInterval(interval);
  }, [refreshMessages]);

  const handleAcknowledge = (messageId: string) => {
    const updated = messages.map(m =>
      m.message_id === messageId
        ? { ...m, status: "acknowledged" as const, acknowledged_at: new Date().toISOString() }
        : m
    );
    saveMessages(updated);
    setMessages(updated);
  };

  const filtered = messages
    .filter(m => m.status === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Deduplicate by message_id
  const seen = new Set<string>();
  const deduplicated = filtered.filter(m => {
    if (seen.has(m.message_id)) return false;
    seen.add(m.message_id);
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-900 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Megaphone className="w-6 h-6 text-violet-400" />
        <h1 className="text-lg font-bold">Kitchen Messages</h1>
        <div className="ml-auto flex items-center gap-2">
          {messages.filter(m => m.status === "pending").length > 0 && (
            <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Bell className="w-3 h-3" />
              {messages.filter(m => m.status === "pending").length}
            </span>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex gap-1 px-4 py-3 shrink-0">
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            filter === "pending"
              ? "bg-violet-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          Active ({messages.filter(m => m.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("acknowledged")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            filter === "acknowledged"
              ? "bg-violet-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          Acknowledged ({messages.filter(m => m.status === "acknowledged").length})
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-hide">
        {deduplicated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
            <Megaphone className="w-16 h-16 opacity-30" />
            <p className="text-lg font-medium">No kitchen messages</p>
            <p className="text-sm text-neutral-600">
              {filter === "pending"
                ? "Messages sent from POS will appear here"
                : "No acknowledged messages yet"}
            </p>
          </div>
        ) : (
          deduplicated.map((msg) => (
            <div
              key={msg.message_id}
              className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                flashId === msg.message_id
                  ? "border-violet-400 ring-2 ring-violet-400/50 animate-pulse"
                  : "border-neutral-700"
              }`}
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                    {msg.terminal_name ? `Message from ${msg.terminal_name}` : "Kitchen Message"}
                  </span>
                </div>
                <span className="text-xs text-white/70 font-mono">
                  {format(new Date(msg.timestamp), "hh:mm a")}
                </span>
              </div>

              {/* Card Meta */}
              <div className="bg-neutral-800 px-4 py-2 flex items-center gap-4 text-xs text-neutral-400 border-b border-neutral-700">
                <span>From: <span className="text-white font-medium">{msg.employee_name}{msg.employee_role ? ` | ${msg.employee_role}` : ""}</span></span>
                {msg.linked_order_number && (
                  <span>·  Order <span className="text-white font-medium">#{msg.linked_order_number}</span></span>
                )}
                {(msg.table_id || msg.table_number) && (
                  <span>·  <span className="text-white font-medium">{msg.table_number || `Table ${msg.table_id}`}</span></span>
                )}
              </div>

              {/* Card Body */}
              <div className="bg-neutral-900 px-4 py-4">
                <p className="text-base leading-relaxed whitespace-pre-wrap break-words max-h-[6rem] overflow-y-auto scrollbar-hide">
                  {msg.message_text}
                </p>
              </div>

              {/* Card Footer */}
              {(() => {
                const hasReplied = kdsReplies.some(r => r.message_id === msg.message_id);
                return msg.status === "pending" ? (
                  <div className="bg-neutral-900 px-4 pb-4 pt-1 space-y-2">
                    <Button
                      onClick={() => handleAcknowledge(msg.message_id)}
                      className="w-full bg-white text-black hover:bg-neutral-200 font-bold text-sm py-5 rounded-xl"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      ACKNOWLEDGE
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenReplyDialog(msg)}
                      className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent font-bold text-sm py-4 rounded-xl"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      {hasReplied ? "REPLY AGAIN" : "REPLY"}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-neutral-900 px-4 pb-3 pt-1 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledged {msg.acknowledged_at ? format(new Date(msg.acknowledged_at), "hh:mm a") : ""}</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenReplyDialog(msg)}
                      className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent font-bold text-xs py-3 rounded-xl"
                    >
                      <Reply className="w-3.5 h-3.5 mr-1.5" />
                      {hasReplied ? "REPLY AGAIN" : "REPLY"}
                    </Button>
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <KDSReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        message={replyDialogMessage}
        onSendReply={handleSendReply}
        hasReplied={replyDialogHasReplied}
      />
    </div>
  );
};

export default KDSMessages;
