import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, ChefHat, Settings, Eye, SlidersHorizontal, Volume2, VolumeX, Maximize, Minimize, Menu, X, ChevronRight, Megaphone, Check, Bell, Reply, CornerDownLeft } from "lucide-react";
import messageKdsIcon from "@/assets/icons/message-kds.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { staffList } from "@/data/staff";

// ─── Table Number Normalization ───
// Extracts just the numeric/alphanumeric table identifier from various formats
// "Table 2" → "2", "T2" → "2", "T. T2" → "2", "2" → "2"
const normalizeTableNumber = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw
    .replace(/^Table\s*/i, "")  // strip leading "Table " first
    .replace(/^T\.?\s*/i, "")   // then strip "T." or "T"
    .trim()
    .toUpperCase();
};

// ─── Session cleanup key ───
// Used with sessionStorage to clear old messages once per browser session.

// ─── KDS Ticket Types ───
interface KDSModifier {
  name: string;
  type: "add" | "remove" | "allergy" | "note";
}

interface KDSProduct {
  qty: number;
  name: string;
  category: string;
  modifiers: KDSModifier[];
  status: "pending" | "cooking" | "ready" | "bumped";
}

interface KDSTicket {
  id: string;
  orderNumber: number;
  orderType: "DINE IN" | "TAKEOUT" | "DELIVERY" | "BAR";
  tableNumber: string | null;
  serverName: string;
  createdAt: Date;
  products: KDSProduct[];
  status: "active" | "seen" | "bumped";
  priority: "normal" | "rush" | "vip";
}

