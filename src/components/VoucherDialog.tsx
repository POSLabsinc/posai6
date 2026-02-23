import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, Ticket, Delete, Search, Gift, Plus, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

const PREDEFINED_VOUCHER_NAMES = [
  'Summer Sale 20% Off',
  'Welcome Offer',
  'Loyalty Reward',
  'Festive Discount',
  'Birthday Special',
];

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

// Format pattern uses X as digit placeholder. Digits fill in left-to-right.
const COUNTRY_CODES = [
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', phoneLength: 10, placeholder: '(555) 123-4567', hint: '10-digit phone number', format: '(XXX) XXX-XXXX' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', phoneLength: 11, placeholder: '07123 456789', hint: '11-digit UK phone number', format: 'XXXXX XXXXXX' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', phoneLength: 10, placeholder: '(555) 123-4567', hint: '10-digit phone number', format: '(XXX) XXX-XXXX' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', phoneLength: 9, placeholder: '412 345 678', hint: '9-digit mobile number', format: 'XXX XXX XXX' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', phoneLength: 10, placeholder: '98765 43210', hint: '10-digit mobile number', format: 'XXXXX XXXXX' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', phoneLength: 11, placeholder: '151 12345678', hint: '11-digit phone number', format: 'XXX XXXXXXXX' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', phoneLength: 9, placeholder: '6 12 34 56 78', hint: '9-digit phone number', format: 'X XX XX XX XX' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan', phoneLength: 10, placeholder: '90 1234 5678', hint: '10-digit phone number', format: 'XX XXXX XXXX' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China', phoneLength: 11, placeholder: '138 0013 8000', hint: '11-digit mobile number', format: 'XXX XXXX XXXX' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil', phoneLength: 11, placeholder: '11 91234 5678', hint: '11-digit phone number', format: 'XX XXXXX XXXX' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico', phoneLength: 10, placeholder: '55 1234 5678', hint: '10-digit phone number', format: 'XX XXXX XXXX' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy', phoneLength: 10, placeholder: '312 345 6789', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain', phoneLength: 9, placeholder: '612 345 678', hint: '9-digit phone number', format: 'XXX XXX XXX' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea', phoneLength: 10, placeholder: '10 1234 5678', hint: '10-digit phone number', format: 'XX XXXX XXXX' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', phoneLength: 9, placeholder: '50 123 4567', hint: '9-digit mobile number', format: 'XX XXX XXXX' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia', phoneLength: 9, placeholder: '51 234 5678', hint: '9-digit mobile number', format: 'XX XXX XXXX' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', phoneLength: 8, placeholder: '9123 4567', hint: '8-digit phone number', format: 'XXXX XXXX' },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', phoneLength: 9, placeholder: '21 123 4567', hint: '9-digit phone number', format: 'XX XXX XXXX' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa', phoneLength: 9, placeholder: '71 123 4567', hint: '9-digit phone number', format: 'XX XXX XXXX' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines', phoneLength: 10, placeholder: '917 123 4567', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria', phoneLength: 10, placeholder: '801 234 5678', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', phoneLength: 10, placeholder: '301 234 5678', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh', phoneLength: 10, placeholder: '1712 345678', hint: '10-digit phone number', format: 'XXXX XXXXXX' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt', phoneLength: 10, placeholder: '100 123 4567', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
];

// Apply format pattern to raw digits
const formatPhone = (digits: string, pattern: string): string => {
  if (!digits) return '';
  let result = '';
  let digitIdx = 0;
  for (let i = 0; i < pattern.length && digitIdx < digits.length; i++) {
    if (pattern[i] === 'X') {
      result += digits[digitIdx++];
    } else {
      result += pattern[i];
    }
  }
  return result;
};

