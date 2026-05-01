import { useMemo } from "react";
import { Building2, Layers, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export type ViewMode = "combined" | "by-location";
export type Shift = "All" | "Morning" | "Lunch" | "Dinner";
export const ALL_LOCATIONS = ["Downtown", "Airport", "Westside"] as const;
export const ALL_SHIFTS: Shift[] = ["All", "Morning", "Lunch", "Dinner"];
export const ALL_CATEGORIES = ["All", "Food", "Beverage", "Dessert"] as const;

export interface MultiLocationFiltersState {
  view: ViewMode;
  location: string;          // "All" or a specific location
  shift: Shift;
  category: string;          // "All" or a specific category
}

export const DEFAULT_ML_FILTERS: MultiLocationFiltersState = {
  view: "combined",
  location: "All",
  shift: "All",
  category: "All",
};

/** Per-location row exposed to dashboards. revenue/profit/foodPct/laborPct + alert count. */
export interface LocationRow {
  location: string;
  revenue: number;
  profit: number;
  foodPct: number;
  laborPct: number;
  inventoryPct: number;
  alerts: number;
}

/**
 * Deterministic per-location seed used by every dashboard, so KPIs and
 * cross-location comparisons stay consistent across screens.
 */
export const LOCATION_SEED: LocationRow[] = [
  { location: "Downtown", revenue: 12150, profit: 4280, foodPct: 30.5, laborPct: 24.2, inventoryPct: 77, alerts: 1 },
  { location: "Airport",  revenue:  9830, profit: 2190, foodPct: 38.2, laborPct: 27.8, inventoryPct: 57, alerts: 4 },
  { location: "Westside", revenue:  6770, profit: 2100, foodPct: 31.0, laborPct: 25.4, inventoryPct: 84, alerts: 0 },
];

const fmt$ = (n: number) => `$${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

/**
 * Returns the filtered & scaled location rows for the active filters.
 * Dashboards multiply their own KPIs by `scale` (totals.revenue / seed total).
 */
export function useFilteredLocations(filters: MultiLocationFiltersState) {
  return useMemo(() => {
    const catMult = filters.category === "All" ? 1
      : filters.category === "Food" ? 0.6
      : filters.category === "Beverage" ? 0.25
      : 0.15;
    const shiftMult = filters.shift === "All" ? 1 : 1 / 3;
    const rows = LOCATION_SEED
      .filter((l) => filters.location === "All" || l.location === filters.location)
      .map((l) => ({
        ...l,
        revenue: Math.round(l.revenue * catMult * shiftMult),
        profit: Math.round(l.profit * catMult * shiftMult),
      }));
    const seedTotal = LOCATION_SEED.reduce((s, l) => s + l.revenue, 0);
    const filteredTotal = rows.reduce((s, l) => s + l.revenue, 0);
    const scale = seedTotal > 0 ? filteredTotal / seedTotal : 1;
    return { rows, scale };
  }, [filters.category, filters.shift, filters.location]);
}

/** Cross-location anomalies derived from the filtered rows. */
export function useLocationAnomalies(rows: LocationRow[]) {
  return useMemo(() => {
    if (rows.length < 2) return [];
    const out: { kind: string; severity: "high" | "med"; text: string; sub: string }[] = [];
    const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top && bottom && top.location !== bottom.location) {
      const dropPct = ((bottom.revenue - top.revenue) / top.revenue) * 100;
      if (dropPct < -15) {
        out.push({
          kind: "sales",
          severity: "high",
          text: `${bottom.location} sales ${pct(Math.abs(dropPct))} below ${top.location}`,
          sub: `${fmt$(bottom.revenue)} vs ${fmt$(top.revenue)}`,
        });
      }
    }
    for (const l of rows) {
      if (l.foodPct > 35) out.push({ kind: "food", severity: "med", text: `High food cost at ${l.location}`, sub: `${pct(l.foodPct)} of revenue (target ≤ 32%)` });
      if (l.laborPct > 28) out.push({ kind: "labor", severity: "med", text: `High labor ratio at ${l.location}`, sub: `${pct(l.laborPct)} of revenue (target ≤ 26%)` });
      if (l.inventoryPct < 60) out.push({ kind: "inv", severity: "high", text: `Inventory low at ${l.location}`, sub: `${pct(l.inventoryPct)} of par — replenish within 6h` });
    }
    return out.slice(0, 4);
  }, [rows]);
}

/* ---------- UI ---------- */

interface Props {
  filters: MultiLocationFiltersState;
  onChange: (next: MultiLocationFiltersState) => void;
  rows: LocationRow[];
  /** Which metric the per-location summary cards should highlight. */
  metric: "revenue" | "inventory" | "profit";
  onAskAI?: (q: string) => void;
}

export const MultiLocationFilters = ({ filters, onChange, rows, metric, onAskAI }: Props) => {
  const cardCls = "rounded-2xl p-4";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;
  const anomalies = useLocationAnomalies(rows);

  const setField = <K extends keyof MultiLocationFiltersState>(k: K, v: MultiLocationFiltersState[K]) =>
    onChange({ ...filters, [k]: v });

  const sortedByMetric = useMemo(() => {
    const key: keyof LocationRow = metric === "inventory" ? "inventoryPct" : metric === "profit" ? "profit" : "revenue";
    return [...rows].sort((a, b) => Number(b[key]) - Number(a[key]));
  }, [rows, metric]);

  const fmtMetric = (l: LocationRow) =>
    metric === "inventory" ? pct(l.inventoryPct) : metric === "profit" ? fmt$(l.profit) : fmt$(l.revenue);
  const metricLabel = metric === "inventory" ? "Inventory" : metric === "profit" ? "Profit" : "Revenue";

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className={cardCls} style={cardStyle}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/5 rounded-full p-1">
            {(["combined", "by-location"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setField("view", v)}
                className={`text-[11px] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  filters.view === v ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <Layers className="w-3 h-3" />
                {v === "combined" ? "Combined" : "By Location"}
              </button>
            ))}
          </div>
          <FilterSelect label="Location" value={filters.location} onChange={(v) => setField("location", v)} options={["All", ...ALL_LOCATIONS]} />
          <FilterSelect label="Shift" value={filters.shift} onChange={(v) => setField("shift", v as Shift)} options={ALL_SHIFTS} />
          <FilterSelect label="Category" value={filters.category} onChange={(v) => setField("category", v)} options={[...ALL_CATEGORIES]} />
        </div>
      </div>

      {/* By-location summary cards */}
      {filters.view === "by-location" && rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sortedByMetric.map((l, idx) => {
            const isTop = idx === 0 && rows.length > 1;
            const isLow = idx === sortedByMetric.length - 1 && rows.length > 1;
            return (
              <button
                key={l.location}
                onClick={() => setField("location", l.location)}
                className={`${cardCls} text-left hover:bg-white/[0.05] transition-colors ${
                  filters.location === l.location ? "ring-1 ring-primary/40" : ""
                }`}
                style={cardStyle}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <p className="text-[13px] font-semibold text-foreground">{l.location}</p>
                  </div>
                  {isTop && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3" /> Top
                    </span>
                  )}
                  {isLow && (
                    <span className="flex items-center gap-1 text-[10px] text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      <TrendingDown className="w-3 h-3" /> Low
                    </span>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">{metricLabel}</p>
                <p className="text-[18px] font-bold text-foreground tabular-nums">{fmtMetric(l)}</p>
                <div className="mt-2 flex items-center gap-3 text-[10.5px] text-muted-foreground/80">
                  <span>Food {pct(l.foodPct)}</span>
                  <span>Labor {pct(l.laborPct)}</span>
                  {l.alerts > 0 && (
                    <span className="flex items-center gap-1 text-red-300">
                      <AlertTriangle className="w-3 h-3" />{l.alerts}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Cross-location anomalies (only when comparing >1 location) */}
      {filters.location === "All" && anomalies.length > 0 && (
        <div className={cardCls} style={cardStyle}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-foreground">AI Cross-Location Anomalies</h3>
          </div>
          <ul className="space-y-1.5">
            {anomalies.map((a, i) => (
              <li key={i}>
                <button
                  onClick={() => onAskAI?.(`Explain: ${a.text}. ${a.sub}`)}
                  className="w-full text-left flex gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full ${a.severity === "high" ? "bg-red-400" : "bg-amber-400"}`} />
                  <span className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-foreground/90 font-medium">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground/70 truncate">{a.sub}</p>
                  </span>
                  {onAskAI && <span className="text-[10px] text-muted-foreground/60 shrink-0 self-center">Ask AI →</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const FilterSelect = ({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) => (
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

export default MultiLocationFilters;
