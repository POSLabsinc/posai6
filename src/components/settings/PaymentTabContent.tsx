import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Banknote, Star, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

// Payment method icons
import cashIcon from "@/assets/icons/payment-cash.png";
import cardIcon from "@/assets/icons/payment-card.png";
import giftCardIcon from "@/assets/icons/payment-gift-card.png";
import doordashIcon from "@/assets/icons/payment-doordash.png";
import uberEatsIcon from "@/assets/icons/payment-ubereats.png";
import grubhubIcon from "@/assets/icons/payment-grubhub.png";
import loyaltyIcon from "@/assets/icons/payment-loyalty.png";
import accountIcon from "@/assets/icons/payment-account.png";
import manualCardIcon from "@/assets/icons/payment-manual-card.png";
import manualCcIcon from "@/assets/icons/payment-manual-cc.png";
import externalCcIcon from "@/assets/icons/payment-external-cc.png";
import payByLinkIcon from "@/assets/icons/payment-pay-by-link.png";
import voucherIcon from "@/assets/icons/voucher.svg";
import blizzfulIcon from "@/assets/icons/payment-blizzful.png";

interface PaymentOrder {
  id: string;
  order_number: number;
  created_at: string;
  subtotal: number;
  tip_amount: number;
  total: number;
  payment_type: string;
  platform: string | null;
  discount_amount: number;
}

interface PaymentTabContentProps {
  guest: { id: string; name: string };
}

type SortField = "date" | "spent" | "tips" | "points" | "total";
type SortDir = "asc" | "desc";

const paymentCategories = [
  { key: "Gift Card", match: (pt: string) => pt.toLowerCase().includes("gift") },
  { key: "Cards", match: (pt: string) => ["Card", "Credit", "Debit", "Visa", "Mastercard", "Amex"].some(k => pt.toLowerCase().includes(k.toLowerCase())) },
  { key: "Cash", match: (pt: string) => pt.toLowerCase() === "cash" },
  { key: "Online", match: (pt: string) => ["online", "uber", "doordash", "grubhub"].some(k => pt.toLowerCase().includes(k)) },
];

const categorize = (paymentType: string): string => {
  for (const cat of paymentCategories) {
    if (cat.match(paymentType)) return cat.key;
  }
  return "Other";
};

