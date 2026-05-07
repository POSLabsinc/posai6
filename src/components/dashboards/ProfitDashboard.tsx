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
  ChevronLeft,
  Bell,
  DollarSign,
  Percent,
  Wallet,
  Building2,
  Sun,
  Moon,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  MultiLocationFilters,
  DEFAULT_ML_FILTERS,
  useFilteredLocations,
  type MultiLocationFiltersState,
} from "./MultiLocationFilters";

type RangeKey = "today" | "weekly" | "monthly";
interface ChatMsg { role: "user" | "assistant"; content: string }

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const SUGGESTIONS = [
  "Why is today's profit lower?",
  "Which shift performed best?",
  "What caused high labor costs?",
  "Which location is most profitable?",
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#a78bfa"];

// ===== Mock data (deterministic so AI answers match what's shown) =====
type Shift = "Morning" | "Lunch" | "Dinner";
type ShiftRow = {
  shift: Shift;
  location: string;
  revenue: number;
  foodCost: number;
  laborCost: number;
  otherCost: number;
  discounts: number;
  refunds: number;
};

const SHIFT_DATA: ShiftRow[] = [
  { shift: "Morning", location: "Downtown",  revenue: 2100, foodCost: 620,  laborCost: 540, otherCost: 180, discounts: 45,  refunds: 20 },
  { shift: "Lunch",   location: "Downtown",  revenue: 4850, foodCost: 1480, laborCost: 980, otherCost: 320, discounts: 120, refunds: 60 },
  { shift: "Dinner",  location: "Downtown",  revenue: 5200, foodCost: 1980, laborCost: 1450,otherCost: 380, discounts: 210, refunds: 340 },
  { shift: "Morning", location: "Airport",   revenue: 1750, foodCost: 510,  laborCost: 480, otherCost: 150, discounts: 30,  refunds: 15 },
  { shift: "Lunch",   location: "Airport",   revenue: 3980, foodCost: 1280, laborCost: 860, otherCost: 280, discounts: 95,  refunds: 40 },
  { shift: "Dinner",  location: "Airport",   revenue: 4100, foodCost: 1320, laborCost: 1020,otherCost: 310, discounts: 140, refunds: 80 },
  { shift: "Morning", location: "Westside",  revenue: 1620, foodCost: 470,  laborCost: 410, otherCost: 140, discounts: 25,  refunds: 10 },
  { shift: "Lunch",   location: "Westside",  revenue: 3450, foodCost: 1050, laborCost: 760, otherCost: 240, discounts: 80,  refunds: 35 },
  { shift: "Dinner",  location: "Westside",  revenue: 4720, foodCost: 1510, laborCost: 1120,otherCost: 330, discounts: 160, refunds: 90 },
];

const fmt$ = (n: number) => `$${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

export const ProfitDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("today");
  const [tick, setTick] = useState(0);
  const [mlFilters, setMlFilters] = useState<MultiLocationFiltersState>(DEFAULT_ML_FILTERS);
  const { rows: locationRows, scale: locationScale } = useFilteredLocations(mlFilters);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  // ===== Derived totals =====
  const totals = useMemo(() => {
    const mult = (range === "today" ? 1 : range === "weekly" ? 7 : 30) * locationScale;
    const revenue = SHIFT_DATA.reduce((s, r) => s + r.revenue, 0) * mult;
    const foodCost = SHIFT_DATA.reduce((s, r) => s + r.foodCost, 0) * mult;
    const laborCost = SHIFT_DATA.reduce((s, r) => s + r.laborCost, 0) * mult;
    const otherCost = SHIFT_DATA.reduce((s, r) => s + r.otherCost, 0) * mult;
    const discounts = SHIFT_DATA.reduce((s, r) => s + r.discounts, 0) * mult;
    const refunds = SHIFT_DATA.reduce((s, r) => s + r.refunds, 0) * mult;
    const grossProfit = revenue - foodCost;
    const netProfit = revenue - foodCost - laborCost - otherCost - discounts - refunds;
    const foodCostPct = revenue ? (foodCost / revenue) * 100 : 0;
    const laborCostPct = revenue ? (laborCost / revenue) * 100 : 0;
    const grossMarginPct = revenue ? (grossProfit / revenue) * 100 : 0;
    const netMarginPct = revenue ? (netProfit / revenue) * 100 : 0;
    return { revenue, foodCost, laborCost, otherCost, discounts, refunds, grossProfit, netProfit, foodCostPct, laborCostPct, grossMarginPct, netMarginPct };
  }, [range, tick, locationScale]);

  // Profit by shift
  const byShift = useMemo(() => {
    const map = new Map<Shift, { shift: Shift; revenue: number; cost: number; profit: number }>();
    for (const r of SHIFT_DATA) {
      const cur = map.get(r.shift) || { shift: r.shift, revenue: 0, cost: 0, profit: 0 };
      cur.revenue += r.revenue;
      cur.cost += r.foodCost + r.laborCost + r.otherCost + r.discounts + r.refunds;
      cur.profit = cur.revenue - cur.cost;
      map.set(r.shift, cur);
    }
    return Array.from(map.values());
  }, [tick]);

  // Profit by location
  const byLocation = useMemo(() => {
    const map = new Map<string, { location: string; revenue: number; cost: number; profit: number; margin: number }>();
    for (const r of SHIFT_DATA) {
      const cur = map.get(r.location) || { location: r.location, revenue: 0, cost: 0, profit: 0, margin: 0 };
      cur.revenue += r.revenue;
      cur.cost += r.foodCost + r.laborCost + r.otherCost + r.discounts + r.refunds;
      cur.profit = cur.revenue - cur.cost;
      cur.margin = (cur.profit / cur.revenue) * 100;
      map.set(r.location, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [tick]);

  const bestShift = useMemo(() => [...byShift].sort((a, b) => b.profit - a.profit)[0], [byShift]);
  const worstShift = useMemo(() => [...byShift].sort((a, b) => a.profit - b.profit)[0], [byShift]);
  const bestLocation = byLocation[0];
  const worstLocation = byLocation[byLocation.length - 1];

  // Profit trend (last 14 days, deterministic)
  const profitTrend = useMemo(() => {
    const days = range === "today" ? 7 : range === "weekly" ? 14 : 14;
    const baseProfit = totals.netProfit / (range === "today" ? 1 : range === "weekly" ? 7 : 30);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const noise = ((i * 13) % 17 - 8) / 100; // -8%..+8%
      const dip = i === days - 2 ? -0.18 : 0; // anomaly: yesterday dipped 18%
      const profit = Math.round(baseProfit * (1 + noise + dip));
      const target = Math.round(baseProfit * 1.05);
      return { label: d.toISOString().slice(5, 10), profit, target, anomaly: dip !== 0 };
    });
  }, [range, totals.netProfit]);

  // Cost breakdown pie
  const costPie = useMemo(() => ([
    { name: "Food", value: Math.round(totals.foodCost) },
    { name: "Labor", value: Math.round(totals.laborCost) },
    { name: "Other", value: Math.round(totals.otherCost) },
    { name: "Discounts", value: Math.round(totals.discounts) },
    { name: "Refunds", value: Math.round(totals.refunds) },
  ]), [totals]);

  // ===== Anomalies (deterministic, derived from visible data) =====
  type Anomaly = { kind: "profit" | "food" | "labor" | "refund" | "discount"; severity: "high" | "med"; text: string; sub: string };
  const anomalies = useMemo<Anomaly[]>(() => {
    const out: Anomaly[] = [];

    // Profit dip on trend
    const dip = profitTrend.find((p) => p.anomaly);
    if (dip) out.push({
      kind: "profit", severity: "high",
      text: `Net profit dropped on ${dip.label}`,
      sub: `${fmt$(dip.profit)} vs target ${fmt$(dip.target)} — ${pct(((dip.profit - dip.target) / dip.target) * 100)} variance`,
    });

    // Food cost too high on a shift
    for (const r of SHIFT_DATA) {
      const fcPct = (r.foodCost / r.revenue) * 100;
      if (fcPct > 35) out.push({
        kind: "food", severity: "med",
        text: `High food cost on ${r.shift} at ${r.location}`,
        sub: `Food cost ${pct(fcPct)} of revenue (target ≤ 32%)`,
      });
    }

    // Labor cost ratio
    for (const r of SHIFT_DATA) {
      const lcPct = (r.laborCost / r.revenue) * 100;
      if (lcPct > 28) out.push({
        kind: "labor", severity: "med",
        text: `Labor cost exceeding sales ratio at ${r.location} (${r.shift})`,
        sub: `Labor ${pct(lcPct)} of revenue (target ≤ 26%)`,
      });
    }

    // Excessive refunds
    for (const r of SHIFT_DATA) {
      const refPct = (r.refunds / r.revenue) * 100;
      if (refPct > 5) out.push({
        kind: "refund", severity: "high",
        text: `Excessive refunds on ${r.shift} at ${r.location}`,
        sub: `${fmt$(r.refunds)} refunded (${pct(refPct)} of shift revenue)`,
      });
    }

    return out.slice(0, 5);
  }, [profitTrend]);

  // ===== AI insights (local) =====
  const insights = useMemo<string[]>(() => {
    const out: string[] = [];
    if (bestShift) out.push(`${bestShift.shift} is your best shift overall with ${fmt$(bestShift.profit)} profit.`);
    if (worstShift && bestShift && worstShift.shift !== bestShift.shift) out.push(`${worstShift.shift} underperforms at ${fmt$(worstShift.profit)} — review staffing and product mix.`);
    if (bestLocation) out.push(`${bestLocation.location} leads on margin (${pct(bestLocation.margin)}); replicate its ops at ${worstLocation?.location}.`);
    if (totals.foodCostPct > 30) out.push(`Food cost is ${pct(totals.foodCostPct)} of revenue — promote higher-margin products to lower it.`);
    if (totals.laborCostPct > 26) out.push(`Labor cost is ${pct(totals.laborCostPct)} — reduce overstaffing during slow hours.`);
    return out.slice(0, 4);
  }, [totals, bestShift, worstShift, bestLocation, worstLocation]);

  // ===== Chat =====
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me about today's profit, shift performance, or anomalies. I only use the data shown above." },
  ]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, chatBusy]);

  const answerLocally = (q: string): string => {
    const ql = q.toLowerCase();
    if (ql.includes("lower") || ql.includes("drop") || ql.includes("why")) {
      const dip = profitTrend.find((p) => p.anomaly);
      const refundShift = SHIFT_DATA.find((r) => (r.refunds / r.revenue) * 100 > 5);
      const parts: string[] = [];
      if (dip) parts.push(`Profit on ${dip.label} came in at ${fmt$(dip.profit)} vs target ${fmt$(dip.target)}.`);
      if (refundShift) parts.push(`Main driver: ${refundShift.shift} at ${refundShift.location} had ${fmt$(refundShift.refunds)} in refunds (${pct((refundShift.refunds / refundShift.revenue) * 100)} of revenue).`);
      if (totals.foodCostPct > 30) parts.push(`Food cost also elevated at ${pct(totals.foodCostPct)}.`);
      return parts.join(" ") || "No significant profit drop detected in the visible window.";
    }
    if (ql.includes("best") && (ql.includes("shift") || ql.includes("perform"))) {
      return bestShift ? `${bestShift.shift} is the top shift with ${fmt$(bestShift.profit)} profit on ${fmt$(bestShift.revenue)} revenue.` : "No shift data.";
    }
    if (ql.includes("labor")) {
      const high = SHIFT_DATA.map((r) => ({ r, lcPct: (r.laborCost / r.revenue) * 100 })).filter((x) => x.lcPct > 26).sort((a, b) => b.lcPct - a.lcPct)[0];
      if (high) return `Highest labor ratio is ${high.r.shift} at ${high.r.location} (${pct(high.lcPct)}). Likely cause: overstaffing for the shift's revenue. Consider trimming one role.`;
      return `Labor cost overall is ${pct(totals.laborCostPct)} of revenue — within target.`;
    }
    if (ql.includes("location") || ql.includes("store")) {
      return `Best: ${bestLocation?.location} (${pct(bestLocation?.margin || 0)} margin, ${fmt$(bestLocation?.profit || 0)} profit). Lowest: ${worstLocation?.location} (${pct(worstLocation?.margin || 0)}).`;
    }
    if (ql.includes("food")) {
      return `Food cost is ${pct(totals.foodCostPct)} of revenue (${fmt$(totals.foodCost)}). Watch dinner shifts — they run highest.`;
    }
    if (ql.includes("refund")) {
      const refunds = SHIFT_DATA.filter((r) => (r.refunds / r.revenue) * 100 > 5);
      if (!refunds.length) return "No shift has unusually high refund activity.";
      return `Elevated refunds: ${refunds.map((r) => `${r.shift} @ ${r.location} (${fmt$(r.refunds)})`).join("; ")}.`;
    }
    return `Net profit is ${fmt$(totals.netProfit)} on ${fmt$(totals.revenue)} revenue (${pct(totals.netMarginPct)} margin). Food ${pct(totals.foodCostPct)}, labor ${pct(totals.laborCostPct)}.`;
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

  const explainAnomaly = (a: { text: string; sub: string }) => {
    ask(`Explain this anomaly: ${a.text}. ${a.sub}`);
  };

  const cardCls = "rounded-2xl p-4";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  const kpis = [
    { label: "Revenue", val: fmt$(totals.revenue), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Gross Profit", val: fmt$(totals.grossProfit), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Net Profit", val: fmt$(totals.netProfit), icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Food Cost %", val: pct(totals.foodCostPct), icon: Utensils, color: totals.foodCostPct > 32 ? "text-red-400" : "text-amber-400", bg: totals.foodCostPct > 32 ? "bg-red-500/10" : "bg-amber-500/10" },
    { label: "Labor Cost %", val: pct(totals.laborCostPct), icon: Percent, color: totals.laborCostPct > 26 ? "text-red-400" : "text-sky-400", bg: totals.laborCostPct > 26 ? "bg-red-500/10" : "bg-sky-500/10" },
    { label: "Net Margin", val: pct(totals.netMarginPct), icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  const shiftIcon = (s: Shift) => s === "Morning" ? Sun : s === "Lunch" ? Utensils : Moon;

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 lg:px-6 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-bold text-foreground tracking-tight truncate">Real-Time Profit Monitoring</h1>
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Auto-refreshing every 30s</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-white/5 rounded-full p-1 flex-1 md:flex-none overflow-x-auto scrollbar-hide">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`text-[11px] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap flex-1 md:flex-none ${
                  range === r.key ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTick((t) => t + 1)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0"
            aria-label="Refresh now"
          >
            <RefreshCw className="w-4 h-4 text-foreground/80" />
          </button>
        </div>
      </div>

      {/* Anomaly banner */}
      {anomalies.length > 0 && (
        <button
          onClick={() => explainAnomaly(anomalies[0])}
          className="mx-4 lg:mx-6 mt-3 shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 transition-colors text-left"
        >
          <Bell className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-red-300">{anomalies[0].text}</p>
            <p className="text-[11px] text-red-200/70 truncate">{anomalies[0].sub}</p>
          </div>
          <span className="text-[11px] text-red-300/80 font-medium shrink-0">Open chat →</span>
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 p-4 lg:p-6 overflow-hidden">
        <div className="h-full min-h-0 overflow-y-auto scrollbar-hide pr-1 space-y-4">
          <MultiLocationFilters
            filters={mlFilters}
            onChange={setMlFilters}
            rows={locationRows}
            metric="profit"
            onAskAI={ask}
          />
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

          {/* Profit trend */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Profit Trend vs Target</h3>
                <p className="text-[11px] text-muted-foreground/70">Net profit per day with anomalies highlighted</p>
              </div>
              {anomalies.find((a) => a.kind === "profit") && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-[11px] font-semibold text-red-400">Anomaly detected</span>
                </div>
              )}
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profitTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => fmt$(Number(v))}
                  />
                  <Bar dataKey="profit" radius={[6, 6, 0, 0]} maxBarSize={20}>
                    {profitTrend.map((p, i) => (
                      <Cell key={i} fill={p.anomaly ? "#ef4444" : "url(#profitBar)"} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="target" stroke="rgba(244,114,182,0.85)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shift breakdown + Cost pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`${cardCls} lg:col-span-2`} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Profit by Shift</h3>
              </div>
              <div className="space-y-2.5">
                {byShift.map((s) => {
                  const Icon = shiftIcon(s.shift);
                  const margin = (s.profit / s.revenue) * 100;
                  const isBest = bestShift?.shift === s.shift;
                  const isWorst = worstShift?.shift === s.shift && bestShift?.shift !== s.shift;
                  const tone = isBest ? "border-emerald-500/30 bg-emerald-500/5" : isWorst ? "border-red-500/25 bg-red-500/5" : "border-white/5 bg-white/[0.03]";
                  const toneText = isBest ? "text-emerald-300" : isWorst ? "text-red-300" : "text-foreground/85";
                  return (
                    <div key={s.shift} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${tone}`}>
                      <Icon className="w-4 h-4 text-foreground/70 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-foreground/90">{s.shift}</p>
                          {isBest && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Best</span>}
                          {isWorst && <span className="text-[10px] font-semibold uppercase tracking-wider text-red-300">Lowest</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground/70">Revenue {fmt$(s.revenue)} • Margin {pct(margin)}</p>
                      </div>
                      <p className={`text-[14px] font-bold tabular-nums shrink-0 ${toneText}`}>{fmt$(s.profit)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cardCls} style={cardStyle}>
              <h3 className="text-sm font-semibold text-foreground mb-2">Cost Breakdown</h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {costPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: any) => fmt$(Number(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Location breakdown */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Profit by Location</h3>
            </div>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground/70 text-left">
                    <th className="py-2 pr-3 font-semibold">Location</th>
                    <th className="py-2 pr-3 font-semibold text-right">Revenue</th>
                    <th className="py-2 pr-3 font-semibold text-right">Cost</th>
                    <th className="py-2 pr-3 font-semibold text-right">Profit</th>
                    <th className="py-2 pr-3 font-semibold text-right">Margin</th>
                    <th className="py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {byLocation.map((l, idx) => {
                    const isBest = idx === 0;
                    const isWorst = idx === byLocation.length - 1;
                    return (
                      <tr key={l.location} className="border-t border-white/5">
                        <td className="py-2 pr-3 text-foreground/90 font-medium">{l.location}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground/85">{fmt$(l.revenue)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground/80">{fmt$(l.cost)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground/90 font-semibold">{fmt$(l.profit)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground/85">{pct(l.margin)}</td>
                        <td className="py-2">
                          {isBest && <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Best</span>}
                          {isWorst && <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/15 text-red-300 text-[10px] font-semibold">Lowest</span>}
                          {!isBest && !isWorst && <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-foreground/70 text-[10px] font-semibold">Stable</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomalies + Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">AI-Flagged Anomalies</h3>
              </div>
              {anomalies.length ? (
                <ul className="space-y-2">
                  {anomalies.map((a, i) => {
                    const tone = a.severity === "high" ? "border-red-500/25 bg-red-500/5" : "border-amber-500/25 bg-amber-500/5";
                    const dot = a.severity === "high" ? "text-red-400" : "text-amber-400";
                    return (
                      <li key={i}>
                        <button
                          onClick={() => explainAnomaly(a)}
                          className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl border ${tone} hover:bg-white/[0.04] transition-colors`}
                        >
                          <Bell className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-foreground/90">{a.text}</p>
                            <p className="text-[11px] text-muted-foreground/70 truncate">{a.sub}</p>
                          </div>
                          <span className="text-[11px] text-foreground/50 shrink-0">Explain →</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground/60">No anomalies detected — profit is on track.</p>
              )}
            </div>

            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">AI Insights & Recommendations</h3>
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

          {/* Inline conversation */}
          {messages.length > 1 && (
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
              </div>
              <div className="space-y-3">
                {messages.slice(1).map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-white/[0.04] text-foreground/90 border border-white/5"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatBusy && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/5 rounded-2xl px-3.5 py-2.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 px-4 lg:px-6 pb-4 pt-3 border-t border-white/5 bg-background space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
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
            placeholder="Ask AI about profit, shifts, or anomalies..."
            className="w-full bg-white/[0.04] border border-white/5 rounded-full pl-5 pr-14 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={chatBusy || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            aria-label="Send"
          >
            {chatBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfitDashboard;
