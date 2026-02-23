import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, Ticket, Delete, RefreshCw, Pencil, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export interface VoucherInitialData {
  type: 'fixed' | 'percentage';
  value: number;
  sellingPrice: number;
  expiryDate?: string;
  quantity: number;
  editingItemId?: number;
  voucherName?: string;
  validFrom?: string;
  redemptionLimit?: number;
  minimumOrder?: number;
  issuedBy?: string;
  notes?: string;
}

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoucher: (amount: number, voucherData: {
    type: string;
    value: number;
    expiryDate?: string;
    sellingPrice?: number;
    quantity?: number;
    voucherName?: string;
    validFrom?: string;
    redemptionLimit?: number;
    minimumOrder?: number;
    issuedBy?: string;
    notes?: string;
    voucherCode?: string;
  }) => void;
  onRedeemVoucher?: (voucherCode: string, balance: number) => void;
  initialView?: 'sell' | 'redeem';
  initialData?: VoucherInitialData | null;
}

const QUICK_VALUES = [10, 25, 50, 100];

const generateVoucherCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VC-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Mock employee list – replace with real data source when available
const MOCK_EMPLOYEES = [
  { id: '1', name: 'John Smith', role: 'Manager' },
  { id: '2', name: 'Sarah Johnson', role: 'Server' },
  { id: '3', name: 'Mike Chen', role: 'Cashier' },
  { id: '4', name: 'Emily Davis', role: 'Server' },
  { id: '5', name: 'Alex Wilson', role: 'Bartender' },
  { id: '6', name: 'Lisa Brown', role: 'Manager' },
  { id: '7', name: 'David Lee', role: 'Server' },
  { id: '8', name: 'Anna Martinez', role: 'Cashier' },
];

