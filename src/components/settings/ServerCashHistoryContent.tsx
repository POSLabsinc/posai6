import { useState, useEffect } from "react";
import { ChevronLeft, User, Clock, DollarSign, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface ServerCashHistoryContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

interface TransactionEntry {
  id: string;
  type: "cash_sale" | "card_sale" | "tip_cash" | "tip_card" | "pay_in" | "pay_out" | "refund";
  amount: number;
  timestamp: string;
  note?: string;
  reason?: string;
}

interface ShiftSummary {
  serverName: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string | null;
  cashSales: number;
  cardSales: number;
  tipsCash: number;
  tipsCard: number;
  payIns: number;
  payOuts: number;
  totalCashHandled: number;
  totalCardTransactions: number;
  totalTips: number;
  netCashDeposit: number;
  transactions: TransactionEntry[];
}

const formatCurrency = (amount: number) => {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getTypeLabel = (type: TransactionEntry["type"]) => {
  const map: Record<string, string> = {
    cash_sale: "Cash Sale",
    card_sale: "Card Sale",
    tip_cash: "Tip (Cash)",
    tip_card: "Tip (Card)",
    pay_in: "Pay In",
    pay_out: "Pay Out",
    refund: "Refund",
  };
  return map[type] || type;
};

const getTypeIcon = (type: TransactionEntry["type"]) => {
  switch (type) {
    case "cash_sale": return <Banknote className="w-4 h-4 text-emerald-400" />;
    case "card_sale": return <CreditCard className="w-4 h-4 text-blue-400" />;
    case "tip_cash": return <TrendingUp className="w-4 h-4 text-amber-400" />;
    case "tip_card": return <TrendingUp className="w-4 h-4 text-amber-400" />;
    case "pay_in": return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    case "pay_out": return <ArrowUpRight className="w-4 h-4 text-red-400" />;
    case "refund": return <ArrowUpRight className="w-4 h-4 text-red-400" />;
    default: return <DollarSign className="w-4 h-4 text-muted-foreground" />;
  }
};

const getAmountColor = (type: TransactionEntry["type"]) => {
  if (["pay_out", "refund"].includes(type)) return "text-red-400";
  if (["cash_sale", "card_sale", "pay_in"].includes(type)) return "text-emerald-400";
  return "text-amber-400";
};

const ServerCashHistoryContent = ({
  showHeader = true,
  onBack,
}: ServerCashHistoryContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServerHistory();
  }, []);

  const loadServerHistory = async () => {
    setLoading(true);

    // Get logged-in employee from localStorage (clock-in session)
    const clockInData = localStorage.getItem("pos_clockin_state");
    let serverName = "Current Server";
    let employeeId = "";

    if (clockInData) {
      try {
        const parsed = JSON.parse(clockInData);
        serverName = parsed.employeeName || parsed.full_name || "Current Server";
        employeeId = parsed.employeeId || parsed.id || "";
      } catch {
        // fallback
      }
    }

    // Load cash drawer sessions for this device/employee
    const activeSession = localStorage.getItem("activeDrawerSession");
    let sessionId = "";
    let startingCash = 0;
    let sessionStartTime = Date.now();
    let drawerName = "Point of Sale 1";

    if (activeSession) {
      try {
        const parsed = JSON.parse(activeSession);
        sessionId = parsed.id || "";
        startingCash = parsed.startingCash || 0;
        sessionStartTime = parsed.sessionStartTime || Date.now();
        drawerName = parsed.selectedDrawer || "Point of Sale 1";
      } catch {
        // fallback
      }
    }

    // Fetch transactions from DB for this session
    const transactions: TransactionEntry[] = [];
    let cashSales = 0;
    let cardSales = 0;
    let tipsCash = 0;
    let tipsCard = 0;
    let payIns = 0;
    let payOuts = 0;

    if (sessionId) {
      const { data: cashTxns } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (cashTxns) {
        cashTxns.forEach((txn) => {
          const amount = Number(txn.amount) || 0;
          let type: TransactionEntry["type"] = "cash_sale";

          if (txn.type === "pay_in") {
            type = "pay_in";
            payIns += amount;
          } else if (txn.type === "pay_out") {
            type = "pay_out";
            payOuts += amount;
          } else if (txn.type === "refund") {
            type = "refund";
          }

          transactions.push({
            id: txn.id,
            type,
            amount,
            timestamp: txn.created_at,
            note: txn.note || undefined,
            reason: txn.reason,
          });
        });
      }
    }

    // Fetch orders for this employee from today
    const today = new Date().toISOString().split("T")[0];
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: true });

    if (orders) {
      orders.forEach((order) => {
        const total = Number(order.total) || 0;
        const tip = Number(order.tip_amount) || 0;
        const paymentType = (order.payment_type || "").toLowerCase();

        if (paymentType.includes("cash")) {
          cashSales += total;
          transactions.push({
            id: `order-cash-${order.id}`,
            type: "cash_sale",
            amount: total,
            timestamp: order.created_at,
            reason: `Order #${order.order_number}`,
          });
          if (tip > 0) {
            tipsCash += tip;
            transactions.push({
              id: `tip-cash-${order.id}`,
              type: "tip_cash",
              amount: tip,
              timestamp: order.created_at,
              reason: `Tip on Order #${order.order_number}`,
            });
          }
        } else {
          cardSales += total;
          transactions.push({
            id: `order-card-${order.id}`,
            type: "card_sale",
            amount: total,
            timestamp: order.created_at,
            reason: `Order #${order.order_number}`,
          });
          if (tip > 0) {
            tipsCard += tip;
            transactions.push({
              id: `tip-card-${order.id}`,
              type: "tip_card",
              amount: tip,
              timestamp: order.created_at,
              reason: `Tip on Order #${order.order_number}`,
            });
          }
        }
      });
    }

    // Sort all transactions by timestamp
    transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const totalCashHandled = startingCash + cashSales + payIns - payOuts;
    const totalTips = tipsCash + tipsCard;
    const netCashDeposit = totalCashHandled + tipsCash;

    setSummary({
      serverName,
      shiftDate: formatDate(new Date(sessionStartTime).toISOString()),
      shiftStart: formatTime(new Date(sessionStartTime).toISOString()),
      shiftEnd: null,
      cashSales,
      cardSales,
      tipsCash,
      tipsCard,
      payIns,
      payOuts,
      totalCashHandled,
      totalCardTransactions: cardSales,
      totalTips,
      netCashDeposit,
      transactions,
    });

    setLoading(false);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/settings/payments/cash-management");
  };

  const SummaryCard = ({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) => (
    <div className="bg-neutral-800/40 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-xl font-semibold ${valueColor || "text-foreground"}`}>{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide">
        {showHeader && (
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-medium text-foreground">Server Cash History</h1>
          </div>
        )}
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground text-sm">No active shift found. Open a drawer to start tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 px-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Server Cash History</h1>
          <div className="w-10" />
        </div>
      )}

      <div className="px-6 pb-28 space-y-6">
        {/* Section 1: User & Shift Details */}
        <div>
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Shift Details</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-neutral-700/60 flex items-center justify-center">
                <User className="w-5 h-5 text-foreground/60" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium text-base">{summary.serverName}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{summary.shiftDate}</p>
              </div>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Shift Time</span>
              </div>
              <span className="text-sm text-foreground font-medium">
                {summary.shiftStart} {summary.shiftEnd ? `- ${summary.shiftEnd}` : "- Present"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Transaction Breakdown */}
        <div>
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Transaction Breakdown</h2>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon={<Banknote className="w-4 h-4 text-emerald-400" />}
              label="Cash Sales"
              value={formatCurrency(summary.cashSales)}
              valueColor="text-emerald-400"
            />
            <SummaryCard
              icon={<CreditCard className="w-4 h-4 text-blue-400" />}
              label="Card Sales"
              value={formatCurrency(summary.cardSales)}
              valueColor="text-blue-400"
            />
            <SummaryCard
              icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
              label="Tips (Cash)"
              value={formatCurrency(summary.tipsCash)}
              valueColor="text-amber-400"
            />
            <SummaryCard
              icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
              label="Tips (Card)"
              value={formatCurrency(summary.tipsCard)}
              valueColor="text-amber-400"
            />
            <SummaryCard
              icon={<ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
              label="Pay Ins"
              value={formatCurrency(summary.payIns)}
              valueColor="text-emerald-400"
            />
            <SummaryCard
              icon={<ArrowUpRight className="w-4 h-4 text-red-400" />}
              label="Pay Outs"
              value={formatCurrency(summary.payOuts)}
              valueColor="text-red-400"
            />
          </div>
        </div>

        {/* Section 3: Transaction Log */}
        <div>
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">
            Transaction Log
            <span className="text-xs text-neutral-600 ml-2">({summary.transactions.length} transactions)</span>
          </h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {summary.transactions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground text-sm">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="border-neutral-700/50 hover:bg-transparent">
                      <TableHead sortable={false} className="text-neutral-400 text-xs font-semibold tracking-wider uppercase">Time</TableHead>
                      <TableHead sortable={false} className="text-neutral-400 text-xs font-semibold tracking-wider uppercase">Type</TableHead>
                      <TableHead sortable={false} className="text-neutral-400 text-xs font-semibold tracking-wider uppercase">Details</TableHead>
                      <TableHead sortable={false} className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.transactions.map((txn) => (
                      <TableRow key={txn.id} className="border-neutral-700/50 hover:bg-neutral-700/20">
                        <TableCell className="text-neutral-400 text-sm py-3 whitespace-nowrap">
                          {formatTime(txn.timestamp)}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(txn.type)}
                            <span className="text-foreground text-sm font-medium">{getTypeLabel(txn.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm py-3">
                          {txn.reason || txn.note || "-"}
                        </TableCell>
                        <TableCell className={`text-sm font-medium py-3 text-right whitespace-nowrap ${getAmountColor(txn.type)}`}>
                          {["pay_out", "refund"].includes(txn.type) ? "-" : "+"}{formatCurrency(txn.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Summary */}
        <div>
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Summary</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-sm font-medium">Total Cash Handled</span>
              <span className="text-foreground text-sm font-semibold">{formatCurrency(summary.totalCashHandled)}</span>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-sm font-medium">Total Card Transactions</span>
              <span className="text-foreground text-sm font-semibold">{formatCurrency(summary.totalCardTransactions)}</span>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-sm font-medium">Total Tips</span>
              <span className="text-amber-400 text-sm font-semibold">{formatCurrency(summary.totalTips)}</span>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-base font-semibold">Net Cash to Deposit</span>
              <span className="text-emerald-400 text-base font-bold">{formatCurrency(summary.netCashDeposit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerCashHistoryContent;
