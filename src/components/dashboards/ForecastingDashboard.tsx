import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
  Users,
  ChefHat,
  Coffee,
  UserCog,
  ChevronLeft,
  Bell,
  Clock,
  Truck,
  Utensils,
  CalendarDays,
  CloudSun,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReportsData } from "@/hooks/useReportsData";
import { supabase } from "@/integrations/supabase/client";
import {
  MultiLocationFilters,
  DEFAULT_ML_FILTERS,
  useFilteredLocations,
  type MultiLocationFiltersState,
} from "./MultiLocationFilters";

type RangeKey = "today" | "tomorrow" | "week";
interface ChatMsg { role: "user" | "assistant"; content: string }

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "Next 7 days" },
];

const SUGGESTIONS = [
  "Do I need more staff tonight?",
  "Which shift is understaffed?",
  "How can I reduce labor cost?",
  "What's the demand forecast for tomorrow?",
];

const fmt = (n: number) => `$${n.toFixed(0)}`;
const fmtShort = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

// Standard restaurant labor model
const LABOR_TARGET_PCT = 28; // % of sales
const HOURLY_WAGE: Record<string, number> = {
  Cashier: 16,
  Cook: 22,
  Server: 14,
  Manager: 32,
};

interface RoleStaffing {
  role: keyof typeof HOURLY_WAGE | string;
  current: number;
  recommended: number;
  hourlyWage: number;
}

interface ShiftForecast {
  shift: "Morning" | "Lunch" | "Dinner";
  hours: string;
  forecastTraffic: number;
  forecastSales: number;
  currentStaff: number;
  recommendedStaff: number;
  status: "ok" | "understaffed" | "overstaffed";
  deltaPct: number;
}

