import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SettingsManager } from "@/lib/settingsManager";
import { supabase } from "@/integrations/supabase/client";

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
  closingReason?: string;
}

interface CashLogEntry {
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
  runningBalance: number;
}

type FilterTab = 'history' | 'cashlog';

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
  const [allClosedSessions, setAllClosedSessions] = useState<ClosedSessionData[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [cashLogEntries, setCashLogEntries] = useState<CashLogEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('history');
  
  const drawerRef = useRef<HTMLButtonElement>(null);
  const hasAmount = openingCash.trim() !== "" && parseFloat(openingCash) >= 0;

  // Load last closing data from DB on mount
  useEffect(() => {
    const loadData = async () => {
      const savedBalance = localStorage.getItem('lastClosingBalance');
      if (savedBalance) {
        setLastClosingBalance(parseFloat(savedBalance));
      }
      
      // Load all closed sessions from DB
      const deviceId = localStorage.getItem('pos_device_id') || 'default';
      const { data: sessions } = await (supabase as any).from("cash_drawer_sessions")
        .select("*")
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(50);
      
      if (sessions && sessions.length > 0) {
        const mapped: ClosedSessionData[] = sessions.map((s: any) => ({
          drawer: s.drawer_name,
          closingBalance: Number(s.closing_cash) || 0,
          startingCash: Number(s.starting_cash) || 0,
          expectedInDrawer: Number(s.expected_in_drawer) || 0,
          difference: Number(s.difference) || 0,
          cashSales: Number(s.cash_sales) || 0,
          cashRefunds: Number(s.cash_refunds) || 0,
          paidInOut: 0,
          closedAt: new Date(s.closed_at).getTime(),
          closingReason: s.closing_reason || undefined,
        }));
        setAllClosedSessions(mapped);
        setLastClosedSession(mapped[0]);
        setLastClosingBalance(mapped[0].closingBalance);
      } else {
        const savedSession = localStorage.getItem('lastClosedSession');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setLastClosedSession(parsed);
          setAllClosedSessions([parsed]);
        }
      }
    };
    loadData();
  }, []);

  // Build cash log entries from closed session data and real transactions
  useEffect(() => {
    const loadCashLog = async () => {
      const selectedDateStr = format(selectedLogDate, 'yyyy-MM-dd');
      
      const startOfDay = new Date(selectedLogDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedLogDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get clocked-in employees from employee_shifts for this date
      const { data: activeShifts } = await (supabase as any).from("employee_shifts")
        .select("employee_id, employees(full_name)")
        .eq("shift_date", selectedDateStr)
        .not("clock_in", "is", null);

      const clockedInNames = new Set<string>();
      if (activeShifts) {
        activeShifts.forEach((s: any) => {
          const name = s.employees?.full_name;
          if (name) clockedInNames.add(name);
        });
      }
      // Also include current session employee
      try {
        const session = localStorage.getItem('pos_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.employeeName) clockedInNames.add(parsed.employeeName);
        }
      } catch {}
      
      const { data: dbTransactions } = await (supabase as any).from("cash_transactions")
        .select("*")
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: true });
      
      // Load orders - use 'paid' and 'completed' statuses
      const { data: dayOrders } = await (supabase as any).from("orders")
        .select("*")
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .in("status", ["paid", "completed", "PAID"])
        .order("created_at", { ascending: true });

      // Load cash drops for the date
      const { data: dayCashDrops } = await (supabase as any).from("cash_drops")
        .select("*")
        .eq("shift_date", selectedDateStr)
        .order("created_at", { ascending: true });

      const entries: CashLogEntry[] = [];
      let balance = 0;

      const getEmployeeName = () => {
        try {
          const session = localStorage.getItem('pos_session');
          if (session) {
            const parsed = JSON.parse(session);
            return parsed.employeeName || 'Staff';
          }
        } catch {}
        return 'Staff';
      };

      // Find session for this date
      const matchingSession = allClosedSessions.find(s => {
        const sessionDate = format(new Date(s.closedAt), 'yyyy-MM-dd');
        return sessionDate === selectedDateStr;
      });

      // Opening Cash entry
      if (matchingSession) {
        balance = matchingSession.startingCash;
        entries.push({
          time: format(new Date(matchingSession.closedAt), 'hh:mm a'),
          name: getEmployeeName(),
          reason: "Opening Cash",
          payIn: matchingSession.startingCash,
          payOut: 0,
          cashSale: 0,
          cardSale: 0,
          cashTip: 0,
          cardTip: 0,
          cashDrop: 0,
          runningBalance: balance,
        });
      }

      // Add order-based entries (Cash Sale / Card Sale with tip split)
      if (dayOrders && dayOrders.length > 0) {
        dayOrders.forEach((order: any) => {
          const empName = order.employee_name || getEmployeeName();
          // Filter: only show clocked-in employees
          if (clockedInNames.size > 0 && !clockedInNames.has(empName)) return;

          const isCash = order.payment_type === 'cash';
          const orderTotal = Number(order.total) || 0;
          const tipAmount = Number(order.tip_amount) || 0;
          const saleAmount = orderTotal - tipAmount; // sale excluding tip

          if (isCash) {
            balance += orderTotal;
          }
          
          entries.push({
            time: format(new Date(order.created_at), 'hh:mm a'),
            name: empName,
            reason: isCash ? 'Cash Sale' : 'Card Sale',
            payIn: 0,
            payOut: 0,
            cashSale: isCash ? saleAmount : 0,
            cardSale: !isCash ? saleAmount : 0,
            cashTip: isCash ? tipAmount : 0,
            cardTip: !isCash ? tipAmount : 0,
            cashDrop: 0,
            runningBalance: balance,
          });
        });
      }

      // Add pay in/out transactions (NOT counted as sales)
      if (dbTransactions && dbTransactions.length > 0) {
        dbTransactions.forEach((t: any) => {
          const empName = t.employee_name || getEmployeeName();
          if (clockedInNames.size > 0 && !clockedInNames.has(empName)) return;

          const payIn = t.type === 'pay_in' ? Number(t.amount) : 0;
          const payOut = t.type === 'pay_out' ? Number(t.amount) : 0;
          balance += payIn - payOut;
          entries.push({
            time: format(new Date(t.created_at), 'hh:mm a'),
            name: empName,
            reason: t.reason,
            payIn,
            payOut,
            cashSale: 0,
            cardSale: 0,
            cashTip: 0,
            cardTip: 0,
            cashDrop: 0,
            runningBalance: balance,
          });
        });
      }

      // Add cash drop entries
      if (dayCashDrops && dayCashDrops.length > 0) {
        dayCashDrops.forEach((drop: any) => {
          const empName = drop.employee_name || getEmployeeName();
          if (clockedInNames.size > 0 && !clockedInNames.has(empName)) return;

          const dropAmount = Number(drop.actual_drop_amount) || 0;
          balance -= dropAmount;
          entries.push({
            time: format(new Date(drop.created_at), 'hh:mm a'),
            name: empName,
            reason: 'Cash Drop',
            payIn: 0,
            payOut: 0,
            cashSale: 0,
            cardSale: 0,
            cashTip: 0,
            cardTip: 0,
            cashDrop: dropAmount,
            runningBalance: balance,
          });
        });
      }

      // Fallback for localStorage-based entries
      if (entries.length === 0 && lastClosedSession) {
        const sessionDate = format(new Date(lastClosedSession.closedAt), 'yyyy-MM-dd');
        if (sessionDate === selectedDateStr) {
          const employeeName = getEmployeeName();
          balance = lastClosedSession.startingCash;
          entries.push({
            time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
            name: employeeName,
            reason: "Opening Cash",
            payIn: lastClosedSession.startingCash,
            payOut: 0,
            cashSale: 0, cardSale: 0, cashTip: 0, cardTip: 0, cashDrop: 0,
            runningBalance: balance,
          });

          if (lastClosedSession.cashSales > 0) {
            balance += lastClosedSession.cashSales;
            entries.push({
              time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
              name: "Sales",
              reason: "Cash Sales",
              payIn: 0, payOut: 0,
              cashSale: lastClosedSession.cashSales, cardSale: 0,
              cashTip: 0, cardTip: 0, cashDrop: 0,
              runningBalance: balance,
            });
          }

          if (lastClosedSession.cashRefunds > 0) {
            balance -= lastClosedSession.cashRefunds;
            entries.push({
              time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
              name: "Refund",
              reason: "Cash Refunds",
              payIn: 0, payOut: lastClosedSession.cashRefunds,
              cashSale: 0, cardSale: 0, cashTip: 0, cardTip: 0, cashDrop: 0,
              runningBalance: balance,
            });
          }

          if (lastClosedSession.paidInOut !== 0) {
            balance += lastClosedSession.paidInOut;
            entries.push({
              time: format(new Date(lastClosedSession.closedAt), 'hh:mm a'),
              name: "Manager",
              reason: lastClosedSession.paidInOut > 0 ? "Paid In" : "Paid Out",
              payIn: lastClosedSession.paidInOut > 0 ? lastClosedSession.paidInOut : 0,
              payOut: lastClosedSession.paidInOut < 0 ? Math.abs(lastClosedSession.paidInOut) : 0,
              cashSale: 0, cardSale: 0, cashTip: 0, cardTip: 0, cashDrop: 0,
              runningBalance: balance,
            });
          }
        }
      }

      setCashLogEntries(entries);
    };
    
    loadCashLog();
  }, [lastClosedSession, allClosedSessions, selectedLogDate]);

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
        </div>
      )}
      <div className="pt-0 px-6 pb-28">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cash management focuses on efficiently handling cash flow, liquidity, and investments to ensure financial stability.
          </p>
        </div>

        {/* Start New Drawer */}
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

        {/* Filter Tabs */}
        <div className="mt-6 flex gap-3 mb-4">
          <button
            onClick={() => setActiveFilter('history')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'history'
                ? 'bg-foreground text-background'
                : 'bg-neutral-800/60 text-neutral-400 hover:text-foreground'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveFilter('cashlog')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'cashlog'
                ? 'bg-foreground text-background'
                : 'bg-neutral-800/60 text-neutral-400 hover:text-foreground'
            }`}
          >
            Cash Log
          </button>
        </div>

        {/* History Section */}
        {activeFilter === 'history' && allClosedSessions.length > 0 && (
          <div>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="border-neutral-700/50 hover:bg-transparent">
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">Drawer</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">Closed At</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Opening Cash</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Cash Sales</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Cash Refunds</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Paid In/Out</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Expected</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Closing Balance</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase text-right whitespace-nowrap">Difference</TableHead>
                      <TableHead className="text-neutral-400 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allClosedSessions.map((session, idx) => (
                      <TableRow key={idx} className="border-neutral-700/50 hover:bg-neutral-700/20">
                        <TableCell className="text-foreground text-sm font-medium py-3 whitespace-nowrap">{session.drawer}</TableCell>
                        <TableCell className="text-neutral-400 text-sm py-3 whitespace-nowrap">{formatDateTime(session.closedAt)}</TableCell>
                        <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(session.startingCash)}</TableCell>
                        <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(session.cashSales)}</TableCell>
                        <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(session.cashRefunds)}</TableCell>
                        <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">
                          {`${session.paidInOut < 0 ? '-' : ''}${formatCurrency(Math.abs(session.paidInOut))}`}
                        </TableCell>
                        <TableCell className="text-foreground text-sm py-3 text-right whitespace-nowrap">{formatCurrency(session.expectedInDrawer)}</TableCell>
                        <TableCell className="text-foreground text-sm font-medium py-3 text-right whitespace-nowrap">{formatCurrency(session.closingBalance)}</TableCell>
                        <TableCell className={`text-sm font-medium py-3 text-right whitespace-nowrap ${session.difference === 0 ? 'text-foreground' : session.difference > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {`${session.difference >= 0 ? '' : '-'}${formatCurrency(Math.abs(session.difference))}`}
                        </TableCell>
                        <TableCell className="text-neutral-400 text-sm py-3 whitespace-nowrap max-w-[200px] truncate">
                          {session.closingReason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {activeFilter === 'history' && allClosedSessions.length === 0 && (
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden py-8 text-center text-neutral-500 text-sm">
            No drawer history available
          </div>
        )}

        {/* Cash Log Section */}
        {activeFilter === 'cashlog' && (
          <div>
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
        )}
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