const PaymentTabContent = ({ guest }: PaymentTabContentProps) => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("orders")
        .select("id, order_number, created_at, subtotal, tip_amount, total, payment_type, platform, discount_amount")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [guest.id]);

  // Group orders by category
  const grouped: Record<string, PaymentOrder[]> = {};
  orders.forEach(o => {
    const cat = categorize(o.payment_type);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(o);
  });

  // Summary totals
  const summaryItems = [
    { label: "Cards", icon: CreditCard, key: "Cards" },
    { label: "Cash", icon: Banknote, key: "Cash" },
    { label: "Loyalty Points", icon: Star, key: "Loyalty" },
    { label: "Gift Card", icon: Gift, key: "Gift Card" },
  ];

  const getCategoryTotal = (key: string) => {
    return (grouped[key] || []).reduce((sum, o) => sum + o.total, 0);
  };

  const sortOrders = (items: PaymentOrder[]) => {
    return [...items].sort((a, b) => {
      let va: number, vb: number;
      switch (sortField) {
        case "date": va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); break;
        case "spent": va = a.subtotal; vb = b.subtotal; break;
        case "tips": va = a.tip_amount; vb = b.tip_amount; break;
        case "total": va = a.total; vb = b.total; break;
        default: va = 0; vb = 0;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1 opacity-50">
      <ChevronUp className={`w-3 h-3 -mb-1 ${sortField === field && sortDir === "asc" ? "opacity-100" : "opacity-30"}`} />
      <ChevronDown className={`w-3 h-3 ${sortField === field && sortDir === "desc" ? "opacity-100" : "opacity-30"}`} />
    </span>
  );

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), "dd MMM yyyy"); } catch { return dateStr; }
  };

  const getPaymentIcon = (paymentType: string): { icon: string; bg: string } => {
    const pt = paymentType.toLowerCase();
    if (pt.includes("gift")) return { icon: giftCardIcon, bg: "#CF0064" };
    if (pt.includes("visa") || pt.includes("master") || pt.includes("amex") || pt.includes("credit") || pt.includes("debit")) return { icon: cardIcon, bg: "#9463FF" };
    if (pt.includes("card")) return { icon: cardIcon, bg: "#9463FF" };
    if (pt === "cash") return { icon: cashIcon, bg: "#CF0064" };
    if (pt.includes("doordash")) return { icon: doordashIcon, bg: "#FFFFFF" };
    if (pt.includes("uber")) return { icon: uberEatsIcon, bg: "#FFFFFF" };
    if (pt.includes("grubhub")) return { icon: grubhubIcon, bg: "#FFFFFF" };
    if (pt.includes("loyalty")) return { icon: loyaltyIcon, bg: "#000000" };
    if (pt.includes("account")) return { icon: accountIcon, bg: "#5AB0EE" };
    if (pt.includes("manual") && pt.includes("cc")) return { icon: manualCcIcon, bg: "#FFBD00" };
    if (pt.includes("manual")) return { icon: manualCardIcon, bg: "#FF6381" };
    if (pt.includes("external")) return { icon: externalCcIcon, bg: "#5AB0EE" };
    if (pt.includes("link")) return { icon: payByLinkIcon, bg: "#5AB0EE" };
    if (pt.includes("voucher")) return { icon: voucherIcon, bg: "#FF9500" };
    if (pt.includes("blizzful")) return { icon: blizzfulIcon, bg: "#FFFFFF" };
    if (pt.includes("online")) return { icon: doordashIcon, bg: "#FFFFFF" };
    return { icon: cardIcon, bg: "#9463FF" };
  };

  if (loading) {
    return (
      <div className="bg-neutral-800/40 rounded-2xl p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-neutral-800/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <CreditCard className="w-10 h-10 text-neutral-500 mb-1" />
        <p className="text-neutral-400 text-sm">No payment history available yet.</p>
      </div>
    );
  }

  const allCategories = Object.keys(grouped);

  return (
    <div className="space-y-5">
      {/* SUMMARY */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">Summary</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryItems.map(item => {
            const total = getCategoryTotal(item.key);
            const Icon = item.icon;
            return (
              <div key={item.key} className="rounded-2xl p-4 flex items-center gap-3 bg-neutral-200/60 dark:bg-[#26262699]">
                <div className="w-10 h-10 rounded-xl bg-neutral-700/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-neutral-300" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                  <p className="text-xs text-neutral-400">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYMENT TABLE */}
      <div className="rounded-2xl overflow-hidden bg-neutral-200/60 dark:bg-[#26262699]">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-neutral-700/50 text-xs font-medium text-neutral-500">
          <button onClick={() => toggleSort("date")} className="flex items-center gap-0.5 text-left">Date <SortIcon field="date" /></button>
          <button onClick={() => toggleSort("spent")} className="flex items-center gap-0.5 text-left">Spent <SortIcon field="spent" /></button>
          <button onClick={() => toggleSort("tips")} className="flex items-center gap-0.5 text-left">Tips <SortIcon field="tips" /></button>
          <div className="text-left">Points</div>
          <div className="text-left">Payment Type</div>
          <button onClick={() => toggleSort("total")} className="flex items-center gap-0.5 text-right justify-end">Total <SortIcon field="total" /></button>
        </div>

        {/* Grouped Rows */}
        {allCategories.map(category => {
          const catOrders = sortOrders(grouped[category]);
          const catTotal = catOrders.reduce((sum, o) => sum + o.total, 0);
          const catTips = catOrders.reduce((sum, o) => sum + o.tip_amount, 0);
          const catSpent = catOrders.reduce((sum, o) => sum + o.subtotal, 0);
          const isExpanded = expandedCategory === category;

          return (
            <div key={category}>
              {/* Category Label */}
              <div className="px-4 py-2 bg-neutral-200/60 dark:bg-[#26262699]">
                <span className="text-xs font-medium text-neutral-500">{category}</span>
              </div>

              {/* Summary Row (clickable to expand) */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full grid grid-cols-6 gap-2 px-4 py-3 hover:bg-neutral-700/20 transition-colors text-sm items-center"
              >
                <span className="text-foreground text-left">{formatDate(catOrders[0]?.created_at)}</span>
                <span className="text-foreground text-left">{formatCurrency(catSpent)}</span>
                <span className="text-foreground text-left">{formatCurrency(catTips)}</span>
                <span className="text-foreground text-left">{String(catOrders.length).padStart(2, '0')}</span>
                <span className="text-foreground text-left flex items-center">
                  {(() => { const pi = getPaymentIcon(catOrders[0]?.payment_type || ""); return (
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img src={pi.icon} alt="" className="w-5 h-5 object-contain" />
                    </span>
                  ); })()}
                </span>
                <span className="text-foreground text-right flex items-center justify-end gap-2">
                  <span className="bg-neutral-700/50 rounded-full w-6 h-6 flex items-center justify-center text-xs text-neutral-300">{catOrders.length}</span>
                  {formatCurrency(catTotal)}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </span>
              </button>

              {/* Expanded Detail Rows */}
              {isExpanded && (
                <div className="bg-neutral-900/30">
                  <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-700/30">
                    <span>Date</span>
                    <span>Spent</span>
                    <span>Tips</span>
                    <span>Points</span>
                    <span>Platform</span>
                    <span className="text-right">Total</span>
                  </div>
                  {catOrders.map(order => (
                    <div key={order.id} className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-neutral-800/30 text-sm">
                      <span className="text-foreground">{formatDate(order.created_at)}</span>
                      <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
                      <span className="text-foreground">{formatCurrency(order.tip_amount)}</span>
                      <span className="text-foreground">{String(Math.floor(order.subtotal / 10)).padStart(2, '0')}</span>
                      <span className="text-foreground flex items-center">
                        {(() => { const pi = getPaymentIcon(order.payment_type); return (
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center">
                            <img src={pi.icon} alt={order.payment_type} className="w-4 h-4 object-contain" />
                          </span>
                        ); })()}
                      </span>
                      <span className="text-foreground text-right">{formatCurrency(order.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentTabContent;