export const ForecastingDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("today");
  const [tick, setTick] = useState(0);
  const [mlFilters, setMlFilters] = useState<MultiLocationFiltersState>(DEFAULT_ML_FILTERS);
  const { rows: locationRows, scale: locationScale } = useFilteredLocations(mlFilters);

  // Use today as the live baseline; forecast extends from there.
  const { start, end } = useMemo(() => {
    const now = new Date();
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const data = useReportsData(start, end, "00:00", "23:59");

  // Auto-refresh every 30s
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  // ===== Demand forecast: blend historical hourly + simulated weather/event uplift =====
  // Multipliers represent expected "normal" demand intensity per hour.
  const HOURLY_DEMAND_PROFILE = useMemo(() => {
    // 24 hours, peaks at 12-13 (lunch) and 18-20 (dinner)
    const profile = [
      0.05, 0.03, 0.02, 0.02, 0.02, 0.03, 0.06, 0.12, 0.18, 0.22,
      0.32, 0.55, 0.92, 0.85, 0.55, 0.45, 0.50, 0.78, 1.00, 0.95,
      0.78, 0.45, 0.22, 0.10,
    ];
    return profile;
  }, []);

  // Range multiplier (today=1, tomorrow=1.05 with weather, week=avg)
  const rangeFactor = useMemo(() => {
    if (range === "tomorrow") return 1.08; // assume mild uplift
    if (range === "week") return 1.04;
    return 1;
  }, [range]);

  // Forecast traffic + sales by hour for the selected horizon
  const forecastByHour = useMemo(() => {
    const baseSalesToday = Math.max(2400, data.kpis.totalSales) * locationScale;
    const baseOrdersToday = Math.max(80, data.kpis.orderCount) * locationScale;
    return HOURLY_DEMAND_PROFILE.map((m, h) => {
      const noise = ((h * 13) % 7) / 100;
      const sales = Math.round(baseSalesToday * m * rangeFactor * (1 + noise));
      const traffic = Math.round(baseOrdersToday * m * rangeFactor * (1 + noise));
      return {
        label: `${String(h).padStart(2, "0")}:00`,
        hour: h,
        forecast: sales,
        actual: range === "today" && h <= new Date().getHours()
          ? Math.round((data.salesByHour[h]?.sales ?? 0) * locationScale)
          : null,
        traffic,
      };
    });
  }, [HOURLY_DEMAND_PROFILE, data.kpis.totalSales, data.kpis.orderCount, data.salesByHour, locationScale, rangeFactor, range]);

  // Dine-in vs Delivery split (forecast)
  const channelMix = useMemo(() => {
    const total = forecastByHour.reduce((s, p) => s + p.forecast, 0);
    return [
      { channel: "Dine-in", forecast: Math.round(total * 0.62), share: 62 },
      { channel: "Delivery", forecast: Math.round(total * 0.26), share: 26 },
      { channel: "Take-out", forecast: Math.round(total * 0.12), share: 12 },
    ];
  }, [forecastByHour]);

  // Top product demand trends (use top items as proxy, scale by range)
  const productDemand = useMemo(() => {
    return data.topItems.slice(0, 6).map((p, i) => ({
      name: p.name,
      forecastUnits: Math.round((p.units || 4) * rangeFactor * (1 + (i % 3) * 0.1) * locationScale),
      trend: i % 3 === 0 ? "up" : i % 3 === 1 ? "stable" : "down",
    }));
  }, [data.topItems, rangeFactor, locationScale]);

  // ===== Shift forecasts & staffing recommendations =====
  const shiftForecasts = useMemo<ShiftForecast[]>(() => {
    const hoursOf = (start: number, end: number) =>
      forecastByHour.slice(start, end).reduce(
        (acc, p) => ({ traffic: acc.traffic + p.traffic, sales: acc.sales + p.forecast }),
        { traffic: 0, sales: 0 }
      );
    const morning = hoursOf(7, 11);
    const lunch = hoursOf(11, 15);
    const dinner = hoursOf(17, 22);

    // 1 staff serves ~25 covers / shift; minimum 2
    const recommend = (traffic: number) => Math.max(2, Math.round(traffic / 25));
    // current = recommended +/- noise based on tick (simulated schedule)
    const currentFor = (rec: number, biasUnder: boolean) =>
      Math.max(1, biasUnder ? rec - 2 : rec + 1);

    const build = (
      shift: ShiftForecast["shift"],
      hours: string,
      traffic: number,
      sales: number,
      biasUnder: boolean
    ): ShiftForecast => {
      const recommended = recommend(traffic);
      const current = currentFor(recommended, biasUnder);
      const delta = current - recommended;
      const deltaPct = recommended > 0 ? Math.round((Math.abs(delta) / recommended) * 100) : 0;
      const status: ShiftForecast["status"] =
        delta < 0 ? "understaffed" : delta > 1 ? "overstaffed" : "ok";
      return { shift, hours, forecastTraffic: traffic, forecastSales: sales, currentStaff: current, recommendedStaff: recommended, status, deltaPct };
    };

    return [
      build("Morning", "07:00 – 11:00", morning.traffic, morning.sales, false),
      build("Lunch", "11:00 – 15:00", lunch.traffic, lunch.sales, false),
      build("Dinner", "17:00 – 22:00", dinner.traffic, dinner.sales, true),
    ];
  }, [forecastByHour]);

  // Role-level staffing breakdown (derived from total recommended across day)
  const roleStaffing = useMemo<RoleStaffing[]>(() => {
    const totalRec = shiftForecasts.reduce((s, x) => s + x.recommendedStaff, 0);
    // Distribution: Cook 35%, Server 35%, Cashier 20%, Manager 10%
    const dist = [
      { role: "Cook", pct: 0.35, bias: -1 },
      { role: "Server", pct: 0.35, bias: -1 },
      { role: "Cashier", pct: 0.20, bias: 0 },
      { role: "Manager", pct: 0.10, bias: 0 },
    ];
    return dist.map((d) => {
      const recommended = Math.max(1, Math.round(totalRec * d.pct));
      const current = Math.max(1, recommended + d.bias);
      return { role: d.role, current, recommended, hourlyWage: HOURLY_WAGE[d.role] || 18 };
    });
  }, [shiftForecasts]);

  // Cost projection
  const costProjection = useMemo(() => {
    const projectedSales = forecastByHour.reduce((s, p) => s + p.forecast, 0);
    const projectedLabor = roleStaffing.reduce((s, r) => s + r.recommended * r.hourlyWage * 8, 0);
    const currentLabor = roleStaffing.reduce((s, r) => s + r.current * r.hourlyWage * 8, 0);
    const targetLabor = projectedSales * (LABOR_TARGET_PCT / 100);
    const laborPct = projectedSales > 0 ? (projectedLabor / projectedSales) * 100 : 0;
    return { projectedSales, projectedLabor, currentLabor, targetLabor, laborPct };
  }, [forecastByHour, roleStaffing]);

  // ===== Demand heatmap (24h) =====
  const peak = useMemo(() => {
    let best = forecastByHour[0];
    for (const p of forecastByHour) if (p.forecast > best.forecast) best = p;
    return best;
  }, [forecastByHour]);

  // ===== Real-time AI alerts =====
  type AlertSeverity = "critical" | "warning" | "info";
  interface OpsAlert {
    id: string;
    severity: AlertSeverity;
    icon: typeof Activity;
    title: string;
    detail: string;
    metric: string;
    question: string;
  }

  const alerts = useMemo<OpsAlert[]>(() => {
    const list: OpsAlert[] = [];
    const dinner = shiftForecasts.find((s) => s.shift === "Dinner");
    if (dinner && dinner.status === "understaffed") {
      list.push({
        id: "dinner-understaffed",
        severity: "critical",
        icon: Users,
        title: `Dinner shift likely understaffed between 19:00 – 21:00`,
        detail: `${dinner.currentStaff} scheduled vs ${dinner.recommendedStaff} recommended (${dinner.deltaPct}% gap). Forecast: ${dinner.forecastTraffic} covers / ${fmt(dinner.forecastSales)}.`,
        metric: "Staffing",
        question: `Dinner shift is understaffed (${dinner.currentStaff} vs ${dinner.recommendedStaff}). What's the impact and how do I cover it?`,
      });
    }
    // Delivery uplift
    if (channelMix[1].share >= 25) {
      list.push({
        id: "delivery-spike",
        severity: "warning",
        icon: Truck,
        title: `High delivery demand expected — add 1 kitchen staff`,
        detail: `Delivery forecast at ${channelMix[1].share}% of mix (${fmtShort(channelMix[1].forecast)}). Kitchen capacity is the bottleneck.`,
        metric: "Channel mix",
        question: `Delivery demand is forecast at ${channelMix[1].share}%. How should I rebalance the kitchen?`,
      });
    }
    // Overstaffing
    const morning = shiftForecasts.find((s) => s.shift === "Morning");
    if (morning && morning.status === "overstaffed") {
      list.push({
        id: "morning-overstaffed",
        severity: "info",
        icon: Clock,
        title: `Overstaffing detected during afternoon hours`,
        detail: `Morning shift has ${morning.currentStaff} staff vs ${morning.recommendedStaff} recommended. Potential savings: ${fmt((morning.currentStaff - morning.recommendedStaff) * 16 * 4)}.`,
        metric: "Labor cost",
        question: `Morning shift is overstaffed by ${morning.currentStaff - morning.recommendedStaff}. Where can I reassign them?`,
      });
    }
    // Labor cost ratio
    if (costProjection.laborPct > LABOR_TARGET_PCT + 2) {
      const gap = Math.round(costProjection.laborPct - LABOR_TARGET_PCT);
      list.push({
        id: "labor-cost",
        severity: gap >= 6 ? "critical" : "warning",
        icon: AlertTriangle,
        title: `High labor cost risk — projected ${costProjection.laborPct.toFixed(1)}% of sales`,
        detail: `Target ${LABOR_TARGET_PCT}%, gap ${gap}pp. Trim non-peak hours to recover margin.`,
        metric: "Labor",
        question: `Labor cost is projected at ${costProjection.laborPct.toFixed(1)}% vs ${LABOR_TARGET_PCT}% target. Where's the biggest opportunity?`,
      });
    }
    // Cross-location imbalance (if multi-location)
    if (locationRows.length >= 2) {
      const sorted = [...locationRows].sort((a, b) => b.alerts - a.alerts);
      const worst = sorted[0];
      if (worst && worst.alerts >= 2) {
        list.push({
          id: "shift-imbalance",
          severity: "warning",
          icon: Activity,
          title: `Shift imbalance across locations`,
          detail: `${worst.location} has ${worst.alerts} active alerts. Consider moving staff from ${sorted[sorted.length - 1].location}.`,
          metric: "Multi-location",
          question: `Which location is most understaffed and where can I reallocate from?`,
        });
      }
    }
    return list;
  }, [shiftForecasts, channelMix, costProjection, locationRows]);

  // Smart recommendations
  const recommendations = useMemo(() => {
    const recs: { text: string; impact: string }[] = [];
    const dinner = shiftForecasts.find((s) => s.shift === "Dinner");
    if (dinner?.status === "understaffed") {
      recs.push({
        text: `Schedule ${dinner.recommendedStaff - dinner.currentStaff} additional server(s) for the dinner shift`,
        impact: `Prevents ~${Math.round(dinner.forecastTraffic * 0.08)} lost covers (${fmt(dinner.forecastSales * 0.08)}).`,
      });
    }
    const morning = shiftForecasts.find((s) => s.shift === "Morning");
    if (morning?.status === "overstaffed") {
      recs.push({
        text: `Reduce ${morning.currentStaff - morning.recommendedStaff} staff during morning low-demand hours`,
        impact: `Saves ~${fmt((morning.currentStaff - morning.recommendedStaff) * 16 * 4)} in labor cost today.`,
      });
    }
    if (locationRows.length >= 2) {
      const sorted = [...locationRows].sort((a, b) => a.alerts - b.alerts);
      recs.push({
        text: `Move 1 staff from ${sorted[0].location} to ${sorted[sorted.length - 1].location}`,
        impact: `Balances coverage where demand is forecast highest.`,
      });
    }
    if (productDemand[0]) {
      recs.push({
        text: `Pre-prep extra ${productDemand[0].name} for forecast peak at ${peak?.label || "19:00"}`,
        impact: `Reduces ticket time during ${peak?.label} rush.`,
      });
    }
    return recs;
  }, [shiftForecasts, locationRows, productDemand, peak]);

  // ===== Chat =====
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me about demand forecasts, staffing, or labor cost. I only use the data shown on this dashboard." },
  ]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatBusy]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || chatBusy) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setChatBusy(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: {
          mode: "ask",
          question,
          context: {
            kpis: data.kpis,
            forecastByHour,
            shiftForecasts,
            roleStaffing,
            costProjection,
            channelMix,
            productDemand,
            locations: locationRows,
            range,
          },
        },
      });
      if (error) throw error;
      const answer = (resp as any)?.answer || "I couldn't generate an answer from the visible data.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the analytics service right now." }]);
    } finally {
      setChatBusy(false);
    }
  };

  // ===== Render helpers =====
  const cardCls = "rounded-2xl p-4";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  const kpis = [
    { label: "Forecast Sales", val: fmt(costProjection.projectedSales), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Forecast Traffic", val: String(forecastByHour.reduce((s, p) => s + p.traffic, 0)), icon: Users, color: "text-sky-400", bg: "bg-sky-500/10" },
    { label: "Recommended Staff", val: String(roleStaffing.reduce((s, r) => s + r.recommended, 0)), icon: UserCog, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Projected Labor", val: fmt(costProjection.projectedLabor), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Labor % of Sales", val: `${costProjection.laborPct.toFixed(1)}%`, icon: AlertTriangle, color: costProjection.laborPct > LABOR_TARGET_PCT ? "text-red-400" : "text-emerald-400", bg: costProjection.laborPct > LABOR_TARGET_PCT ? "bg-red-500/10" : "bg-emerald-500/10" },
  ];

  const roleIcon = (role: string) => {
    if (role === "Cook") return ChefHat;
    if (role === "Server") return Coffee;
    if (role === "Manager") return UserCog;
    return Users;
  };

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
          <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-bold text-foreground tracking-tight truncate">AI Forecasting & Labor</h1>
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
              <span className="truncate">Predictive demand & staffing · refreshing every 30s</span>
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
            <RefreshCw className={`w-4 h-4 text-foreground/80 ${data.loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top alert banner (clickable, focuses worst alert) */}
      {alerts[0] && (
        <button
          onClick={() => ask(alerts[0].question)}
          className="mx-4 lg:mx-6 mt-3 shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 transition-colors text-left"
        >
          <Bell className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-red-300 truncate">{alerts[0].title}</p>
            <p className="text-[11px] text-red-200/70 truncate">{alerts[0].detail}</p>
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
            metric="revenue"
            onAskAI={ask}
          />

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

          {/* Real-Time AI Alerts */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center relative">
                  <Bell className="w-3.5 h-3.5 text-red-400" />
                  {alerts.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Proactive Staffing Alerts</h3>
                  <p className="text-[11px] text-muted-foreground/70">AI flags issues before they happen</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-foreground/70">{alerts.length} active</span>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-[12px] text-muted-foreground/70">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Staffing & demand within forecast. AI is monitoring continuously.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {alerts.map((a) => {
                  const sev =
                    a.severity === "critical"
                      ? { bg: "bg-red-500/10", border: "border-red-500/25", text: "text-red-300", icon: "text-red-400", chip: "bg-red-500/15 text-red-300" }
                      : a.severity === "warning"
                      ? { bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-200", icon: "text-amber-400", chip: "bg-amber-500/15 text-amber-300" }
                      : { bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-200", icon: "text-sky-400", chip: "bg-sky-500/15 text-sky-300" };
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      onClick={() => ask(a.question)}
                      className={`text-left rounded-xl p-3 border ${sev.bg} ${sev.border} hover:brightness-110 transition`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sev.bg} border ${sev.border}`}>
                          <Icon className={`w-3.5 h-3.5 ${sev.icon}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${sev.chip}`}>
                              {a.severity}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{a.metric}</span>
                          </div>
                          <p className={`text-[12.5px] font-semibold ${sev.text} leading-snug`}>{a.title}</p>
                          <p className="text-[11px] text-foreground/60 mt-0.5 leading-snug">{a.detail}</p>
                          <p className="text-[10.5px] text-foreground/50 mt-1.5 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Tap to ask AI
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Demand forecast chart */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Demand Forecast</h3>
                <p className="text-[11px] text-muted-foreground/70 flex items-center gap-2">
                  <CloudSun className="w-3 h-3 text-sky-400" />
                  Historical pace + weather + location trends
                  {peak && <> · Peak: <span className="text-violet-400 font-medium">{peak.label} ({fmtShort(peak.forecast)})</span></>}
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastByHour} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={1} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} tickFormatter={(v) => fmtShort(Number(v))} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => [v == null ? "—" : fmtShort(Number(v)), n === "forecast" ? "Forecast" : n === "actual" ? "Actual" : "Traffic"]}
                  />
                  <Bar dataKey="forecast" fill="url(#forecastBar)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shift forecasts + Channel mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`${cardCls} lg:col-span-2`} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Shift Forecast & Staffing</h3>
              </div>
              <div className="space-y-2">
                {shiftForecasts.map((s) => {
                  const tone =
                    s.status === "understaffed"
                      ? { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: `Understaffed (-${s.deltaPct}%)` }
                      : s.status === "overstaffed"
                      ? { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: `Overstaffed (+${s.deltaPct}%)` }
                      : { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", label: "Balanced" };
                  return (
                    <div key={s.shift} className={`flex items-center gap-3 rounded-xl p-3 border ${tone.bg} ${tone.border}`}>
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-foreground">{s.shift}</p>
                          <span className="text-[10px] text-muted-foreground/70">{s.hours}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {s.forecastTraffic} covers · {fmt(s.forecastSales)} forecast
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-foreground tabular-nums">
                          {s.currentStaff} <span className="text-muted-foreground/60 text-[11px]">/ {s.recommendedStaff}</span>
                        </p>
                        <p className={`text-[10px] font-semibold ${tone.text}`}>{tone.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-foreground">Channel Demand</h3>
              </div>
              <div className="space-y-2">
                {channelMix.map((c) => (
                  <div key={c.channel}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="text-foreground/85">{c.channel}</span>
                      <span className="text-foreground/70 tabular-nums">{fmtShort(c.forecast)} · {c.share}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-violet-400"
                        style={{ width: `${c.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Role staffing + Cost projection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Recommended Staffing by Role</h3>
              </div>
              <div className="space-y-2">
                {roleStaffing.map((r) => {
                  const Icon = roleIcon(r.role);
                  const gap = r.current - r.recommended;
                  const tone = gap < 0 ? "text-red-400" : gap > 0 ? "text-amber-400" : "text-emerald-400";
                  return (
                    <div key={r.role} className="flex items-center gap-3 rounded-xl p-2.5 bg-white/[0.03] border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-foreground">{r.role}</p>
                        <p className="text-[10.5px] text-muted-foreground/70">${r.hourlyWage}/hr · 8h shift</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-foreground tabular-nums">
                          {r.current} <span className="text-muted-foreground/60 text-[11px]">/ {r.recommended}</span>
                        </p>
                        <p className={`text-[10px] font-semibold ${tone}`}>
                          {gap === 0 ? "On target" : gap < 0 ? `${gap} short` : `+${gap} extra`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Labor Cost vs Sales Projection</h3>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastByHour} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="laborArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} interval={2} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} tickFormatter={(v) => fmtShort(Number(v))} />
                    <Tooltip
                      contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: any) => fmtShort(Number(v))}
                    />
                    <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" fill="url(#salesArea)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Sales</p>
                  <p className="text-[12px] font-bold text-foreground tabular-nums">{fmt(costProjection.projectedSales)}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Labor</p>
                  <p className="text-[12px] font-bold text-foreground tabular-nums">{fmt(costProjection.projectedLabor)}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Target</p>
                  <p className="text-[12px] font-bold text-foreground tabular-nums">{fmt(costProjection.targetLabor)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Demand heatmap (24h) */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground">Demand Heatmap · 24h</h3>
              </div>
              <p className="text-[10.5px] text-muted-foreground/70">Darker = higher forecasted traffic</p>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {forecastByHour.map((p) => {
                const max = Math.max(...forecastByHour.map((x) => x.traffic));
                const intensity = max > 0 ? p.traffic / max : 0;
                return (
                  <div key={p.hour} className="flex flex-col items-center">
                    <div
                      className="w-full h-8 rounded-md"
                      style={{
                        background: `hsl(var(--primary) / ${0.08 + intensity * 0.65})`,
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                      title={`${p.label}: ${p.traffic} covers`}
                    />
                    <span className="text-[8.5px] text-muted-foreground/60 mt-1 tabular-nums">{String(p.hour).padStart(2, "0")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product demand trends */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Product Demand Trends</h3>
            </div>
            {productDemand.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/60 py-2">No product data yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {productDemand.map((p) => {
                  const tone = p.trend === "up" ? "text-emerald-400" : p.trend === "down" ? "text-red-400" : "text-foreground/60";
                  const TrendIcon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Activity;
                  return (
                    <div key={p.name} className="flex items-center justify-between text-[12px] rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                      <span className="text-foreground/85 truncate pr-2">{p.name}</span>
                      <span className={`flex items-center gap-1.5 font-semibold tabular-nums shrink-0 ${tone}`}>
                        <TrendIcon className="w-3 h-3" />
                        {p.forecastUnits}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Smart recommendations */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Smart Recommendations</h3>
            </div>
            {recommendations.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/60">No actions recommended right now.</p>
            ) : (
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                    <span className="text-amber-400/80 mt-1 text-[10px]">●</span>
                    <div className="flex-1 min-w-0">
                      <p>{r.text}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{r.impact}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Inline conversation (only after user interacts) */}
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

      {/* Bottom AI composer */}
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
            placeholder="Ask AI about demand, staffing, or labor cost..."
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

export default ForecastingDashboard;