const VoucherDialog = ({ isOpen, onClose, onAddVoucher, initialData }: VoucherDialogProps) => {
  const [voucherName, setVoucherName] = useState('');
  const voucherType = 'fixed' as const;
  const [value, setValue] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [quantity, setQuantity] = useState(1);
  const [redemptionLimit, setRedemptionLimit] = useState('1');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [issuedBy, setIssuedBy] = useState(MOCK_EMPLOYEES[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [voucherCode] = useState(generateVoucherCode);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [touched, setTouched] = useState({ voucherName: false, value: false, sellingPrice: false });
  const [showKeypad, setShowKeypad] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCustomVoucherName, setIsCustomVoucherName] = useState(false);
  const [showVoucherNameDropdown, setShowVoucherNameDropdown] = useState(false);
  const [voucherNameSearch, setVoucherNameSearch] = useState('');
  const staffDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const voucherNameDropdownRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!(initialData?.editingItemId);

  // Close voucher name dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voucherNameDropdownRef.current && !voucherNameDropdownRef.current.contains(e.target as Node)) {
        setShowVoucherNameDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && initialData) {
      setVoucherName(initialData.voucherName || '');
      
      setValue(initialData.value.toString());
      setSellingPrice(initialData.sellingPrice.toString());
      setExpiryDate(initialData.expiryDate || '');
      setValidFrom(initialData.validFrom || new Date().toISOString().split('T')[0]);
      setQuantity(initialData.quantity);
      setRedemptionLimit(initialData.redemptionLimit?.toString() || '1');
      setMinimumOrder(initialData.minimumOrder?.toString() || '');
      setIssuedBy(initialData.issuedBy || '');
      setNotes(initialData.notes || '');
      setTouched({ voucherName: false, value: false, sellingPrice: false });
      setShowKeypad(false);
    }
  }, [isOpen, initialData]);

  const numericValue = parseFloat(value) || 0;
  const numericSellingPrice = parseFloat(sellingPrice) || 0;

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === selectedCountry.phoneLength;
  };

  const hasValidContact = 
    (recipientEmail.trim().length > 0 && isValidEmail(recipientEmail)) ||
    (recipientPhone.trim().length > 0 && isValidPhone(recipientPhone));

  const giftValid = !isGift || (
    recipientFirstName.trim().length > 0 &&
    recipientLastName.trim().length > 0 &&
    hasValidContact
  );

  const isValid = voucherName.trim().length > 0 && numericValue > 0 && numericSellingPrice > 0 && giftValid;

  const resetState = () => {
    setVoucherName('');
    
    setValue('');
    setSellingPrice('');
    setExpiryDate('');
    setValidFrom(new Date().toISOString().split('T')[0]);
    
    setQuantity(1);
    setRedemptionLimit('1');
    setMinimumOrder('');
    setIssuedBy(MOCK_EMPLOYEES[0]?.name || '');
    setShowStaffDropdown(false);
    setStaffSearch('');
    setNotes('');
    setTouched({ voucherName: false, value: false, sellingPrice: false });
    setShowKeypad(false);
    setIsGift(false);
    setRecipientFirstName('');
    setRecipientLastName('');
    setRecipientEmail('');
    setRecipientPhone('');
    setSelectedCountry(COUNTRY_CODES[0]);
    setShowCountryDropdown(false);
    setCountrySearch('');
    setIsCustomVoucherName(false);
    setShowVoucherNameDropdown(false);
    setVoucherNameSearch('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddToOrder = () => {
    setTouched({ voucherName: true, value: true, sellingPrice: true });
    if (!isValid) return;


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
          {/* 1. Voucher Name - Searchable Dropdown with Custom Option */}
          <div className="relative" ref={voucherNameDropdownRef}>
            <label className={labelClass}>
              Voucher Name <span className="text-red-400">*</span>
            </label>
            {isCustomVoucherName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherName}
                  onChange={(e) => setVoucherName(e.target.value.slice(0, 50))}
                  onBlur={() => setTouched(prev => ({ ...prev, voucherName: true }))}
                  placeholder="Enter custom voucher name"
                  autoFocus
                  className={`flex-1 ${inputClass} ${touched.voucherName && !voucherName.trim() ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (voucherName.trim()) {
                      setIsCustomVoucherName(false);
                      setShowVoucherNameDropdown(false);
                    }
                  }}
                  className="p-3 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                  title="Confirm"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoucherName('');
                    setIsCustomVoucherName(false);
                  }}
                  className="p-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowVoucherNameDropdown(prev => !prev);
                  setVoucherNameSearch('');
                }}
                onBlur={() => setTimeout(() => setTouched(prev => ({ ...prev, voucherName: true })), 200)}
                className={`w-full flex items-center justify-between ${inputClass} cursor-pointer hover:border-neutral-500 ${touched.voucherName && !voucherName.trim() ? 'border-red-500' : ''}`}
              >
                <span className={voucherName ? 'text-white' : 'text-neutral-500'}>
                  {voucherName || 'Select voucher name'}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showVoucherNameDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Dropdown List */}
            {showVoucherNameDropdown && !isCustomVoucherName && (
              <div className="absolute z-[9999] w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-neutral-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type="text"
                      value={voucherNameSearch}
                      onChange={(e) => setVoucherNameSearch(e.target.value)}
                      placeholder="Search voucher names..."
                      autoFocus
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-md pl-9 pr-3 py-2 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto scrollbar-hide">
                  {PREDEFINED_VOUCHER_NAMES
                    .filter(name => name.toLowerCase().includes(voucherNameSearch.toLowerCase()))
                    .map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setVoucherName(name);
                          setShowVoucherNameDropdown(false);
                          setVoucherNameSearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-neutral-700 ${voucherName === name ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
                      >
                        {name}
                      </button>
                    ))}
                  {/* Create Custom Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherName('');
                      setIsCustomVoucherName(true);
                      setShowVoucherNameDropdown(false);
                      setVoucherNameSearch('');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-neutral-700 transition-colors flex items-center gap-2 border-t border-neutral-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create Custom Voucher Name
                  </button>
                </div>
              </div>
            )}

            {touched.voucherName && !voucherName.trim() && (
              <p className="text-red-400 text-xs mt-1">Voucher name is required</p>
            )}
          </div>


          {/* 3. Voucher Value with POS Keypad */}
          <div>
            <label className={labelClass}>
              Voucher Value ($) <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowKeypad(prev => !prev)}
              className={`w-full bg-neutral-800 border rounded-lg px-4 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${touched.value && numericValue <= 0 ? 'border-red-500' : showKeypad ? 'border-neutral-400' : 'border-neutral-600'}`}
            >
              <span className="text-neutral-400 mr-1">$</span>
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
                  {`$${amt}`}
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

          {/* 11. Gift Toggle */}
          <div className="border border-neutral-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-neutral-400" />
                <span className="text-white text-sm font-medium">Gift It to Friends / Family</span>
              </div>
              <Switch
                checked={isGift}
                onCheckedChange={(checked) => {
                  setIsGift(checked);
                  if (!checked) {
                    setRecipientFirstName('');
                    setRecipientLastName('');
                    setRecipientEmail('');
                    setRecipientPhone('');
                    setShowCountryDropdown(false);
                    setCountrySearch('');
                  }
                }}
              />
            </div>

            {isGift && (
              <div className="mt-3 space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
                  <div>
                    <label className={labelClass}>First Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={recipientFirstName}
                      onChange={(e) => setRecipientFirstName(e.target.value.slice(0, 50))}
                      placeholder="Recipient first name"
                      className={`${inputClass} ${isGift && !recipientFirstName.trim() ? 'border-red-500/50' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={recipientLastName}
                      onChange={(e) => setRecipientLastName(e.target.value.slice(0, 50))}
                      placeholder="Recipient last name"
                      className={`${inputClass} ${isGift && !recipientLastName.trim() ? 'border-red-500/50' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value.slice(0, 100))}
                    placeholder="recipient@email.com"
                    className={`${inputClass} ${
                      !recipientEmail && !recipientPhone && recipientFirstName.trim() && recipientLastName.trim()
                        ? 'border-amber-500/50'
                        : recipientEmail && !isValidEmail(recipientEmail)
                          ? 'border-red-500/50'
                          : ''
                    }`}
                  />
                  {recipientEmail && !isValidEmail(recipientEmail) && (
                    <p className="text-red-400 text-xs mt-1">Invalid email format</p>
                  )}
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="flex">
                    {/* Country Code Selector */}
                    <div className="relative" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => { setShowCountryDropdown(prev => !prev); setCountrySearch(''); }}
                        className="h-[46px] bg-neutral-800 border border-neutral-600 border-r-0 rounded-l-lg px-3 text-sm text-white flex items-center gap-1.5 hover:bg-neutral-700 transition-colors whitespace-nowrap"
                      >
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className="text-neutral-300 text-xs">{selectedCountry.dial}</span>
                        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-50 shadow-xl">
                          <div className="p-2 border-b border-neutral-700">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                autoFocus
                                className="w-full bg-neutral-900 border border-neutral-600 rounded-md pl-8 pr-3 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto scrollbar-hide">
                            {COUNTRY_CODES
                              .filter(c =>
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.dial.includes(countrySearch) ||
                                c.code.toLowerCase().includes(countrySearch.toLowerCase())
                              )
                              .map(c => (
                                <button
                                  key={c.code}
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setShowCountryDropdown(false);
                                    setCountrySearch('');
                                    setRecipientPhone('');
                                  }}
                                  className={`w-full px-3 py-2.5 text-sm text-left flex items-center gap-2.5 transition-colors ${
                                    selectedCountry.code === c.code ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'
                                  }`}
                                >
                                  <span className="text-base">{c.flag}</span>
                                  <span className="flex-1 truncate">{c.name}</span>
                                  <span className="text-neutral-500 text-xs">{c.dial}</span>
                                </button>
                              ))
                            }
                            {COUNTRY_CODES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                              <p className="px-3 py-3 text-neutral-500 text-xs text-center">No countries found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Phone Input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formatPhone(recipientPhone, selectedCountry.format)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.phoneLength);
                        setRecipientPhone(raw);
                      }}
                      placeholder={selectedCountry.placeholder || `${selectedCountry.phoneLength}-digit phone number`}
                      className={`${inputClass} rounded-l-none flex-1 ${
                        !recipientEmail && !recipientPhone && recipientFirstName.trim() && recipientLastName.trim()
                          ? 'border-amber-500/50'
                          : recipientPhone && !isValidPhone(recipientPhone)
                            ? 'border-red-500/50'
                            : ''
                      }`}
                    />
                  </div>
                  {recipientPhone && !isValidPhone(recipientPhone) && (
                    <p className="text-red-400 text-xs mt-1">Invalid phone number for {selectedCountry.name} — {selectedCountry.hint} (e.g. {selectedCountry.placeholder})</p>
                  )}
                </div>

                {/* Helper text / validation */}
                <p className={`text-xs ${
                  recipientFirstName.trim() && recipientLastName.trim() && !recipientEmail.trim() && !recipientPhone.trim()
                    ? 'text-amber-400'
                    : 'text-neutral-500'
                }`}>
                  Either Email or Phone Number must be provided.
                </p>
              </div>
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
