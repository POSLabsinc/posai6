import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoucher: (amount: number, voucherData: { type: string; value: number; expiryDate?: string; maxUses?: number }) => void;
  /* --- Legacy props kept for backwards compatibility (commented-out flow) --- */
  onRedeemVoucher?: (voucherCode: string, balance: number) => void;
  initialView?: 'sell' | 'redeem';
}

const VoucherDialog = ({ isOpen, onClose, onAddVoucher }: VoucherDialogProps) => {
  const [voucherType, setVoucherType] = useState<'fixed' | 'percentage'>('fixed');
  const [value, setValue] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const numericValue = parseFloat(value) || 0;

  const resetState = () => {
    setVoucherType('fixed');
    setValue('');
    setExpiryDate('');
    setMaxUses('');
    setShowTypeDropdown(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddToOrder = () => {
    if (numericValue <= 0) return;

    if (voucherType === 'percentage' && numericValue > 100) {
      toast({ title: "Invalid value", description: "Percentage cannot exceed 100%", variant: "destructive" });
      return;
    }

    const voucherData = {
      type: voucherType,
      value: numericValue,
      expiryDate: expiryDate || undefined,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
    };

    onAddVoucher(numericValue, voucherData);
    toast({ title: "Voucher added to order" });
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 rounded-xl p-0 max-w-[420px] w-full [&>button]:hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1 hover:bg-white/10 rounded-full transition-colors z-[10]"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>

        <div className="p-5">
          {/* Header */}
          <h2 className="text-white text-lg font-semibold text-center mb-1">Voucher</h2>
          <p className="text-neutral-400 text-xs text-center mb-6">
            Enter voucher details to add it to the order.
          </p>

          {/* Voucher Type Dropdown */}
          <div className="mb-4">
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">Voucher Type</label>
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm text-left flex items-center justify-between focus:outline-none focus:border-neutral-500 transition-colors"
              >
                <span>{voucherType === 'fixed' ? 'Fixed Amount' : 'Percentage'}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTypeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-20">
                  <button
                    onClick={() => { setVoucherType('fixed'); setShowTypeDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${voucherType === 'fixed' ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'}`}
                  >
                    Fixed Amount
                  </button>
                  <button
                    onClick={() => { setVoucherType('percentage'); setShowTypeDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${voucherType === 'percentage' ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'}`}
                  >
                    Percentage
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Voucher Value */}
          <div className="mb-4">
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
              Voucher Value {voucherType === 'percentage' ? '(%)' : '($)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                {voucherType === 'fixed' ? '$' : '%'}
              </span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                min="0"
                step={voucherType === 'fixed' ? '0.01' : '1'}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg pl-8 pr-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Expiry Date (Optional) */}
          <div className="mb-4">
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
              Expiry Date <span className="text-neutral-500">(Optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Max Uses (Optional) */}
          <div className="mb-6">
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
              Max Uses <span className="text-neutral-500">(Optional)</span>
            </label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              min="1"
              className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Add to Order Button */}
          <button
            onClick={handleAddToOrder}
            disabled={numericValue <= 0}
            className={`w-full py-3.5 rounded-lg text-sm font-semibold transition-colors ${
              numericValue > 0
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Add to Order
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDialog;

/* ============================================================
   LEGACY FLOW — commented out for future restoration
   ============================================================

   The original VoucherDialog supported two views:
   - 'sell': Keypad-based amount entry with preset buttons + CHARGE CTA
   - 'redeem': Voucher code text input + REDEEM VOUCHER CTA

   To restore:
   1. Uncomment the original component body (useState for view/amount/selectedPreset/voucherCode,
      PRESET_AMOUNTS, keypadKeys, etc.)
   2. Re-enable the props: onRedeemVoucher, initialView
   3. Remove the new form-based component above.

   Original props interface:
     onAddVoucher: (amount: number) => void;
     onRedeemVoucher: (voucherCode: string, balance: number) => void;
     initialView?: 'sell' | 'redeem';
============================================================ */
