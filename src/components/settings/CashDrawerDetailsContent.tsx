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
  note?: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format for easy filtering
}

interface DrawerSession {
  startingCash: number;
  selectedDrawer: string;
  sessionStartTime: number;
}

const DRAWER_OPTIONS = ["Point of Sale 1", "Point of Sale 2", "Point of Sale 3", "Main Drawer"];

const CashDrawerDetailsContent = ({ 
  showHeader = true, 
  onBack
}: CashDrawerDetailsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Load drawer session from localStorage (persisted, not from navigation state)
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
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const drawerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Load from localStorage first
    const savedTransactions = localStorage.getItem('cashTransactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    
    // Also load from DB if session has an ID
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
              name: t.employee_name || 'User',
              reason: t.reason,
              payIn: t.type === 'pay_in' ? Number(t.amount) : 0,
              payOut: t.type === 'pay_out' ? Number(t.amount) : 0,
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
  
  // Calculate paidInOut from actual transactions (totalPayIn - totalPayOut)
  const calculatedPaidInOut = transactions.reduce((acc, t) => {
    return acc + t.payIn - t.payOut;
  }, 0);
  
  // Mock sales data (in real app, this would come from sales system)
  const cashSales = 0.00;
  const cashRefunds = 0.00;
  
  // Expected = Starting + Sales - Refunds + (PayIns - PayOuts)
  const expectedInDrawer = startingCash + cashSales - cashRefunds + calculatedPaidInOut;
  
  const actualAmount = actualInDrawer ? parseFloat(actualInDrawer) : 0;
  const difference = actualAmount - expectedInDrawer;
  const hasActualAmount = actualInDrawer.trim() !== "";
  
  // Get session start date for filtering
  const sessionStartDate = new Date(drawerSession.sessionStartTime);
  const sessionStartDateString = format(sessionStartDate, 'yyyy-MM-dd');
  const selectedDateString = format(selectedLogDate, 'yyyy-MM-dd');
  
  // Build cash log entries filtered by selected date
  const filteredCashLogEntries = (() => {
    const entries: Array<{ time: string; name: string; reason: string; payIn: number; payOut: number }> = [];
    
    // Include Starting Cash only on the session start date
    if (selectedDateString === sessionStartDateString) {
      const startTime = format(sessionStartDate, 'hh:mm a');
      entries.push({ 
        time: startTime, 
        name: "Rohan", 
        reason: "Starting Cash", 
        payIn: startingCash, 
        payOut: 0 
      });
    }
    
    // Filter transactions by selected date
    const filteredTransactions = transactions
      .filter(t => {
        // Use date field if available, otherwise derive from timestamp
        const txDate = t.date || format(new Date(t.timestamp), 'yyyy-MM-dd');
        return txDate === selectedDateString;
      })
      .map(t => ({
        time: t.time,
        name: t.name,
        reason: t.reason,
        payIn: t.payIn,
        payOut: t.payOut
      }));
    
    entries.push(...filteredTransactions);
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
    // Session data is already in localStorage, no need to pass via state
    navigate('/settings/payments/cash-management/pay-in-out');
  };

  const handleConfirmEndDrawer = () => {
    if (hasActualAmount) {
      // Store complete closing session data for display on Cash Management screen
      const closedSessionData = {
        drawer: selectedDrawer,
        closingBalance: actualAmount,
        startingCash: startingCash,
        expectedInDrawer: expectedInDrawer,
        difference: difference,
        cashSales: cashSales,
        cashRefunds: cashRefunds,
        paidInOut: calculatedPaidInOut,
        closedAt: Date.now()
      };
      localStorage.setItem('lastClosedSession', JSON.stringify(closedSessionData));
      localStorage.setItem('lastClosingBalance', actualAmount.toFixed(2));
      localStorage.setItem('lastClosingDrawer', selectedDrawer);
      // Clear transactions and active session for new session
      localStorage.removeItem('cashTransactions');
      localStorage.removeItem('activeDrawerSession');
      setShowEndDrawerPopup(false);
      navigate('/settings/payments/cash-management');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/settings/payments');
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Back Button - Circular style matching reference */}
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

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Starting Cash Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Starting Cash</h2>
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
            <span className="text-foreground text-lg font-medium">Starting Cash</span>
            <span className="text-foreground text-lg">${startingCash.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Expected In Drawer</span>
            <span className="text-foreground text-lg">${expectedInDrawer.toFixed(2)}</span>
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
          {/* Table Header */}
          <div className="grid grid-cols-5 py-3.5 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-sm font-medium">Time</span>
            <span className="text-neutral-400 text-sm font-medium">Name</span>
            <span className="text-neutral-400 text-sm font-medium">Reason</span>
            <span className="text-neutral-400 text-sm font-medium text-right">Pay In</span>
            <span className="text-neutral-400 text-sm font-medium text-right">Pay Out</span>
          </div>
          
          {/* Table Rows */}
          {filteredCashLogEntries.map((entry, index) => (
            <div key={index} className="grid grid-cols-5 py-3.5 px-4">
              <span className="text-foreground text-sm">{entry.time}</span>
              <span className="text-foreground text-sm">{entry.name}</span>
              <span className="text-foreground text-sm">{entry.reason}</span>
              <span className="text-foreground text-sm text-right">${entry.payIn.toFixed(2)}</span>
              <span className="text-foreground text-sm text-right">${entry.payOut.toFixed(2)}</span>
            </div>
          ))}
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
            className="bg-background rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-center px-4 py-4 border-b border-neutral-800">
              <span className="text-foreground text-lg font-semibold">End Drawer</span>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Starting Cash */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Starting Cash</span>
                <span className="text-foreground text-base">${startingCash.toFixed(2)}</span>
              </div>

              {/* Cash Sales */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Cash Sales</span>
                <span className="text-foreground text-base">${cashSales.toFixed(2)}</span>
              </div>

              {/* Cash Refunds */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Cash Refunds</span>
                <span className="text-foreground text-base">${cashRefunds.toFixed(2)}</span>
              </div>

              {/* Paid In/Out */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-base">Paid In/Out</span>
                <span className="text-foreground text-base">{calculatedPaidInOut < 0 ? '-' : ''}${Math.abs(calculatedPaidInOut).toFixed(2)}</span>
              </div>

              {/* Expected in Drawer */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-neutral-400 text-base">Expected in Drawer</span>
                <span className="text-foreground text-base font-medium">${expectedInDrawer.toFixed(2)}</span>
              </div>

              {/* Actual in Drawer - Input */}
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
            </div>

            {/* Confirm Button */}
            <div className="px-6 pb-6 pt-2">
              <button 
                onClick={handleConfirmEndDrawer}
                disabled={!hasActualAmount}
                className={`w-full py-4 rounded-xl text-base font-semibold transition-all ${
                  hasActualAmount 
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
