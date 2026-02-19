import { useState } from "react";
import { X, ChevronDown, Ticket } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      <DialogContent
        className="bg-neutral-900 border-neutral-700 p-0 max-w-md w-[95vw] md:w-full overflow-hidden rounded-2xl flex flex-col max-h-[90vh] [&>button]:hidden"
      >
        {/* Grabber Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-neutral-600 rounded-full" />
        </div>

        {/* Item Header — mirrors View Item layout */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            {/* Icon in place of item image */}
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white bg-neutral-800 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-white font-bold text-base leading-tight">
                Sell Voucher
              </span>
              <p className="text-neutral-400 text-xs mt-0.5">Add voucher to the order</p>
            </div>

            {/* Value badge — mirrors price badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-neutral-700 px-2.5 py-1 rounded-md">
                <span className="text-white font-medium text-sm">
                  {numericValue > 0
                    ? voucherType === 'fixed'
                      ? `$${numericValue.toFixed(2)}`
                      : `${numericValue}%`
                    : '$0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex-1 px-4 pb-2 space-y-3 overflow-y-auto scrollbar-hide">
          {/* Voucher Type Dropdown */}
          <div>
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
          <div>
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
          <div>
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
          <div>
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
        </div>

        {/* Action Buttons — mirrors View Item footer */}
        <div className="px-4 py-3 border-t border-neutral-700 mt-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-transparent border border-neutral-500 hover:bg-neutral-800 h-10"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleAddToOrder}
            disabled={numericValue <= 0}
            className="flex-[2] py-2 rounded-full font-bold text-sm h-10 disabled:opacity-40"
            style={{
              background: numericValue > 0
                ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                : undefined,
              color: numericValue > 0 ? 'black' : undefined,
            }}
          >
            {numericValue > 0
              ? `ADD TO ORDER ${voucherType === 'fixed' ? `$${numericValue.toFixed(2)}` : `${numericValue}%`}`
              : 'ADD TO ORDER'}
          </Button>
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
