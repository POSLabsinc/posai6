import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Package,
  PackageX,
  PackageCheck,
  Boxes,
  ChevronLeft,
  Bell,
  Clock,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

type RangeKey = "today" | "weekly" | "monthly";
interface ChatMsg { role: "user" | "assistant"; content: string }

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const SUGGESTIONS = [
  "What items will run out soon?",
  "Should I reorder meat today?",
  "Why is chicken usage high?",
  "What is overstocked?",
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#a78bfa", "#22d3ee"];

// ===== Mock inventory data (deterministic so AI answers match what's shown) =====
type StockItem = {
  name: string;
  category: string;
  unit: string;
  current: number;
  min: number;
  max: number;
  dailyUsage: number;
  pricePerUnit: number;
  trendPct: number; // weekly price/usage trend
  spoilagePct: number; // last 30d spoilage rate
};

const INVENTORY: StockItem[] = [
  { name: "Chicken Breast", category: "Meat", unit: "kg", current: 4.5, min: 10, max: 40, dailyUsage: 8, pricePerUnit: 6.5, trendPct: 18, spoilagePct: 2 },
  { name: "Beef Tenderloin", category: "Meat", unit: "kg", current: 12, min: 8, max: 30, dailyUsage: 4, pricePerUnit: 24, trendPct: 5, spoilagePct: 3 },
  { name: "Onions", category: "Produce", unit: "kg", current: 6, min: 15, max: 50, dailyUsage: 5, pricePerUnit: 1.2, trendPct: 12, spoilagePct: 4 },
  { name: "Tomatoes", category: "Produce", unit: "kg", current: 18, min: 10, max: 35, dailyUsage: 6, pricePerUnit: 2.1, trendPct: -3, spoilagePct: 6 },
  { name: "Lettuce", category: "Produce", unit: "kg", current: 0, min: 5, max: 20, dailyUsage: 3, pricePerUnit: 1.8, trendPct: 0, spoilagePct: 8 },
  { name: "Whole Milk", category: "Dairy", unit: "L", current: 92, min: 20, max: 60, dailyUsage: 4, pricePerUnit: 1.1, trendPct: -1, spoilagePct: 5 },
  { name: "Mozzarella", category: "Dairy", unit: "kg", current: 38, min: 8, max: 25, dailyUsage: 2.5, pricePerUnit: 7.4, trendPct: 2, spoilagePct: 3 },
  { name: "Salmon Fillet", category: "Seafood", unit: "kg", current: 7, min: 6, max: 20, dailyUsage: 3, pricePerUnit: 18, trendPct: 6, spoilagePct: 7 },
  { name: "Olive Oil", category: "Pantry", unit: "L", current: 22, min: 10, max: 40, dailyUsage: 1.2, pricePerUnit: 9, trendPct: 4, spoilagePct: 0 },
  { name: "All-Purpose Flour", category: "Pantry", unit: "kg", current: 45, min: 15, max: 60, dailyUsage: 3, pricePerUnit: 0.9, trendPct: 0, spoilagePct: 0 },
  { name: "Eggs", category: "Dairy", unit: "dz", current: 14, min: 12, max: 36, dailyUsage: 5, pricePerUnit: 4.2, trendPct: 9, spoilagePct: 2 },
  { name: "Pasta", category: "Pantry", unit: "kg", current: 28, min: 10, max: 40, dailyUsage: 2, pricePerUnit: 1.5, trendPct: -2, spoilagePct: 0 },
];

type Status = "out" | "low" | "ok" | "over";
const statusOf = (i: StockItem): Status => {
  if (i.current <= 0) return "out";
  if (i.current < i.min) return "low";
  if (i.current > i.max) return "over";
  return "ok";
};
const daysLeftOf = (i: StockItem) => (i.dailyUsage > 0 ? i.current / i.dailyUsage : Infinity);

const STATUS_META: Record<Status, { label: string; color: string; bg: string; ring: string }> = {
  out:  { label: "Out of stock", color: "text-red-300",     bg: "bg-red-500/15",     ring: "border-red-500/30" },
  low:  { label: "Low",          color: "text-amber-300",   bg: "bg-amber-500/15",   ring: "border-amber-500/30" },
  ok:   { label: "OK",           color: "text-emerald-300", bg: "bg-emerald-500/15", ring: "border-emerald-500/30" },
  over: { label: "Overstock",    color: "text-sky-300",     bg: "bg-sky-500/15",     ring: "border-sky-500/30" },
};

const fmtQty = (n: number, unit: string) => `${n % 1 === 0 ? n : n.toFixed(1)} ${unit}`;

export const InventoryDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [range, setRange] = useState<RangeKey>("today");
  const [tick, setTick] = useState(0);

  // Auto-refresh every 30s (re-derives client-side metrics)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  // ===== Derived stats =====
  const items = INVENTORY;
  const counts = useMemo(() => {
    const c = { total: items.length, out: 0, low: 0, ok: 0, over: 0, totalValue: 0 };
    for (const i of items) {
      const s = statusOf(i);
      c[s]++;
      c.totalValue += i.current * i.pricePerUnit;
    }
    return c;
  }, [items, tick]);

  // Daily usage trend (last 7 days, derived from per-item dailyUsage with deterministic noise)
  const usageTrend = useMemo(() => {
    const days = range === "today" ? 1 : range === "weekly" ? 7 : 30;
    const labels = Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (Math.min(days, 14) - 1 - i));
      return d.toISOString().slice(5, 10);
    });
    const totalDaily = items.reduce((s, i) => s + i.dailyUsage, 0);
    return labels.map((label, i) => {
      const noise = ((i * 7) % 11 - 5) / 100; // -5%..+5%
      const usage = Math.round(totalDaily * (1 + noise));
      const baseline = Math.round(totalDaily * 1.05);
      return { label, usage, baseline };
    });
  }, [items, range]);

  // Category breakdown
  const categoryPie = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) map.set(i.category, (map.get(i.category) || 0) + i.current * i.pricePerUnit);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [items]);

  // Anomalies: largest dip vs baseline
  const anomaly = useMemo(() => {
    let worst: { label: string; usage: number; baseline: number; deficit: number } | null = null;
    for (const p of usageTrend) {
      const deficit = p.usage - p.baseline; // positive = unusual consumption
      if (Math.abs(deficit) > worst?.deficit ?? 0) {
        if (Math.abs(deficit) > 20) worst = { label: p.label, usage: p.usage, baseline: p.baseline, deficit };
      }
    }
    // Also surface an out-of-stock product if any
    return worst;
  }, [usageTrend]);

  // Smart alerts (replenishment + price + overstock)
  const alerts = useMemo(() => {
    const out: { kind: "low" | "out" | "price" | "over"; text: string; sub: string }[] = [];
    for (const i of items) {
      const s = statusOf(i);
      if (s === "out") out.push({ kind: "out", text: `${i.name} is out of stock`, sub: `${i.category} • daily usage ${fmtQty(i.dailyUsage, i.unit)}` });
      else if (s === "low") out.push({ kind: "low", text: `${i.name} stock running low`, sub: `${fmtQty(i.current, i.unit)} left • ~${daysLeftOf(i).toFixed(1)} days` });
      else if (s === "over") out.push({ kind: "over", text: `Overstock detected for ${i.name}`, sub: `${fmtQty(i.current, i.unit)} on hand (max ${fmtQty(i.max, i.unit)})` });
      if (i.trendPct >= 10) out.push({ kind: "price", text: `${i.name} prices increased ${i.trendPct}%`, sub: `Now ~$${i.pricePerUnit.toFixed(2)}/${i.unit}` });
    }
    return out.slice(0, 6);
  }, [items, tick]);

  // Replenishment suggestions
  const replenishment = useMemo(() => {
    return items
      .filter((i) => statusOf(i) === "low" || statusOf(i) === "out")
      .map((i) => {
        const target = Math.max(i.max - i.current, Math.ceil(i.dailyUsage * 5));
        const days = daysLeftOf(i);
        const when = days < 1 ? "today" : days < 2 ? "by tomorrow evening" : `within ${Math.ceil(days)} days`;
        return {
          name: i.name,
          qty: `${Math.ceil(target)} ${i.unit}`,
          when,
          reason: `Daily usage ${fmtQty(i.dailyUsage, i.unit)} • current ${fmtQty(i.current, i.unit)}`,
        };
      })
      .slice(0, 5);
  }, [items, tick]);

  // Forecast: estimated days until depletion per item (lowest first)
  const forecast = useMemo(() => {
    return [...items]
      .filter((i) => i.dailyUsage > 0)
      .map((i) => ({ name: i.name, days: daysLeftOf(i), unit: i.unit, current: i.current }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
  }, [items, tick]);

  // ===== AI insights (local, derived from visible data — no extra cost) =====
  const insights = useMemo<string[]>(() => {
    const out: string[] = [];
    const lowItems = items.filter((i) => statusOf(i) === "low" || statusOf(i) === "out");
    const overItems = items.filter((i) => statusOf(i) === "over");
    const priceUp = items.filter((i) => i.trendPct >= 10);
    if (lowItems.length) out.push(`${lowItems.length} product${lowItems.length > 1 ? "s" : ""} need attention: ${lowItems.slice(0, 3).map((i) => i.name).join(", ")}.`);
    if (priceUp.length) out.push(`Price spikes detected on ${priceUp.map((i) => `${i.name} (+${i.trendPct}%)`).join(", ")}. Consider locking in suppliers.`);
    if (overItems.length) out.push(`Overstock on ${overItems.map((i) => i.name).join(", ")} — push as specials to avoid spoilage.`);
    const peakUsage = [...items].sort((a, b) => b.dailyUsage - a.dailyUsage).slice(0, 2);
    if (peakUsage.length) out.push(`Highest daily usage: ${peakUsage.map((i) => `${i.name} (${fmtQty(i.dailyUsage, i.unit)}/day)`).join(", ")}.`);
    return out.slice(0, 4);
  }, [items, tick]);

  // ===== Chat (local, deterministic answers from visible data) =====
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me anything about your live inventory. I only use the data shown on this dashboard." },
  ]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, chatBusy]);

  const answerLocally = (q: string): string => {
    const ql = q.toLowerCase();
    if (ql.includes("run out") || ql.includes("soon") || ql.includes("deplet")) {
      const soon = forecast.filter((f) => f.days < 3);
      if (!soon.length) return "Nothing is forecast to run out in the next 3 days.";
      return `These will deplete soon: ${soon.map((f) => `${f.name} (~${f.days.toFixed(1)} days, ${fmtQty(f.current, f.unit)} left)`).join("; ")}.`;
    }
    if (ql.includes("reorder")) {
      if (!replenishment.length) return "No replenishment needed right now — all stock levels look healthy.";
      return `Recommended reorders: ${replenishment.map((r) => `${r.qty} of ${r.name} ${r.when}`).join("; ")}.`;
    }
    if (ql.includes("overstock")) {
      const over = items.filter((i) => statusOf(i) === "over");
      if (!over.length) return "No overstocked products at the moment.";
      return `Overstocked: ${over.map((i) => `${i.name} (${fmtQty(i.current, i.unit)} on hand, max ${fmtQty(i.max, i.unit)})`).join("; ")}.`;
    }
    if (ql.includes("price")) {
      const up = items.filter((i) => i.trendPct >= 5);
      if (!up.length) return "No notable price movement on visible products.";
      return `Price changes: ${up.map((i) => `${i.name} ${i.trendPct > 0 ? "+" : ""}${i.trendPct}%`).join(", ")}.`;
    }
    // "why is X usage high"
    const item = items.find((i) => ql.includes(i.name.toLowerCase()) || ql.includes(i.name.toLowerCase().split(" ")[0]));
    if (item) {
      return `${item.name}: current ${fmtQty(item.current, item.unit)}, daily usage ${fmtQty(item.dailyUsage, item.unit)}, ~${daysLeftOf(item).toFixed(1)} days left. Status: ${STATUS_META[statusOf(item)].label}. Spoilage ~${item.spoilagePct}%, price trend ${item.trendPct > 0 ? "+" : ""}${item.trendPct}%.`;
    }
    return "I can answer questions about stock levels, reorders, overstock, prices, and depletion timelines for the products shown above.";
  };

  const ask = (q: string) => {
    const question = q.trim();
    if (!question || chatBusy) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setChatBusy(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: answerLocally(question) }]);
      setChatBusy(false);
    }, 450);
  };

  const explainAnomaly = () => {
    if (!anomaly) return;
    ask(`Unusual usage detected on ${anomaly.label} (${anomaly.usage} vs baseline ${anomaly.baseline}). What should I do?`);
  };

  const cardCls = "rounded-2xl p-4";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  const kpis = [
    { label: "Total Products", val: String(counts.total), icon: Boxes, color: "text-primary", bg: "bg-primary/10" },
    { label: "Low Stock", val: String(counts.low), icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Out of Stock", val: String(counts.out), icon: PackageX, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Overstocked", val: String(counts.over), icon: Package, color: "text-sky-400", bg: "bg-sky-500/10" },
    { label: "Inventory Value", val: `$${counts.totalValue.toFixed(0)}`, icon: PackageCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-foreground tracking-tight truncate">Live Inventory & AI Replenishment</h1>
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-refreshing every 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-full p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`text-[11px] px-3 py-1.5 rounded-full transition-colors ${
                  range === r.key ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTick((t) => t + 1)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            aria-label="Refresh now"
          >
            <RefreshCw className="w-4 h-4 text-foreground/80" />
          </button>
        </div>
      </div>

      {/* Anomaly / out-of-stock alert banner */}
      {(counts.out > 0 || anomaly) && (
        <button
          onClick={() => counts.out > 0 ? ask("What items will run out soon?") : explainAnomaly()}
          className="mx-4 lg:mx-6 mt-3 shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 transition-colors text-left"
        >
          <Bell className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-red-300">
              {counts.out > 0 ? `${counts.out} product${counts.out > 1 ? "s" : ""} out of stock` : `Unusual consumption on ${anomaly!.label}`}
            </p>
            <p className="text-[11px] text-red-200/70 truncate">
              {counts.out > 0 ? "Tap to see depletion forecast and reorders" : `${anomaly!.usage} units vs baseline ${anomaly!.baseline} — tap to ask AI`}
            </p>
          </div>
          <span className="text-[11px] text-red-300/80 font-medium shrink-0">Open chat →</span>
        </button>
      )}

      {/* Main content (full width) */}
      <div className="flex-1 min-h-0 p-4 lg:p-6 overflow-hidden">
        <div className="h-full min-h-0 overflow-y-auto scrollbar-hide pr-1 space-y-4">
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className={cardCls} style={cardStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">{k.label}</p>
                </div>
                <p className="text-[18px] font-bold text-foreground tabular-nums">{k.val}</p>
              </div>
            ))}
          </div>

          {/* Usage trend chart */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Daily Usage Trend</h3>
                <p className="text-[11px] text-muted-foreground/70">
                  Combined ingredient consumption {range === "today" ? "(last 14 days)" : range === "weekly" ? "(last 7 days)" : "(last 14 days)"}
                </p>
              </div>
              {anomaly && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <TrendingUp className="w-3 h-3 text-red-400" />
                  <span className="text-[11px] font-semibold text-red-400">+{Math.abs(anomaly.deficit)} @ {anomaly.label}</span>
                </div>
              )}
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={usageTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invUsageBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="usage" fill="url(#invUsageBar)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                  <Line type="monotone" dataKey="baseline" stroke="rgba(244,114,182,0.85)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock levels table + Category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`${cardCls} lg:col-span-2`} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Stock Levels</h3>
              </div>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground/70 text-left">
                      <th className="py-2 pr-3 font-semibold">Product</th>
                      <th className="py-2 pr-3 font-semibold">Category</th>
                      <th className="py-2 pr-3 font-semibold text-right">On Hand</th>
                      <th className="py-2 pr-3 font-semibold text-right">Daily Use</th>
                      <th className="py-2 pr-3 font-semibold text-right">Days Left</th>
                      <th className="py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => {
                      const s = statusOf(i);
                      const meta = STATUS_META[s];
                      const days = daysLeftOf(i);
                      return (
                        <tr key={i.name} className="border-t border-white/5">
                          <td className="py-2 pr-3 text-foreground/90 font-medium">{i.name}</td>
                          <td className="py-2 pr-3 text-muted-foreground/80">{i.category}</td>
                          <td className="py-2 pr-3 text-right tabular-nums text-foreground/85">{fmtQty(i.current, i.unit)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground/80">{fmtQty(i.dailyUsage, i.unit)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums text-foreground/85">
                            {Number.isFinite(days) ? `${days.toFixed(1)}d` : "—"}
                          </td>
                          <td className="py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${meta.color} ${meta.bg} ${meta.ring}`}>
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={cardCls} style={cardStyle}>
              <h3 className="text-sm font-semibold text-foreground mb-2">Inventory Value by Category</h3>
              {categoryPie.length ? (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {categoryPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: any) => `$${Number(v).toFixed(0)}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground/60 py-10 text-center">No category data.</p>
              )}
            </div>
          </div>

          {/* Smart alerts + Replenishment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Smart Alerts</h3>
              </div>
              {alerts.length ? (
                <ul className="space-y-2">
                  {alerts.map((a, i) => {
                    const tone = a.kind === "out" || a.kind === "low" ? "amber" : a.kind === "price" ? "red" : "sky";
                    const ring = tone === "amber" ? "border-amber-500/25 bg-amber-500/5" : tone === "red" ? "border-red-500/25 bg-red-500/5" : "border-sky-500/25 bg-sky-500/5";
                    const dot = tone === "amber" ? "text-amber-400" : tone === "red" ? "text-red-400" : "text-sky-400";
                    return (
                      <li key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border ${ring}`}>
                        <Bell className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${dot}`} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-foreground/90">{a.text}</p>
                          <p className="text-[11px] text-muted-foreground/70 truncate">{a.sub}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground/60">All inventory looks healthy — no alerts.</p>
              )}
            </div>

            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Smart Replenishment</h3>
              </div>
              {replenishment.length ? (
                <ul className="space-y-2">
                  {replenishment.map((r, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-foreground/90 truncate">Reorder {r.qty} of {r.name}</p>
                        <p className="text-[11px] text-muted-foreground/70 truncate">{r.reason}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-primary shrink-0">{r.when}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground/60">No reorders recommended right now.</p>
              )}
            </div>
          </div>

          {/* Forecast + AI insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-foreground">Predictive Depletion Forecast</h3>
              </div>
              <ul className="space-y-2">
                {forecast.map((f) => {
                  const tone = f.days < 1 ? "red" : f.days < 3 ? "amber" : "emerald";
                  const colorCls = tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-300" : "text-emerald-300";
                  return (
                    <li key={f.name} className="flex items-center justify-between text-[12px]">
                      <span className="text-foreground/85 truncate pr-2">{f.name}</span>
                      <span className={`font-semibold tabular-nums shrink-0 ${colorCls}`}>
                        {Number.isFinite(f.days) ? `~${f.days.toFixed(1)} days` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">AI Insights & Suggestions</h3>
              </div>
              {insights.length ? (
                <ul className="space-y-2">
                  {insights.map((line, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                      <span className="text-amber-400/80 mt-1 text-[10px]">●</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground/60">No insights right now.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating composer */}
      {isMobile && (
        <div className="lg:hidden shrink-0 px-4 pb-4 pt-2 border-t border-white/5 space-y-2 bg-background">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                disabled={chatBusy}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-foreground/80 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="relative w-full">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI about your inventory..."
              className="w-full bg-white/[0.04] border border-white/5 rounded-full pl-4 pr-12 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={chatBusy || !input.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
              aria-label="Send"
            >
              {chatBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {messages.length > 1 && (
            <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2" ref={scrollRef}>
              {messages.slice(-2).map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-[12px] ${
                    m.role === "user" ? "bg-primary/90 text-primary-foreground" : "bg-white/[0.04] text-foreground/90 border border-white/5"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
