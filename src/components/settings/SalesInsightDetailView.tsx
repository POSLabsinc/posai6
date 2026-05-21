import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send, Sparkles, BarChart3, ChevronDown, ChevronLeft, Loader2,
  Calendar as CalendarIcon, Table as TableIcon, List as ListIcon, TrendingUp,
  ShoppingCart, DollarSign, Calculator, Users, X, RotateCcw, Lightbulb,
  ListChecks, Target,
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/hooks/useNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import aiEIcon from "@/assets/icons/ai-e-icon.png";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, addMonths } from "date-fns";

interface ChatMsg { role: "user" | "assistant"; content: string }

type RecCategory = "Staffing" | "Menu" | "Labor" | "Finance" | "Promo";
interface Recommendation { id: string; text: string; category: RecCategory; when: string; dotColor: string }

const CATEGORY_STYLES: Record<RecCategory, string> = {
  Staffing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Menu: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Labor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Finance: "bg-red-500/15 text-red-400 border-red-500/30",
  Promo: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const MOCK_RECS: Recommendation[] = [
  { id: "r1", text: "Peak hour approaching at 6 PM. Consider adding 2 staff to Front of House.", category: "Staffing", when: "Today", dotColor: "bg-amber-400" },
  { id: "r2", text: "Tacos are trending 23% above average. Feature on the specials board.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
  { id: "r3", text: "Labor cost at 28% approaching 30% threshold. Monitor closely.", category: "Labor", when: "Tomorrow", dotColor: "bg-blue-400" },
  { id: "r4", text: "Voids spiked 40% in the last hour. Review POS activity immediately.", category: "Finance", when: "Urgent", dotColor: "bg-red-400" },
  { id: "r5", text: "Happy Hour promo underperforming. Boost via SMS to repeat guests.", category: "Promo", when: "In 3 hours", dotColor: "bg-amber-400" },
  { id: "r6", text: "Wine inventory low on Cabernet. Reorder before weekend rush.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
  { id: "r7", text: "Server Alex closing 18% faster than average. Consider as trainer.", category: "Staffing", when: "This week", dotColor: "bg-amber-400" },
  { id: "r8", text: "Dessert attach rate down 12%. Brief staff on suggestive selling.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
];

type MetricKey = "netSales" | "grossSales" | "totalOrders" | "totalTransactions" | "totalRefunds" | "totalDiscounts";
const METRIC_OPTIONS: { key: MetricKey; label: string; isCurrency: boolean }[] = [
  { key: "netSales", label: "Net Sales", isCurrency: true },
  { key: "grossSales", label: "Gross Sales", isCurrency: true },
  { key: "totalOrders", label: "Total Orders", isCurrency: false },
  { key: "totalTransactions", label: "Total Transactions", isCurrency: false },
  { key: "totalRefunds", label: "Total Refunds", isCurrency: true },
  { key: "totalDiscounts", label: "Total Discounts", isCurrency: true },
];

type ViewMode = "chart" | "table" | "list" | "trend";
type Granularity = "Hourly" | "Daily" | "Weekly";
type QuickSelect = "Today" | "Yesterday" | "Last 7 days" | "This week" | "This month" | "Last month" | "Last 3 months" | "Year to date" | "Custom range";

const fmtCur = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n: number) => n.toLocaleString();

// ---- Dummy data generators (deterministic per metric + date) ----
const HOUR_SHAPE = [0.04, 0.02, 0.015, 0.012, 0.018, 0.025, 0.04, 0.06, 0.075, 0.08, 0.085, 0.095, 0.09, 0.07, 0.055, 0.06, 0.072, 0.105, 0.13, 0.105, 0.08, 0.06, 0.04, 0.02];

const METRIC_TOTALS: Record<MetricKey, { today: number; compare: number }> = {
  netSales: { today: 45280.50, compare: 42178.30 },
  grossSales: { today: 47850.25, compare: 44680.75 },
  totalOrders: { today: 1235, compare: 1168 },
  totalTransactions: { today: 1198, compare: 1132 },
  totalRefunds: { today: 482.10, compare: 615.40 },
  totalDiscounts: { today: 1864.20, compare: 1742.55 },
};

function buildHourly(metric: MetricKey) {
  const t = METRIC_TOTALS[metric];
  return Array.from({ length: 24 }, (_, i) => {
    const suf = i < 12 ? "AM" : "PM";
    const h12 = i % 12 === 0 ? 12 : i % 12;
    return {
      hourLabel: `${h12}${suf}`,
      hour: i,
      today: +(t.today * HOUR_SHAPE[i]).toFixed(2),
      compare: +(t.compare * HOUR_SHAPE[(i + 23) % 24]).toFixed(2),
    };
  });
}

const METRIC_CARDS = [
  { label: "Gross Sales", value: "$47,850.25", delta: "+7.1%", caption: "Total revenue before adjustments", icon: TrendingUp },
  { label: "Net Sales", value: "$45,280.50", delta: "+7.4%", caption: "Total revenue after discounts and refunds", icon: DollarSign },
  { label: "Average Order Value", value: "$38.75", delta: "+9.2%", caption: "Average amount spent per order", icon: ShoppingCart },
  { label: "Sales per Sq Ft", value: "$285.50", delta: "+5.2%", caption: "Revenue efficiency per square foot", icon: Calculator },
  { label: "Revenue per Available Seat Hour", value: "$142.25", delta: "+3.8%", caption: "Revenue optimization metric for seating efficiency", icon: TrendingUp },
  { label: "Customer Count", value: "1,235", delta: "+4.0%", caption: "Total number of unique customers served", icon: Users },
];

// ---- Custom Filter Popover (matches reference image) ----
const QUICK_OPTIONS: QuickSelect[] = ["Today", "Yesterday", "Last 7 days", "This week", "This month", "Last month", "Last 3 months", "Year to date", "Custom range"];
const GRANULARITY_OPTIONS: Granularity[] = ["Hourly", "Daily", "Weekly"];

function rangeForQuickSelect(q: QuickSelect): { start: Date; end: Date } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setHours(23, 59, 59, 999);
  switch (q) {
    case "Today": return { start: today, end };
    case "Yesterday": { const s = subDays(today, 1); const e = new Date(s); e.setHours(23, 59, 59, 999); return { start: s, end: e }; }
    case "Last 7 days": return { start: subDays(today, 6), end };
    case "This week": return { start: startOfWeek(today, { weekStartsOn: 0 }), end };
    case "This month": return { start: startOfMonth(today), end };
    case "Last month": { const s = startOfMonth(subDays(startOfMonth(today), 1)); const e = subDays(startOfMonth(today), 1); e.setHours(23, 59, 59, 999); return { start: s, end: e }; }
    case "Last 3 months": return { start: subDays(today, 90), end };
    case "Year to date": return { start: startOfYear(today), end };
    case "Custom range": return { start: subDays(today, 1), end };
  }
}

const DateRangeFilter = ({
  label, range, onChange, granularity, onGranularityChange,
}: {
  label: string;
  range: { start: Date; end: Date; quick: QuickSelect };
  onChange: (r: { start: Date; end: Date; quick: QuickSelect }) => void;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draftQuick, setDraftQuick] = useState<QuickSelect>(range.quick);
  const [draftStart, setDraftStart] = useState<Date>(range.start);
  const [draftEnd, setDraftEnd] = useState<Date>(range.end);
  const [draftGran, setDraftGran] = useState<Granularity>(granularity);
  const [viewMonth, setViewMonth] = useState<Date>(range.start);

  useEffect(() => {
    if (open) {
      setDraftQuick(range.quick); setDraftStart(range.start); setDraftEnd(range.end); setDraftGran(granularity);
      setViewMonth(range.start);
    }
  }, [open]);

  const apply = () => {
    onChange({ start: draftStart, end: draftEnd, quick: draftQuick });
    onGranularityChange(draftGran);
    setOpen(false);
  };
  const clear = () => {
    const r = rangeForQuickSelect("Today");
    setDraftQuick("Today"); setDraftStart(r.start); setDraftEnd(r.end);
  };
  const pickQuick = (q: QuickSelect) => {
    setDraftQuick(q);
    if (q !== "Custom range") {
      const r = rangeForQuickSelect(q);
      setDraftStart(r.start); setDraftEnd(r.end);
      setViewMonth(r.start);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-1 text-xs text-muted-foreground/70 mb-1.5 hover:text-foreground transition-colors outline-none">
        {label} <ChevronDown className="w-3 h-3" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 bg-[#1c1c1e] border-white/10 rounded-xl overflow-hidden">
        <div className="flex">
          {/* Left rail: Quick Select + Granularity */}
          <div className="w-[160px] border-r border-white/[0.08] p-3 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">Quick Select</div>
            {QUICK_OPTIONS.map((q) => (
              <button key={q} onClick={() => pickQuick(q)}
                className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] text-left transition-colors",
                  draftQuick === q ? "bg-white/[0.08] text-foreground" : "text-foreground/75 hover:bg-white/[0.04]")}>
                <span>{q}</span>
                {draftQuick === q && <span className="text-foreground/70">✓</span>}
              </button>
            ))}
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5 mt-2">Granularity</div>
            {GRANULARITY_OPTIONS.map((g) => (
              <button key={g} onClick={() => setDraftGran(g)}
                className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] text-left transition-colors",
                  draftGran === g ? "bg-white/[0.08] text-foreground" : "text-foreground/75 hover:bg-white/[0.04]")}>
                <span>{g}</span>
                {draftGran === g && <span className="text-foreground/70">✓</span>}
              </button>
            ))}
          </div>

          {/* Right: Start/End + dual calendars */}
          <div className="p-4 w-[560px]">
            <div className="flex items-end gap-3 mb-3">
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground mb-1">Start</div>
                <div className="bg-transparent border border-white/15 rounded-md px-3 py-2 text-sm text-foreground">{format(draftStart, "MM/dd/yyyy")}</div>
              </div>
              <span className="pb-2.5 text-muted-foreground">→</span>
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground mb-1">End</div>
                <div className="bg-transparent border border-white/15 rounded-md px-3 py-2 text-sm text-foreground">{format(draftEnd, "MM/dd/yyyy")}</div>
              </div>
            </div>
            <Calendar
              mode="range"
              numberOfMonths={2}
              month={viewMonth}
              onMonthChange={setViewMonth}
              selected={{ from: draftStart, to: draftEnd }}
              onSelect={(r: any) => {
                if (r?.from) { const s = new Date(r.from); s.setHours(0, 0, 0, 0); setDraftStart(s); }
                if (r?.to) { const e = new Date(r.to); e.setHours(23, 59, 59, 999); setDraftEnd(e); }
                if (r?.from && (!r?.to || r.from.getTime() === r.to.getTime())) setDraftQuick("Custom range");
              }}
              className="p-0 pointer-events-auto"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.08]">
              <button onClick={clear} className="text-sm text-foreground/80 hover:text-foreground">Clear</button>
              <button onClick={apply} className="px-4 py-1.5 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90">Apply</button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ---- Custom chart tooltip (white background) ----
