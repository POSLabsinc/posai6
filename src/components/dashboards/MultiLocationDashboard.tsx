import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
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
  Package,
  Users,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type RangeKey = "today" | "weekly" | "monthly";
type ViewMode = "combined" | "by-location";
type Shift = "Morning" | "Lunch" | "Dinner" | "All";
interface ChatMsg { role: "user" | "assistant"; content: string }

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const SHIFTS: Shift[] = ["All", "Morning", "Lunch", "Dinner"];

const SUGGESTIONS = [
  "Which location is underperforming?",
  "Why is profit low at Airport?",
  "Which location needs replenishment?",
  "Compare food cost across locations",
];

type LocRow = {
  location: string;
  shift: Exclude<Shift, "All">;
  revenue: number;
  foodCost: number;
  laborCost: number;
  inventoryLevel: number; // % of par
  alerts: number;
};

const DATA: LocRow[] = [
  // Downtown — strong performer
  { location: "Downtown", shift: "Morning", revenue: 2100, foodCost: 620,  laborCost: 540, inventoryLevel: 82, alerts: 0 },
  { location: "Downtown", shift: "Lunch",   revenue: 4850, foodCost: 1480, laborCost: 980, inventoryLevel: 78, alerts: 0 },
  { location: "Downtown", shift: "Dinner",  revenue: 5200, foodCost: 1980, laborCost: 1450, inventoryLevel: 71, alerts: 1 },
  // Airport — high food cost
  { location: "Airport",  shift: "Morning", revenue: 1750, foodCost: 640,  laborCost: 480, inventoryLevel: 64, alerts: 1 },
  { location: "Airport",  shift: "Lunch",   revenue: 3980, foodCost: 1620, laborCost: 860, inventoryLevel: 58, alerts: 1 },
  { location: "Airport",  shift: "Dinner",  revenue: 4100, foodCost: 1740, laborCost: 1020, inventoryLevel: 49, alerts: 2 },
  // Westside — low sales / underperforming
  { location: "Westside", shift: "Morning", revenue: 1200, foodCost: 470,  laborCost: 410, inventoryLevel: 88, alerts: 0 },
  { location: "Westside", shift: "Lunch",   revenue: 2450, foodCost: 1050, laborCost: 760, inventoryLevel: 84, alerts: 0 },
  { location: "Westside", shift: "Dinner",  revenue: 3120, foodCost: 1310, laborCost: 1120, inventoryLevel: 80, alerts: 0 },
];

const CATEGORIES = ["All", "Food", "Beverage", "Dessert"] as const;