// ─── Generate Mock Tickets (fallback when queue is empty) ───
// These must match the mock orders in MessageKitchenDialog so linked messages map correctly.
const generateMockTickets = (): KDSTicket[] => {
  const now = new Date();
  return [
    {
      id: "kds-1",
      orderNumber: 23,
      orderType: "DINE IN",
      tableNumber: "T2",
      serverName: "Mia Jones",
      createdAt: new Date(now.getTime() - 38 * 60000),
      products: [
        { qty: 1, name: "Fried Calamari", category: "APPETIZER", modifiers: [], status: "pending" },
        { qty: 1, name: "Filet Mignon", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [], status: "cooking" },
        { qty: 1, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [], status: "pending" },
        { qty: 1, name: "Tres Leches", category: "DESSERT", modifiers: [], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
    {
      id: "kds-2",
      orderNumber: 24,
      orderType: "DINE IN",
      tableNumber: "T4",
      serverName: "Dustin H",
      createdAt: new Date(now.getTime() - 23 * 60000),
      products: [
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [], status: "cooking" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [], status: "ready" },
      ],
      status: "active",
      priority: "rush",
    },
    {
      id: "kds-3",
      orderNumber: 25,
      orderType: "DINE IN",
      tableNumber: "T5",
      serverName: "Mia Jones",
      createdAt: new Date(now.getTime() - 23 * 60000),
      products: [
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [], status: "cooking" },
      ],
      status: "active",
      priority: "vip",
    },
    {
      id: "kds-4",
      orderNumber: 26,
      orderType: "DINE IN",
      tableNumber: "T6",
      serverName: "Sarah K",
      createdAt: new Date(now.getTime() - 38 * 60000),
      products: [
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [], status: "ready" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [], status: "cooking" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
    {
      id: "kds-5",
      orderNumber: 27,
      orderType: "DINE IN",
      tableNumber: "T8",
      serverName: "Dustin H",
      createdAt: new Date(now.getTime() - 23 * 60000),
      products: [
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [], status: "pending" },
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
    {
      id: "kds-6",
      orderNumber: 28,
      orderType: "DINE IN",
      tableNumber: "T3",
      serverName: "Mia Jones",
      createdAt: new Date(now.getTime() - 23 * 60000),
      products: [
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [], status: "pending" },
        { qty: 1, name: "Filet Mignon", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }], status: "pending" },
        { qty: 4, name: "Meatballs", category: "ENTREE", modifiers: [], status: "cooking" },
        { qty: 2, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [], status: "pending" },
        { qty: 3, name: "Tres Leches", category: "DESSERT", modifiers: [], status: "pending" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [], status: "ready" },
        { qty: 2, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [], status: "cooking" },
        { qty: 1, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
  ];
};

// ─── Time helpers ───
const getElapsedMinutes = (createdAt: Date) => Math.floor((Date.now() - createdAt.getTime()) / 60000);

const getHeaderColor = (minutes: number) => {
  if (minutes >= 35) return "bg-gradient-to-r from-red-700 to-red-600"; // overdue
  if (minutes >= 20) return "bg-gradient-to-r from-orange-700 to-orange-600"; // warning
  return "bg-gradient-to-r from-neutral-700 to-neutral-600"; // normal
};

const getTimerBadgeColor = (minutes: number) => {
  if (minutes >= 35) return "bg-red-500 text-white";
  if (minutes >= 20) return "bg-orange-500 text-white";
  return "bg-neutral-500 text-white";
};

// ─── Item Summary ───
const ItemSummary = ({ tickets }: { tickets: KDSTicket[] }) => {
  const summary = useMemo(() => {
    const map = new Map<string, { category: string; count: number }>();
    tickets.forEach(t =>
      t.products.forEach(p => {
        const key = p.name;
        const existing = map.get(key);
        if (existing) existing.count += p.qty;
        else map.set(key, { category: p.category, count: p.qty });
      })
    );
    const grouped = new Map<string, { name: string; count: number }[]>();
    map.forEach((val, name) => {
      const arr = grouped.get(val.category) || [];
      arr.push({ name, count: val.count });
      grouped.set(val.category, arr);
    });
    return grouped;
  }, [tickets]);

  const categoryOrder = ["APPETIZER", "SALADS", "ENTREE", "DESSERT"];

  return (
    <div className="w-64 bg-neutral-900 border-l border-neutral-700 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Product Summary</h2>
        <span className="text-xs text-neutral-400">{format(new Date(), "dd MMM yyyy")}</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {categoryOrder.map(cat => {
          const items = summary.get(cat);
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="bg-neutral-700 px-3 py-1 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                {cat === "APPETIZER" ? "APPETIZERS" : cat === "ENTREE" ? "ENTREES" : cat + "S"}
              </div>
              {items.map(item => (
                <div key={item.name} className="flex justify-between px-3 py-1.5 text-sm border-b border-neutral-800">
                  <span className="text-white truncate pr-2">{item.name}</span>
                  <span className="text-neutral-400 font-mono shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── KDS Messages Panel ───
interface KDSMessageData {
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
  linked_order_ids?: string[] | null;
  link_type?: string;
  timestamp: string;
  status: "pending" | "acknowledged";
  acknowledged_at?: string;
}

// ─── Reply types ───
interface KDSReply {
  reply_id: string;
  message_id: string;
  reply_text: string;
  timestamp: string;
  source: "kds";
}

const REPLY_STORAGE_KEY = "kds_message_replies";
const POS_REPLY_NOTIFICATION_KEY = "pos_reply_notifications";

const REPLY_PRESETS = ["Got it", "On its way", "5 mins", "Need more time", "Out of stock"];

const readReplies = (): KDSReply[] => {
  try { return JSON.parse(localStorage.getItem(REPLY_STORAGE_KEY) || "[]"); } catch { return []; }
};

const saveReply = (reply: KDSReply) => {
  const replies = readReplies();
  replies.push(reply);
  localStorage.setItem(REPLY_STORAGE_KEY, JSON.stringify(replies));
};

const pushPosNotification = (reply: KDSReply, originalMessage: KDSMessageData) => {
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

// ─── Inline Reply Panel ───
const KDSReplyPanel = ({ message, onSend, onCancel }: { message: KDSMessageData; onSend: (text: string) => void; onCancel: () => void }) => {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [showQR, setShowQR] = useState(false);
  const qrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showQR) {
      qrTimerRef.current = setTimeout(() => setShowQR(false), 60000);
      return () => { if (qrTimerRef.current) clearTimeout(qrTimerRef.current); };
    }
  }, [showQR]);

  const handleChipClick = (chip: string) => {
    if (selectedChip === chip) {
      setSelectedChip(null);
      setText("");
    } else {
      setSelectedChip(chip);
      setText(chip);
    }
  };

  const handleTextChange = (val: string) => {
    if (val.length <= 150) {
      setText(val);
      if (selectedChip) setSelectedChip(null);
    }
  };

  const canSend = text.trim().length > 0;

  const qrUrl = `https://${window.location.host}/kds-reply?messageId=${message.message_id}&orderId=${message.linked_order_id || ""}&table=${message.table_number || message.table_id || ""}&session=${sessionStorage.getItem("kds_session_cleared") || ""}`;

  return (
    <div className="bg-neutral-800 border-t border-neutral-700 px-3 py-2 space-y-2">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {REPLY_PRESETS.map(chip => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
              selectedChip === chip
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-neutral-700 border-neutral-600 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
      {/* Text input */}
      <Input
        value={text}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="Type a reply..."
        maxLength={150}
        className="h-8 text-xs bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
      />
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 text-[10px] h-7 border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent">
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSend}
          onClick={() => onSend(text.trim())}
          className="flex-1 text-[10px] h-7 bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-40"
        >
          Send Reply
        </Button>
      </div>
      {/* QR option */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-neutral-700" />
          <span className="text-[9px] text-neutral-500">or reply via mobile</span>
          <div className="flex-1 h-px bg-neutral-700" />
        </div>
        <button onClick={() => setShowQR(true)} className="w-full text-center text-[10px] text-violet-400 hover:text-violet-300 font-medium mt-1 transition-colors">
          Show QR Code
        </button>
      </div>
      {/* QR overlay */}
      {showQR && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 flex flex-col items-center gap-3">
          <QRCodeSVG value={qrUrl} size={120} bgColor="transparent" fgColor="white" />
          <span className="text-[10px] text-neutral-400 text-center">Scan to reply from your phone</span>
          <button onClick={() => setShowQR(false)} className="text-[10px] text-neutral-500 hover:text-white transition-colors">Close</button>
        </div>
      )}
    </div>
  );
};

// ─── Threaded Replies Display ───
const RepliesThread = ({ replies }: { replies: KDSReply[] }) => {
  if (replies.length === 0) return null;
  return (
    <div className="bg-neutral-900 px-3 pb-2 space-y-1">
      {replies.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(r => (
        <div key={r.reply_id} className="pl-3 border-l-2 border-neutral-700 py-1">
          <p className="text-[10px] text-neutral-400">
            <CornerDownLeft className="w-2.5 h-2.5 inline mr-1 opacity-60" />
            You replied: <span className="text-neutral-300">{r.reply_text}</span>
          </p>
          <span className="text-[9px] text-neutral-600">{format(new Date(r.timestamp), "hh:mm a")}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Shared message reader ───
// Single source of truth for reading, normalizing, filtering, and deduping messages.
const readSessionMessages = (): KDSMessageData[] => {
  try {
    const raw = localStorage.getItem("kds_message_queue");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    const seen = new Set<string>();
    return parsed
      .map((m: any) => ({ ...m, status: m.status || "pending" } as KDSMessageData))
      .filter((m) => {
        if (seen.has(m.message_id)) return false;
        seen.add(m.message_id);
        return true;
      });
  } catch {
    return [];
  }
};

const KDSMessagesPanel = ({ onClose, messages, onAcknowledge, onSendReply, allReplies }: { onClose: () => void; messages: KDSMessageData[]; onAcknowledge: (id: string) => void; onSendReply: (messageId: string, text: string) => void; allReplies: KDSReply[] }) => {
  const [filter, setFilter] = useState<"pending" | "acknowledged">("pending");
  const [flashId, setFlashId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const prevCountRef = useRef(0);

  // Flash animation on new pending messages
  useEffect(() => {
    const pendingCount = messages.filter(m => m.status === "pending").length;
    if (pendingCount > prevCountRef.current && prevCountRef.current > 0) {
      const newest = messages.filter(m => m.status === "pending").sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (newest) { setFlashId(newest.message_id); setTimeout(() => setFlashId(null), 2000); }
    }
    prevCountRef.current = pendingCount;
  }, [messages]);

  const filtered = messages.filter(m => m.status === filter).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const seen = new Set<string>();
  const deduplicated = filtered.filter(m => { if (seen.has(m.message_id)) return false; seen.add(m.message_id); return true; });

  const handleSendReply = (messageId: string, text: string) => {
    onSendReply(messageId, text);
    setReplyingTo(null);
  };

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-800 shrink-0">
        <Megaphone className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-bold flex-1">Kitchen Messages</h2>
        {messages.filter(m => m.status === "pending").length > 0 && (
          <span className="flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Bell className="w-3 h-3" />
            {messages.filter(m => m.status === "pending").length}
          </span>
        )}
        <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded-lg transition-colors">
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-3 py-2 shrink-0">
        <button onClick={() => setFilter("pending")} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "pending" ? "bg-violet-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>
          Active ({messages.filter(m => m.status === "pending").length})
        </button>
        <button onClick={() => setFilter("acknowledged")} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "acknowledged" ? "bg-violet-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>
          Done ({messages.filter(m => m.status === "acknowledged").length})
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-hide">
        {deduplicated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2">
            <Megaphone className="w-10 h-10 opacity-30" />
            <p className="text-xs font-medium">{filter === "pending" ? "No active messages" : "No acknowledged messages"}</p>
          </div>
        ) : deduplicated.map(msg => {
          let displayOrderNumbers: number[] = [];
          if (msg.linked_order_number) {
            displayOrderNumbers = [msg.linked_order_number];
          } else if (msg.linked_order_ids && msg.linked_order_ids.length > 0) {
            try {
              const ticketQueue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
              displayOrderNumbers = msg.linked_order_ids
                .map((id: string) => {
                  const ticket = ticketQueue.find((t: any) => t.sessionId === id || t.id === id);
                  return ticket?.orderNumber;
                })
                .filter((n: number | undefined): n is number => typeof n === "number");
            } catch {}
          }

          const msgReplies = allReplies.filter(r => r.message_id === msg.message_id);
          const hasReplied = msgReplies.length > 0;

          return (
          <div key={msg.message_id} className={`rounded-xl overflow-hidden border transition-all duration-300 ${flashId === msg.message_id ? "border-violet-400 ring-2 ring-violet-400/50 animate-pulse" : "border-neutral-700"}`}>
            <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Megaphone className="w-3 h-3 text-white/80" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">{msg.terminal_name ? `Message from ${msg.terminal_name}` : "Kitchen Message"}</span>
              </div>
              <span className="text-[10px] text-white/70 font-mono">{format(new Date(msg.timestamp), "hh:mm a")}</span>
            </div>
            <div className="bg-neutral-800 px-3 py-1.5 flex items-center gap-3 text-[10px] text-neutral-400 border-b border-neutral-700">
              <span>From: <span className="text-white font-medium">{msg.employee_name}{msg.employee_role ? ` | ${msg.employee_role}` : ""}</span></span>
              {displayOrderNumbers.length > 0 && <span>·  Order <span className="text-white font-medium">{displayOrderNumbers.map(n => `#${n}`).join(", ")}</span></span>}
              {(msg.table_id || msg.table_number) && <span>·  <span className="text-white font-medium">{msg.table_number || `Table ${msg.table_id}`}</span></span>}
            </div>
            <div className="bg-neutral-900 px-3 py-3">
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message_text}</p>
            </div>
            {msg.status === "pending" ? (
              <div className="bg-neutral-900 px-3 pb-3 pt-1 flex gap-2">
                <Button onClick={() => onAcknowledge(msg.message_id)} className="flex-1 bg-white text-black hover:bg-neutral-200 font-bold text-xs py-3 rounded-lg">
                  <Check className="w-3 h-3 mr-1.5" /> ACKNOWLEDGE
                </Button>
                <Button variant="outline" onClick={() => setReplyingTo(replyingTo === msg.message_id ? null : msg.message_id)} className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent font-bold text-xs py-3 rounded-lg">
                  <Reply className="w-3 h-3 mr-1.5" /> {hasReplied ? "REPLY AGAIN" : "REPLY"}
                </Button>
              </div>
            ) : (
              <div className="bg-neutral-900 px-3 pb-2 pt-1 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>Acknowledged {msg.acknowledged_at ? format(new Date(msg.acknowledged_at), "hh:mm a") : ""}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setReplyingTo(replyingTo === msg.message_id ? null : msg.message_id)} className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent font-bold text-[10px] py-2 rounded-lg">
                  <Reply className="w-3 h-3 mr-1" /> {hasReplied ? "REPLY AGAIN" : "REPLY"}
                </Button>
              </div>
            )}
            {/* Threaded replies */}
            <RepliesThread replies={msgReplies} />
            {/* Reply panel */}
            {replyingTo === msg.message_id && (
              <KDSReplyPanel message={msg} onSend={(text) => handleSendReply(msg.message_id, text)} onCancel={() => setReplyingTo(null)} />
            )}
          </div>
          );
        })}

      </div>
    </div>
  );
};

// ─── KDS Sidebar ───
const KDSSidebar = ({ collapsed, onToggle, showMessages, onMessagesToggle, messageCount }: { collapsed: boolean; onToggle: () => void; showMessages: boolean; onMessagesToggle: () => void; messageCount: number }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Menu, label: "Menu", action: onToggle },
    { icon: Home, label: "Home", path: "/" },
    { icon: Clock, label: "History", path: "/kds/history" },
    { icon: ChefHat, label: "Queue", path: "/kds" },
    { icon: ({ className }: { className?: string }) => <img src={messageKdsIcon} alt="Messages" className={`${className} invert`} />, label: "Messages", action: onMessagesToggle },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Eye, label: "View", path: "/kds/view" },
  ];

  return (
    <div className="w-14 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-2 gap-1 shrink-0 h-full">
      {navItems.map((item, i) => {
        const isActive = item.path ? location.pathname === item.path : (item.label === "Messages" && showMessages);
        return (
          <button
            key={i}
            onClick={() => item.action ? item.action() : item.path && navigate(item.path)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isActive ? "bg-white/15 text-white" : "text-neutral-500 hover:text-white hover:bg-white/10"
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {item.label === "Messages" && messageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-violet-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {messageCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── Product Status Icon ───
const ProductStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "ready":
      return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px]">✓</span>;
    case "cooking":
      return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px]">⏳</span>;
    default:
      return null;
  }
};

// ─── Ticket Card ───
const TicketCard = ({ ticket, onBump, onSeen, attachedMessages = [], onAcknowledgeMessage, onSendReply, allReplies = [] }: { ticket: KDSTicket; onBump: (id: string) => void; onSeen: (id: string) => void; attachedMessages?: KDSMessageData[]; onAcknowledgeMessage?: (messageId: string) => void; onSendReply?: (messageId: string, text: string) => void; allReplies?: KDSReply[] }) => {
  const isMessage = (ticket as any).type === "MESSAGE";
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.floor((Date.now() - ticket.createdAt.getTime()) / 1000));
  const [inlineReplyingTo, setInlineReplyingTo] = useState<string | null>(null);
  const elapsed = Math.floor(elapsedSeconds / 60);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - ticket.createdAt.getTime()) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  // Group products by category
  const grouped = useMemo(() => {
    const map = new Map<string, KDSProduct[]>();
    ticket.products.forEach(p => {
      const arr = map.get(p.category) || [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return map;
  }, [ticket.products]);

  const categoryOrder = ["MESSAGE", "APPETIZER", "ENTREE", "DESSERT"];
  const timeStr = format(ticket.createdAt, "hh:mm:ss a");

  const hasPendingMessage = !isMessage && attachedMessages.some(m => m.status === "pending");
  const hasAnyMessage = !isMessage && attachedMessages.length > 0;

  return (
    <div className={`bg-neutral-900 rounded-xl border overflow-hidden flex flex-col min-w-[240px] max-w-[280px] w-full ${isMessage ? "border-violet-600/60" : hasPendingMessage ? "border-violet-600/60" : "border-neutral-700"}`}>
      {/* Header */}
      <div className={`${isMessage ? "bg-gradient-to-r from-violet-700 to-indigo-600" : getHeaderColor(elapsed)} px-3 py-2 text-center`}>
        <div className="text-white font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2">
          {isMessage && <img src={messageKdsIcon} alt="Message" className="w-4 h-4 invert" />}
          {isMessage ? "MESSAGE" : ticket.orderType}
          {hasAnyMessage && (
            <img src={messageKdsIcon} alt="Has messages" className={`w-4 h-4 invert ${hasPendingMessage ? "opacity-80 animate-pulse" : "opacity-70"}`} />
          )}
        </div>
      </div>

      {/* Time & Order Number / Sender */}
      {isMessage ? (
        <div className="bg-neutral-800 px-3 py-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-mono">{timeStr}</span>
            <span className="text-[10px] text-violet-400 font-semibold">{ticket.tableNumber || "General"}</span>
          </div>
          <span className="text-lg font-black text-violet-300 leading-none">MSG</span>
        </div>
      ) : (
        <div className="bg-neutral-800 px-3 py-3">
          {/* Top row: Time (left) | Table (right) */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-neutral-400 font-mono">{timeStr}</span>
            {ticket.tableNumber && (
              <span className="text-[10px] text-neutral-400 font-semibold">Table {normalizeTableNumber(ticket.tableNumber)}</span>
            )}
          </div>
          {/* Centered order number */}
          <div className="flex items-center justify-center py-2">
            <span className="text-5xl font-black text-white leading-none">{ticket.orderNumber}</span>
          </div>
          {/* Bottom row: Elapsed timer (left) | Server name (right) */}
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTimerBadgeColor(elapsed)}`}>
              {String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:{String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
            {ticket.serverName && (
              <span className="text-[10px] text-neutral-400 font-semibold uppercase truncate max-w-[120px]">{ticket.serverName}</span>
            )}
          </div>
        </div>
      )}

      {/* Attached Kitchen Messages — shown at top */}
      {!isMessage && attachedMessages.length > 0 && (
        <div className="border-b border-violet-600/40">
          {attachedMessages.map(msg => {
            const isAcked = msg.status === "acknowledged";
            return (
              <div key={msg.message_id} className="border-b border-neutral-700 last:border-b-0">
                <div className={`${isAcked ? "bg-gradient-to-r from-violet-900/50 to-indigo-900/40" : "bg-gradient-to-r from-violet-700 to-indigo-700"} px-3 py-1.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-1.5">
                    <Megaphone className={`w-3 h-3 ${isAcked ? "text-white/40" : "text-white/80"}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isAcked ? "text-white/50" : "text-white/90"}`}>{msg.terminal_name ? `Message from ${msg.terminal_name}` : "Kitchen Message"}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isAcked ? "text-white/40" : "text-white/70"}`}>{format(new Date(msg.timestamp), "hh:mm a")}</span>
                </div>
                <div className={`${isAcked ? "bg-neutral-800/60" : "bg-neutral-800"} px-3 py-2`}>
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${isAcked ? "text-neutral-400" : "text-white"}`}>{msg.message_text}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">From: <span className={isAcked ? "text-neutral-500" : "text-neutral-300"}>{msg.employee_name}{msg.employee_role ? ` | ${msg.employee_role}` : ""}</span></p>
                </div>
                {(() => {
                  const msgReplies = allReplies.filter(r => r.message_id === msg.message_id);
                  const hasReplied = msgReplies.length > 0;
                  const handleInlineReply = (text: string) => {
                    if (onSendReply) onSendReply(msg.message_id, text);
                    setInlineReplyingTo(null);
                  };
                  return (
                    <>
                      {msg.status === "pending" && onAcknowledgeMessage ? (
                        <div className="bg-neutral-900 px-3 py-2 flex gap-1.5">
                          <Button onClick={() => onAcknowledgeMessage(msg.message_id)} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] py-2 rounded-lg">
                            <Check className="w-3 h-3 mr-1" /> ACKNOWLEDGE
                          </Button>
                          <Button variant="outline" onClick={() => setInlineReplyingTo(inlineReplyingTo === msg.message_id ? null : msg.message_id)} className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent font-bold text-[10px] py-2 rounded-lg">
                            <Reply className="w-3 h-3 mr-1" /> {hasReplied ? "REPLY AGAIN" : "REPLY"}
                          </Button>
                        </div>
                      ) : isAcked ? (
                        <div className="bg-neutral-900/60 px-3 py-1.5 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-medium">Acknowledged{msg.acknowledged_at ? ` ${format(new Date(msg.acknowledged_at), "hh:mm a")}` : ""}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setInlineReplyingTo(inlineReplyingTo === msg.message_id ? null : msg.message_id)} className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent font-bold text-[10px] py-1.5 rounded-lg">
                            <Reply className="w-3 h-3 mr-1" /> {hasReplied ? "REPLY AGAIN" : "REPLY"}
                          </Button>
                        </div>
                      ) : null}
                      <RepliesThread replies={msgReplies} />
                      {inlineReplyingTo === msg.message_id && (
                        <KDSReplyPanel message={msg} onSend={handleInlineReply} onCancel={() => setInlineReplyingTo(null)} />
                      )}
                    </>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Products / Message Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-1 space-y-0.5">
        {isMessage ? (
          <div className="py-3">
            <p className="text-sm text-white leading-relaxed">{ticket.products[0]?.name}</p>
            <p className="text-[10px] text-neutral-500 mt-2">From: {ticket.serverName}</p>
          </div>
        ) : (
          categoryOrder.map(cat => {
            const products = grouped.get(cat);
            if (!products) return null;
            return (
              <div key={cat}>
                <div className="bg-neutral-700 text-center text-[10px] font-bold text-neutral-300 uppercase tracking-wider py-0.5 rounded my-1">
                  {cat}
                </div>
                {products.map((p, idx) => (
                  <div key={idx} className="py-1 border-b border-neutral-800 last:border-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs text-white font-medium">
                        {p.qty} x {p.name}
                      </span>
                      <ProductStatusIcon status={p.status} />
                    </div>
                    {p.modifiers.length > 0 && (
                      <div className="mt-0.5 space-y-0">
                        {p.modifiers.map((mod, mi) => (
                          <div key={mi} className={`text-[10px] pl-3 ${
                            mod.type === "allergy" ? "text-red-400" :
                            mod.type === "remove" ? "text-red-300 line-through" :
                            "text-neutral-400"
                          }`}>
                            {mod.type === "allergy" ? `· Allergies : ${mod.name}` :
                             mod.type === "remove" ? `- ${mod.name}` :
                             mod.type === "add" ? `+ ${mod.name}` :
                             mod.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Action Button */}
      <div className="p-2 border-t border-neutral-700">
        {isMessage ? (
          <button
            onClick={() => onBump(ticket.id)}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-4 h-4" /> ACKNOWLEDGE
          </button>
        ) : (
          <button
            onClick={() => onSeen(ticket.id)}
            className="w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-4 h-4" /> SEEN
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Convert localStorage KDS queue entries to KDSTicket ───
const convertQueueToTickets = (queue: any[]): KDSTicket[] => {
  return queue
    .filter((entry: any) => entry.status === "active")
    .map((entry: any) => ({
      id: entry.sessionId || `kds-live-${entry.orderNumber}`,
      orderNumber: entry.orderNumber || 0,
      orderType: (entry.orderType || "DINE IN") as KDSTicket["orderType"],
      tableNumber: entry.tableNumber || null,
      serverName: entry.serverName || "Staff",
      createdAt: new Date(entry.createdAt),
      products: (entry.items || []).map((item: any) => ({
        qty: item.qty || 1,
        name: item.name,
        category: "ENTREE" as const,
        modifiers: (item.modifiers || []).map((m: string) => ({
          name: m,
          type: "note" as const,
        })),
        status: "pending" as const,
      })),
      status: "active" as const,
      priority: "normal" as const,
    }));
};

// ─── Main KDS Page ───
const KDS = () => {

  const [tickets, setTickets] = useState<KDSTicket[]>(() => {
    try {
      const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
      const real = convertQueueToTickets(queue);
      return real.length > 0 ? real : generateMockTickets();
    } catch {
      return generateMockTickets();
    }
  });
  const [showSummary, setShowSummary] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(() => new Set(tickets.map(t => t.id)));
  const [pendingMessageCount, setPendingMessageCount] = useState(0);

  // Poll localStorage for new fired orders every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
        const realTickets = convertQueueToTickets(queue);
        if (realTickets.length > 0) {
          const newOnes = realTickets.filter(t => !knownIds.has(t.id));
          if (newOnes.length > 0) {
            if (soundEnabled) {
              try {
                const audio = new Audio("/notification.mp3");
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }
            setTickets(prev => [...newOnes, ...prev]);
            setKnownIds(prev => {
              const next = new Set(prev);
              newOnes.forEach(t => next.add(t.id));
              return next;
            });
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [knownIds, soundEnabled]);


  // Poll pending messages for badge + attached messages using shared helper
  const [kdsMessages, setKdsMessages] = useState<KDSMessageData[]>([]);
  const prevPendingCountRef = useRef(0);
  // One-time session cleanup: clear old messages on hard refresh/new tab only
  useEffect(() => {
    const alreadyCleared = sessionStorage.getItem("kds_session_cleared");
    if (!alreadyCleared) {
      localStorage.removeItem("kds_message_queue");
      sessionStorage.setItem("kds_session_cleared", "true");
    }
  }, []);

  useEffect(() => {
    const load = () => {
      const allMessages = readSessionMessages();
      setKdsMessages(allMessages);
      const count = allMessages.filter(m => m.status !== "acknowledged").length;
      // Auto-open messages panel when new messages arrive
      if (count > prevPendingCountRef.current && prevPendingCountRef.current >= 0) {
        setShowMessages(true);
      }
      prevPendingCountRef.current = count;
      setPendingMessageCount(count);
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);
  // Build maps: table number -> all messages (pending + acknowledged), order id -> all messages
  const messagesByTable = useMemo(() => {
    const map = new Map<string, KDSMessageData[]>();
    kdsMessages.filter(m => (m.status === "pending" || m.status === "acknowledged") && (m.table_number || m.table_id) && !m.linked_order_id).forEach(msg => {
      const tableKey = normalizeTableNumber(msg.table_number || msg.table_id || "");
      if (!tableKey) return;
      const arr = map.get(tableKey) || [];
      arr.push(msg);
      map.set(tableKey, arr);
    });
    return map;
  }, [kdsMessages]);

  const messagesByOrder = useMemo(() => {
    const map = new Map<string, KDSMessageData[]>();
    kdsMessages.filter(m => (m.status === "pending" || m.status === "acknowledged") && m.linked_order_id).forEach(msg => {
      const arr = map.get(msg.linked_order_id!) || [];
      arr.push(msg);
      map.set(msg.linked_order_id!, arr);
    });
    // Also map by order number for mock tickets
    kdsMessages.filter(m => (m.status === "pending" || m.status === "acknowledged") && m.linked_order_number && !m.linked_order_id).forEach(msg => {
      const key = `order-${msg.linked_order_number}`;
      const arr = map.get(key) || [];
      arr.push(msg);
      map.set(key, arr);
    });
    return map;
  }, [kdsMessages]);

  const handleAcknowledgeMessage = useCallback((messageId: string) => {
    try {
      const queue: KDSMessageData[] = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      const updated = queue.map(m => m.message_id === messageId ? { ...m, status: "acknowledged" as const, acknowledged_at: new Date().toISOString() } : m);
      localStorage.setItem("kds_message_queue", JSON.stringify(updated));
      // Re-read through shared helper to keep filtering/dedupe consistent
      setKdsMessages(readSessionMessages());
    } catch {}
  }, []);

  // Reply state
  const [kdsReplies, setKdsReplies] = useState<KDSReply[]>(() => readReplies());

  const handleSendReply = useCallback((messageId: string, replyText: string) => {
    const originalMsg = kdsMessages.find(m => m.message_id === messageId);
    if (!originalMsg) return;

    const reply: KDSReply = {
      reply_id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message_id: messageId,
      reply_text: replyText,
      timestamp: new Date().toISOString(),
      source: "kds",
    };

    try {
      saveReply(reply);
      pushPosNotification(reply, originalMsg);
      setKdsReplies(readReplies());
      toast.success("Reply sent \u2713", { duration: 3000 });
    } catch {
      toast.error("Failed to send reply. Try again.");
    }
  }, [kdsMessages]);

  const activeTickets = tickets.filter(t => t.status === "active");
  const totalInQueue = activeTickets.reduce((sum, t) => sum + t.products.filter(p => p.status === "pending" || p.status === "cooking").length, 0);

  const handleBump = useCallback((id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "bumped" as const } : t));
    try {
      const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
      const updated = queue.map((entry: any) =>
        (entry.sessionId === id || `kds-live-${entry.orderNumber}` === id)
          ? { ...entry, status: "bumped" }
          : entry
      );
      localStorage.setItem("kds_ticket_queue", JSON.stringify(updated));
    } catch {}
  }, []);

  const handleSeen = useCallback((id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "seen" as const } : t));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      {/* KDS Sidebar */}
      <KDSSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} showMessages={showMessages} onMessagesToggle={() => setShowMessages(p => !p)} messageCount={pendingMessageCount} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <h1 className="text-sm font-bold">Kitchen Display</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className={`p-2 rounded-lg transition-colors ${showSummary ? "bg-white/15 text-white" : "text-neutral-500 hover:text-white hover:bg-white/10"}`}
              title="Toggle Product Summary"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showSummary ? "rotate-0" : "rotate-180"}`} />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? "text-white bg-white/10" : "text-neutral-500 hover:text-white hover:bg-white/10"}`}
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Ticket Grid + Summary */}
        <div className="flex-1 flex overflow-hidden">
          {/* Scrollable ticket area */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
             <div className="flex gap-3 p-3 h-full items-start">
              {activeTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onBump={handleBump} onSeen={handleSeen} attachedMessages={[
                  ...(ticket.tableNumber ? (messagesByTable.get(normalizeTableNumber(ticket.tableNumber)) || []) : []),
                  ...(messagesByOrder.get(ticket.id) || []),
                  ...(messagesByOrder.get(`order-${ticket.orderNumber}`) || []),
                ]} onAcknowledgeMessage={handleAcknowledgeMessage} onSendReply={handleSendReply} allReplies={kdsReplies} />
              ))}
              {activeTickets.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-3">
                  <ChefHat className="w-20 h-20 opacity-20" />
                  <p className="text-xl font-semibold">All caught up!</p>
                  <p className="text-sm">No active orders in the queue</p>
                </div>
              )}
            </div>
          </div>

          {/* Item Summary Panel */}
          {showSummary && <ItemSummary tickets={activeTickets} />}

          {/* Messages Panel */}
          {showMessages && <KDSMessagesPanel onClose={() => setShowMessages(false)} messages={kdsMessages} onAcknowledge={handleAcknowledgeMessage} onSendReply={handleSendReply} allReplies={kdsReplies} />}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-2 flex items-center gap-4 shrink-0">
          <span className="text-3xl font-black text-white">{activeTickets.length}</span>
          <span className="text-sm font-semibold text-neutral-300">Orders in Queue</span>
          <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden ml-4">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((activeTickets.length / 10) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDS;