const VoucherDialog = ({ isOpen, onClose, onAddVoucher, initialData }: VoucherDialogProps) => {
  const [voucherName, setVoucherName] = useState('');
  const [voucherType, setVoucherType] = useState<'fixed' | 'percentage'>('fixed');
  const [value, setValue] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [redemptionLimit, setRedemptionLimit] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [issuedBy, setIssuedBy] = useState(MOCK_EMPLOYEES[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState(generateVoucherCode);
  const [isCustomCode, setIsCustomCode] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [touched, setTouched] = useState({ voucherName: false, value: false, sellingPrice: false });
  const [showKeypad, setShowKeypad] = useState(false);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!(initialData?.editingItemId);

  useEffect(() => {
    if (isOpen && initialData) {
      setVoucherName(initialData.voucherName || '');
      setVoucherType(initialData.type);
      setValue(initialData.value.toString());
      setSellingPrice(initialData.sellingPrice.toString());
      setExpiryDate(initialData.expiryDate || '');
      setValidFrom(initialData.validFrom || '');
      setQuantity(initialData.quantity);
      setRedemptionLimit(initialData.redemptionLimit?.toString() || '');
      setMinimumOrder(initialData.minimumOrder?.toString() || '');
      setIssuedBy(initialData.issuedBy || '');
      setNotes(initialData.notes || '');
      setTouched({ voucherName: false, value: false, sellingPrice: false });
      setShowKeypad(false);
    }
  }, [isOpen, initialData]);

  const numericValue = parseFloat(value) || 0;
  const numericSellingPrice = parseFloat(sellingPrice) || 0;

  const isValid = voucherName.trim().length > 0 && numericValue > 0 && numericSellingPrice > 0;

  const resetState = () => {
    setVoucherName('');
    setVoucherType('fixed');
    setValue('');
    setSellingPrice('');
    setExpiryDate('');
    setValidFrom('');
    setShowTypeDropdown(false);
    setQuantity(1);
    setRedemptionLimit('');
    setMinimumOrder('');
    setIssuedBy(MOCK_EMPLOYEES[0]?.name || '');
    setShowStaffDropdown(false);
    setStaffSearch('');
    setNotes('');
    setVoucherCode(generateVoucherCode());
    setIsCustomCode(false);
    setTouched({ voucherName: false, value: false, sellingPrice: false });
    setShowKeypad(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddToOrder = () => {
    setTouched({ voucherName: true, value: true, sellingPrice: true });
    if (!isValid) return;

    if (voucherType === 'percentage' && numericValue > 100) {
      toast({ title: "Invalid value", description: "Percentage cannot exceed 100%", variant: "destructive" });
      return;
    }

    const parsedRedemptionLimit = parseInt(redemptionLimit) || undefined;
    const parsedMinimumOrder = parseFloat(minimumOrder) || undefined;

    onAddVoucher(numericValue, {
      type: voucherType,
      value: numericValue,
      expiryDate: expiryDate || undefined,
      sellingPrice: numericSellingPrice,
      quantity,
      voucherName: voucherName.trim(),
      validFrom: validFrom || undefined,
      redemptionLimit: parsedRedemptionLimit,
      minimumOrder: parsedMinimumOrder,
      issuedBy: issuedBy.trim() || undefined,
      notes: notes.trim() || undefined,
      voucherCode: voucherCode.trim() || undefined,
    });
    toast({ title: isEditMode ? "Voucher updated" : "Voucher added to order" });
    resetState();
  };

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
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setSellingPrice(val);
    }
  };

  const handleNumericOnly = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setter(val);
    }
  };

  const handleIntegerOnly = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setter(val);
    }
  };

  const keypadBtnClass = "rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-white transition-all duration-100 active:scale-95 flex items-center justify-center";
  const inputClass = "w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors";
  const labelClass = "text-neutral-400 text-xs font-medium mb-1.5 block";

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
              <span className="text-white font-bold text-base leading-tight">
                {isEditMode ? 'Edit Voucher' : 'Sell Voucher'}
              </span>
              <p className="text-neutral-400 text-xs mt-0.5">
                {isEditMode ? 'Update voucher details' : 'Add voucher to the order'}
              </p>
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
          {/* 1. Voucher Name */}
          <div>
            <label className={labelClass}>
              Voucher Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={voucherName}
              onChange={(e) => setVoucherName(e.target.value.slice(0, 100))}
              onBlur={() => setTouched(prev => ({ ...prev, voucherName: true }))}
              placeholder="e.g. Summer Sale 20% Off"
              className={`${inputClass} ${touched.voucherName && !voucherName.trim() ? 'border-red-500' : ''}`}
            />
            {touched.voucherName && !voucherName.trim() && (
              <p className="text-red-400 text-xs mt-1">Voucher name is required</p>
            )}
          </div>

          {/* 2. Voucher Type */}
          <div>
            <label className={labelClass}>
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

          {/* 3. Voucher Value with POS Keypad */}
          <div>
            <label className={labelClass}>
              Voucher Value {voucherType === 'percentage' ? '(%)' : '($)'} <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowKeypad(prev => !prev)}
              className={`w-full bg-neutral-800 border rounded-lg px-4 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${touched.value && numericValue <= 0 ? 'border-red-500' : showKeypad ? 'border-neutral-400' : 'border-neutral-600'}`}
            >
              <span className="text-neutral-400 mr-1">{voucherType === 'fixed' ? '$' : '%'}</span>
              <span className="text-white">{value || '0.00'}</span>
            </button>
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
            {showKeypad && (
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
                <button onClick={handleDeleteKey} className={`h-11 ${keypadBtnClass}`}>
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Selling Price */}
          <div>
            <label className={labelClass}>
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
                className={`${inputClass} pl-8 ${touched.sellingPrice && numericSellingPrice <= 0 ? 'border-red-500' : ''}`}
              />
            </div>
            {touched.sellingPrice && numericSellingPrice <= 0 && (
              <p className="text-red-400 text-xs mt-1">Selling price is required</p>
            )}
          </div>

          {/* 5 & 6. Valid From + Expiry Date */}
          <div className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
            <div>
              <label className={labelClass}>Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => {
                  setValidFrom(e.target.value);
                  if (expiryDate && e.target.value && e.target.value > expiryDate) {
                    setExpiryDate(e.target.value);
                  }
                }}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>
            <div>
              <label className={labelClass}>Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                min={validFrom || undefined}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>
          </div>

          {/* 7 & 8. Redemption Limit + Minimum Order */}
          <div className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
            <div>
              <label className={labelClass}>Redemption Limit</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRedemptionLimit(prev => {
                    const n = parseInt(prev) || 0;
                    return n > 0 ? (n - 1 === 0 ? '' : (n - 1).toString()) : '';
                  })}
                  className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-600 text-white text-lg font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center flex-shrink-0"
                >
                  −
                </button>
                <span className="text-white text-sm font-medium flex-1 text-center truncate">
                  {redemptionLimit ? redemptionLimit : 'Unlimited'}
                </span>
                <button
                  type="button"
                  onClick={() => setRedemptionLimit(prev => {
                    const n = parseInt(prev) || 0;
                    return (n + 1).toString();
                  })}
                  className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-600 text-white text-lg font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Minimum Order ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={minimumOrder}
                  onChange={handleNumericOnly(setMinimumOrder)}
                  placeholder="0.00"
                  className={`${inputClass} pl-8 h-10`}
                />
              </div>
            </div>
          </div>

          {/* 8b. Voucher Code */}
          <div>
            <label className={labelClass}>Voucher Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => {
                  if (isCustomCode) setVoucherCode(e.target.value.toUpperCase().slice(0, 20));
                }}
                readOnly={!isCustomCode}
                className={`${inputClass} flex-1 font-mono tracking-wider ${!isCustomCode ? 'opacity-80' : ''}`}
              />
              <button
                type="button"
                onClick={() => {
                  setVoucherCode(generateVoucherCode());
                  setIsCustomCode(false);
                }}
                title="Generate new code"
                className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-600 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCustomCode(prev => !prev)}
                title={isCustomCode ? "Use auto-generated" : "Enter custom code"}
                className={`p-2.5 rounded-lg border transition-colors ${isCustomCode ? 'bg-neutral-600 border-neutral-500 text-white' : 'bg-neutral-800 border-neutral-600 text-neutral-300 hover:text-white hover:bg-neutral-700'}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className="text-neutral-500 text-xs mt-1">
              {isCustomCode ? 'Enter a custom voucher code' : 'Auto-generated code (tap pencil to customize)'}
            </p>
          </div>

          {/* 9. Issued By */}
          <div className="relative" ref={staffDropdownRef}>
            <label className={labelClass}>Issued By (Staff Name)</label>
            <button
              type="button"
              onClick={() => { setShowStaffDropdown(prev => !prev); setStaffSearch(''); }}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between focus:outline-none focus:border-neutral-500 transition-colors"
            >
              <span className={issuedBy ? 'text-white' : 'text-neutral-500'}>
                {issuedBy || 'Select Employee'}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showStaffDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStaffDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-50 shadow-xl">
                {MOCK_EMPLOYEES.length > 6 && (
                  <div className="p-2 border-b border-neutral-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        placeholder="Search employee..."
                        autoFocus
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-md pl-8 pr-3 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto scrollbar-hide">
                  {MOCK_EMPLOYEES
                    .filter(emp => emp.name.toLowerCase().includes(staffSearch.toLowerCase()) || emp.role.toLowerCase().includes(staffSearch.toLowerCase()))
                    .map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { setIssuedBy(emp.name); setShowStaffDropdown(false); setStaffSearch(''); }}
                        className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors ${issuedBy === emp.name ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'}`}
                      >
                        <span>{emp.name}</span>
                        <span className="text-neutral-500 text-xs">{emp.role}</span>
                      </button>
                    ))
                  }
                  {MOCK_EMPLOYEES.filter(emp => emp.name.toLowerCase().includes(staffSearch.toLowerCase())).length === 0 && (
                    <p className="px-4 py-3 text-neutral-500 text-xs text-center">No employees found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 10. Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Internal notes (not printed on voucher)"
              rows={2}
              className={`${inputClass} min-h-[60px] resize-none`}
            />
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
            {isValid
              ? `${isEditMode ? 'UPDATE' : 'ADD TO ORDER'} $${numericSellingPrice.toFixed(2)}`
              : (isEditMode ? 'UPDATE' : 'ADD TO ORDER')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDialog;