const ChartTooltip = ({ active, payload, label, isCurrency, compareLabel }: any) => {
  if (!active || !payload?.length) return null;
  const today = payload.find((p: any) => p.dataKey === "today")?.value ?? 0;
  const compare = payload.find((p: any) => p.dataKey === "compare")?.value ?? 0;
  const fmt = (v: number) => isCurrency ? fmtCur(v) : fmtNum(v);
  return (
    <div className="bg-white text-black rounded-lg shadow-lg px-3 py-2 text-xs min-w-[150px]">
      <div className="font-semibold mb-1.5">{label}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-black/70">Today</span>
        <span className="font-semibold tabular-nums">{fmt(today)}</span>
      </div>
      <div className="flex items-center justify-center my-1">
        <div className="flex-1 h-px bg-black/10" />
        <span className="px-2 text-[10px] uppercase tracking-wider text-black/50">vs</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-black/70">{compareLabel}</span>
        <span className="font-semibold tabular-nums text-black/70">{fmt(compare)}</span>
      </div>
    </div>
  );
};

// ---- Maya structured answer renderer ----
const SECTION_META: { key: string; label: string; icon: any; tint: string }[] = [
  { key: "solution", label: "Solution", icon: Lightbulb, tint: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  { key: "actions", label: "Suggested Actions & Next Steps", icon: ListChecks, tint: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  { key: "impact", label: "Business Impact", icon: Target, tint: "text-violet-300 bg-violet-500/15 border-violet-500/30" },
];

function parseMayaSections(text: string) {
  const lines = text.split(/\r?\n/);
  const sections: Record<string, string[]> = { solution: [], actions: [], impact: [] };
  let current: keyof typeof sections | null = null;
  const headingMap: { re: RegExp; key: keyof typeof sections }[] = [
    { re: /solution/i, key: "solution" },
    { re: /action|next step/i, key: "actions" },
    { re: /impact/i, key: "impact" },
  ];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const stripped = line.replace(/^[#*\-\d.\s]+/, "").replace(/\*+/g, "").trim();
    const isHeading = /^[#*]{0,3}\s*\**\s*(solution|suggested actions|actions|next steps|business impact|impact)/i.test(line);
    if (isHeading) {
      const match = headingMap.find((m) => m.re.test(stripped));
      if (match) { current = match.key; continue; }
    }
    const bullet = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim();
    if (current && bullet) sections[current].push(bullet);
  }
  // Fallback: if nothing parsed into sections, dump everything into solution
  if (!sections.solution.length && !sections.actions.length && !sections.impact.length) {
    sections.solution = text.split(/\r?\n/).map((l) => l.replace(/\*\*/g, "").trim()).filter(Boolean);
  }
  return sections;
}

const MayaAnswerCard = ({ answer }: { answer: string }) => {
  const sections = parseMayaSections(answer);
  return (
    <div className="space-y-3">
      {SECTION_META.map((s) => {
        const items = sections[s.key];
        if (!items?.length) return null;
        const Icon = s.icon;
        return (
          <div key={s.key} className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center border ${s.tint}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-[13px] font-bold text-foreground">{s.label}</h4>
            </div>
            <ul className="space-y-1.5 pl-1">
              {items.map((line, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-foreground/85 leading-relaxed">
                  <span className="text-muted-foreground/60 mt-0.5">•</span>
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export const SalesInsightDetailView = ({ notification }: { notification: NotificationItem }) => {
  const today0 = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayEnd = useMemo(() => { const d = new Date(today0); d.setHours(23, 59, 59, 999); return d; }, [today0]);
  const ystd = useMemo(() => subDays(today0, 1), [today0]);
  const ystdEnd = useMemo(() => { const d = new Date(ystd); d.setHours(23, 59, 59, 999); return d; }, [ystd]);

  // Primary range
  const [primaryRange, setPrimaryRange] = useState({ start: today0, end: todayEnd, quick: "Today" as QuickSelect });
  const [primaryGran, setPrimaryGran] = useState<Granularity>("Hourly");

  // Comparison range
  const [compareRange, setCompareRange] = useState({ start: ystd, end: ystdEnd, quick: "Yesterday" as QuickSelect });
  const [compareGran, setCompareGran] = useState<Granularity>("Daily");

  // Selected metric & view mode
  const [metric, setMetric] = useState<MetricKey>("netSales");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const selectedMetric = METRIC_OPTIONS.find((m) => m.key === metric)!;

  // Dummy chart data driven by metric
  const chartData = useMemo(() => buildHourly(metric), [metric]);
  const todayValue = METRIC_TOTALS[metric].today;
  const compareValue = METRIC_TOTALS[metric].compare;
  const formatMetricValue = (v: number) => selectedMetric.isCurrency ? fmtCur(v) : fmtNum(v);

  // Breakdown report (driven by selected granularity + range)
  const [bdRange, setBdRange] = useState({ start: today0, end: todayEnd, quick: "Today" as QuickSelect });
  const [bdGran, setBdGran] = useState<Granularity>("Hourly");
  const [bdCompare, setBdCompare] = useState({ start: ystd, end: ystdEnd, quick: "Yesterday" as QuickSelect });
  const [bdCompareGran, setBdCompareGran] = useState<Granularity>("Daily");

  const breakdownRows = useMemo(() => {
    if (bdGran === "Hourly") {
      return chartData.map((h) => {
        const labour = h.today * 0.28;
        return { time: h.hourLabel, netSales: h.today, labour, labourPct: h.today > 0 ? (labour / h.today) * 100 : null };
      });
    }
    if (bdGran === "Daily") {
      const days = Math.max(1, Math.round((bdRange.end.getTime() - bdRange.start.getTime()) / 86400000) + 1);
      return Array.from({ length: Math.min(days, 31) }, (_, i) => {
        const v = +(METRIC_TOTALS[metric].today * (0.7 + (i % 7) * 0.08)).toFixed(2);
        const labour = v * 0.28;
        return { time: format(new Date(bdRange.start.getTime() + i * 86400000), "MMM d"), netSales: v, labour, labourPct: v > 0 ? (labour / v) * 100 : null };
      });
    }
    // Weekly
    return Array.from({ length: 8 }, (_, i) => {
      const v = +(METRIC_TOTALS[metric].today * 7 * (0.85 + (i % 4) * 0.05)).toFixed(2);
      const labour = v * 0.28;
      return { time: `Week ${i + 1}`, netSales: v, labour, labourPct: v > 0 ? (labour / v) * 100 : null };
    });
  }, [bdGran, bdRange, chartData, metric]);

  const [bdPage, setBdPage] = useState(0);
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(breakdownRows.length / PAGE_SIZE));
  useEffect(() => { setBdPage(0); }, [bdGran, bdRange.start.getTime(), bdRange.end.getTime()]);
  const pagedRows = breakdownRows.slice(bdPage * PAGE_SIZE, bdPage * PAGE_SIZE + PAGE_SIZE);

  // Ask Maya drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<"list" | "detail">("list");
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null);
  const [mayaAnswer, setMayaAnswer] = useState<string>("");
  const [mayaLoading, setMayaLoading] = useState(false);
  const [mayaError, setMayaError] = useState<string | null>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  const askMaya = async (rec: Recommendation) => {
    setActiveRec(rec);
    setDrawerView("detail");
    setMayaAnswer("");
    setMayaError(null);
    setMayaLoading(true);
    try {
      const context = {
        metric: selectedMetric.label,
        today: todayValue,
        compare: compareValue,
        recommendation: rec,
      };
      const question =
        `For the following POS alert, provide a concise actionable plan. ` +
        `Use three clear sections with these exact markdown headings on their own line: ` +
        `**Solution**, **Suggested Actions & Next Steps**, **Business Impact**. ` +
        `Use short bullet points under each heading. Keep it under 180 words.\n\n` +
        `Alert: "${rec.text}" (Category: ${rec.category}, When: ${rec.when}).`;
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "ask", question, context },
      });
      if (error) throw error;
      const answer = (resp as any)?.answer?.trim();
      if (!answer) throw new Error("Empty response");
      setMayaAnswer(answer);
    } catch (e: any) {
      setMayaError("Sorry, Maya couldn't generate a response right now. Please retry.");
    } finally {
      setMayaLoading(false);
    }
  };

  useEffect(() => {
    detailScrollRef.current?.scrollTo({ top: 0 });
  }, [activeRec?.id]);

  const openDrawer = (view: "list" | "detail" = "list") => {
    setDrawerView(view);
    setDrawerOpen(true);
  };


  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  const compareLabel = useMemo(() => {
    if (compareRange.quick !== "Custom range") return compareRange.quick;
    return format(compareRange.start, "MMM d, yyyy");
  }, [compareRange]);
  const primaryLabel = useMemo(() => {
    if (primaryRange.quick !== "Custom range") return primaryRange.quick;
    return format(primaryRange.start, "MMM d, yyyy");
  }, [primaryRange]);

  // Render visualization based on viewMode
  const renderVisualization = () => {
    if (viewMode === "table") {
      return (
        <div className="h-64 overflow-y-auto scrollbar-hide rounded-xl border border-white/[0.06]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#1c1c1e]">
              <tr className="text-left text-muted-foreground/80">
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium text-right">Today</th>
                <th className="px-3 py-2 font-medium text-right">{compareLabel}</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((r, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  <td className="px-3 py-2 text-foreground/90">{r.hourLabel}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground/90">{formatMetricValue(r.today)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground/70">{formatMetricValue(r.compare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (viewMode === "list") {
      return (
        <div className="h-64 overflow-y-auto scrollbar-hide space-y-1.5 pr-1">
          {chartData.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <span className="text-xs text-foreground/80 w-12">{r.hourLabel}</span>
              <div className="flex-1 mx-3 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (r.today / Math.max(...chartData.map(d => d.today))) * 100)}%` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground">{formatMetricValue(r.today)}</span>
            </div>
          ))}
        </div>
      );
    }
    if (viewMode === "trend") {
      return (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="hourLabel" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={2} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: "rgba(255,255,255,0.2)" }} content={<ChartTooltip isCurrency={selectedMetric.isCurrency} compareLabel={compareLabel} />} />
              <Line type="monotone" dataKey="today" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="compare" stroke="#7f1d1d" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    // chart (default)
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="hourLabel" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={2} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.06)" }} content={<ChartTooltip isCurrency={selectedMetric.isCurrency} compareLabel={compareLabel} />} />
            <Bar dataKey="today" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
            <Bar dataKey="compare" fill="#7f1d1d" radius={[3, 3, 0, 0]} maxBarSize={14} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col px-6 pt-6 pb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 shrink-0">
        <div className="w-11 h-11 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.15rem] font-bold text-foreground leading-snug tracking-tight">{notification.headline || notification.title}</h1>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">{notification.version_date} · {notification.time}</p>
        </div>
      </div>

      {/* Scrollable main area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 space-y-4">
        {/* Row 1: chart + recommendations side-by-side, equal height */}
        <div className="flex gap-4 items-stretch">
          {/* LEFT: chart card */}
          <div className="flex-1 min-w-0 rounded-2xl p-5" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">{primaryLabel}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors outline-none ring-1 ring-white/10">
                  {viewMode === "chart" && <BarChart3 className="w-4 h-4 text-foreground" />}
                  {viewMode === "table" && <TableIcon className="w-4 h-4 text-foreground" />}
                  {viewMode === "list" && <ListIcon className="w-4 h-4 text-foreground" />}
                  {viewMode === "trend" && <TrendingUp className="w-4 h-4 text-foreground" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1c1c1e] border-white/10 min-w-[140px]">
                  {[
                    { v: "chart" as const, icon: BarChart3, label: "Chart" },
                    { v: "table" as const, icon: TableIcon, label: "Table" },
                    { v: "list" as const, icon: ListIcon, label: "List" },
                    { v: "trend" as const, icon: TrendingUp, label: "Trend" },
                  ].map((o) => (
                    <DropdownMenuItem key={o.v} onClick={() => setViewMode(o.v)}
                      className={cn("flex items-center justify-between gap-3 text-foreground/90 focus:bg-white/[0.06]", viewMode === o.v && "text-foreground")}>
                      <span className="flex items-center gap-2"><o.icon className="w-4 h-4" />{o.label}</span>
                      {viewMode === o.v && <span>✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-end gap-6 mb-4">
              {/* Metric dropdown */}
              <div className="flex flex-col">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-muted-foreground/70 mb-1.5 hover:text-foreground transition-colors outline-none">
                    {selectedMetric.label} <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-[#1c1c1e] border-white/10">
                    {METRIC_OPTIONS.map((opt) => (
                      <DropdownMenuItem key={opt.key} onClick={() => setMetric(opt.key)}
                        className={cn("text-foreground/90 focus:bg-white/[0.06]", metric === opt.key && "text-primary")}>
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-3xl font-bold text-foreground tabular-nums">{formatMetricValue(todayValue)}</span>
              </div>
              <span className="text-sm text-muted-foreground/60 pb-1.5">vs</span>
              {/* Compare dropdown -> opens advanced filter */}
              <div className="flex flex-col">
                <DateRangeFilter
                  label={compareLabel}
                  range={compareRange}
                  onChange={setCompareRange}
                  granularity={compareGran}
                  onGranularityChange={setCompareGran}
                />
                <span className="text-3xl font-bold text-muted-foreground/60 tabular-nums">{formatMetricValue(compareValue)}</span>
              </div>
            </div>

            {renderVisualization()}
          </div>

          {/* RIGHT: recommendations panel */}
          <div className="w-[340px] shrink-0 rounded-2xl flex flex-col" style={cardStyle}>
            <div className="flex items-center gap-2 px-5 pt-5 pb-3 shrink-0">
              <h3 className="text-base font-bold text-foreground flex-1">Recommendations</h3>
              <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
                <img src={aiEIcon} alt="AI" className="w-4 h-4 object-contain" />
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">{MOCK_RECS.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-2 space-y-3 min-h-0">
              {MOCK_RECS.slice(0, 3).map((rec) => (
                <div key={rec.id} className="space-y-2.5">
                  <div className="flex gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${rec.dotColor} mt-2 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground/90 leading-relaxed mb-2">{rec.text}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_STYLES[rec.category]}`}>{rec.category}</span>
                        <span className="text-[11px] text-muted-foreground/70">{rec.when}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                </div>
              ))}
            </div>

            <div className="px-5 pb-4 pt-1 shrink-0">
              <button
                onClick={() => openDrawer("list")}
                className="w-full flex items-center justify-between text-[13px] font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                <span>View all {MOCK_RECS.length} recommendations</span>
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>


        {/* Row 2: 6 metric cards (matches reference design) */}
        <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          {METRIC_CARDS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-2xl p-4" style={cardStyle}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[12px] text-muted-foreground/80">{m.label}</span>
                  <Icon className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums mb-2">{m.value}</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" /> {m.delta}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 leading-snug">{m.caption}</p>
              </div>
            );
          })}
        </div>

        {/* Row 3: Breakdown Report */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-xl font-bold text-foreground">Breakdown Report</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Detailed breakdown of key metrics with visual comparison charts</p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex flex-col">
              <DateRangeFilter
                label={bdRange.quick !== "Custom range" ? bdRange.quick : format(bdRange.start, "MMM d, yyyy")}
                range={bdRange}
                onChange={setBdRange}
                granularity={bdGran}
                onGranularityChange={setBdGran}
              />
            </div>
            <span className="text-xs text-muted-foreground pb-1.5">vs</span>
            <div className="flex flex-col">
              <DateRangeFilter
                label={bdCompare.quick !== "Custom range" ? bdCompare.quick : format(bdCompare.start, "MMM d, yyyy")}
                range={bdCompare}
                onChange={setBdCompare}
                granularity={bdCompareGran}
                onGranularityChange={setBdCompareGran}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground/80">
                  <th className="px-5 py-3 font-medium">{bdGran === "Hourly" ? "Time" : bdGran === "Daily" ? "Date" : "Week"}</th>
                  <th className="px-5 py-3 font-medium text-right">Net Sales</th>
                  <th className="px-5 py-3 font-medium text-right">Labour Cost</th>
                  <th className="px-5 py-3 font-medium text-right">Labour %</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r, i) => (
                  <tr key={i} className="border-t border-white/[0.04]">
                    <td className="px-5 py-3.5 text-foreground/90">{r.time}</td>
                    <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{fmtCur(r.netSales)}</td>
                    <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{fmtCur(r.labour)}</td>
                    <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{r.labourPct === null ? "-" : r.labourPct.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <button onClick={() => setBdPage(Math.max(0, bdPage - 1))} disabled={bdPage === 0}
                className="w-8 h-8 rounded-md text-foreground/70 hover:bg-white/[0.06] disabled:opacity-30">«</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setBdPage(i)}
                  className={cn("w-8 h-8 rounded-md text-sm", bdPage === i ? "bg-white text-black" : "text-foreground/70 hover:bg-white/[0.06]")}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setBdPage(Math.min(totalPages - 1, bdPage + 1))} disabled={bdPage === totalPages - 1}
                className="w-8 h-8 rounded-md text-foreground/70 hover:bg-white/[0.06] disabled:opacity-30">»</button>
            </div>
          )}
        </div>
      </div>

      {/* Ask Maya / All Recommendations Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[440px] p-0 bg-[#131316] border-l border-white/10 [&>button]:hidden flex flex-col"
        >
          {drawerView === "list" ? (
            <>
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
                <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="text-base font-bold text-foreground flex-1">All recommendations</h2>
                <span className="text-sm font-semibold text-foreground tabular-nums">{MOCK_RECS.length}</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
                {MOCK_RECS.map((rec) => (
                  <div key={rec.id} className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex gap-2.5 mb-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${rec.dotColor} mt-2 shrink-0`} />
                      <p className="text-[13px] text-foreground/90 leading-relaxed flex-1">{rec.text}</p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_STYLES[rec.category]}`}>
                        {rec.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">{rec.when}</span>
                    </div>
                    <button
                      onClick={() => askMaya(rec)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Ask Maya
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
                <button
                  onClick={() => setDrawerView("list")}
                  className="w-8 h-8 -ml-2 rounded-full hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center">
                  <img src={aiEIcon} alt="AI" className="w-4 h-4 object-contain" />
                </div>
                <h2 className="text-base font-bold text-foreground flex-1">Ask Maya</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div ref={detailScrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
                {activeRec && (
                  <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex gap-2.5 mb-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeRec.dotColor} mt-2 shrink-0`} />
                      <p className="text-[13px] text-foreground/90 leading-relaxed flex-1">{activeRec.text}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_STYLES[activeRec.category]}`}>
                        {activeRec.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">{activeRec.when}</span>
                    </div>
                  </div>
                )}

                {mayaLoading && (
                  <div className="rounded-2xl p-5 bg-violet-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2.5 text-violet-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[13px] font-medium">Maya is analysing this alert...</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2.5 rounded-full bg-white/[0.06] animate-pulse w-3/4" />
                      <div className="h-2.5 rounded-full bg-white/[0.06] animate-pulse w-5/6" />
                      <div className="h-2.5 rounded-full bg-white/[0.06] animate-pulse w-2/3" />
                    </div>
                  </div>
                )}

                {mayaError && !mayaLoading && (
                  <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/20">
                    <p className="text-[13px] text-red-300 mb-3">{mayaError}</p>
                    <button
                      onClick={() => activeRec && askMaya(activeRec)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-white/[0.06] text-foreground border border-white/10 hover:bg-white/[0.1] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                )}

                {!mayaLoading && !mayaError && mayaAnswer && (
                  <>
                    <MayaAnswerCard answer={mayaAnswer} />
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => activeRec && askMaya(activeRec)}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-white/[0.06] text-foreground/90 border border-white/10 hover:bg-white/[0.1] transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};


export default SalesInsightDetailView;
