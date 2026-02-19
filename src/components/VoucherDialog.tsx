import { useState, useCallback } from "react";
import { ChevronDown, Ticket, Delete } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoucher: (amount: number, voucherData: { type: string; value: number; expiryDate?: string; sellingPrice?: number; quantity?: number }) => void;
  onRedeemVoucher?: (voucherCode: string, balance: number) => void;
  initialView?: 'sell' | 'redeem';
}

const QUICK_VALUES = [10, 25, 50, 100];

const VoucherDialog = ({ isOpen, onClose, onAddVoucher }: VoucherDialogProps) => {
  const [voucherType, setVoucherType] = useState<'fixed' | 'percentage'>('fixed');
  const [value, setValue] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [touched, setTouched] = useState({ value: false, sellingPrice: false });

  const numericValue = parseFloat(value) || 0;
  const numericSellingPrice = parseFloat(sellingPrice) || 0;

  const isValid = numericValue > 0 && numericSellingPrice > 0;

  const resetState = () => {
    setVoucherType('fixed');
    setValue('');
    setSellingPrice('');
    setExpiryDate('');
    setShowTypeDropdown(false);
    setQuantity(1);
    setTouched({ value: false, sellingPrice: false });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddToOrder = () => {
    setTouched({ value: true, sellingPrice: true });
    if (!isValid) return;

    if (voucherType === 'percentage' && numericValue > 100) {
      toast({ title: "Invalid value", description: "Percentage cannot exceed 100%", variant: "destructive" });
      return;
    }

    onAddVoucher(numericValue, {
      type: voucherType,
      value: numericValue,
      expiryDate: expiryDate || undefined,
      sellingPrice: numericSellingPrice,
      quantity,
    });
    toast({ title: "Voucher added to order" });
    resetState();
  };

  // POS Keypad handler for voucher value
  const handleKeyPress = useCallback((key: string) => {
    setValue(prev => {
      if (key === '.' && prev.includes('.')) return prev;
      if (key === '00') {
        if (prev === '' || prev === '0') return prev;
        return prev + '00';
      }
      if (prev === '0' && key !== '.') return key;
      return prev + key;
    });
  }, []);

  const handleDeleteKey = useCallback(() => {
    setValue(prev => prev.slice(0, -1));
  }, []);

  const handleQuickValue = (amount: number) => {
    setValue(amount.toString());
    if (!sellingPrice) {
      setSellingPrice(amount.toString());
    }
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty, or valid positive number
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setSellingPrice(val);
    }
  };

  const keypadBtnClass = "rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-white transition-all duration-100 active:scale-95 flex items-center justify-center";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="bg-neutral-900 border-neutral-700 p-0 max-w-md w-[95vw] md:w-full overflow-hidden rounded-2xl flex flex-col max-h-[90vh] [&>button]:hidden"
      >
        {/* Grabber Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-neutral-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white bg-neutral-800 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-white font-bold text-base leading-tight">Sell Voucher</span>
              <p className="text-neutral-400 text-xs mt-0.5">Add voucher to the order</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-neutral-700 px-2.5 py-1 rounded-md">
                <span className="text-white font-medium text-sm">
                  {numericSellingPrice > 0 ? `$${numericSellingPrice.toFixed(2)}` : '$0.00'}
                </span>
              </div>
              <Select value={quantity.toString()} onValueChange={(val) => setQuantity(parseInt(val))}>
                <SelectTrigger className="w-12 h-7 bg-neutral-700 border-none text-white font-medium text-sm rounded-md px-2 gap-0.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600 z-[9999] min-w-[3rem]">
                  {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()} className="text-white text-sm hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white py-1">
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex-1 px-4 pb-2 space-y-3 overflow-y-auto scrollbar-hide">
          {/* Voucher Type */}
          <div>
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
              Voucher Type <span className="text-red-400">*</span>
            </label>
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

          {/* Voucher Value with POS Keypad */}
          <div>
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
              Voucher Value {voucherType === 'percentage' ? '(%)' : '($)'} <span className="text-red-400">*</span>
            </label>
            {/* Display */}
            <div className={`w-full bg-neutral-800 border rounded-lg px-4 py-3 text-sm ${touched.value && numericValue <= 0 ? 'border-red-500' : 'border-neutral-600'}`}>
              <span className="text-neutral-400 mr-1">{voucherType === 'fixed' ? '$' : '%'}</span>
              <span className="text-white">{value || '0.00'}</span>
            </div>
            {touched.value && numericValue <= 0 && (
              <p className="text-red-400 text-xs mt-1">Voucher value is required</p>
            )}

            {/* Quick Add Values */}
            <div className="flex gap-2 mt-2">
              {QUICK_VALUES.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickValue(amt)}
                  className="flex-1 py-1.5 rounded-lg bg-neutral-800 border border-neutral-600 text-white text-xs font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                >
                  {voucherType === 'fixed' ? `$${amt}` : `${amt}%`}
                </button>
              ))}
            </div>

            {/* Inbuilt POS Keypad */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handleKeyPress(num.toString())} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>
                  {num}
                </button>
              ))}
              <button onClick={() => handleKeyPress('00')} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>
                00
              </button>
              <button onClick={() => handleKeyPress('0')} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>
                0
              </button>
              <button onClick={() => handleKeyPress('.')} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>
                .
              </button>
            </div>
            <button onClick={handleDeleteKey} className={`w-full h-10 mt-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-white transition-all flex items-center justify-center gap-2 text-sm font-medium`}>
              <Delete className="w-4 h-4" /> Backspace
            </button>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
              Selling Price <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={sellingPrice}
                onChange={handleSellingPriceChange}
                onBlur={() => setTouched(prev => ({ ...prev, sellingPrice: true }))}
                placeholder="0.00"
                className={`w-full bg-neutral-800 border rounded-lg pl-8 pr-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors ${touched.sellingPrice && numericSellingPrice <= 0 ? 'border-red-500' : 'border-neutral-600'}`}
              />
            </div>
            {touched.sellingPrice && numericSellingPrice <= 0 && (
              <p className="text-red-400 text-xs mt-1">Selling price is required</p>
            )}
          </div>
        </div>

        {/* Footer */}
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
            disabled={!isValid}
            className="flex-[2] py-2 rounded-full font-bold text-sm h-10 disabled:opacity-40"
            style={{
              background: isValid ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' : undefined,
              color: isValid ? 'black' : undefined,
            }}
          >
            {isValid ? `ADD TO ORDER $${numericSellingPrice.toFixed(2)}` : 'ADD TO ORDER'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDialog;
