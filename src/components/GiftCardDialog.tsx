import { useState } from "react";
import { X, CreditCard, Camera, Check, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GiftCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal?: number;
}

const GiftCardDialog = ({ isOpen, onClose, orderTotal = 0 }: GiftCardDialogProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [cardBalance, setCardBalance] = useState(0);
  const [customAmount, setCustomAmount] = useState("");

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Format as XXXX XXXX XXXX XXXX
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(" ").substring(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    // Reset validation when card number changes
    if (isValidated) {
      setIsValidated(false);
      setCardBalance(0);
    }
  };

  const handleValidate = () => {
    if (cardNumber.replace(/\s/g, "").length >= 16) {
      // Simulate validation - in real app this would be an API call
      setIsValidated(true);
      setCardBalance(52.00); // Mock balance
    }
  };

  const handleQuickAdd = (amount: number) => {
    if (!isValidated) return;
    setCustomAmount(amount.toString());
  };

  const handleAddCustomAmount = () => {
    if (!isValidated || !customAmount) return;
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      setCardBalance(prev => prev + amount);
      setCustomAmount("");
    }
  };

  // Calculate amount to apply: min of card balance and order total
  const calculatedAmountToApply = Math.min(cardBalance, orderTotal);

  const handleApply = () => {
    // Apply the gift card to order logic here
    onClose();
  };

  const handleClose = () => {
    // Reset state on close
    setCardNumber("");
    setIsValidated(false);
    setCardBalance(0);
    setCustomAmount("");
    onClose();
  };

  const coversOrder = cardBalance >= orderTotal && orderTotal > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-[500px] mx-4 max-h-[85vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-white" />
            <h2 className="text-white text-lg font-semibold">Gift Card</h2>
          </div>
          <p className="text-neutral-400 text-sm">Check balance, add funds, or apply to order</p>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Card Information Section */}
            <div>
              <h3 className="text-neutral-400 text-xs font-medium tracking-wide mb-3">CARD INFORMATION</h3>
              <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    className="flex-1 bg-transparent text-white placeholder-neutral-500 text-lg tracking-wide outline-none"
                    maxLength={19}
                  />
                  <button className="p-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors">
                    <Camera className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isValidated ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 text-sm">Card Verified</span>
                      </>
                    ) : (
                      <span className="text-neutral-400 text-sm">Enter card number to validate</span>
                    )}
                  </div>
                  <button
                    onClick={handleValidate}
                    disabled={cardNumber.replace(/\s/g, "").length < 16}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isValidated
                        ? "bg-orange-500 text-white"
                        : cardNumber.replace(/\s/g, "").length >= 16
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Validate
                  </button>
                </div>
              </div>
            </div>

            {/* Balance & Funds Section */}
            <div className={!isValidated ? "opacity-50 pointer-events-none" : ""}>
              <h3 className="text-neutral-400 text-xs font-medium tracking-wide mb-3">BALANCE & FUNDS</h3>
              
              {/* Current Balance Card */}
              <div 
                className="rounded-xl p-4 mb-4 flex items-center justify-between"
                style={{
                  background: isValidated 
                    ? "linear-gradient(135deg, #5D4A1F 0%, #3D3219 100%)"
                    : "linear-gradient(135deg, #2D2D2D 0%, #1D1D1D 100%)"
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">CURRENT BALANCE</p>
                    <p className="text-white text-2xl font-bold">${cardBalance.toFixed(2)}</p>
                  </div>
                </div>
                {coversOrder && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                    Covers Order
                  </span>
                )}
              </div>

              {/* Quick Add */}
              <div className="mb-4">
                <p className="text-neutral-400 text-xs font-medium mb-3">QUICK ADD</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAdd(amount)}
                      className="py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-medium hover:bg-neutral-700 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-neutral-800 border border-neutral-700 rounded-lg px-3">
                    <span className="text-neutral-400">$</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-white placeholder-neutral-500 py-3 px-2 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddCustomAmount}
                    disabled={!customAmount}
                    className="px-6 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Apply to Order Section */}
            <div className={!isValidated ? "opacity-50 pointer-events-none" : ""}>
              <h3 className="text-neutral-400 text-xs font-medium tracking-wide mb-3">APPLY TO ORDER</h3>
              <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white">Order Total</span>
                  <span className="text-white font-medium">${orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Gift Card Balance</span>
                  <span className="text-green-500 font-medium">${cardBalance.toFixed(2)}</span>
                </div>
                <div className="border-t border-neutral-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Amount to Apply</span>
                    <span className="text-orange-500 font-bold">${calculatedAmountToApply.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-neutral-800 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-lg bg-neutral-700 text-white font-medium hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!isValidated}
              className="flex-1 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{
                background: isValidated 
                  ? "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
                  : "linear-gradient(180deg, #4A4A4A 0%, #3A3A3A 100%)"
              }}
            >
              Apply ${calculatedAmountToApply.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCardDialog;
