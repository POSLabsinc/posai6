// Mock commodity market data used by CommodityPriceInsightView.
// Keys are matched against notification title/headline (case-insensitive).

export interface ForecastPoint { day: string; price: number; change: number }
export interface ReasonItem { iconKey: "rain" | "truck" | "package" | "demand" | "fuel" | "season"; text: string }

export interface CommodityData {
  product: string;          // display name e.g. "Tomatoes"
  unit: string;             // "£/kg"
  emoji?: string;
  today: number;
  yesterday: number;
  lastWeekAvg: number;
  weekChangePct: number;    // signed
  forecast: ForecastPoint[];
  reasons: ReasonItem[];
  suggestions: string[];
  decision: string;
  chips: string[];
}

const baseChips = (name: string) => [
  `Why is ${name.toLowerCase()} expensive right now?`,
  "Should we stock now or wait?",
  "How much should I buy this week?",
  "When will prices drop?",
];

export const COMMODITIES: Record<string, CommodityData> = {
  onion: {
    product: "Onions",
    unit: "£/kg",
    emoji: "🧅",
    today: 1.24,
    yesterday: 1.11,
    lastWeekAvg: 1.04,
    weekChangePct: 12,
    forecast: [
      { day: "Today", price: 1.24, change: +12 },
      { day: "Tue", price: 1.29, change: +4 },
      { day: "Wed", price: 1.33, change: +3 },
      { day: "Thu", price: 1.36, change: +2 },
      { day: "Fri", price: 1.34, change: -1 },
      { day: "Sat", price: 1.28, change: -4 },
      { day: "Sun", price: 1.22, change: -5 },
    ],
    reasons: [
      { iconKey: "rain", text: "Heavy rains in key growing regions reduced harvest yield by ~8%." },
      { iconKey: "truck", text: "Wholesale supply tightened as distributors hold stock for forecasted price rise." },
      { iconKey: "demand", text: "Demand spike from restaurants restocking after weekend service." },
    ],
    suggestions: [
      "Stock now, prices forecast to rise another 7-10% by Thursday.",
      "Buy a 4-day supply, avoid bulk purchase as prices ease by Sunday.",
      "Prep onions in smaller batches to reduce waste during the price peak.",
      "Negotiate a fixed-price deal with your supplier for the next 2 weeks.",
    ],
    decision: "Recommended: Stock now. Prices expected to rise another ~10% by Thursday before easing late next week.",
    chips: baseChips("Onions"),
  },
  tomato: {
    product: "Tomatoes",
    unit: "£/kg",
    emoji: "🍅",
    today: 2.45,
    yesterday: 2.30,
    lastWeekAvg: 2.10,
    weekChangePct: 16,
    forecast: [
      { day: "Today", price: 2.45, change: +16 },
      { day: "Tue", price: 2.55, change: +4 },
      { day: "Wed", price: 2.62, change: +3 },
      { day: "Thu", price: 2.58, change: -2 },
      { day: "Fri", price: 2.40, change: -7 },
      { day: "Sat", price: 2.25, change: -6 },
      { day: "Sun", price: 2.15, change: -4 },
    ],
    reasons: [
      { iconKey: "season", text: "End-of-season harvest in Spain, fewer greenhouse imports reaching wholesale." },
      { iconKey: "fuel", text: "Diesel cost increase pushed transport rates up 6% week over week." },
      { iconKey: "demand", text: "Strong restaurant demand for summer salad menus." },
    ],
    suggestions: [
      "Buy only a 3-day supply, prices expected to drop ~12% by the weekend.",
      "Switch to canned tomatoes for cooked dishes to cut cost by ~30%.",
      "Promote dishes that use less tomato while spot prices peak.",
    ],
    decision: "Recommended: Buy short. Prices peak Wednesday then drop ~12% by Sunday, wait for Friday for bulk orders.",
    chips: baseChips("Tomatoes"),
  },
  chicken: {
    product: "Chicken (whole)",
    unit: "£/kg",
    emoji: "🍗",
    today: 4.85,
    yesterday: 4.70,
    lastWeekAvg: 4.55,
    weekChangePct: 7,
    forecast: [
      { day: "Today", price: 4.85, change: +7 },
      { day: "Tue", price: 4.92, change: +1 },
      { day: "Wed", price: 4.95, change: +1 },
      { day: "Thu", price: 4.98, change: +1 },
      { day: "Fri", price: 4.95, change: -1 },
      { day: "Sat", price: 4.88, change: -1 },
      { day: "Sun", price: 4.80, change: -2 },
    ],
    reasons: [
      { iconKey: "fuel", text: "Feed grain prices up 9% globally, pushing farm-gate poultry costs higher." },
      { iconKey: "demand", text: "Strong export demand draining UK supply." },
      { iconKey: "truck", text: "Cold-chain logistics fees increased after recent fuel surcharge." },
    ],
    suggestions: [
      "Lock in a weekly contract price with your butcher to hedge further increases.",
      "Promote thigh / leg cuts which are 18% cheaper than breast right now.",
      "Cross-utilize chicken in 2 dishes to lower waste and increase yield.",
    ],
    decision: "Recommended: Stock 7 days. Prices keep climbing into Thursday, with only minor relief over the weekend.",
    chips: baseChips("Chicken"),
  },
  beef: {
    product: "Beef (mince)",
    unit: "£/kg",
    emoji: "🥩",
    today: 8.40,
    yesterday: 8.10,
    lastWeekAvg: 7.85,
    weekChangePct: 9,
    forecast: [
      { day: "Today", price: 8.40, change: +9 },
      { day: "Tue", price: 8.55, change: +2 },
      { day: "Wed", price: 8.65, change: +1 },
      { day: "Thu", price: 8.70, change: +1 },
      { day: "Fri", price: 8.60, change: -1 },
      { day: "Sat", price: 8.45, change: -2 },
      { day: "Sun", price: 8.30, change: -2 },
    ],
    reasons: [
      { iconKey: "season", text: "Lower cattle slaughter rates due to high feed costs and drought conditions." },
      { iconKey: "demand", text: "Burger and steak menu demand up 11% week over week across UK casual dining." },
      { iconKey: "truck", text: "Import beef quotas tightening from key suppliers." },
    ],
    suggestions: [
      "Promote chicken or plant-based burgers as the value option this week.",
      "Adjust burger spec down 10g to protect margin without changing menu price.",
      "Pre-order a 5-day supply now, weekend discounts unlikely.",
    ],
    decision: "Recommended: Stock now and protect margin via spec/menu. Prices stay elevated all week.",
    chips: baseChips("Beef"),
  },
  milk: {
    product: "Milk",
    unit: "£/L",
    emoji: "🥛",
    today: 1.18,
    yesterday: 1.14,
    lastWeekAvg: 1.10,
    weekChangePct: 7,
    forecast: [
      { day: "Today", price: 1.18, change: +7 },
      { day: "Tue", price: 1.20, change: +2 },
      { day: "Wed", price: 1.21, change: +1 },
      { day: "Thu", price: 1.20, change: -1 },
      { day: "Fri", price: 1.18, change: -2 },
      { day: "Sat", price: 1.16, change: -2 },
      { day: "Sun", price: 1.14, change: -2 },
    ],
    reasons: [
      { iconKey: "season", text: "Lower seasonal milk yield from UK dairy herds during heat wave." },
      { iconKey: "fuel", text: "Refrigerated transport surcharge up 4% on long-haul routes." },
      { iconKey: "demand", text: "Coffee shop and bakery demand up post school holidays." },
    ],
    suggestions: [
      "Order daily rather than bulk, prices ease ~5% by Sunday.",
      "Switch to UHT milk for cooked applications to save ~22%.",
      "Review portion control on milk-heavy drinks (lattes, hot chocolate).",
    ],
    decision: "Recommended: Buy daily through Wednesday, then stock for the weekend when prices ease.",
    chips: baseChips("Milk"),
  },
  egg: {
    product: "Eggs (medium)",
    unit: "£/dozen",
    emoji: "🥚",
    today: 3.20,
    yesterday: 3.05,
    lastWeekAvg: 2.85,
    weekChangePct: 12,
    forecast: [
      { day: "Today", price: 3.20, change: +12 },
      { day: "Tue", price: 3.30, change: +3 },
      { day: "Wed", price: 3.35, change: +2 },
      { day: "Thu", price: 3.32, change: -1 },
      { day: "Fri", price: 3.20, change: -4 },
      { day: "Sat", price: 3.10, change: -3 },
      { day: "Sun", price: 3.00, change: -3 },
    ],
    reasons: [
      { iconKey: "season", text: "Avian flu outbreak in northern Europe reduced supply by ~6%." },
      { iconKey: "demand", text: "Strong brunch menu demand with bank holiday weekend approaching." },
      { iconKey: "truck", text: "Free-range cage transitions slowed packer throughput." },
    ],
    suggestions: [
      "Stock for the weekend brunch peak before Wednesday's price top.",
      "Promote brunch dishes with lower egg count (1-egg specials).",
      "Switch to liquid pasteurized egg for baking to reduce cost ~18%.",
    ],
    decision: "Recommended: Pre-order Tuesday morning before midweek peak, prices ease by Friday.",
    chips: baseChips("Eggs"),
  },
};

export function detectCommodity(notification: { title?: string; headline?: string }): CommodityData | null {
  const text = `${notification.title || ""} ${notification.headline || ""}`.toLowerCase();
  // Order matters slightly: more specific words first
  const order: (keyof typeof COMMODITIES)[] = ["onion", "tomato", "chicken", "beef", "milk", "egg"];
  for (const key of order) {
    if (text.includes(key)) return COMMODITIES[key];
  }
  // Generic "price" notification fallback to onion
  if (text.includes("price")) return COMMODITIES.onion;
  return null;
}
