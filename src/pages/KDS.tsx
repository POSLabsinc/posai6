import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, ChefHat, Settings, Eye, SlidersHorizontal, Volume2, VolumeX, Maximize, Minimize, Menu, X, ChevronRight, Megaphone, Check, Bell, AlertTriangle, MessageSquare } from "lucide-react";
import messageKdsIcon from "@/assets/icons/message-kds.svg";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

// ─── Kitchen Message Types ───
type KitchenMessageStatus = "active" | "seen" | "acknowledged" | "resolved";

interface KDSMessageData {
  message_id: string;
  message_text: string;
  store_id: string;
  terminal_id: string;
  employee_id: string;
  employee_name: string;
  table_id: string | null;
  table_number?: string | null;
  timestamp: string;
  status: KitchenMessageStatus;
  acknowledged_at?: string;
  resolved_at?: string;
  seen_at?: string;
  linked_order_id?: string | null;
}

// ─── Mock KDS Data ───
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
        { qty: 1, name: "Filet Mignon", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Extra Olive Oil", type: "add" }], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Potato Wedge", type: "add" }, { name: "Extra Olive Oil", type: "add" }], status: "pending" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Spicy Chimichurri Potatoes", type: "add" }, { name: "NO Parmesan", type: "remove" }, { name: "Peanut", type: "allergy" }], status: "pending" },
        { qty: 1, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Extra Butter", type: "add" }, { name: "Gluten", type: "allergy" }], status: "ready" },
        { qty: 1, name: "Tres Leches", category: "DESSERT", modifiers: [{ name: "Gluten", type: "allergy" }, { name: "Peanut", type: "allergy" }, { name: "Tree Nuts", type: "allergy" }], status: "pending" },
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
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [{ name: "Peanut", type: "allergy" }], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Potato Wedge", type: "add" }, { name: "Extra Cheese", type: "add" }], status: "pending" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Spicy Chimichurri Potatoes", type: "add" }, { name: "NO Parmesan", type: "remove" }, { name: "Peanut", type: "allergy" }], status: "pending" },
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
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Potato Wedge", type: "add" }, { name: "Extra Cheese", type: "add" }], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Potato Wedge", type: "add" }, { name: "Extra Cheese", type: "add" }], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
    {
      id: "kds-4",
      orderNumber: 26,
      orderType: "DINE IN",
      tableNumber: "T6",
      serverName: "Sarah K",
      createdAt: new Date(now.getTime() - 38 * 60000),
      products: [
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [{ name: "Peanut", type: "allergy" }], status: "pending" },
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Potato Wedge", type: "add" }, { name: "Extra Cheese", type: "add" }], status: "pending" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Spicy Chimichurri Potatoes", type: "add" }, { name: "NO Parmesan", type: "remove" }, { name: "Peanut", type: "allergy" }], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
    {
      id: "kds-5",
      orderNumber: 24,
      orderType: "DINE IN",
      tableNumber: "T8",
      serverName: "Dustin H",
      createdAt: new Date(now.getTime() - 23 * 60000),
      products: [
        { qty: 2, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Potato Wedge", type: "add" }, { name: "Extra Cheese", type: "add" }], status: "pending" },
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [{ name: "Peanut", type: "allergy" }], status: "pending" },
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
        { qty: 1, name: "Cheese Selection", category: "APPETIZER", modifiers: [{ name: "Peanut", type: "allergy" }], status: "pending" },
        { qty: 1, name: "Filet Mignon", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Extra Olive Oil", type: "add" }], status: "pending" },
        { qty: 4, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Spicy Chimichurri Potato", type: "add" }, { name: "NO Parmesan", type: "remove" }, { name: "Peanut", type: "allergy" }], status: "pending" },
        { qty: 2, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [{ name: "Extra Butter", type: "add" }, { name: "Gluten", type: "allergy" }], status: "pending" },
        { qty: 3, name: "Tres Leches", category: "DESSERT", modifiers: [{ name: "Peanut, GLUTEN", type: "allergy" }], status: "pending" },
        { qty: 1, name: "Meatballs", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Spicy Chimichurri Potato", type: "add" }, { name: "NO Parmesan", type: "remove" }, { name: "Peanut", type: "allergy" }], status: "pending" },
        { qty: 2, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [{ name: "Medium Rare", type: "note" }, { name: "Extra Butter", type: "add" }, { name: "Gluten", type: "allergy" }], status: "pending" },
        { qty: 1, name: "Grassfed Sirloin Steak", category: "ENTREE", modifiers: [{ name: "Rare", type: "note" }, { name: "Light", type: "add" }, { name: "Peanuts", type: "allergy" }], status: "pending" },
      ],
      status: "active",
      priority: "normal",
    },
  ];
};

// ─── Mock Messages for demo ───
const generateMockMessages = (): KDSMessageData[] => {
  const now = new Date();
  return [
    {
      message_id: "msg-mock-1",
      message_text: "Guest at T2 has severe peanut allergy. Double check ALL dishes before plating.",
      store_id: "store-1",
      terminal_id: "terminal-1",
      employee_id: "emp-1",
      employee_name: "Mia Jones",
      table_id: "T2",
      table_number: "T2",
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      status: "active",
    },
    {
      message_id: "msg-mock-2",
      message_text: "VIP guest arriving at T4 in 10 min. Prep amuse-bouche.",
      store_id: "store-1",
      terminal_id: "terminal-1",
      employee_id: "emp-2",
      employee_name: "Dustin H",
      table_id: "T4",
      table_number: "T4",
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
      status: "active",
    },
    {
      message_id: "msg-mock-3",
      message_text: "86 the salmon. Running low on halibut too.",
      store_id: "store-1",
      terminal_id: "terminal-1",
      employee_id: "emp-1",
      employee_name: "Sarah K",
      table_id: null,
      table_number: null,
      timestamp: new Date(now.getTime() - 8 * 60000).toISOString(),
      status: "active",
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

const MESSAGE_STATUS_LABELS: Record<KitchenMessageStatus, string> = {
  active: "Active",
  seen: "Seen",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

const MESSAGE_STATUS_COLORS: Record<KitchenMessageStatus, string> = {
  active: "bg-red-500 text-white",
  seen: "bg-amber-500 text-white",
  acknowledged: "bg-blue-500 text-white",
  resolved: "bg-emerald-500 text-white",
};

// ─── Shared message helpers ───
const normalizeTableId = (t: string | null | undefined): string | null => {
  if (!t) return null;
  return t.toUpperCase().replace(/\s+/g, "");
};

const loadMessages = (): KDSMessageData[] => {
  try {
    const raw = localStorage.getItem("kds_message_queue");
    if (!raw) return [];
    return JSON.parse(raw).map((m: any) => ({
      ...m,
      status: m.status || "active",
    }));
  } catch {
    return [];
  }
};

const saveMessages = (msgs: KDSMessageData[]) => {
  localStorage.setItem("kds_message_queue", JSON.stringify(msgs));
};

const updateMessageStatus = (
  messageId: string,
  newStatus: KitchenMessageStatus,
  messages: KDSMessageData[]
): KDSMessageData[] => {
  const now = new Date().toISOString();
  return messages.map(m => {
    if (m.message_id !== messageId) return m;
    const updated = { ...m, status: newStatus };
    if (newStatus === "seen") updated.seen_at = now;
    if (newStatus === "acknowledged") updated.acknowledged_at = now;
    if (newStatus === "resolved") updated.resolved_at = now;
    return updated;
  });
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

// ─── Inline Message Block (shown at top of order card) ───
const InlineMessageBlock = ({
  messages,
  onUpdateStatus,
}: {
  messages: KDSMessageData[];
  onUpdateStatus: (messageId: string, status: KitchenMessageStatus) => void;
}) => {
  if (messages.length === 0) return null;

  return (
    <div className="border-b border-amber-500/30">
      {messages.map((msg) => (
        <div
          key={msg.message_id}
          className="bg-gradient-to-r from-amber-900/60 to-orange-900/40 px-3 py-2 border-b border-amber-700/30 last:border-b-0"
        >
          {/* Header row */}
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex-1">
              Kitchen Message
            </span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${MESSAGE_STATUS_COLORS[msg.status]}`}>
              {MESSAGE_STATUS_LABELS[msg.status]}
            </span>
          </div>

          {/* Message text */}
          <p className="text-xs text-white leading-relaxed font-medium mb-1.5">
            {msg.message_text}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between text-[9px] text-amber-400/70">
            <span>From. {msg.employee_name}</span>
            <span>{format(new Date(msg.timestamp), "hh:mm a")}</span>
          </div>

          {/* Quick action buttons */}
          {msg.status === "active" && (
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(msg.message_id, "seen"); }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
              >
                SEEN
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(msg.message_id, "acknowledged"); }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
              >
                ACK
              </button>
            </div>
          )}
          {msg.status === "seen" && (
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(msg.message_id, "acknowledged"); }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
              >
                ACKNOWLEDGE
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(msg.message_id, "resolved"); }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
              >
                RESOLVE
              </button>
            </div>
          )}
          {msg.status === "acknowledged" && (
            <div className="mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(msg.message_id, "resolved"); }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
              >
                RESOLVE
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Standalone Message Card (for messages without active orders) ───
const StandaloneMessageCard = ({
  message,
  onUpdateStatus,
}: {
  message: KDSMessageData;
  onUpdateStatus: (messageId: string, status: KitchenMessageStatus) => void;
}) => {
  const msgAge = Math.floor((Date.now() - new Date(message.timestamp).getTime()) / 60000);

  return (
    <div className="bg-neutral-900 rounded-xl border-2 border-amber-500/60 overflow-hidden flex flex-col min-w-[240px] max-w-[280px] w-full animate-in fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-2 text-center">
        <div className="text-white font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          KITCHEN MESSAGE
        </div>
      </div>

      {/* Info */}
      <div className="bg-neutral-800 px-3 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-neutral-400 font-mono">
            {format(new Date(message.timestamp), "hh:mm:ss a")}
          </span>
          {message.table_number || message.table_id ? (
            <span className="text-[10px] text-amber-400 font-semibold">
              T. {message.table_number || message.table_id}
            </span>
          ) : (
            <span className="text-[10px] text-neutral-500 font-semibold">General</span>
          )}
        </div>

        {/* Large MSG indicator */}
        <div className="flex items-center justify-center py-3">
          <MessageSquare className="w-10 h-10 text-amber-400" />
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${MESSAGE_STATUS_COLORS[message.status]}`}>
            {MESSAGE_STATUS_LABELS[message.status]}
          </span>
          <span className="text-[10px] text-neutral-400 font-semibold uppercase truncate max-w-[120px]">
            {message.employee_name}
          </span>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 px-3 py-3 border-t border-neutral-700">
        <p className="text-sm text-white leading-relaxed font-medium">{message.message_text}</p>
        <div className="flex items-center gap-2 mt-2 text-[9px] text-neutral-500">
          <span>{msgAge}m ago</span>
          {message.seen_at && <span>· Seen {format(new Date(message.seen_at), "hh:mm a")}</span>}
          {message.acknowledged_at && <span>· Ack'd {format(new Date(message.acknowledged_at), "hh:mm a")}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-neutral-700">
        {message.status === "active" && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(message.message_id, "seen")}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-lg transition-colors"
            >
              SEEN
            </button>
            <button
              onClick={() => onUpdateStatus(message.message_id, "acknowledged")}
              className="flex-1 bg-white text-black font-bold text-xs py-3 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              ACK
            </button>
          </div>
        )}
        {message.status === "seen" && (
          <button
            onClick={() => onUpdateStatus(message.message_id, "acknowledged")}
            className="w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> ACKNOWLEDGE
          </button>
        )}
        {message.status === "acknowledged" && (
          <button
            onClick={() => onUpdateStatus(message.message_id, "resolved")}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> RESOLVE
          </button>
        )}
      </div>
    </div>
  );
};

// ─── KDS Messages Panel (Global) ───
const KDSMessagesPanel = ({
  messages,
  onClose,
  onUpdateStatus,
}: {
  messages: KDSMessageData[];
  onClose: () => void;
  onUpdateStatus: (messageId: string, status: KitchenMessageStatus) => void;
}) => {
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [flashId, setFlashId] = useState<string | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const activeCount = messages.filter(m => m.status === "active").length;
    if (activeCount > prevCountRef.current && prevCountRef.current > 0) {
      const newest = messages
        .filter(m => m.status === "active")
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (newest) {
        setFlashId(newest.message_id);
        setTimeout(() => setFlashId(null), 2000);
      }
    }
    prevCountRef.current = activeCount;
  }, [messages]);

  const activeMessages = messages.filter(m => m.status !== "resolved");
  const allMessages = [...messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const displayed = filter === "active"
    ? activeMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : allMessages;

  const seen = new Set<string>();
  const deduplicated = displayed.filter(m => {
    if (seen.has(m.message_id)) return false;
    seen.add(m.message_id);
    return true;
  });

  const getNextAction = (status: KitchenMessageStatus): { label: string; next: KitchenMessageStatus } | null => {
    switch (status) {
      case "active": return { label: "SEEN", next: "seen" };
      case "seen": return { label: "ACKNOWLEDGE", next: "acknowledged" };
      case "acknowledged": return { label: "RESOLVE", next: "resolved" };
      default: return null;
    }
  };

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-800 shrink-0">
        <Megaphone className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-bold flex-1">Kitchen Messages</h2>
        {activeMessages.length > 0 && (
          <span className="flex items-center gap-1 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Bell className="w-3 h-3" />
            {activeMessages.length}
          </span>
        )}
        <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded-lg transition-colors">
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-3 py-2 shrink-0">
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "active" ? "bg-amber-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          Active ({activeMessages.length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "all" ? "bg-amber-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          All ({messages.length})
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-hide">
        {deduplicated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2">
            <Megaphone className="w-10 h-10 opacity-30" />
            <p className="text-xs font-medium">No messages</p>
          </div>
        ) : (
          deduplicated.map(msg => {
            const action = getNextAction(msg.status);
            return (
              <div
                key={msg.message_id}
                className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                  flashId === msg.message_id
                    ? "border-amber-400 ring-2 ring-amber-400/50 animate-pulse"
                    : msg.status === "active"
                    ? "border-amber-500/50"
                    : "border-neutral-700"
                }`}
              >
                <div className={`px-3 py-2 flex items-center justify-between ${
                  msg.status === "active"
                    ? "bg-gradient-to-r from-amber-700 to-orange-700"
                    : msg.status === "seen"
                    ? "bg-gradient-to-r from-amber-800/60 to-orange-800/60"
                    : msg.status === "acknowledged"
                    ? "bg-gradient-to-r from-blue-800/60 to-indigo-800/60"
                    : "bg-gradient-to-r from-emerald-800/60 to-teal-800/60"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-white/80" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                      {(msg.table_number || msg.table_id) ? `T. ${msg.table_number || msg.table_id}` : "General"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${MESSAGE_STATUS_COLORS[msg.status]}`}>
                      {MESSAGE_STATUS_LABELS[msg.status]}
                    </span>
                    <span className="text-[10px] text-white/70 font-mono">
                      {format(new Date(msg.timestamp), "hh:mm a")}
                    </span>
                  </div>
                </div>
                <div className="bg-neutral-800 px-3 py-1.5 flex items-center gap-3 text-[10px] text-neutral-400 border-b border-neutral-700">
                  <span>From. <span className="text-white font-medium">{msg.employee_name}</span></span>
                </div>
                <div className="bg-neutral-900 px-3 py-3">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message_text}</p>
                  {/* Status trail */}
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-neutral-500 flex-wrap">
                    {msg.seen_at && <span>Seen {format(new Date(msg.seen_at), "hh:mm a")}</span>}
                    {msg.acknowledged_at && <span>· Ack'd {format(new Date(msg.acknowledged_at), "hh:mm a")}</span>}
                    {msg.resolved_at && <span>· Resolved {format(new Date(msg.resolved_at), "hh:mm a")}</span>}
                  </div>
                </div>
                {action && (
                  <div className="bg-neutral-900 px-3 pb-3 pt-1">
                    <Button
                      onClick={() => onUpdateStatus(msg.message_id, action.next)}
                      className={`w-full font-bold text-xs py-3 rounded-lg ${
                        msg.status === "active"
                          ? "bg-white text-black hover:bg-neutral-200"
                          : msg.status === "seen"
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      <Check className="w-3 h-3 mr-1.5" /> {action.label}
                    </Button>
                  </div>
                )}
                {msg.status === "resolved" && (
                  <div className="bg-neutral-900 px-3 pb-2 pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Resolved {msg.resolved_at ? format(new Date(msg.resolved_at), "hh:mm a") : ""}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── KDS Sidebar ───
const KDSSidebar = ({
  collapsed,
  onToggle,
  showMessages,
  onMessagesToggle,
  messageCount,
}: {
  collapsed: boolean;
  onToggle: () => void;
  showMessages: boolean;
  onMessagesToggle: () => void;
  messageCount: number;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Menu, label: "Menu", action: onToggle },
    { icon: Home, label: "Home", path: "/" },
    { icon: Clock, label: "History", path: "/kds/history" },
    { icon: ChefHat, label: "Queue", path: "/kds" },
    {
      icon: ({ className }: { className?: string }) => (
        <img src={messageKdsIcon} alt="Messages" className={`${className} invert`} />
      ),
      label: "Messages",
      action: onMessagesToggle,
    },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Eye, label: "View", path: "/kds/view" },
  ];

  return (
    <div className="w-14 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-2 gap-1 shrink-0 h-full">
      {navItems.map((item, i) => {
        const isActive = item.path
          ? location.pathname === item.path
          : item.label === "Messages" && showMessages;
        return (
          <button
            key={i}
            onClick={() =>
              item.action ? item.action() : item.path && navigate(item.path)
            }
            className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-white/15 text-white"
                : "text-neutral-500 hover:text-white hover:bg-white/10"
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {item.label === "Messages" && messageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px]">
          ✓
        </span>
      );
    case "cooking":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px]">
          ⏳
        </span>
      );
    default:
      return null;
  }
};

// ─── Ticket Card ───
const TicketCard = ({
  ticket,
  onBump,
  onSeen,
  tableMessages,
  onUpdateMessageStatus,
}: {
  ticket: KDSTicket;
  onBump: (id: string) => void;
  onSeen: (id: string) => void;
  tableMessages: KDSMessageData[];
  onUpdateMessageStatus: (messageId: string, status: KitchenMessageStatus) => void;
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.floor((Date.now() - ticket.createdAt.getTime()) / 1000)
  );
  const elapsed = Math.floor(elapsedSeconds / 60);

  useEffect(() => {
    const interval = setInterval(
      () =>
        setElapsedSeconds(
          Math.floor((Date.now() - ticket.createdAt.getTime()) / 1000)
        ),
      1000
    );
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  const grouped = useMemo(() => {
    const map = new Map<string, KDSProduct[]>();
    ticket.products.forEach(p => {
      const arr = map.get(p.category) || [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return map;
  }, [ticket.products]);

  const categoryOrder = ["APPETIZER", "ENTREE", "DESSERT"];
  const timeStr = format(ticket.createdAt, "hh:mm:ss a");

  // Filter to non-resolved messages for inline display
  const activeTableMessages = tableMessages.filter(m => m.status !== "resolved");
  const hasMessages = activeTableMessages.length > 0;

  return (
    <div
      className={`bg-neutral-900 rounded-xl border overflow-hidden flex flex-col min-w-[240px] max-w-[280px] w-full ${
        hasMessages ? "border-amber-500/60 ring-1 ring-amber-500/20" : "border-neutral-700"
      }`}
    >
      {/* Header */}
      <div
        className={`${getHeaderColor(elapsed)} px-3 py-2 text-center`}
      >
        <div className="text-white font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2">
          {hasMessages && <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
          {ticket.orderType}
        </div>
      </div>

      {/* Inline Kitchen Messages (above products) */}
      <InlineMessageBlock
        messages={activeTableMessages}
        onUpdateStatus={onUpdateMessageStatus}
      />

      {/* Time & Order Number */}
      <div className="bg-neutral-800 px-3 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-neutral-400 font-mono">{timeStr}</span>
          {ticket.tableNumber && (
            <span className="text-[10px] text-neutral-400 font-semibold">
              T. {ticket.tableNumber}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center py-2">
          <span className="text-5xl font-black text-white leading-none">
            {ticket.orderNumber}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTimerBadgeColor(elapsed)}`}
          >
            {String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0")}:
            {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0")}:
            {String(elapsedSeconds % 60).padStart(2, "0")}
          </span>
          {ticket.serverName && (
            <span className="text-[10px] text-neutral-400 font-semibold uppercase truncate max-w-[120px]">
              {ticket.serverName}
            </span>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-1 space-y-0.5">
        {categoryOrder.map(cat => {
          const products = grouped.get(cat);
          if (!products) return null;
          return (
            <div key={cat}>
              <div className="bg-neutral-700 text-center text-[10px] font-bold text-neutral-300 uppercase tracking-wider py-0.5 rounded my-1">
                {cat}
              </div>
              {products.map((p, idx) => (
                <div
                  key={idx}
                  className="py-1 border-b border-neutral-800 last:border-0"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs text-white font-medium">
                      {p.qty} x {p.name}
                    </span>
                    <ProductStatusIcon status={p.status} />
                  </div>
                  {p.modifiers.length > 0 && (
                    <div className="mt-0.5 space-y-0">
                      {p.modifiers.map((mod, mi) => (
                        <div
                          key={mi}
                          className={`text-[10px] pl-3 ${
                            mod.type === "allergy"
                              ? "text-red-400"
                              : mod.type === "remove"
                              ? "text-red-300 line-through"
                              : "text-neutral-400"
                          }`}
                        >
                          {mod.type === "allergy"
                            ? `· Allergies : ${mod.name}`
                            : mod.type === "remove"
                            ? `- ${mod.name}`
                            : mod.type === "add"
                            ? `+ ${mod.name}`
                            : mod.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="p-2 border-t border-neutral-700">
        <button
          onClick={() => onSeen(ticket.id)}
          className="w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronRight className="w-4 h-4" /> SEEN
        </button>
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
  const [messages, setMessages] = useState<KDSMessageData[]>(() => {
    const stored = loadMessages();
    return stored.length > 0 ? stored : generateMockMessages();
  });
  const [showSummary, setShowSummary] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(
    () => new Set(tickets.map(t => t.id))
  );

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
            setTickets(prev => {
              const isMockOnly = prev.every(
                t => t.id.startsWith("kds-") && !t.id.startsWith("kds-live-")
              );
              const base = isMockOnly ? [] : prev;
              return [...newOnes, ...base];
            });
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

  // Poll messages from localStorage every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = loadMessages();
      if (stored.length > 0) {
        setMessages(prev => {
          // Merge: keep stored statuses as source of truth, preserve mock messages
          const storedIds = new Set(stored.map(s => s.message_id));
          const mockMessages = prev.filter(
            m => m.message_id.startsWith("msg-mock-") && !storedIds.has(m.message_id)
          );
          return [...stored, ...mockMessages];
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-link messages to orders: when a new order appears for a table with pending messages
  useEffect(() => {
    const activeTickets = tickets.filter(t => t.status === "active");
    let updated = false;
    const newMessages = messages.map(msg => {
      if (msg.linked_order_id) return msg;
      const tableId = normalizeTableId(msg.table_number || msg.table_id);
      if (!tableId) return msg;
      const matchingTicket = activeTickets.find(
        t => normalizeTableId(t.tableNumber) === tableId
      );
      if (matchingTicket) {
        updated = true;
        return { ...msg, linked_order_id: matchingTicket.id };
      }
      return msg;
    });
    if (updated) {
      setMessages(newMessages);
      saveMessages(newMessages);
    }
  }, [tickets, messages]);

  const pendingMessageCount = messages.filter(
    m => m.status === "active" || m.status === "seen"
  ).length;

  const activeTickets = tickets.filter(t => t.status === "active");
  const totalInQueue = activeTickets.reduce(
    (sum, t) =>
      sum +
      t.products.filter(p => p.status === "pending" || p.status === "cooking")
        .length,
    0
  );

  // Build table -> messages map
  const tableMessagesMap = useMemo(() => {
    const map = new Map<string, KDSMessageData[]>();
    messages.forEach(msg => {
      const tableId = normalizeTableId(msg.table_number || msg.table_id);
      if (!tableId) return;
      const arr = map.get(tableId) || [];
      arr.push(msg);
      map.set(tableId, arr);
    });
    // Sort each group newest first
    map.forEach((msgs, key) => {
      map.set(
        key,
        msgs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    });
    return map;
  }, [messages]);

  // Find orphan messages (no matching active order)
  const orphanMessages = useMemo(() => {
    const activeTableIds = new Set(
      activeTickets
        .map(t => normalizeTableId(t.tableNumber))
        .filter(Boolean) as string[]
    );
    return messages.filter(msg => {
      if (msg.status === "resolved") return false;
      const tableId = normalizeTableId(msg.table_number || msg.table_id);
      if (!tableId) return true; // General messages are always standalone
      return !activeTableIds.has(tableId);
    });
  }, [messages, activeTickets]);

  const handleUpdateMessageStatus = useCallback(
    (messageId: string, newStatus: KitchenMessageStatus) => {
      setMessages(prev => {
        const updated = updateMessageStatus(messageId, newStatus, prev);
        saveMessages(updated);
        return updated;
      });
    },
    []
  );

  const handleBump = useCallback((id: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === id ? { ...t, status: "bumped" as const } : t))
    );
    try {
      const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
      const updated = queue.map((entry: any) =>
        entry.sessionId === id || `kds-live-${entry.orderNumber}` === id
          ? { ...entry, status: "bumped" }
          : entry
      );
      localStorage.setItem("kds_ticket_queue", JSON.stringify(updated));
    } catch {}
  }, []);

  const handleSeen = useCallback((id: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === id ? { ...t, status: "seen" as const } : t))
    );
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
      <KDSSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        showMessages={showMessages}
        onMessagesToggle={() => setShowMessages(p => !p)}
        messageCount={pendingMessageCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <h1 className="text-sm font-bold">Kitchen Display</h1>
            {pendingMessageCount > 0 && (
              <button
                onClick={() => setShowMessages(true)}
                className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full hover:bg-amber-600/30 transition-colors"
              >
                <AlertTriangle className="w-3 h-3" />
                {pendingMessageCount} Active Message{pendingMessageCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className={`p-2 rounded-lg transition-colors ${
                showSummary
                  ? "bg-white/15 text-white"
                  : "text-neutral-500 hover:text-white hover:bg-white/10"
              }`}
              title="Toggle Product Summary"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  showSummary ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? "text-white bg-white/10"
                  : "text-neutral-500 hover:text-white hover:bg-white/10"
              }`}
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Ticket Grid + Summary */}
        <div className="flex-1 flex overflow-hidden">
          {/* Scrollable ticket area */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 p-3 h-full items-start">
              {/* Standalone message cards first */}
              {orphanMessages.map(msg => (
                <StandaloneMessageCard
                  key={msg.message_id}
                  message={msg}
                  onUpdateStatus={handleUpdateMessageStatus}
                />
              ))}

              {/* Order tickets with inline messages */}
              {activeTickets.map(ticket => {
                const tableId = normalizeTableId(ticket.tableNumber);
                const ticketMessages = tableId
                  ? tableMessagesMap.get(tableId) || []
                  : [];
                return (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onBump={handleBump}
                    onSeen={handleSeen}
                    tableMessages={ticketMessages}
                    onUpdateMessageStatus={handleUpdateMessageStatus}
                  />
                );
              })}

              {activeTickets.length === 0 && orphanMessages.length === 0 && (
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
          {showMessages && (
            <KDSMessagesPanel
              messages={messages}
              onClose={() => setShowMessages(false)}
              onUpdateStatus={handleUpdateMessageStatus}
            />
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-2 flex items-center gap-4 shrink-0">
          <span className="text-3xl font-black text-white">
            {activeTickets.length}
          </span>
          <span className="text-sm font-semibold text-neutral-300">
            Orders in Queue
          </span>
          <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden ml-4">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  (activeTickets.length / 10) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDS;
