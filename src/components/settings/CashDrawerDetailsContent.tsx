import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SettingsManager } from "@/lib/settingsManager";

interface CashDrawerDetailsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

interface DropdownPosition {
  top: number;
  right: number;
}

interface CashTransaction {
  id: string;
  time: string;
  name: string;
  reason: string;
  payIn: number;
  payOut: number;
  cashSale: number;
  cardSale: number;
  cashTip: number;
  cardTip: number;
  cashDrop: number;
  note?: string;
  timestamp: number;
  date: string;
}

interface DrawerSession {
  startingCash: number;
  selectedDrawer: string;
  sessionStartTime: number;
  id?: string;
}

const DRAWER_OPTIONS = ["Point of Sale 1", "Point of Sale 2", "Point of Sale 3", "Main Drawer"];

const CashDrawerDetailsContent = ({ 
  showHeader = true, 
  onBack
}: CashDrawerDetailsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Load drawer session from localStorage
  const [drawerSession, setDrawerSession] = useState<DrawerSession>(() => {
    const saved = localStorage.getItem('activeDrawerSession');
    if (saved) {
      return JSON.parse(saved);
    }
    return { startingCash: 0, selectedDrawer: "Point of Sale 1", sessionStartTime: Date.now() };
  });
  
  const startingCash = drawerSession.startingCash;
  const [selectedDrawer, setSelectedDrawer] = useState(drawerSession.selectedDrawer);
  const [showDrawerDropdown, setShowDrawerDropdown] = useState(false);
  const [drawerPosition, setDrawerPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
  const [showEndDrawerPopup, setShowEndDrawerPopup] = useState(false);
  
  const [actualInDrawer, setActualInDrawer] = useState("");
  const [differenceReason, setDifferenceReason] = useState("");
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const drawerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Load transactions only for the current session (fresh start enforced)
    const savedTransactions = localStorage.getItem('cashTransactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    
    const loadFromDB = async () => {
      const sessionData = localStorage.getItem('activeDrawerSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.id) {
          const dbTransactions = await SettingsManager.getCashTransactions(session.id);
          if (dbTransactions.length > 0) {
            const mapped: CashTransaction[] = dbTransactions.map((t: any) => ({
              id: t.id,
              time: new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              name: t.employee_name || 'Guest',
              reason: t.reason,
              payIn: t.type === 'pay_in' ? Number(t.amount) : 0,
              payOut: t.type === 'pay_out' ? Number(t.amount) : 0,
              cashSale: 0,
              cardSale: 0,
              cashTip: 0,
              cardTip: 0,
              cashDrop: t.type === 'cash_drop' ? Number(t.amount) : 0,
              note: t.note,
              timestamp: new Date(t.created_at).getTime(),
              date: format(new Date(t.created_at), 'yyyy-MM-dd'),
            }));
            setTransactions(mapped);
            localStorage.setItem('cashTransactions', JSON.stringify(mapped));
          }
        }
      }
    };
    loadFromDB();
  }, []);
  
  // Calculate totals from transactions
  const calculatedPaidInOut = transactions.reduce((acc, t) => acc + t.payIn - t.payOut, 0);
  const totalCashSales = transactions.reduce((acc, t) => acc + (t.cashSale || 0), 0);
  const totalCardSales = transactions.reduce((acc, t) => acc + (t.cardSale || 0), 0);
  const totalCashTips = transactions.reduce((acc, t) => acc + (t.cashTip || 0), 0);
  const totalCardTips = transactions.reduce((acc, t) => acc + (t.cardTip || 0), 0);
  const totalCashDrops = transactions.reduce((acc, t) => acc + (t.cashDrop || 0), 0);
  
  const cashSales = totalCashSales;
  const cashRefunds = 0.00;
  
  // Expected = Starting + CashSales - Refunds + (PayIns - PayOuts) - CashDrops
  const expectedInDrawer = startingCash + cashSales - cashRefunds + calculatedPaidInOut - totalCashDrops;
  
  const actualAmount = actualInDrawer ? parseFloat(actualInDrawer) : 0;
  const difference = actualAmount - expectedInDrawer;
  const hasActualAmount = actualInDrawer.trim() !== "";
  const hasDifference = hasActualAmount && difference !== 0;
  const canConfirmEndDrawer = hasActualAmount && (!hasDifference || differenceReason.trim().length > 0);
  
  const sessionStartDate = new Date(drawerSession.sessionStartTime);
  const sessionStartDateString = format(sessionStartDate, 'yyyy-MM-dd');
  const selectedDateString = format(selectedLogDate, 'yyyy-MM-dd');
  
  const getEmployeeName = () => {
    try {
      const session = localStorage.getItem('pos_session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.employeeName || 'Guest';
      }
    } catch {}
    return 'Guest';
  };

  // Build cash log entries filtered by selected date
  const filteredCashLogEntries = (() => {
    const entries: Array<{ time: string; name: string; reason: string; payIn: number; payOut: number; cashSale: number; cardSale: number; cashTip: number; cardTip: number; cashDrop: number; runningBalance: number }> = [];
    let balance = 0;
    
    if (selectedDateString === sessionStartDateString) {
      const startTime = format(sessionStartDate, 'hh:mm a');
      balance = startingCash;
      entries.push({ 
        time: startTime, 
        name: getEmployeeName(), 
        reason: "Opening Cash",
        payIn: startingCash, 
        payOut: 0,
        cashSale: 0,
        cardSale: 0,
        cashTip: 0,
        cardTip: 0,
        cashDrop: 0,
        runningBalance: balance,
      });
    }
    
    const filteredTransactions = transactions
      .filter(t => {
        const txDate = t.date || format(new Date(t.timestamp), 'yyyy-MM-dd');
        return txDate === selectedDateString;
      });
    
    filteredTransactions.forEach(t => {
      balance += t.payIn - t.payOut - (t.cashDrop || 0);
      entries.push({
        time: t.time,
        name: t.name || getEmployeeName(),
        reason: t.reason,
        payIn: t.payIn,
        payOut: t.payOut,
        cashSale: t.cashSale || 0,
        cardSale: t.cardSale || 0,
        cashTip: t.cashTip || 0,
        cardTip: t.cardTip || 0,
        cashDrop: t.cashDrop || 0,
        runningBalance: balance,
      });
    });
    
    return entries;
  })();

  const formattedLogDate = format(selectedLogDate, 'MM/dd/yyyy');

  const handleOpenDrawerDropdown = () => {
    if (drawerRef.current) {
      const rect = drawerRef.current.getBoundingClientRect();
      setDrawerPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
    }
    setShowDrawerDropdown(true);
  };

  const handleActualInput = (value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") {
      setActualInDrawer(value);
    }
  };

  const handlePayInOut = () => {
    navigate('/settings/payments/cash-management/pay-in-out');
  };

  const handleBack = () => {
    // Allow navigation away - drawer session persists in localStorage
    if (onBack) {
      onBack();
    } else {
      navigate('/settings/payments');
    }
  };

  const handleConfirmEndDrawer = async () => {
    if (hasActualAmount) {
      const sessionData = localStorage.getItem('activeDrawerSession');
      const session = sessionData ? JSON.parse(sessionData) : null;
      
      if (session?.id) {
        await SettingsManager.closeCashDrawerSession(session.id, {
          closingCash: actualAmount,
          cashSales,
          cashRefunds,
          expectedInDrawer,
          difference,
          closingReason: differenceReason.trim() || undefined,
        });
      }

      const closedSessionData = {
        drawer: selectedDrawer,
        closingBalance: actualAmount,
        startingCash: startingCash,
        expectedInDrawer: expectedInDrawer,
        difference: difference,
        cashSales: cashSales,
        cardSales: totalCardSales,
        cashTips: totalCashTips,
        cardTips: totalCardTips,
        cashDrops: totalCashDrops,
        cashRefunds: cashRefunds,
        paidInOut: calculatedPaidInOut,
        closedAt: Date.now()
      };
      localStorage.setItem('lastClosedSession', JSON.stringify(closedSessionData));
      localStorage.setItem('lastClosingBalance', actualAmount.toFixed(2));
      localStorage.setItem('lastClosingDrawer', selectedDrawer);
      localStorage.removeItem('cashTransactions');
      localStorage.removeItem('activeDrawerSession');
      setShowEndDrawerPopup(false);
      navigate('/settings/payments/cash-management');
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Back Button — shows alert instead of navigating */}
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Cash Drawer</h1>
          <div className="w-8 h-8" />
        </div>
      )}

      <div className="pt-0 px-6 pb-28">
        {/* Opening Cash Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Opening Cash</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <button
            ref={drawerRef}
            onClick={handleOpenDrawerDropdown}
            className="w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-lg font-medium">Cash Drawer</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-base">{selectedDrawer}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Close Drawer Button */}
        <button 
          onClick={() => setShowEndDrawerPopup(true)}
          className="w-full py-4 rounded-full bg-neutral-800/60 text-foreground text-base font-semibold tracking-wide active:opacity-70 transition-opacity mb-6"
        >
          CLOSE DRAWER
        </button>

        {/* Balances Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Balances</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Opening Cash</span>
            <span className="text-foreground text-lg">${startingCash.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Cash Sale</span>
            <span className="text-foreground text-lg">${totalCashSales.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Card Sale</span>
            <span className="text-foreground text-lg">${totalCardSales.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Cash Tip</span>
            <span className="text-foreground text-lg">${totalCashTips.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Card Tip</span>
            <span className="text-foreground text-lg">${totalCardTips.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Cash Drop</span>
            <span className="text-amber-400 text-lg">${totalCashDrops.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Expected In Drawer</span>
            <span className="text-foreground text-lg font-semibold">${expectedInDrawer.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay In/Pay Out */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <button 
            onClick={handlePayInOut}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-lg font-medium">Pay In/ Pay Out</span>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Cash Log with Date Picker */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity">
                <span className="text-foreground text-lg font-medium">Cash Log</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">{formattedLogDate}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500" />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="end">
              <Calendar
                mode="single"
                selected={selectedLogDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedLogDate(date);
                    setIsDatePickerOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Cash Log Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              {/* Table Header */}
              <div className="grid grid-cols-11 py-3.5 px-4 border-b border-neutral-700/50">
                <span className="text-neutral-400 text-sm font-medium">Time</span>
                <span className="text-neutral-400 text-sm font-medium">Name</span>
                <span className="text-neutral-400 text-sm font-medium">Reason</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Pay In</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Pay Out</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Cash Sale</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Card Sale</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Cash Tip</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Card Tip</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Cash Drop</span>
                <span className="text-neutral-400 text-sm font-medium text-right">Balance</span>
              </div>
              
              {/* Table Rows */}
              {filteredCashLogEntries.length > 0 ? (
                filteredCashLogEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-11 py-3.5 px-4 border-b border-neutral-700/20 last:border-0">
                    <span className="text-foreground text-sm">{entry.time}</span>
                    <span className="text-foreground text-sm">{entry.name}</span>
                    <span className="text-foreground text-sm">{entry.reason}</span>
                    <span className="text-foreground text-sm text-right">${entry.payIn.toFixed(2)}</span>
                    <span className="text-foreground text-sm text-right">${entry.payOut.toFixed(2)}</span>
                    <span className="text-foreground text-sm text-right">${entry.cashSale.toFixed(2)}</span>
                    <span className="text-foreground text-sm text-right">${entry.cardSale.toFixed(2)}</span>
                    <span className="text-foreground text-sm text-right">${entry.cashTip.toFixed(2)}</span>
                    <span className="text-foreground text-sm text-right">${entry.cardTip.toFixed(2)}</span>
                    <span className="text-amber-400 text-sm text-right">${entry.cashDrop.toFixed(2)}</span>
                    <span className="text-foreground text-sm text-right font-medium">${entry.runningBalance.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-neutral-500 text-sm">
                  No cash log entries for this date
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Dropdown Overlay */}
      {showDrawerDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowDrawerDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
            style={{ top: drawerPosition.top, right: drawerPosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {DRAWER_OPTIONS.map((drawer) => (
              <button
                key={drawer}
                className={`w-full text-left px-4 py-3 text-base transition-colors ${
                  selectedDrawer === drawer 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setSelectedDrawer(drawer);
                  setShowDrawerDropdown(false);
                }}
              >
                {drawer}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* End Drawer Popup */}
      {showEndDrawerPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
          onClick={() => setShowEndDrawerPopup(false)}
        >
          <div 
            className="bg-background rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-center px-4 py-4 border-b border-neutral-800">
              <span className="text-foreground text-lg font-semibold">End Drawer</span>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Opening Cash</span>
                <span className="text-foreground text-base">${startingCash.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Cash Sale</span>
                <span className="text-foreground text-base">${totalCashSales.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Card Sale</span>
                <span className="text-foreground text-base">${totalCardSales.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Cash Tip</span>
                <span className="text-foreground text-base">${totalCashTips.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Card Tip</span>
                <span className="text-foreground text-base">${totalCardTips.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Cash Drop</span>
                <span className="text-amber-400 text-base">${totalCashDrops.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Cash Refunds</span>
                <span className="text-foreground text-base">${cashRefunds.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Paid In/Out</span>
                <span className="text-foreground text-base">{calculatedPaidInOut < 0 ? '-' : ''}${Math.abs(calculatedPaidInOut).toFixed(2)}</span>
              </div>

              {/* Expected in Drawer */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-neutral-400 text-base">Expected in Drawer</span>
                <span className="text-foreground text-base font-medium">${expectedInDrawer.toFixed(2)}</span>
              </div>

              {/* Actual in Drawer */}
              <div className="pt-2">
                <span className="text-neutral-400 text-base block mb-2">Actual in Drawer</span>
                <div className="flex items-center bg-neutral-800/60 rounded-xl px-4 py-3">
                  <span className="text-foreground text-lg">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={expectedInDrawer.toFixed(2)}
                    value={actualInDrawer}
                    onChange={(e) => handleActualInput(e.target.value)}
                    className="bg-transparent text-foreground text-lg flex-1 outline-none placeholder:text-neutral-500 ml-1"
                  />
                </div>
              </div>

              {/* Difference */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-neutral-400 text-base font-medium">Difference</span>
                <span className={`text-base font-medium ${
                  difference === 0 ? 'text-foreground' : difference > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {difference >= 0 ? '' : '-'}${Math.abs(difference).toFixed(2)}
                </span>
              </div>

              {/* Reason for Difference */}
              {hasDifference && (
                <div className="pt-2">
                  <span className="text-neutral-400 text-base block mb-2">
                    Reason for Difference <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    placeholder="Enter reason for the balance difference..."
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    maxLength={500}
                    className="w-full bg-neutral-800/60 rounded-xl px-4 py-3 text-foreground text-sm outline-none placeholder:text-neutral-500 resize-none min-h-[80px]"
                  />
                  {differenceReason.trim().length === 0 && (
                    <p className="text-red-500 text-xs mt-1.5 px-1">A reason is required when the balance does not match</p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <div className="px-6 pb-6 pt-2">
              <button 
                onClick={handleConfirmEndDrawer}
                disabled={!canConfirmEndDrawer}
                className={`w-full py-4 rounded-xl text-base font-semibold transition-all ${
                  canConfirmEndDrawer 
                    ? 'bg-neutral-600 text-foreground active:opacity-70' 
                    : 'bg-neutral-600/50 text-foreground/50'
                }`}
              >
                Confirm End Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashDrawerDetailsContent;
