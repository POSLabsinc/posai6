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

type MetricKey = string;
interface MetricOption { key: string; label: string; isCurrency: boolean; suffix?: string }
const SALES_METRIC_OPTIONS: MetricOption[] = [
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

// ---- Dummy data generators ----
const HOUR_SHAPE = [0.04, 0.02, 0.015, 0.012, 0.018, 0.025, 0.04, 0.06, 0.075, 0.08, 0.085, 0.095, 0.09, 0.07, 0.055, 0.06, 0.072, 0.105, 0.13, 0.105, 0.08, 0.06, 0.04, 0.02];
// Service-time shape (lunch + dinner peaks) for ops modules
const HOUR_SHAPE_OPS = [0.005, 0.005, 0.005, 0.005, 0.005, 0.01, 0.02, 0.035, 0.05, 0.06, 0.07, 0.095, 0.11, 0.08, 0.045, 0.04, 0.05, 0.08, 0.11, 0.095, 0.065, 0.04, 0.02, 0.01];

const SALES_METRIC_TOTALS: Record<string, { today: number; compare: number }> = {
  netSales: { today: 45280.50, compare: 42178.30 },
  grossSales: { today: 47850.25, compare: 44680.75 },
  totalOrders: { today: 1235, compare: 1168 },
  totalTransactions: { today: 1198, compare: 1132 },
  totalRefunds: { today: 482.10, compare: 615.40 },
  totalDiscounts: { today: 1864.20, compare: 1742.55 },
};

function buildHourly(totals: { today: number; compare: number }, shape: number[] = HOUR_SHAPE) {
  return Array.from({ length: 24 }, (_, i) => {
    const suf = i < 12 ? "AM" : "PM";
    const h12 = i % 12 === 0 ? 12 : i % 12;
    return {
      hourLabel: `${h12}${suf}`,
      hour: i,
      today: +(totals.today * shape[i]).toFixed(2),
      compare: +(totals.compare * shape[(i + 23) % 24]).toFixed(2),
    };
  });
}

const SALES_METRIC_CARDS = [
  { label: "Gross Sales", value: "$47,850.25", delta: "+7.1%", caption: "Total revenue before adjustments", icon: TrendingUp },
  { label: "Net Sales", value: "$45,280.50", delta: "+7.4%", caption: "Total revenue after discounts and refunds", icon: DollarSign },
  { label: "Average Order Value", value: "$38.75", delta: "+9.2%", caption: "Average amount spent per order", icon: ShoppingCart },
  { label: "Sales per Sq Ft", value: "$285.50", delta: "+5.2%", caption: "Revenue efficiency per square foot", icon: Calculator },
  { label: "Revenue per Available Seat Hour", value: "$142.25", delta: "+3.8%", caption: "Revenue optimization metric for seating efficiency", icon: TrendingUp },
  { label: "Customer Count", value: "1,235", delta: "+4.0%", caption: "Total number of unique customers served", icon: Users },
];

// ---- Per-module content (recommendations, KPI cards, breakdown, chart metrics) ----
type MetricCard = { label: string; value: string; delta: string; caption: string; icon: any };
interface ModuleConfig {
  recommendations: Recommendation[];
  metricCards: MetricCard[];
  breakdownTitle: string;
  breakdownSubtitle: string;
  breakdownColumns: [string, string, string];
  breakdownRow: (label: string, i: number) => [string, string, string];
  // Chart-specific
  metricOptions: MetricOption[];
  metricTotals: Record<string, { today: number; compare: number }>;
  hourShape?: number[];
  primaryColor: string; // hex for "today" series
  compareColor: string; // hex for "compare" series
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  "live-sales-dashboard": {
    recommendations: MOCK_RECS,
    metricCards: SALES_METRIC_CARDS,
    breakdownTitle: "Breakdown Report",
    breakdownSubtitle: "Detailed breakdown of revenue and labour cost",
    breakdownColumns: ["Net Sales", "Labour Cost", "Labour %"],
    breakdownRow: (_l, i) => {
      const v = 1200 + (i % 8) * 280;
      const lab = v * 0.28;
      return [fmtCur(v), fmtCur(lab), (28).toFixed(2)];
    },
    metricOptions: SALES_METRIC_OPTIONS,
    metricTotals: SALES_METRIC_TOTALS,
    primaryColor: "#ef4444",
    compareColor: "#7f1d1d",
  },
  "menu-sync-dashboard": {
    recommendations: [
      { id: "m1", text: "Burger Buns at 12 units. Disable combo meals before dinner rush.", category: "Menu", when: "Urgent", dotColor: "bg-red-400" },
      { id: "m2", text: "Truffle Pasta 86'd on POS. Hide from online ordering channels now.", category: "Menu", when: "Now", dotColor: "bg-emerald-400" },
      { id: "m3", text: "Suggest Margherita Pizza as alternative for unavailable Quattro Formaggi.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
      { id: "m4", text: "Kitchen ticket time on Ramen exceeds 18 min. Flag as delayed item.", category: "Menu", when: "Live", dotColor: "bg-amber-400" },
      { id: "m5", text: "Salmon removed from menu yesterday still visible on UberEats. Resync.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
      { id: "m6", text: "Oat Milk stock at 3 units. Pause oat milk modifier on beverages.", category: "Menu", when: "Today", dotColor: "bg-red-400" },
      { id: "m7", text: "Lobster Roll availability synced across DoorDash, Grubhub, Direct.", category: "Menu", when: "Confirmed", dotColor: "bg-emerald-400" },
      { id: "m8", text: "Seasonal menu rotation due Friday. Stage new items for review.", category: "Menu", when: "This week", dotColor: "bg-blue-400" },
    ],
    metricCards: [
      { label: "86'd Products", value: "7", delta: "+2", caption: "Items currently marked unavailable", icon: ShoppingCart },
      { label: "Low Stock Items", value: "12", delta: "+4", caption: "Below par level, needs replenishment", icon: TrendingUp },
      { label: "Channels Synced", value: "5 / 5", delta: "100%", caption: "POS, Direct, UberEats, DoorDash, Grubhub", icon: Calculator },
      { label: "Avg Sync Latency", value: "2.4s", delta: "-0.8s", caption: "Time to propagate availability changes", icon: DollarSign },
      { label: "Delayed Kitchen Items", value: "3", delta: "+1", caption: "Tickets exceeding standard prep time", icon: Users },
      { label: "Menu Updates Today", value: "14", delta: "+6", caption: "Add, remove, and availability changes", icon: TrendingUp },
    ],
    breakdownTitle: "Menu Availability Breakdown",
    breakdownSubtitle: "Stock status and channel sync per product",
    breakdownColumns: ["On Hand", "Channels Live", "Status"],
    breakdownRow: (_l, i) => {
      const stock = [12, 0, 6, 28, 3, 0, 45, 18][i % 8];
      const channels = stock === 0 ? "0 / 5" : "5 / 5";
      const status = stock === 0 ? "86'd" : stock < 10 ? "Low" : "In Stock";
      return [String(stock), channels, status];
    },
    metricOptions: [
      { key: "eightySixFreq", label: "86'd Item Frequency", isCurrency: false },
      { key: "outOfStock", label: "Out-of-Stock Trends", isCurrency: false },
      { key: "delayedPrep", label: "Delayed Prep Items", isCurrency: false },
      { key: "availability", label: "Item Availability", isCurrency: false, suffix: "%" },
      { key: "menuUpdates", label: "Menu Updates", isCurrency: false },
      { key: "syncLatency", label: "Channel Sync Latency", isCurrency: false, suffix: "s" },
    ],
    metricTotals: {
      eightySixFreq: { today: 38, compare: 24 },
      outOfStock: { today: 21, compare: 16 },
      delayedPrep: { today: 14, compare: 9 },
      availability: { today: 96, compare: 92 },
      menuUpdates: { today: 84, compare: 56 },
      syncLatency: { today: 28, compare: 42 },
    },
    hourShape: HOUR_SHAPE_OPS,
    primaryColor: "#10b981",
    compareColor: "#064e3b",
  },
  "upsell-prompts-dashboard": {
    recommendations: [
      { id: "u1", text: "Suggest garlic bread with pasta orders. 38% conversion last week.", category: "Promo", when: "Live", dotColor: "bg-amber-400" },
      { id: "u2", text: "Tables of 4+ are 62% more likely to order sharing platters.", category: "Promo", when: "Now", dotColor: "bg-amber-400" },
      { id: "u3", text: "Premium beverages convert best during 7-9 PM dinner rush.", category: "Promo", when: "Tonight", dotColor: "bg-amber-400" },
      { id: "u4", text: "High-margin dessert: Tiramisu attach rate up 22% with espresso bundle.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
      { id: "u5", text: "Add-on truffle fries on burgers add $4.50 to average ticket.", category: "Promo", when: "Live", dotColor: "bg-amber-400" },
      { id: "u6", text: "Lunch hour: pair side salad with sandwich combo for +18% AOV.", category: "Promo", when: "Lunch", dotColor: "bg-amber-400" },
      { id: "u7", text: "Wine pairing suggestions boost dinner ticket size by $12 average.", category: "Promo", when: "Dinner", dotColor: "bg-amber-400" },
      { id: "u8", text: "Brunch tables convert 41% on mimosa upgrades. Prompt server.", category: "Promo", when: "Weekend", dotColor: "bg-amber-400" },
    ],
    metricCards: [
      { label: "Upsell Acceptance Rate", value: "34.2%", delta: "+5.1%", caption: "Suggestions accepted by guests today", icon: TrendingUp },
      { label: "Avg Ticket Lift", value: "$6.80", delta: "+$1.20", caption: "Incremental revenue per accepted upsell", icon: DollarSign },
      { label: "Top Add-On", value: "Garlic Bread", delta: "128", caption: "Most-attached side product today", icon: ShoppingCart },
      { label: "High-Margin Pushes", value: "47", delta: "+12", caption: "Premium item prompts fired", icon: Calculator },
      { label: "Group Platter Conversion", value: "62%", delta: "+8%", caption: "Tables of 4+ ordering sharing items", icon: Users },
      { label: "Peak Upsell Window", value: "7-9 PM", delta: "Dinner", caption: "Hour with highest conversion rate", icon: TrendingUp },
    ],
    breakdownTitle: "Upsell Opportunity Breakdown",
    breakdownSubtitle: "Add-on performance and ticket lift by suggestion",
    breakdownColumns: ["Prompts Fired", "Accepted", "Ticket Lift"],
    breakdownRow: (_l, i) => {
      const fired = 40 + (i % 6) * 12;
      const accepted = Math.round(fired * 0.34);
      return [String(fired), String(accepted), fmtCur(accepted * 6.8)];
    },
    metricOptions: [
      { key: "conversion", label: "Upsell Conversion Rate", isCurrency: false, suffix: "%" },
      { key: "acceptedAddOns", label: "Accepted Add-Ons", isCurrency: false },
      { key: "highMargin", label: "High-Margin Item Sales", isCurrency: true },
      { key: "suggestedVsAccepted", label: "Suggested vs Accepted", isCurrency: false },
      { key: "ticketLift", label: "Avg Ticket Lift", isCurrency: true },
      { key: "promptsFired", label: "Prompts Fired", isCurrency: false },
    ],
    metricTotals: {
      conversion: { today: 34.2, compare: 29.1 },
      acceptedAddOns: { today: 412, compare: 348 },
      highMargin: { today: 5840.25, compare: 4920.80 },
      suggestedVsAccepted: { today: 1205, compare: 1098 },
      ticketLift: { today: 6.80, compare: 5.60 },
      promptsFired: { today: 1205, compare: 1098 },
    },
    hourShape: HOUR_SHAPE_OPS,
    primaryColor: "#f59e0b",
    compareColor: "#78350f",
  },
  "guest-personalisation-dashboard": {
    recommendations: [
      { id: "g1", text: "Sarah M. (returning) usually orders oat milk latte. Pre-suggest at order.", category: "Promo", when: "Live", dotColor: "bg-emerald-400" },
      { id: "g2", text: "James P. has nut allergy on file. Avoid recommending pesto and baklava.", category: "Menu", when: "Urgent", dotColor: "bg-red-400" },
      { id: "g3", text: "Loyalty member Anna R. has 850 points. Offer free dessert redemption.", category: "Promo", when: "Now", dotColor: "bg-emerald-400" },
      { id: "g4", text: "Returning guest Tom W. prefers booth seating. Reserve table 7.", category: "Staffing", when: "Tonight", dotColor: "bg-amber-400" },
      { id: "g5", text: "VIP guest dietary: vegan. Highlight plant-based specials at greeting.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
      { id: "g6", text: "Frequent orderer Maria L. always adds avocado. Auto-include in suggestion.", category: "Menu", when: "Live", dotColor: "bg-emerald-400" },
      { id: "g7", text: "Birthday flag: Daniel K. dines tonight. Notify manager for complimentary treat.", category: "Promo", when: "Tonight", dotColor: "bg-amber-400" },
      { id: "g8", text: "Gluten-free preference detected for table 12. Show GF menu first.", category: "Menu", when: "Now", dotColor: "bg-emerald-400" },
    ],
    metricCards: [
      { label: "Returning Guests Today", value: "84", delta: "+12", caption: "Recognised loyalty or order history", icon: Users },
      { label: "Dietary Flags Active", value: "23", delta: "+5", caption: "Allergy and preference notes in service", icon: ShoppingCart },
      { label: "Personalised Suggestions", value: "156", delta: "+34", caption: "Tailored prompts surfaced to staff", icon: TrendingUp },
      { label: "Loyalty Redemptions", value: "18", delta: "+6", caption: "Reward points used in active sessions", icon: DollarSign },
      { label: "Guest Satisfaction", value: "4.8 / 5", delta: "+0.2", caption: "Avg rating from personalised orders", icon: Calculator },
      { label: "Repeat Visit Rate", value: "42%", delta: "+3.5%", caption: "Guests returning within 30 days", icon: TrendingUp },
    ],
    breakdownTitle: "Guest Insights Breakdown",
    breakdownSubtitle: "Returning guest preferences, dietary notes, and loyalty status",
    breakdownColumns: ["Visits", "Top Item", "Loyalty Pts"],
    breakdownRow: (_l, i) => {
      const visits = 4 + (i % 6) * 2;
      const items = ["Oat Milk Latte", "Margherita Pizza", "Caesar Salad", "Truffle Fries", "Tiramisu", "House Burger", "Pad Thai", "Avocado Toast"];
      const pts = 120 + (i % 8) * 95;
      return [String(visits), items[i % items.length], String(pts)];
    },
    metricOptions: [
      { key: "returningGuests", label: "Returning Guest Frequency", isCurrency: false },
      { key: "favouriteItems", label: "Favourite Item Orders", isCurrency: false },
      { key: "dietaryFlags", label: "Dietary Preferences", isCurrency: false },
      { key: "loyaltyEngagement", label: "Loyalty Engagement", isCurrency: false },
      { key: "personalisedAccept", label: "Personalised Acceptance", isCurrency: false, suffix: "%" },
      { key: "repeatVisitRate", label: "Repeat Visit Rate", isCurrency: false, suffix: "%" },
    ],
    metricTotals: {
      returningGuests: { today: 84, compare: 72 },
      favouriteItems: { today: 218, compare: 184 },
      dietaryFlags: { today: 23, compare: 18 },
      loyaltyEngagement: { today: 156, compare: 122 },
      personalisedAccept: { today: 68, compare: 61 },
      repeatVisitRate: { today: 42, compare: 38.5 },
    },
    hourShape: HOUR_SHAPE_OPS,
    primaryColor: "#a855f7",
    compareColor: "#4c1d95",
  },
  "inventory-dashboard": {
    recommendations: [
      { id: "i1", text: "Tomatoes below par. Reorder 40 lbs before tomorrow service.", category: "Menu", when: "Urgent", dotColor: "bg-red-400" },
      { id: "i2", text: "Olive Oil usage 18% above forecast. Adjust replenishment cycle.", category: "Finance", when: "This week", dotColor: "bg-blue-400" },
      { id: "i3", text: "Salmon will deplete in 2 days at current pace. Schedule order.", category: "Menu", when: "Tomorrow", dotColor: "bg-emerald-400" },
      { id: "i4", text: "Cabernet wine variance 4.2%. Investigate possible over-pour.", category: "Finance", when: "Today", dotColor: "bg-red-400" },
      { id: "i5", text: "Bread waste reduced 22% after par adjustment. Hold settings.", category: "Menu", when: "This week", dotColor: "bg-emerald-400" },
      { id: "i6", text: "Cheese inventory healthy. No action needed.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
      { id: "i7", text: "Spike in cleaning supply usage. Verify with FOH manager.", category: "Staffing", when: "Today", dotColor: "bg-amber-400" },
      { id: "i8", text: "Auto-reorder triggered for napkins and straws.", category: "Menu", when: "Confirmed", dotColor: "bg-emerald-400" },
    ],
    metricCards: [
      { label: "Items Below Par", value: "14", delta: "+3", caption: "Stock under reorder threshold", icon: ShoppingCart },
      { label: "Forecast Stockouts", value: "5", delta: "+2", caption: "Predicted within 48 hours", icon: TrendingUp },
      { label: "Auto-Reorders Queued", value: "9", delta: "+4", caption: "Pending vendor confirmation", icon: Calculator },
      { label: "Inventory Value", value: "$28,420", delta: "-2.1%", caption: "Current on-hand at cost", icon: DollarSign },
      { label: "Waste % Today", value: "3.2%", delta: "-0.6%", caption: "Spoilage as share of usage", icon: Users },
      { label: "Variance vs COGS", value: "1.8%", delta: "+0.3%", caption: "Theoretical vs actual usage", icon: TrendingUp },
    ],
    breakdownTitle: "Stock Movement Breakdown",
    breakdownSubtitle: "On-hand, usage, and reorder status by product",
    breakdownColumns: ["On Hand", "Used", "Status"],
    breakdownRow: (_l, i) => {
      const onHand = [40, 12, 0, 88, 22, 6, 130, 4][i % 8];
      const used = [18, 30, 24, 14, 8, 20, 32, 16][i % 8];
      const status = onHand === 0 ? "Stockout" : onHand < 15 ? "Low" : "OK";
      return [String(onHand), String(used), status];
    },
    metricOptions: [
      { key: "itemsBelowPar", label: "Items Below Par", isCurrency: false },
      { key: "stockouts", label: "Forecast Stockouts", isCurrency: false },
      { key: "autoReorders", label: "Auto-Reorders Queued", isCurrency: false },
      { key: "inventoryValue", label: "Inventory Value", isCurrency: true },
      { key: "wastePct", label: "Waste %", isCurrency: false, suffix: "%" },
      { key: "variancePct", label: "Variance vs COGS", isCurrency: false, suffix: "%" },
    ],
    metricTotals: {
      itemsBelowPar: { today: 14, compare: 11 },
      stockouts: { today: 5, compare: 3 },
      autoReorders: { today: 9, compare: 5 },
      inventoryValue: { today: 28420, compare: 29030 },
      wastePct: { today: 3.2, compare: 3.8 },
      variancePct: { today: 1.8, compare: 1.5 },
    },
    hourShape: HOUR_SHAPE_OPS,
    primaryColor: "#06b6d4",
    compareColor: "#155e75",
  },
  "profit-dashboard": {
    recommendations: [
      { id: "p1", text: "Dinner shift refunds 38% above avg. Audit recent transactions.", category: "Finance", when: "Urgent", dotColor: "bg-red-400" },
      { id: "p2", text: "Labour to sales ratio 32%. Trim one closing role for next shift.", category: "Labor", when: "Tonight", dotColor: "bg-blue-400" },
      { id: "p3", text: "Cocktail program margin +4.2%. Promote signature drinks.", category: "Promo", when: "Live", dotColor: "bg-amber-400" },
      { id: "p4", text: "Lunch service food cost spiked. Review portion control on entrees.", category: "Finance", when: "Today", dotColor: "bg-red-400" },
      { id: "p5", text: "Net profit pacing $2,140 over plan. Maintain current execution.", category: "Finance", when: "Today", dotColor: "bg-emerald-400" },
      { id: "p6", text: "Comp meals up 15%. Verify approvals with managers.", category: "Finance", when: "Today", dotColor: "bg-red-400" },
      { id: "p7", text: "Tuesday margins consistently lowest. Test promo bundle.", category: "Promo", when: "Tuesday", dotColor: "bg-amber-400" },
      { id: "p8", text: "Beverage attach drives margin. Brief servers pre-shift.", category: "Staffing", when: "Tomorrow", dotColor: "bg-amber-400" },
    ],
    metricCards: [
      { label: "Gross Profit", value: "$18,640", delta: "+6.2%", caption: "Revenue less COGS today", icon: DollarSign },
      { label: "Net Profit", value: "$9,820", delta: "+4.5%", caption: "After labour and overheads", icon: TrendingUp },
      { label: "Profit Margin", value: "21.7%", delta: "+0.8%", caption: "Net profit as share of revenue", icon: Calculator },
      { label: "Food Cost %", value: "29.4%", delta: "+0.6%", caption: "COGS share of sales", icon: ShoppingCart },
      { label: "Labour Cost %", value: "28.2%", delta: "-0.4%", caption: "Wages share of sales", icon: Users },
      { label: "Refunds & Comps", value: "$642", delta: "+18%", caption: "Flagged for anomaly review", icon: TrendingUp },
    ],
    breakdownTitle: "Profit Breakdown",
    breakdownSubtitle: "Revenue, cost, and margin by period",
    breakdownColumns: ["Revenue", "Cost", "Margin %"],
    breakdownRow: (_l, i) => {
      const rev = 1800 + (i % 8) * 320;
      const cost = rev * 0.62;
      const margin = ((rev - cost) / rev) * 100;
      return [fmtCur(rev), fmtCur(cost), margin.toFixed(2)];
    },
    metricOptions: [
      { key: "grossProfit", label: "Gross Profit", isCurrency: true },
      { key: "netProfit", label: "Net Profit", isCurrency: true },
      { key: "profitMargin", label: "Profit Margin", isCurrency: false, suffix: "%" },
      { key: "foodCostPct", label: "Food Cost %", isCurrency: false, suffix: "%" },
      { key: "labourCostPct", label: "Labour Cost %", isCurrency: false, suffix: "%" },
      { key: "refundsComps", label: "Refunds & Comps", isCurrency: true },
    ],
    metricTotals: {
      grossProfit: { today: 18640, compare: 17550 },
      netProfit: { today: 9820, compare: 9400 },
      profitMargin: { today: 21.7, compare: 20.9 },
      foodCostPct: { today: 29.4, compare: 28.8 },
      labourCostPct: { today: 28.2, compare: 28.6 },
      refundsComps: { today: 642, compare: 544 },
    },
    primaryColor: "#22c55e",
    compareColor: "#14532d",
  },
  "forecasting-dashboard": {
    recommendations: [
      { id: "f1", text: "Dinner traffic predicted +18% tonight. Add 2 servers, 1 runner.", category: "Staffing", when: "Tonight", dotColor: "bg-amber-400" },
      { id: "f2", text: "Lunch likely soft Wednesday. Cut one prep cook from schedule.", category: "Labor", when: "Wednesday", dotColor: "bg-blue-400" },
      { id: "f3", text: "Weather impact: rain expected Friday. Boost delivery staffing.", category: "Staffing", when: "Friday", dotColor: "bg-amber-400" },
      { id: "f4", text: "Forecast accuracy 94% last week. Apply same model this week.", category: "Labor", when: "This week", dotColor: "bg-blue-400" },
      { id: "f5", text: "Brunch on Sunday tracking +25%. Pre-portion mimosa station.", category: "Menu", when: "Sunday", dotColor: "bg-emerald-400" },
      { id: "f6", text: "Bartender coverage gap 9-10 PM Saturday. Move shift earlier.", category: "Staffing", when: "Saturday", dotColor: "bg-amber-400" },
      { id: "f7", text: "Holiday week forecast loaded. Confirm PTO blackout dates.", category: "Labor", when: "Next month", dotColor: "bg-blue-400" },
      { id: "f8", text: "Catering inquiry uptick. Reserve prep hours Thursday AM.", category: "Staffing", when: "Thursday", dotColor: "bg-amber-400" },
    ],
    metricCards: [
      { label: "Forecast Accuracy", value: "94.2%", delta: "+1.4%", caption: "Predicted vs actual last 7 days", icon: TrendingUp },
      { label: "Predicted Covers", value: "312", delta: "+18%", caption: "Expected guests tonight", icon: Users },
      { label: "Recommended Staff", value: "14", delta: "+2", caption: "Optimal headcount for forecast", icon: ShoppingCart },
      { label: "Coverage Gaps", value: "3", delta: "-1", caption: "Roles needing reassignment", icon: Calculator },
      { label: "Projected Sales", value: "$48,900", delta: "+7.8%", caption: "Forecast revenue for next shift", icon: DollarSign },
      { label: "Labour Target %", value: "27.5%", delta: "-0.5%", caption: "Optimal wage ratio per forecast", icon: TrendingUp },
    ],
    breakdownTitle: "Forecast Breakdown",
    breakdownSubtitle: "Predicted covers, sales, and staffing by period",
    breakdownColumns: ["Covers", "Sales Forecast", "Staff Needed"],
    breakdownRow: (_l, i) => {
      const covers = 35 + (i % 8) * 18;
      const sales = covers * 38.5;
      const staff = Math.max(3, Math.round(covers / 22));
      return [String(covers), fmtCur(sales), String(staff)];
    },
    metricOptions: [
      { key: "predictedCovers", label: "Predicted Covers", isCurrency: false },
      { key: "projectedSales", label: "Projected Sales", isCurrency: true },
      { key: "recommendedStaff", label: "Recommended Staff", isCurrency: false },
      { key: "coverageGaps", label: "Coverage Gaps", isCurrency: false },
      { key: "forecastAccuracy", label: "Forecast Accuracy", isCurrency: false, suffix: "%" },
      { key: "labourTargetPct", label: "Labour Target %", isCurrency: false, suffix: "%" },
    ],
    metricTotals: {
      predictedCovers: { today: 312, compare: 264 },
      projectedSales: { today: 48900, compare: 45360 },
      recommendedStaff: { today: 14, compare: 12 },
      coverageGaps: { today: 3, compare: 4 },
      forecastAccuracy: { today: 94.2, compare: 92.8 },
      labourTargetPct: { today: 27.5, compare: 28 },
    },
    hourShape: HOUR_SHAPE_OPS,
    primaryColor: "#3b82f6",
    compareColor: "#1e3a8a",
  },
};


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
const ChartTooltip = ({ active, payload, label, isCurrency, suffix, compareLabel }: any) => {
  if (!active || !payload?.length) return null;
  const today = payload.find((p: any) => p.dataKey === "today")?.value ?? 0;
  const compare = payload.find((p: any) => p.dataKey === "compare")?.value ?? 0;
  const fmt = (v: number) => {
    if (isCurrency) return fmtCur(v);
    const n = Number.isInteger(v) ? fmtNum(v) : Number(v).toFixed(1);
    return suffix ? `${n}${suffix}` : n;
  };
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
  const cfg = MODULE_CONFIGS[notification.id] ?? MODULE_CONFIGS["live-sales-dashboard"];
  const RECS = cfg.recommendations;
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

  // Selected metric & view mode (reset when module changes)
  const [metric, setMetric] = useState<MetricKey>(cfg.metricOptions[0].key);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  useEffect(() => { setMetric(cfg.metricOptions[0].key); }, [notification.id]);
  const selectedMetric = cfg.metricOptions.find((m) => m.key === metric) ?? cfg.metricOptions[0];
  const totals = cfg.metricTotals[selectedMetric.key] ?? { today: 0, compare: 0 };

  // Dummy chart data driven by metric
  const chartData = useMemo(() => buildHourly(totals, cfg.hourShape), [totals.today, totals.compare, cfg.hourShape]);
  const todayValue = totals.today;
  const compareValue = totals.compare;
  const formatMetricValue = (v: number) => {
    if (selectedMetric.isCurrency) return fmtCur(v);
    const n = Number.isInteger(v) ? fmtNum(v) : v.toFixed(1);
    return selectedMetric.suffix ? `${n}${selectedMetric.suffix}` : n;
  };

  // Breakdown report (driven by selected granularity + range)
  const [bdRange, setBdRange] = useState({ start: today0, end: todayEnd, quick: "Today" as QuickSelect });
  const [bdGran, setBdGran] = useState<Granularity>("Hourly");
  const [bdCompare, setBdCompare] = useState({ start: ystd, end: ystdEnd, quick: "Yesterday" as QuickSelect });
  const [bdCompareGran, setBdCompareGran] = useState<Granularity>("Daily");

  const breakdownRows = useMemo(() => {
    if (bdGran === "Hourly") {
      return chartData.map((h) => ({ time: h.hourLabel }));
    }
    if (bdGran === "Daily") {
      const days = Math.max(1, Math.round((bdRange.end.getTime() - bdRange.start.getTime()) / 86400000) + 1);
      return Array.from({ length: Math.min(days, 31) }, (_, i) => ({
        time: format(new Date(bdRange.start.getTime() + i * 86400000), "MMM d"),
      }));
    }
    return Array.from({ length: 8 }, (_, i) => ({ time: `Week ${i + 1}` }));
  }, [bdGran, bdRange, chartData]);


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
              <span className="text-sm font-semibold text-foreground tabular-nums">{RECS.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-2 space-y-3 min-h-0">
              {RECS.slice(0, 3).map((rec) => (
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
                <span>View all {RECS.length} recommendations</span>
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>


        {/* Row 2: 6 metric cards (matches reference design) */}
        <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          {cfg.metricCards.map((m) => {
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
          <h3 className="text-xl font-bold text-foreground">{cfg.breakdownTitle}</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">{cfg.breakdownSubtitle}</p>

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
                  <th className="px-5 py-3 font-medium text-right">{cfg.breakdownColumns[0]}</th>
                  <th className="px-5 py-3 font-medium text-right">{cfg.breakdownColumns[1]}</th>
                  <th className="px-5 py-3 font-medium text-right">{cfg.breakdownColumns[2]}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r, i) => {
                  const cells = cfg.breakdownRow(r.time, bdPage * PAGE_SIZE + i);
                  return (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="px-5 py-3.5 text-foreground/90">{r.time}</td>
                      <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{cells[0]}</td>
                      <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{cells[1]}</td>
                      <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{cells[2]}</td>
                    </tr>
                  );
                })}
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
                  <img src={aiEIcon} alt="AI" className="w-4 h-4 object-contain" />
                </div>
                <h2 className="text-base font-bold text-foreground flex-1">All recommendations</h2>
                <span className="text-sm font-semibold text-foreground tabular-nums">{RECS.length}</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
                {RECS.map((rec) => (
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
