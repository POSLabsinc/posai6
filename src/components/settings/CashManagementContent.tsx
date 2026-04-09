import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SettingsManager } from "@/lib/settingsManager";

interface CashManagementContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

interface DropdownPosition {
  top: number;
  right: number;
}

interface ClosedSessionData {
  drawer: string;
  closingBalance: number;
  startingCash: number;
  expectedInDrawer: number;
  difference: number;
  cashSales: number;
  cashRefunds: number;
  paidInOut: number;
  closedAt: number;
}

interface CashLogEntry {
  time: string;
  name: string;
  reason: string;
  payIn: number;
  payOut: number;
  cash: number;
  card: number;
  tips: number;
  runningBalance: number;
}

const DRAWER_OPTIONS = ["Point of Sale 1", "Point of Sale 2", "Point of Sale 3", "Main Drawer"];

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const CashManagementContent = ({
  showHeader = true,
  onBack,
  onAIClick
}: CashManagementContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const [selectedDrawer, setSelectedDrawer] = useState("Point of Sale 1");
  const [openingCash, setOpeningCash] = useState("");
  const [showDrawerDropdown, setShowDrawerDropdown] = useState(false);
  const [drawerPosition, setDrawerPosition] = useState<DropdownPosition>({
    top: 0,
    right: 0
  });
  const [lastClosingBalance, setLastClosingBalance] = useState<number>(0);
  const [lastClosedSession, setLastClosedSession] = useState<ClosedSessionData | null>(null);
  const [selectedLogDate, setSelectedLogDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [cashLogEntries, setCashLogEntries] = useState<CashLogEntry[]>([]);
  
  const drawerRef = useRef<HTMLButtonElement>(null);
  const hasAmount = openingCash.trim() !== "" && parseFloat(openingCash) >= 0;

  // Load last closing data from DB on mount
  useEffect(() => {
    const loadData = async () => {
      const savedBalance = localStorage.getItem('lastClosingBalance');
      if (savedBalance) {
        setLastClosingBalance(parseFloat(savedBalance));
      }
      
      const lastSession = await SettingsManager.getLastClosedSession();
      if (lastSession) {
        setLastClosingBalance(Number(lastSession.closing_cash) || 0);
        setLastClosedSession({
          drawer: lastSession.drawer_name,
          closingBalance: Number(lastSession.closing_cash) || 0,
          startingCash: Number(lastSession.starting_cash) || 0,
          expectedInDrawer: Number(lastSession.expected_in_drawer) || 0,
          difference: Number(lastSession.difference) || 0,
          cashSales: Number(lastSession.cash_sales) || 0,
          cashRefunds: Number(lastSession.cash_refunds) || 0,
          paidInOut: 0,
          closedAt: new Date(lastSession.closed_at).getTime(),
        });
      } else {
        const savedSession = localStorage.getItem('lastClosedSession');
        if (savedSession) {
          setLastClosedSession(JSON.parse(savedSession));
        }
      }
    };
    loadData();
  }, []);

  // Build cash log entries from closed session data
  useEffect(() => {
    if (!lastClosedSession) {
      setCashLogEntries([]);
      return;
    }

    const sessionDate = format(new Date(lastClosedSession.closedAt), 'yyyy-MM-dd');
    const selectedDateStr = format(selectedLogDate, 'yyyy-MM-dd');

    if (sessionDate !== selectedDateStr) {
      setCashLogEntries([]);
      return;
    }

    const entries: CashLogEntry[] = [];
    let balance = 0;

    // Get the clocked-in employee name
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
    const employeeName = getEmployeeName();

    // Starting Cash entry
    balance = lastClosedSession.startingCash;
    entries.push({
      time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
      name: employeeName,
      reason: "Starting Cash",
      payIn: lastClosedSession.startingCash,
      payOut: 0,
      cash: lastClosedSession.startingCash,
      card: 0,
      tips: 0,
      runningBalance: balance,
    });

    // Cash Sales entry
    if (lastClosedSession.cashSales > 0) {
      balance += lastClosedSession.cashSales;
      entries.push({
        time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
        name: "Sales",
        reason: "Cash Sales",
        payIn: lastClosedSession.cashSales,
        payOut: 0,
        cash: lastClosedSession.cashSales,
        card: 0,
        tips: 0,
        runningBalance: balance,
      });
    }

    // Cash Refunds entry
    if (lastClosedSession.cashRefunds > 0) {
      balance -= lastClosedSession.cashRefunds;
      entries.push({
        time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
        name: "Refund",
        reason: "Cash Refunds",
        payIn: 0,
        payOut: lastClosedSession.cashRefunds,
        cash: 0,
        card: 0,
        tips: 0,
        runningBalance: balance,
      });
    }

    // Paid In/Out entry
    if (lastClosedSession.paidInOut !== 0) {
      balance += lastClosedSession.paidInOut;
      entries.push({
        time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
        name: "Manager",
        reason: lastClosedSession.paidInOut > 0 ? "Paid In" : "Paid Out",
        payIn: lastClosedSession.paidInOut > 0 ? lastClosedSession.paidInOut : 0,
        payOut: lastClosedSession.paidInOut < 0 ? Math.abs(lastClosedSession.paidInOut) : 0,
        cash: 0,
        card: 0,
        tips: 0,
        runningBalance: balance,
      });
    }

    // Also load transactions from localStorage if available
    const savedTx = localStorage.getItem('closedSessionTransactions');
    if (savedTx) {
      try {
        const txList = JSON.parse(savedTx) as Array<{ time: string; name: string; reason: string; payIn: number; payOut: number }>;
        txList.forEach(tx => {
          balance += tx.payIn - tx.payOut;
          entries.push({
            ...tx,
            cash: tx.payIn,
            card: 0,
            tips: 0,
            runningBalance: balance,
          });
        });
      } catch {}
    }

    setCashLogEntries(entries);
  }, [lastClosedSession, selectedLogDate]);

  const formattedLogDate = format(selectedLogDate, 'MM/dd/yyyy');

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleStartDrawer = async () => {
    if (hasAmount) {
      const parsedCash = parseFloat(openingCash);
      const sessionId = await SettingsManager.createCashDrawerSession(selectedDrawer, parsedCash);
      
      const sessionData = {
        id: sessionId,
        startingCash: parsedCash,
        selectedDrawer: selectedDrawer,
        sessionStartTime: Date.now()
      };
      localStorage.setItem('activeDrawerSession', JSON.stringify(sessionData));
      
      navigate('/settings/payments/cash-management/details');
    }
  };

  const handleCashInput = (value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") {
      setOpeningCash(value);
    }
  };

  const handleOpenDrawerDropdown = () => {
    if (drawerRef.current) {
      const rect = drawerRef.current.getBoundingClientRect();
      setDrawerPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right + 16
      });
    }
    setShowDrawerDropdown(true);
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
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Cash Management</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}
      <div className="pt-0 px-6 pb-28">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cash management focuses on efficiently handling cash flow, liquidity, and investments to ensure financial stability.
          </p>
        </div>

        {/* Starting Cash */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Start New Drawer</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <button ref={drawerRef} onClick={handleOpenDrawerDropdown} className="w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-lg font-medium">Cash Drawer</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-base">{selectedDrawer}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Opening Cash Input */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Opening Cash Amount</h2>
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Amount</span>
            <div className="flex items-center gap-1">
              <span className="text-foreground text-lg">$</span>
              <input type="text" inputMode="decimal" placeholder="0.00" value={openingCash} onChange={e => handleCashInput(e.target.value)} className="bg-transparent text-foreground text-lg text-right w-24 outline-none placeholder:text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Balances */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Balances</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Last Closing Balance</span>
            <span className="text-foreground text-lg">${lastClosingBalance.toFixed(2)}</span>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Opening Till Cash</span>
            <span className="text-foreground text-lg">${openingCash ? parseFloat(openingCash || "0").toFixed(2) : "0.00"}</span>
          </div>
        </div>

        {/* Open Drawer Button */}
        <button onClick={handleStartDrawer} disabled={!hasAmount} className={`w-full py-4 rounded-full text-base font-semibold tracking-wide transition-all ${hasAmount ? 'bg-neutral-600 text-white active:opacity-70' : 'border border-neutral-600 text-foreground opacity-50'}`}>
          OPEN DRAWER
        </button>

        {/* History Section */}
        {lastClosedSession && (
          <div className="mt-6">
            <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">History</h2>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow className="border-neutral-700/50 hover:bg-transparent">
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">Drawer</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">Closed At</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Starting Cash</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Cash Sales</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Cash Refunds</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Paid In/Out</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Expected</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Closing Balance</TableHead>
                    <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-neutral-700/50 hover:bg-neutral-700/20">
                    <TableCell className="text-foreground text-sm font-medium py-3 whitespace-nowrap">{lastClosedSession.drawer}</TableCell>
                    <TableCell className="text-neutral-400 text-sm py-3 whitespace-nowrap">{formatDateTime(lastClosedSession.closedAt)}</TableCell>
                    <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(lastClosedSession.startingCash)}</TableCell>
                    <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(lastClosedSession.cashSales)}</TableCell>
                    <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(lastClosedSession.cashRefunds)}</TableCell>
                    <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">
                      {`${lastClosedSession.paidInOut < 0 ? '-' : ''}${formatCurrency(Math.abs(lastClosedSession.paidInOut))}`}
                    </TableCell>
                    <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(lastClosedSession.expectedInDrawer)}</TableCell>
                    <TableCell className="text-foreground text-sm font-medium py-3 text-right whitespace-nowrap">{formatCurrency(lastClosedSession.closingBalance)}</TableCell>
                    <TableCell className={`text-sm font-medium py-3 text-right whitespace-nowrap ${lastClosedSession.difference === 0 ? 'text-foreground' : lastClosedSession.difference > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {`${lastClosedSession.difference >= 0 ? '' : '-'}${formatCurrency(Math.abs(lastClosedSession.difference))}`}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Cash Log Section */}
        <div className="mt-6">
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
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
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-neutral-700/50">
                    <th className="text-neutral-400 text-sm font-medium text-left py-3.5 px-4">Time</th>
                    <th className="text-neutral-400 text-sm font-medium text-left py-3.5 px-4">Name</th>
                    <th className="text-neutral-400 text-sm font-medium text-left py-3.5 px-4">Reason</th>
                    <th className="text-neutral-400 text-sm font-medium text-right py-3.5 px-4">Pay In</th>
                    <th className="text-neutral-400 text-sm font-medium text-right py-3.5 px-4">Pay Out</th>
                    <th className="text-neutral-400 text-sm font-medium text-right py-3.5 px-4">Cash</th>
                    <th className="text-neutral-400 text-sm font-medium text-right py-3.5 px-4">Card</th>
                    <th className="text-neutral-400 text-sm font-medium text-right py-3.5 px-4">Tips</th>
                    <th className="text-neutral-400 text-sm font-medium text-right py-3.5 px-4">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cashLogEntries.length > 0 ? (
                    cashLogEntries.map((entry, index) => (
                      <tr key={index} className="border-b border-neutral-700/30 last:border-0">
                        <td className="text-foreground text-sm py-3.5 px-4 whitespace-nowrap">{entry.time}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 whitespace-nowrap">{entry.name}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 whitespace-nowrap">{entry.reason}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 text-right whitespace-nowrap">{formatCurrency(entry.payIn)}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 text-right whitespace-nowrap">{formatCurrency(entry.payOut)}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 text-right whitespace-nowrap">{formatCurrency(entry.cash)}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 text-right whitespace-nowrap">{formatCurrency(entry.card)}</td>
                        <td className="text-foreground text-sm py-3.5 px-4 text-right whitespace-nowrap">{formatCurrency(entry.tips)}</td>
                        <td className="text-foreground text-sm font-medium py-3.5 px-4 text-right whitespace-nowrap">{formatCurrency(entry.runningBalance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-neutral-500 text-sm py-8 text-center">
                        No cash log entries for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Dropdown Overlay */}
      {showDrawerDropdown && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-200" onClick={() => setShowDrawerDropdown(false)}>
          <div className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl w-[200px] animate-in zoom-in-95 duration-200" style={{
            top: drawerPosition.top,
            right: drawerPosition.right
          }} onClick={e => e.stopPropagation()}>
            {DRAWER_OPTIONS.map(drawer => (
              <button key={drawer} className={`w-full text-left px-4 py-3 text-base transition-colors ${selectedDrawer === drawer ? "text-foreground bg-neutral-700/50" : "text-neutral-400 hover:bg-neutral-700/30"}`} onClick={() => {
                setSelectedDrawer(drawer);
                setShowDrawerDropdown(false);
              }}>
                {drawer}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashManagementContent;