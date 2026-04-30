import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { KPIs, HourlyPoint, DailyPoint, TopItem, PaymentTypeSummary, CategorySummary } from "@/hooks/useReportsData";

interface Props {
  kpis: KPIs;
  salesByHour: HourlyPoint[];
  salesByDay: DailyPoint[];
  topItems: TopItem[];
  paymentTypes: PaymentTypeSummary[];
  categories: CategorySummary[];
}

const fmtCur = (v: number) => `£${v.toFixed(2)}`;
const fmtCurShort = (v: number) =>
  v >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${Math.round(v)}`;

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];

const KpiCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-card rounded-2xl px-4 py-4">
    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
    <p className="text-foreground text-xl font-semibold mt-1">{value}</p>
    {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
  </div>
);

const ChartShell = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-4">
    <div className="mb-3">
      <h4 className="text-foreground text-sm font-semibold">{title}</h4>
      {subtitle && <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>}
    </div>
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  </div>
);

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

const ReportsAnalytics = ({ kpis, salesByHour, salesByDay, topItems, paymentTypes, categories }: Props) => {
  // Trim hourly chart to active hours range so the chart isn't dominated by zeros
  const trimmedHourly = useMemo(() => {
    const firstIdx = salesByHour.findIndex((h) => h.sales > 0 || h.orders > 0);
    const lastIdx = (() => {
      for (let i = salesByHour.length - 1; i >= 0; i--) if (salesByHour[i].sales || salesByHour[i].orders) return i;
      return -1;
    })();
    if (firstIdx === -1) return salesByHour;
    return salesByHour.slice(Math.max(0, firstIdx - 1), Math.min(24, lastIdx + 2));
  }, [salesByHour]);

  const peakHour = useMemo(() => {
    return [...salesByHour].sort((a, b) => b.sales - a.sales)[0];
  }, [salesByHour]);

  return (
    <div className="space-y-4 mb-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Sales" value={fmtCur(kpis.totalSales)} sub={`${kpis.orderCount} orders`} />
        <KpiCard label="Orders" value={String(kpis.orderCount)} />
        <KpiCard label="Avg Order" value={fmtCur(kpis.averageOrderValue)} />
        <KpiCard label="Units Sold" value={String(kpis.unitsSold)} sub={peakHour && peakHour.sales > 0 ? `Peak ${peakHour.hour}` : undefined} />
      </div>

      {/* Sales over time */}
      {salesByDay.length > 1 ? (
        <ChartShell title="Sales by Day" subtitle="Revenue trend over the selected range">
          <LineChart data={salesByDay} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmtCurShort} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCur(Number(v))} />
            <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ChartShell>
      ) : (
        <ChartShell title="Sales by Hour" subtitle="Revenue distribution across the day">
          <BarChart data={trimmedHourly} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmtCurShort} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => n === "sales" ? fmtCur(Number(v)) : v} />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartShell>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Top items */}
        <ChartShell title="Top Selling Products" subtitle="By revenue contribution">
          {topItems.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No product sales in range</div>
          ) : (
            <BarChart data={topItems} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmtCurShort} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCur(Number(v))} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          )}
        </ChartShell>

        {/* Payment breakdown */}
        <ChartShell title="Payment Method Breakdown" subtitle="Share of revenue by payment type">
          {paymentTypes.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No payments in range</div>
          ) : (
            <PieChart>
              <Pie
                data={paymentTypes}
                dataKey="amount"
                nameKey="type"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {paymentTypes.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCur(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          )}
        </ChartShell>
      </div>

      {/* Category performance */}
      {categories.length > 0 && (
        <ChartShell title="Category Performance" subtitle="Net sales by product category">
          <BarChart data={categories} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmtCurShort} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCur(Number(v))} />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartShell>
      )}
    </div>
  );
};

export default ReportsAnalytics;
