import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoucher: (amount: number) => void;
  onRedeemVoucher: (voucherCode: string, balance: number) => void;
  initialView?: 'sell' | 'redeem';
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

const VoucherDialog = ({ isOpen, onClose, onAddVoucher, onRedeemVoucher, initialView = 'sell' }: VoucherDialogProps) => {
  const [view, setView] = useState<'sell' | 'redeem'>(initialView);
  const [amount, setAmount] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [voucherCode, setVoucherCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) setView(initialView);
  }, [isOpen, initialView]);
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
  };

  const handleBackToSell = () => {
    setView('sell');
    setVoucherCode('');
  };

  const handleApplyVoucher = () => {
    if (voucherCode) {
      // Mock validation - in real app this would call an API
      // For demo purposes, using a fixed balance of $25
      const mockBalance = 25.00;
      onRedeemVoucher(voucherCode, mockBalance);
      resetState();
    }
  };

  const resetState = () => {
    setView('sell');
    setAmount('');
    setSelectedPreset(null);
    setVoucherCode('');
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
      <DialogContent className="bg-neutral-900 border-neutral-700 rounded-xl p-0 max-w-[420px] w-full">
        {view === 'sell' ? (
          <div className="p-5">
            {/* Header */}
            <h2 className="text-white text-lg font-semibold text-center mb-6">Sell Voucher</h2>
            
            {/* Amount Display - Field Style */}
            <div className="flex items-center justify-center bg-neutral-800 rounded-lg px-4 py-4 mb-6">
              <span className="text-green-500 text-2xl font-bold text-center">
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
            {/* Header - Centered */}
            <h2 className="text-white text-lg font-semibold text-center mb-6">Redeem Voucher</h2>
            
            {/* Voucher Code Input Field */}
            <div className="mb-5">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="ENTER VOUCHER CODE"
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-4 
                           text-white text-center text-lg font-mono tracking-wider 
                           placeholder:text-neutral-500 uppercase focus:outline-none focus:border-neutral-500"
              />
            </div>
            
            {/* REDEEM VOUCHER Button */}
            <button
              onClick={handleApplyVoucher}
              disabled={!voucherCode}
              className={`w-full py-3 rounded-lg text-sm font-semibold mb-3 transition-colors ${
                voucherCode
                  ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                  : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
              }`}
            >
              REDEEM VOUCHER
            </button>
            
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDialog;
