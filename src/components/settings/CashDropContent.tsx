import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Clock, DollarSign, CreditCard, TrendingDown, Banknote, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface CashDropContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

interface ShiftSummary {
  employeeName: string;
  employeeId: string;
  totalCashSales: number;
  totalCardSales: number;
  totalCashTips: number;
  totalCardTips: number;
  tipsPayable: number;
  openingCash: number;
  paidInTotal: number;
  paidOutTotal: number;
  expectedDropAmount: number;
}

interface CashDropLog {
  id: string;
  employee_name: string;
  actual_drop_amount: number;
  expected_drop_amount: number;
  variance: number;
  shift_date: string;
  created_at: string;
  status: string;
  notes: string | null;
  reason: string | null;
}

type ViewMode = "drop" | "history";

const REASON_OPTIONS = [
  "End of Shift",
  "Manager Request",
  "Safe Deposit",
  "Bank Run",
  "Drawer Reset",
  "Other",
];

const formatCurrency = (amount: number) => {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
};

const CashDropContent = ({
  showHeader = true,
  onBack,
}: CashDropContentProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("drop");
  const [actualAmount, setActualAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedReason, setSelectedReason] = useState("End of Shift");
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dropLogs, setDropLogs] = useState<CashDropLog[]>([]);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary>({
    employeeName: "Guest",
    employeeId: "",
    totalCashSales: 0,
    totalCardSales: 0,
    totalCashTips: 0,
    totalCardTips: 0,
    tipsPayable: 0,
    openingCash: 0,
    paidInTotal: 0,
    paidOutTotal: 0,
    expectedDropAmount: 0,
  });

  // Load shift data on mount
  useEffect(() => {
    const loadShiftData = () => {
      try {
        // Get employee info
        const session = localStorage.getItem("pos_session");
        let employeeName = "Guest";
        let employeeId = "";
        if (session) {
          const parsed = JSON.parse(session);
          employeeName = parsed.employeeName || "Guest";
          employeeId = parsed.employeeId || "";
        }

        // Get drawer session
        const drawerData = localStorage.getItem("activeDrawerSession");
        let openingCash = 0;
        if (drawerData) {
          const drawer = JSON.parse(drawerData);
          openingCash = drawer.startingCash || 0;
        }

        // Get transactions to calculate paid in/out
        const txData = localStorage.getItem("cashTransactions");
        let paidInTotal = 0;
        let paidOutTotal = 0;
        if (txData) {
          const txs = JSON.parse(txData);
          txs.forEach((t: any) => {
            paidInTotal += t.payIn || 0;
            paidOutTotal += t.payOut || 0;
          });
        }

        // Mock sales data (in production these come from orders system)
        const totalCashSales = 0;
        const totalCardSales = 0;
        const totalCashTips = 0;
        const totalCardTips = 0;
        const tipsPayable = totalCashTips; // Cash tips are payable

        // Expected = Opening + CashSales - CashRefunds + PaidIn - PaidOut - TipsPayable
        const expectedDropAmount =
          openingCash +
          totalCashSales +
          paidInTotal -
          paidOutTotal -
          tipsPayable;

        setShiftSummary({
          employeeName,
          employeeId,
          totalCashSales,
          totalCardSales,
          totalCashTips,
          totalCardTips,
          tipsPayable,
          openingCash,
          paidInTotal,
          paidOutTotal,
          expectedDropAmount: Math.max(0, expectedDropAmount),
        });
      } catch (e) {
        console.error("Error loading shift data:", e);
      }
    };

    loadShiftData();
  }, []);

  // Load drop history
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await (supabase as any)
        .from("cash_drops")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setDropLogs(data);
    };
    if (viewMode === "history") loadHistory();
  }, [viewMode]);

  const parsedActual = actualAmount ? parseFloat(actualAmount) : 0;
  const variance = parsedActual - shiftSummary.expectedDropAmount;
  const hasAmount = actualAmount.trim() !== "" && parsedActual >= 0;

  const handleAmountInput = (value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") setActualAmount(value);
  };

  const handleSubmit = async () => {
    if (!hasAmount || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const drawerData = localStorage.getItem("activeDrawerSession");
      const sessionId = drawerData ? JSON.parse(drawerData)?.id : null;

      await (supabase as any).from("cash_drops").insert({
        session_id: sessionId || null,
        employee_name: shiftSummary.employeeName,
        employee_id: shiftSummary.employeeId || null,
        device_id: localStorage.getItem("pos_device_id") || "default",
        shift_date: format(new Date(), "yyyy-MM-dd"),
        total_cash_sales: shiftSummary.totalCashSales,
        total_card_sales: shiftSummary.totalCardSales,
        total_cash_tips: shiftSummary.totalCashTips,
        total_card_tips: shiftSummary.totalCardTips,
        tips_payable: shiftSummary.tipsPayable,
        expected_drop_amount: shiftSummary.expectedDropAmount,
        actual_drop_amount: parsedActual,
        variance,
        opening_cash: shiftSummary.openingCash,
        paid_in_total: shiftSummary.paidInTotal,
        paid_out_total: shiftSummary.paidOutTotal,
        notes: notes || null,
        reason: selectedReason,
        status: variance === 0 ? "reconciled" : "completed",
      });

      setIsSubmitted(true);
    } catch (e) {
      console.error("Error submitting cash drop:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isSubmitted) {
      navigate("/settings/payments/cash-management/details");
      return;
    }
    if (onBack) onBack();
    else navigate("/settings/payments/cash-management/details");
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
        {showHeader && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Cash Drop</h1>
            <div className="w-8 h-8" />
          </div>
        )}
        <div className="flex flex-col items-center justify-center px-6 pt-16">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            variance === 0 ? "bg-emerald-500/20" : "bg-amber-500/20"
          }`}>
            {variance === 0 ? (
              <Check className="w-10 h-10 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {variance === 0 ? "Cash Drop Complete" : "Cash Drop Recorded"}
          </h2>
          <p className="text-neutral-400 text-center text-sm mb-8 max-w-xs">
            {variance === 0
              ? "Perfect reconciliation — zero variance. Shift can be closed."
              : `Variance of ${formatCurrency(variance)} recorded. A manager may need to review.`}
          </p>

          {/* Summary Card */}
          <div className="w-full max-w-md bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center justify-between py-3.5 px-5 border-b border-neutral-700/30">
              <span className="text-neutral-400 text-sm">Employee</span>
              <span className="text-foreground text-sm font-medium">{shiftSummary.employeeName}</span>
            </div>
            <div className="flex items-center justify-between py-3.5 px-5 border-b border-neutral-700/30">
              <span className="text-neutral-400 text-sm">Expected Drop</span>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.expectedDropAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-3.5 px-5 border-b border-neutral-700/30">
              <span className="text-neutral-400 text-sm">Actual Drop</span>
              <span className="text-foreground text-sm">{formatCurrency(parsedActual)}</span>
            </div>
            <div className="flex items-center justify-between py-3.5 px-5">
              <span className="text-neutral-400 text-sm font-medium">Variance</span>
              <span className={`text-sm font-semibold ${
                variance === 0 ? "text-emerald-500" : variance > 0 ? "text-amber-500" : "text-red-500"
              }`}>
                {formatCurrency(variance)}
              </span>
            </div>
          </div>

          <button
            onClick={handleBack}
            className="w-full max-w-md py-4 rounded-full bg-neutral-800/60 border border-neutral-700 text-foreground text-base font-semibold active:opacity-70 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Cash Drop</h1>
          <div className="w-8 h-8" />
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 px-6 mb-5">
        <button
          onClick={() => setViewMode("drop")}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
            viewMode === "drop"
              ? "bg-neutral-700 text-foreground"
              : "bg-neutral-800/40 text-neutral-500"
          }`}
        >
          Cash Drop
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
            viewMode === "history"
              ? "bg-neutral-700 text-foreground"
              : "bg-neutral-800/40 text-neutral-500"
          }`}
        >
          History
        </button>
      </div>

      {viewMode === "drop" ? (
        <div className="px-6 pb-28">
          {/* Employee Banner */}
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-5 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
              <span className="text-foreground text-sm font-semibold">
                {shiftSummary.employeeName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-foreground text-base font-medium">{shiftSummary.employeeName}</p>
              <p className="text-neutral-500 text-xs">{format(new Date(), "EEEE, MMM d, yyyy")}</p>
            </div>
          </div>

          {/* Sales Breakdown */}
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Sales Breakdown</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center justify-between py-3 px-5">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-4 h-4 text-emerald-500" />
                <span className="text-foreground text-sm">Cash Sales</span>
              </div>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.totalCashSales)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-foreground text-sm">Card Sales</span>
              </div>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.totalCardSales)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-foreground text-sm">Total Sales</span>
              </div>
              <span className="text-foreground text-sm font-medium">
                {formatCurrency(shiftSummary.totalCashSales + shiftSummary.totalCardSales)}
              </span>
            </div>
          </div>

          {/* Tips Breakdown */}
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Tips</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Cash Tips</span>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.totalCashTips)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Card Tips</span>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.totalCardTips)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm font-medium">Tips Payable</span>
              <span className="text-amber-400 text-sm font-medium">{formatCurrency(shiftSummary.tipsPayable)}</span>
            </div>
          </div>

          {/* Cash Reconciliation */}
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Cash Reconciliation</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Opening Cash</span>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.openingCash)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Cash Sales</span>
              <span className="text-foreground text-sm">{formatCurrency(shiftSummary.totalCashSales)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Paid In</span>
              <span className="text-emerald-500 text-sm">+{formatCurrency(shiftSummary.paidInTotal)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Paid Out</span>
              <span className="text-red-400 text-sm">-{formatCurrency(shiftSummary.paidOutTotal)}</span>
            </div>
            <div className="h-px bg-neutral-700/30 mx-5" />
            <div className="flex items-center justify-between py-3 px-5">
              <span className="text-foreground text-sm">Tips Payable</span>
              <span className="text-red-400 text-sm">-{formatCurrency(shiftSummary.tipsPayable)}</span>
            </div>
            <div className="h-px bg-neutral-700/50 mx-5" />
            <div className="flex items-center justify-between py-3.5 px-5 bg-neutral-700/20">
              <span className="text-foreground text-sm font-semibold">Expected Cash Drop</span>
              <span className="text-foreground text-base font-bold">{formatCurrency(shiftSummary.expectedDropAmount)}</span>
            </div>
          </div>

          {/* Actual Cash Drop Input */}
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Actual Cash Drop Amount</h2>
          <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-4">
            <div className="flex items-center py-3.5 px-5">
              <span className="text-foreground text-lg">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder={shiftSummary.expectedDropAmount.toFixed(2)}
                value={actualAmount}
                onChange={(e) => handleAmountInput(e.target.value)}
                className="bg-transparent text-foreground text-lg flex-1 outline-none placeholder:text-neutral-500 ml-1"
              />
            </div>
          </div>

          {/* Variance indicator */}
          {hasAmount && (
            <div className={`flex items-center gap-2 px-5 py-3 rounded-xl mb-5 ${
              variance === 0
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : Math.abs(variance) <= 1
                ? "bg-amber-500/10 border border-amber-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}>
              {variance === 0 ? (
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className={`w-4 h-4 shrink-0 ${
                  Math.abs(variance) <= 1 ? "text-amber-500" : "text-red-500"
                }`} />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  variance === 0 ? "text-emerald-500" : Math.abs(variance) <= 1 ? "text-amber-500" : "text-red-500"
                }`}>
                  {variance === 0
                    ? "Zero variance — perfect match!"
                    : `Variance: ${formatCurrency(variance)}`}
                </p>
                {variance !== 0 && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {variance > 0 ? "Over by" : "Short by"} {formatCurrency(Math.abs(variance))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Reason</h2>
          <div className="relative mb-5">
            <button
              onClick={() => setShowReasonPicker(!showReasonPicker)}
              className="w-full flex items-center justify-between py-3.5 px-5 active:opacity-70 transition-opacity bg-neutral-800/60 rounded-full"
            >
              <span className="text-foreground text-base font-medium">{selectedReason}</span>
              <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${showReasonPicker ? "rotate-90" : ""}`} />
            </button>
            {showReasonPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-30 animate-in zoom-in-95 fade-in duration-200">
                {REASON_OPTIONS.map((reason) => (
                  <button
                    key={reason}
                    className={`w-full text-left px-5 py-3.5 text-base transition-colors ${
                      selectedReason === reason
                        ? "text-foreground bg-neutral-700/50 font-medium"
                        : "text-neutral-300 hover:bg-neutral-700/30"
                    }`}
                    onClick={() => {
                      setSelectedReason(reason);
                      setShowReasonPicker(false);
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Notes (Optional)</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-8">
            <Textarea
              placeholder="Add any notes about this cash drop..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-transparent border-none text-foreground text-base placeholder:text-neutral-500 min-h-[100px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-5 py-4"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!hasAmount || isSubmitting}
            className={`w-full py-4 rounded-full text-base font-semibold transition-all border ${
              hasAmount && !isSubmitting
                ? "bg-neutral-800/60 border-neutral-700 text-foreground active:opacity-70"
                : "bg-neutral-800/30 border-neutral-700/50 text-neutral-500"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Cash Drop"}
          </button>
        </div>
      ) : (
        /* History View */
        <div className="px-6 pb-28">
          {dropLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-neutral-800/60 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="text-neutral-400 text-base font-medium">No Cash Drops Yet</p>
              <p className="text-neutral-500 text-sm mt-1">Cash drop records will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dropLogs.map((log) => (
                <div key={log.id} className="bg-neutral-800/60 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-700/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                        <span className="text-foreground text-xs font-semibold">
                          {log.employee_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{log.employee_name}</p>
                        <p className="text-neutral-500 text-xs">
                          {format(new Date(log.created_at), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.variance === 0
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {log.variance === 0 ? "Reconciled" : "Variance"}
                    </div>
                  </div>
                  {/* Details */}
                  <div className="px-5 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-xs">Expected</span>
                      <span className="text-foreground text-xs">{formatCurrency(Number(log.expected_drop_amount))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-xs">Actual</span>
                      <span className="text-foreground text-xs">{formatCurrency(Number(log.actual_drop_amount))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-xs font-medium">Variance</span>
                      <span className={`text-xs font-semibold ${
                        Number(log.variance) === 0
                          ? "text-emerald-500"
                          : Number(log.variance) > 0
                          ? "text-amber-500"
                          : "text-red-500"
                      }`}>
                        {formatCurrency(Number(log.variance))}
                      </span>
                    </div>
                    {log.reason && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-xs">Reason</span>
                        <span className="text-neutral-300 text-xs">{log.reason}</span>
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-neutral-500 text-xs italic pt-1 border-t border-neutral-700/20">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CashDropContent;