const fmt$ = (n: number) => `$${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

export const MultiLocationDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("today");
  const [view, setView] = useState<ViewMode>("combined");
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [shiftFilter, setShiftFilter] = useState<Shift>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const locations = useMemo(() => Array.from(new Set(DATA.map((d) => d.location))), []);

  // Filtered rows
  const rows = useMemo(() => {
    const mult = range === "today" ? 1 : range === "weekly" ? 7 : 30;
    const catMult = categoryFilter === "All" ? 1 : categoryFilter === "Food" ? 0.6 : categoryFilter === "Beverage" ? 0.25 : 0.15;
    return DATA.filter((r) => locationFilter === "All" || r.location === locationFilter)
      .filter((r) => shiftFilter === "All" || r.shift === shiftFilter)
      .map((r) => ({
        ...r,
        revenue: Math.round(r.revenue * mult * catMult),
        foodCost: Math.round(r.foodCost * mult * catMult),
        laborCost: Math.round(r.laborCost * mult * catMult),
      }));
  }, [range, locationFilter, shiftFilter, categoryFilter, tick]);

  // Aggregate by location
  const byLocation = useMemo(() => {
    const map = new Map<string, { location: string; revenue: number; foodCost: number; laborCost: number; inventoryLevel: number; alerts: number; count: number }>();
    for (const r of rows) {
      const cur = map.get(r.location) || { location: r.location, revenue: 0, foodCost: 0, laborCost: 0, inventoryLevel: 0, alerts: 0, count: 0 };
      cur.revenue += r.revenue;
      cur.foodCost += r.foodCost;
      cur.laborCost += r.laborCost;
      cur.inventoryLevel += r.inventoryLevel;
      cur.alerts += r.alerts;
      cur.count += 1;
      map.set(r.location, cur);
    }
    return Array.from(map.values()).map((v) => {
      const profit = v.revenue - v.foodCost - v.laborCost;
      const margin = v.revenue ? (profit / v.revenue) * 100 : 0;
      const foodPct = v.revenue ? (v.foodCost / v.revenue) * 100 : 0;
      const laborPct = v.revenue ? (v.laborCost / v.revenue) * 100 : 0;
      const inv = v.count ? v.inventoryLevel / v.count : 0;
      return { ...v, profit, margin, foodPct, laborPct, inv };
    }).sort((a, b) => b.profit - a.profit);
  }, [rows]);

  const totals = useMemo(() => {
    const revenue = rows.reduce((s, r) => s + r.revenue, 0);
    const foodCost = rows.reduce((s, r) => s + r.foodCost, 0);
    const laborCost = rows.reduce((s, r) => s + r.laborCost, 0);
    const profit = revenue - foodCost - laborCost;
    const foodPct = revenue ? (foodCost / revenue) * 100 : 0;
    const laborPct = revenue ? (laborCost / revenue) * 100 : 0;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    const alerts = rows.reduce((s, r) => s + r.alerts, 0);
    const inv = rows.length ? rows.reduce((s, r) => s + r.inventoryLevel, 0) / rows.length : 0;
    return { revenue, foodCost, laborCost, profit, foodPct, laborPct, margin, alerts, inv };
  }, [rows]);

  const best = byLocation[0];
  const worst = byLocation[byLocation.length - 1];

  // Anomalies across locations
  type Anomaly = { kind: "sales" | "food" | "labor" | "inventory"; severity: "high" | "med"; text: string; sub: string };
  const anomalies = useMemo<Anomaly[]>(() => {
    const out: Anomaly[] = [];
    if (best && worst && best.location !== worst.location) {
      const dropPct = ((worst.revenue - best.revenue) / best.revenue) * 100;
      if (dropPct < -15) out.push({
        kind: "sales", severity: "high",
        text: `${worst.location} sales ${pct(Math.abs(dropPct))} below ${best.location}`,
        sub: `${fmt$(worst.revenue)} vs ${fmt$(best.revenue)} — review marketing & staffing`,
      });
    }
    for (const l of byLocation) {
      if (l.foodPct > 35) out.push({
        kind: "food", severity: "med",
        text: `High food cost at ${l.location}`,
        sub: `Food cost ${pct(l.foodPct)} of revenue (target ≤ 32%)`,
      });
      if (l.laborPct > 28) out.push({
        kind: "labor", severity: "med",
        text: `High labor ratio at ${l.location}`,
        sub: `Labor ${pct(l.laborPct)} of revenue (target ≤ 26%)`,
      });
      if (l.inv < 60) out.push({
        kind: "inventory", severity: "high",
        text: `Inventory low at ${l.location}`,
        sub: `Avg stock ${pct(l.inv)} of par — replenish within 6 hours`,
      });
    }
    return out.slice(0, 5);
  }, [byLocation, best, worst]);

  const insights = useMemo<string[]>(() => {
    const out: string[] = [];
    if (best) out.push(`${best.location} is the top location with ${fmt$(best.profit)} profit (${pct(best.margin)} margin).`);
    if (worst && best && worst.location !== best.location) out.push(`${worst.location} trails at ${fmt$(worst.profit)} — investigate dinner shift performance.`);
    const highFood = byLocation.find((l) => l.foodPct > 35);
    if (highFood) out.push(`${highFood.location} has unusually high food cost (${pct(highFood.foodPct)}). Consider supplier review.`);
    const lowInv = byLocation.find((l) => l.inv < 60);
    if (lowInv) out.push(`Replenish ${lowInv.location} within 6 hours — stock at ${pct(lowInv.inv)} of par.`);
    return out.slice(0, 4);
  }, [byLocation, best, worst]);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me about location performance, anomalies, or replenishment. I only use the data shown above." },
  ]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, chatBusy]);

  const answerLocally = (q: string): string => {
    const ql = q.toLowerCase();
    if (ql.includes("underperform") || ql.includes("worst") || ql.includes("low")) {
      if (!worst) return "No data.";
      return `${worst.location} is underperforming with ${fmt$(worst.revenue)} revenue and ${fmt$(worst.profit)} profit (${pct(worst.margin)} margin). Likely causes: lower foot traffic and weaker dinner mix.`;
    }
    if (ql.includes("why") && (ql.includes("profit") || ql.includes("low"))) {
      const loc = locations.find((l) => ql.includes(l.toLowerCase())) || worst?.location;
      const row = byLocation.find((l) => l.location === loc);
      if (!row) return "No data for that location.";
      const reasons: string[] = [];
      if (row.foodPct > 32) reasons.push(`food cost ${pct(row.foodPct)}`);
      if (row.laborPct > 26) reasons.push(`labor ${pct(row.laborPct)}`);
      if (row.alerts > 0) reasons.push(`${row.alerts} active alerts`);
      return `${row.location} profit is ${fmt$(row.profit)} (${pct(row.margin)} margin). Drivers: ${reasons.join(", ") || "lower revenue vs other locations"}.`;
    }
    if (ql.includes("replen") || ql.includes("inventory") || ql.includes("stock")) {
      const low = byLocation.filter((l) => l.inv < 70).sort((a, b) => a.inv - b.inv);
      if (!low.length) return "All locations are above 70% of par — no urgent replenishment needed.";
      return `Replenish: ${low.map((l) => `${l.location} (${pct(l.inv)} of par)`).join("; ")}.`;
    }
    if (ql.includes("food")) {
      const sorted = [...byLocation].sort((a, b) => b.foodPct - a.foodPct);
      return `Food cost ranking: ${sorted.map((l) => `${l.location} ${pct(l.foodPct)}`).join(", ")}.`;
    }
    if (ql.includes("labor")) {
      const sorted = [...byLocation].sort((a, b) => b.laborPct - a.laborPct);
      return `Labor ratio: ${sorted.map((l) => `${l.location} ${pct(l.laborPct)}`).join(", ")}.`;
    }
    if (ql.includes("compare") || ql.includes("best")) {
      return `Best: ${best?.location} (${fmt$(best?.profit || 0)}, ${pct(best?.margin || 0)}). Lowest: ${worst?.location} (${fmt$(worst?.profit || 0)}, ${pct(worst?.margin || 0)}).`;
    }
    return `Across ${byLocation.length} locations: revenue ${fmt$(totals.revenue)}, profit ${fmt$(totals.profit)} (${pct(totals.margin)} margin). Food ${pct(totals.foodPct)}, labor ${pct(totals.laborPct)}.`;
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

  const explainAnomaly = (a: { text: string; sub: string }) => ask(`Explain this anomaly: ${a.text}. ${a.sub}`);

  const cardCls = "rounded-2xl p-4";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  const kpis = [
    { label: "Total Revenue", val: fmt$(totals.revenue), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Net Profit", val: fmt$(totals.profit), icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Net Margin", val: pct(totals.margin), icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Food Cost %", val: pct(totals.foodPct), icon: Percent, color: totals.foodPct > 32 ? "text-red-400" : "text-amber-400", bg: totals.foodPct > 32 ? "bg-red-500/10" : "bg-amber-500/10" },
    { label: "Labor Cost %", val: pct(totals.laborPct), icon: Users, color: totals.laborPct > 26 ? "text-red-400" : "text-sky-400", bg: totals.laborPct > 26 ? "bg-red-500/10" : "bg-sky-500/10" },
    { label: "Avg Inventory", val: pct(totals.inv), icon: Package, color: totals.inv < 60 ? "text-red-400" : "text-emerald-400", bg: totals.inv < 60 ? "bg-red-500/10" : "bg-emerald-500/10" },
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
          <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-foreground tracking-tight truncate">Multi-Location Dashboard</h1>
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {byLocation.length} locations, auto-refresh 30s
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

      {/* Filters */}
      <div className="px-4 lg:px-6 mt-3 shrink-0">
        <div className={cardCls} style={cardStyle}>
          <div className="flex flex-wrap items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-white/5 rounded-full p-1">
              {(["combined", "by-location"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-[11px] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                    view === v ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  {v === "combined" ? "Combined" : "By Location"}
                </button>
              ))}
            </div>
            <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter} options={["All", ...locations]} />
            <FilterSelect label="Shift" value={shiftFilter} onChange={(v) => setShiftFilter(v as Shift)} options={SHIFTS} />
            <FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={[...CATEGORIES]} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 p-4 lg:p-6 overflow-hidden">
        <div className="h-full min-h-0 overflow-y-auto scrollbar-hide pr-1 space-y-4">
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

          {view === "combined" ? (
            <>
              {/* Revenue & Profit by location */}
              <div className={cardCls} style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Revenue & Profit by Location</h3>
                    <p className="text-[11px] text-muted-foreground/70">Cross-location comparison</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byLocation} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="location" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                      <Tooltip
                        contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: any) => fmt$(Number(v))}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost ratios */}
              <div className={cardCls} style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Food vs Labor Cost % by Location</h3>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byLocation} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="location" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} unit="%" />
                      <Tooltip
                        contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: any) => pct(Number(v))}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="foodPct" name="Food %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="laborPct" name="Labor %" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            /* By-location detail cards */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {byLocation.map((l, idx) => (
                <button
                  key={l.location}
                  onClick={() => { setView("combined"); setLocationFilter(l.location); }}
                  className={`${cardCls} text-left hover:bg-white/[0.05] transition-colors`}
                  style={cardStyle}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{l.location}</p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {idx === 0 ? "Top performer" : idx === byLocation.length - 1 ? "Lowest" : "Mid-tier"}
                        </p>
                      </div>
                    </div>
                    {l.alerts > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-red-300 font-semibold">{l.alerts}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <Stat label="Revenue" value={fmt$(l.revenue)} />
                    <Stat label="Profit" value={fmt$(l.profit)} accent={l.profit > 0 ? "text-emerald-400" : "text-red-400"} />
                    <Stat label="Margin" value={pct(l.margin)} />
                    <Stat label="Food %" value={pct(l.foodPct)} accent={l.foodPct > 32 ? "text-red-400" : undefined} />
                    <Stat label="Labor %" value={pct(l.laborPct)} accent={l.laborPct > 26 ? "text-red-400" : undefined} />
                    <Stat label="Inventory" value={pct(l.inv)} accent={l.inv < 60 ? "text-red-400" : "text-emerald-400"} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Anomalies + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-foreground">AI Cross-Location Anomalies</h3>
              </div>
              {anomalies.length ? (
                <ul className="space-y-2">
                  {anomalies.map((a, i) => (
                    <li key={i}>
                      <button
                        onClick={() => explainAnomaly(a)}
                        className="w-full text-left flex gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                      >
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full ${a.severity === "high" ? "bg-red-400" : "bg-amber-400"}`} />
                        <span className="flex-1 min-w-0">
                          <p className="text-[12.5px] text-foreground/90 font-medium">{a.text}</p>
                          <p className="text-[11px] text-muted-foreground/70 truncate">{a.sub}</p>
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0 self-center">Ask AI →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground/60">No anomalies detected across locations.</p>
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
            placeholder="Ask AI about locations, anomalies, or replenishment..."
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

const FilterSelect = ({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <label className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
    <span className="uppercase tracking-wider font-semibold">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#1c1c1e]">{o}</option>
      ))}
    </select>
  </label>
);

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">{label}</span>
    <span className={`text-[13px] font-semibold tabular-nums ${accent || "text-foreground"}`}>{value}</span>
  </div>
);

export default MultiLocationDashboard;
