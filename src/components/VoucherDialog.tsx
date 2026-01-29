import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoucher: (amount: number) => void;
  onRedeemVoucher: (voucherCode: string, balance: number) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

const VoucherDialog = ({ isOpen, onClose, onAddVoucher, onRedeemVoucher }: VoucherDialogProps) => {
  const [view, setView] = useState<'sell' | 'redeem'>('sell');
  const [amount, setAmount] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedBalance, setValidatedBalance] = useState<number | null>(null);

  // Calculate display amount from string (treating input as cents)
  const getDisplayAmount = (): number => {
    if (selectedPreset !== null) return selectedPreset;
    if (!amount) return 0;
    return parseInt(amount, 10) / 100;
  };

  const displayAmount = getDisplayAmount();

  const handlePresetClick = (presetAmount: number) => {
    setSelectedPreset(presetAmount);
    setAmount('');
  };

  const handleKeypadClick = (key: string) => {
    setSelectedPreset(null);
    
    if (key === 'C') {
      setAmount('');
      return;
    }
    
    // Limit to 8 digits (up to $999,999.99)
    if (amount.length >= 8) return;
    
    setAmount(prev => prev + key);
  };

  const handleCharge = () => {
    if (displayAmount > 0) {
      onAddVoucher(displayAmount);
      resetState();
    }
  };

  const handleRedeemClick = () => {
    setView('redeem');
    setVoucherCode('');
    setValidatedBalance(null);
  };

  const handleBackToSell = () => {
    setView('sell');
    setVoucherCode('');
    setValidatedBalance(null);
  };

  const handleVoucherKeypad = (key: string) => {
    if (key === 'C') {
      setVoucherCode('');
      setValidatedBalance(null);
      return;
    }
    
    if (voucherCode.length >= 16) return;
    setVoucherCode(prev => prev + key);
  };

  const handleValidateVoucher = () => {
    setIsValidating(true);
    // Simulate validation - in real app this would call an API
    setTimeout(() => {
      setValidatedBalance(25.00); // Mock balance
      setIsValidating(false);
    }, 500);
  };

  const handleApplyVoucher = () => {
    if (validatedBalance && voucherCode) {
      onRedeemVoucher(voucherCode, validatedBalance);
      resetState();
    }
  };

  const resetState = () => {
    setView('sell');
    setAmount('');
    setSelectedPreset(null);
    setVoucherCode('');
    setValidatedBalance(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '00', 'C']
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 rounded-xl p-0 max-w-[340px] w-full">
        {view === 'sell' ? (
          <div className="p-5">
            {/* Header */}
            <h2 className="text-white text-lg font-semibold text-center mb-6">Sell Voucher</h2>
            
            {/* Amount Display */}
            <div className="text-center mb-6">
              <span className="text-white text-4xl font-bold">
                ${displayAmount.toFixed(2)}
              </span>
            </div>
            
            {/* Preset Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`py-2.5 px-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPreset === preset
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 border border-neutral-600 text-white hover:bg-neutral-700'
                  }`}
                >
                  ${preset}.00
                </button>
              ))}
            </div>
            
            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {keypadKeys.flat().map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeypadClick(key)}
                  className={`h-12 rounded-lg text-lg font-semibold transition-colors ${
                    key === 'C'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            
            {/* Charge Button */}
            <button
              onClick={handleCharge}
              disabled={displayAmount === 0}
              className={`w-full py-3 rounded-lg text-sm font-semibold mb-3 transition-colors ${
                displayAmount > 0
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                  : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {displayAmount > 0 ? `CHARGE $${displayAmount.toFixed(2)}` : 'CHARGE'}
            </button>
            
            {/* Redeem Button */}
            <button
              onClick={handleRedeemClick}
              className="w-full py-3 rounded-lg text-sm font-semibold bg-neutral-800 border border-neutral-600 text-white hover:bg-neutral-700 transition-colors"
            >
              REDEEM VOUCHER
            </button>
          </div>
        ) : (
          <div className="p-5">
            {/* Redeem View Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={handleBackToSell}
                className="p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-lg font-semibold text-center flex-1 pr-6">Redeem Voucher</h2>
            </div>
            
            {/* Voucher Code Display */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-5 text-center min-h-[60px] flex items-center justify-center">
              <span className="text-white text-2xl font-mono tracking-wider">
                {voucherCode || 'Enter Code'}
              </span>
            </div>
            
            {/* Validated Balance Display */}
            {validatedBalance !== null && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-5 text-center">
                <span className="text-green-400 text-sm">Valid Voucher</span>
                <div className="text-white text-xl font-bold">${validatedBalance.toFixed(2)}</div>
              </div>
            )}
            
            {/* Keypad for code entry */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {keypadKeys.flat().map((key) => (
                <button
                  key={key}
                  onClick={() => handleVoucherKeypad(key)}
                  className={`h-12 rounded-lg text-lg font-semibold transition-colors ${
                    key === 'C'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            
            {/* Validate / Apply Button */}
            {validatedBalance === null ? (
              <button
                onClick={handleValidateVoucher}
                disabled={!voucherCode || isValidating}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  voucherCode && !isValidating
                    ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                    : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isValidating ? 'VALIDATING...' : 'VALIDATE VOUCHER'}
              </button>
            ) : (
              <button
                onClick={handleApplyVoucher}
                className="w-full py-3 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                APPLY ${validatedBalance.toFixed(2)} TO ORDER
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDialog;
