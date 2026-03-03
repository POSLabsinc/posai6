import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, ChefHat, Settings, Eye, Megaphone, SlidersHorizontal, Volume2, VolumeX, Maximize, Minimize, Menu, X, ChevronRight } from "lucide-react";
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

// ─── Messages Card ───
const MessagesCard = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
        setMessages(queue.filter((m: any) => m.status !== "acknowledged"));
      } catch {
        setMessages([]);
      }
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (id: string) => {
    try {
      const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      const updated = queue.map((m: any) => m.message_id === id ? { ...m, status: "acknowledged" } : m);
      localStorage.setItem("kds_message_queue", JSON.stringify(updated));
      setMessages(updated.filter((m: any) => m.status !== "acknowledged"));
    } catch {}
  };

  if (messages.length === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-xl border border-violet-600/60 overflow-hidden flex flex-col min-w-[240px] max-w-[280px] w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2 text-center">
        <div className="text-white font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2">
          <Megaphone className="w-4 h-4" />
          MESSAGES
        </div>
      </div>

      {/* Count bar */}
      <div className="bg-neutral-800 px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-neutral-400 font-mono">POS → Kitchen</span>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black text-white leading-none">{messages.length}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white">NEW</span>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-1 space-y-1.5 max-h-[300px]">
        {messages.map((msg: any, i: number) => (
          <div key={msg.message_id || i} className="border border-neutral-700 rounded-lg p-2 bg-neutral-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-violet-400 font-semibold">
                {msg.table_number || "General"}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {msg.timestamp ? format(new Date(msg.timestamp), "hh:mm a") : ""}
              </span>
            </div>
            <p className="text-xs text-white leading-snug mb-1.5">{msg.message}</p>
            <button
              onClick={() => handleAcknowledge(msg.message_id)}
              className="w-full text-[10px] font-bold py-1 rounded bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              ACKNOWLEDGE
            </button>
          </div>
        ))}
      </div>

      {/* View All */}
      <div className="p-2 border-t border-neutral-700">
        <button
          onClick={() => navigate("/kds/messages")}
          className="w-full border-2 border-violet-600 text-violet-300 font-bold text-sm py-3 rounded-lg hover:bg-violet-900/30 transition-colors"
        >
          VIEW ALL MESSAGES
        </button>
      </div>
    </div>
  );
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

// ─── KDS Sidebar ───
const KDSSidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Menu, label: "Menu", action: onToggle },
    { icon: Home, label: "Home", path: "/" },
    { icon: Clock, label: "History", path: "/kds/history" },
    { icon: ChefHat, label: "Queue", path: "/kds" },
    { icon: Megaphone, label: "Messages", path: "/kds/messages" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Eye, label: "View", path: "/kds/view" },
  ];

  return (
    <div className="w-14 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-2 gap-1 shrink-0 h-full">
      {navItems.map((item, i) => {
        const isActive = item.path && location.pathname === item.path;
        return (
          <button
            key={i}
            onClick={() => item.action ? item.action() : item.path && navigate(item.path)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isActive ? "bg-white/15 text-white" : "text-neutral-500 hover:text-white hover:bg-white/10"
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
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
const TicketCard = ({ ticket, onBump, onSeen }: { ticket: KDSTicket; onBump: (id: string) => void; onSeen: (id: string) => void }) => {
  const [elapsed, setElapsed] = useState(getElapsedMinutes(ticket.createdAt));

  useEffect(() => {
    const interval = setInterval(() => setElapsed(getElapsedMinutes(ticket.createdAt)), 30000);
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

  const categoryOrder = ["APPETIZER", "ENTREE", "DESSERT"];
  const timeStr = format(ticket.createdAt, "hh:mm:ss a");
  const secondaryTime = format(new Date(ticket.createdAt.getTime() + 2 * 3600000 + 9 * 60000 + 6000), "hh:mm:ss");

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden flex flex-col min-w-[240px] max-w-[280px] w-full">
      {/* Header */}
      <div className={`${getHeaderColor(elapsed)} px-3 py-2 text-center`}>
        <div className="text-white font-black text-sm tracking-widest uppercase">{ticket.orderType}</div>
      </div>

      {/* Time & Order Number */}
      <div className="bg-neutral-800 px-3 py-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-mono">{timeStr}</span>
          <span className="text-[10px] text-neutral-500 font-mono">{secondaryTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black text-white leading-none">{ticket.orderNumber}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getTimerBadgeColor(elapsed)}`}>{elapsed}</span>
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
                          mod.type === "add" ? "text-neutral-400" :
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
        })}
      </div>

      {/* Bump / Seen Button */}
      <div className="p-2 border-t border-neutral-700">
        {ticket.products.some(p => p.status === "ready") ? (
          <button
            onClick={() => onBump(ticket.id)}
            className="w-full bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-4 h-4" /> BUMP
          </button>
        ) : (
          <button
            onClick={() => onSeen(ticket.id)}
            className="w-full border-2 border-neutral-600 text-white font-bold text-sm py-3 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            SEEN
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
    // Load real orders from KDS queue, fall back to mock data
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
  const [knownIds, setKnownIds] = useState<Set<string>>(() => new Set(tickets.map(t => t.id)));

  // Poll localStorage for new fired orders every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
        const realTickets = convertQueueToTickets(queue);
        if (realTickets.length > 0) {
          const newOnes = realTickets.filter(t => !knownIds.has(t.id));
          if (newOnes.length > 0) {
            // Play notification sound for new tickets
            if (soundEnabled) {
              try {
                const audio = new Audio("/notification.mp3");
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }
            setTickets(prev => {
              // Remove mock tickets if we have real ones, and merge
              const isMockOnly = prev.every(t => t.id.startsWith("kds-") && !t.id.startsWith("kds-live-"));
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

  const activeTickets = tickets.filter(t => t.status === "active");
  const totalInQueue = activeTickets.reduce((sum, t) => sum + t.products.filter(p => p.status === "pending" || p.status === "cooking").length, 0);

  const handleBump = useCallback((id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "bumped" as const } : t));
    // Also update localStorage queue
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
      <KDSSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

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
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 p-3 h-full items-start">
              <MessagesCard />
              {activeTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onBump={handleBump} onSeen={handleSeen} />
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
