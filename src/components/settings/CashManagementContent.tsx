import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const DRAWER_OPTIONS = ["Point of Sale 1", "Point of Sale 2", "Point of Sale 3", "Main Drawer"];

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const drawerRef = useRef<HTMLButtonElement>(null);
  const hasAmount = openingCash.trim() !== "" && parseFloat(openingCash) >= 0;

  // Load last closing data from localStorage on mount
  useEffect(() => {
    const savedBalance = localStorage.getItem('lastClosingBalance');
    if (savedBalance) {
      setLastClosingBalance(parseFloat(savedBalance));
    }
    
    const savedSession = localStorage.getItem('lastClosedSession');
    if (savedSession) {
      setLastClosedSession(JSON.parse(savedSession));
    }
  }, []);

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

  const handleStartDrawer = () => {
    if (hasAmount) {
      // Persist drawer session data to localStorage
      const sessionData = {
        startingCash: parseFloat(openingCash),
        selectedDrawer: selectedDrawer,
        sessionStartTime: Date.now()
      };
      localStorage.setItem('activeDrawerSession', JSON.stringify(sessionData));
      
      navigate('/settings/payments/cash-management/details');
    }
  };

  const handleCashInput = (value: string) => {
    // Only allow valid currency input
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

        {/* Start Drawer Button */}
        <button onClick={handleStartDrawer} disabled={!hasAmount} className={`w-full py-4 rounded-full text-base font-semibold tracking-wide transition-all ${hasAmount ? 'bg-neutral-600 text-white active:opacity-70' : 'border border-neutral-600 text-foreground opacity-50'}`}>
          START DRAWER
        </button>

        {/* History Section - Collapsible */}
        {lastClosedSession && (
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="mt-6">
            <CollapsibleTrigger asChild>
              <button className="w-full bg-neutral-800/60 rounded-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity">
                <span className="text-foreground text-lg font-medium">History</span>
                <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 animate-in slide-in-from-top-2 duration-200">
              <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Drawer</span>
                  <span className="text-neutral-400 text-base">{lastClosedSession.drawer}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Closed At</span>
                  <span className="text-neutral-400 text-base">{formatDateTime(lastClosedSession.closedAt)}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Starting Cash</span>
                  <span className="text-foreground text-base">${lastClosedSession.startingCash.toFixed(2)}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Cash Sales</span>
                  <span className="text-foreground text-base">${lastClosedSession.cashSales.toFixed(2)}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Cash Refunds</span>
                  <span className="text-foreground text-base">${lastClosedSession.cashRefunds.toFixed(2)}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Paid In/Out</span>
                  <span className="text-foreground text-base">
                    {lastClosedSession.paidInOut < 0 ? '-' : ''}${Math.abs(lastClosedSession.paidInOut).toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Expected In Drawer</span>
                  <span className="text-foreground text-base">${lastClosedSession.expectedInDrawer.toFixed(2)}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Closing Balance</span>
                  <span className="text-foreground text-base font-medium">${lastClosedSession.closingBalance.toFixed(2)}</span>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Difference</span>
                  <span className={`text-base font-medium ${
                    lastClosedSession.difference === 0 ? 'text-foreground' : 
                    lastClosedSession.difference > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {lastClosedSession.difference >= 0 ? '' : '-'}${Math.abs(lastClosedSession.difference).toFixed(2)}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Drawer Dropdown Overlay */}
      {showDrawerDropdown && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-200" onClick={() => setShowDrawerDropdown(false)}>
          <div className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200" style={{
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