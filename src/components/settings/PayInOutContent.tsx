import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

interface PayInOutContentProps {
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

const REASON_OPTIONS = [
  "Petty Cash",
  "Vendor Payment",
  "Tips Payout",
  "Bank Deposit",
  "Change Replenishment",
  "Other"
];

const PayInOutContent = ({ 
  showHeader = true, 
  onBack 
}: PayInOutContentProps) => {
  const navigate = useNavigate();
  
  // Load drawer session from localStorage (persistent across navigation)
  const [drawerSession] = useState(() => {
    const saved = localStorage.getItem('activeDrawerSession');
    if (saved) {
      return JSON.parse(saved);
    }
    return { startingCash: 0, selectedDrawer: "Point of Sale 1" };
  });
  
  const startingCash = drawerSession.startingCash;
  const selectedDrawer = drawerSession.selectedDrawer;
  
  const [amount, setAmount] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [note, setNote] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [reasonPosition, setReasonPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
  
  const reasonRef = useRef<HTMLButtonElement>(null);
  
  const hasAmount = amount.trim() !== "" && parseFloat(amount) > 0;
  const hasReason = selectedReason !== "";

  const handleAmountInput = (value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") {
      setAmount(value);
    }
  };

  const handleOpenReasonDropdown = () => {
    if (reasonRef.current) {
      const rect = reasonRef.current.getBoundingClientRect();
      setReasonPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
    }
    setShowReasonDropdown(true);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Navigate back without state - session is in localStorage
      navigate('/settings/payments/cash-management/details');
    }
  };

  const saveTransaction = (type: 'payIn' | 'payOut') => {
    const parsedAmount = parseFloat(amount);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Format date as YYYY-MM-DD for filtering
    const dateString = now.toISOString().split('T')[0];

    const newTransaction: CashTransaction = {
      id: Date.now().toString(),
      time: timeString,
      name: "User",
      reason: selectedReason,
      payIn: type === 'payIn' ? parsedAmount : 0,
      payOut: type === 'payOut' ? parsedAmount : 0,
      note: note || undefined,
      timestamp: now.getTime(),
      date: dateString
    };

    const existingTransactions = localStorage.getItem('cashTransactions');
    const transactions: CashTransaction[] = existingTransactions 
      ? JSON.parse(existingTransactions) 
      : [];
    
    transactions.push(newTransaction);
    localStorage.setItem('cashTransactions', JSON.stringify(transactions));

    const currentPaidInOut = parseFloat(localStorage.getItem('paidInOut') || '0');
    const newPaidInOut = type === 'payIn' 
      ? currentPaidInOut + parsedAmount 
      : currentPaidInOut - parsedAmount;
    localStorage.setItem('paidInOut', newPaidInOut.toString());

    // Navigate back without state - session is in localStorage
    navigate('/settings/payments/cash-management/details');
  };

  const handlePayIn = () => {
    if (hasAmount && hasReason) {
      saveTransaction('payIn');
    }
  };

  const handlePayOut = () => {
    if (hasAmount && hasReason) {
      saveTransaction('payOut');
    }
  };

  const canSubmit = hasAmount && hasReason;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Back Button - Circular Icon Style */}
      {showHeader && (
        <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Pay In / Pay Out</h1>
          <div className="w-8 h-8" />
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Amount Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Amount</h2>
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-6">
          <div className="flex items-center py-3.5 px-5">
            <span className="text-foreground text-lg">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountInput(e.target.value)}
              className="bg-transparent text-foreground text-lg flex-1 outline-none placeholder:text-neutral-500 ml-1"
            />
          </div>
        </div>

        {/* Reason Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Reason</h2>
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-6">
          <button
            ref={reasonRef}
            onClick={handleOpenReasonDropdown}
            className="w-full flex items-center justify-between py-3.5 px-5 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-lg font-medium">
              {selectedReason || "Select Reason"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-base">
                {selectedDrawer}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Note Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Note (Optional)</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-8">
          <Textarea
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-transparent border-none text-foreground text-base placeholder:text-neutral-500 min-h-[120px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-5 py-4"
          />
        </div>

        {/* Action Buttons - Dark Outlined Style */}
        <div className="flex gap-4">
          <button
            onClick={handlePayIn}
            disabled={!canSubmit}
            className={`flex-1 py-4 rounded-full text-base font-semibold transition-all border ${
              canSubmit 
                ? 'bg-neutral-800/60 border-neutral-700 text-foreground active:opacity-70' 
                : 'bg-neutral-800/30 border-neutral-700/50 text-neutral-500'
            }`}
          >
            PAY IN
          </button>
          <button
            onClick={handlePayOut}
            disabled={!canSubmit}
            className={`flex-1 py-4 rounded-full text-base font-semibold transition-all border ${
              canSubmit 
                ? 'bg-neutral-800/60 border-neutral-700 text-foreground active:opacity-70' 
                : 'bg-neutral-800/30 border-neutral-700/50 text-neutral-500'
            }`}
          >
            PAY OUT
          </button>
        </div>
      </div>

      {/* Reason Dropdown Overlay */}
      {showReasonDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowReasonDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[200px] animate-in zoom-in-95 duration-200"
            style={{ top: reasonPosition.top, right: reasonPosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {REASON_OPTIONS.map((reason) => (
              <button
                key={reason}
                className={`w-full text-left px-4 py-3 text-base transition-colors ${
                  selectedReason === reason 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setSelectedReason(reason);
                  setShowReasonDropdown(false);
                }}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayInOutContent;
