import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Delete, Search, Plus, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CURRENCY_SYMBOL, PREDEFINED_VOUCHER_TYPES, REDEMPTION_LIMIT_OPTIONS,
  inputClass, labelClass, keypadBtnClass,
  type VoucherTypeConfig, type CompanyProfile,
} from "./voucherConstants";
import {
  posCurrencyDigitAppend, posCurrencyDigitDelete, posCurrencyFormat, posCurrencyToNumber,
} from "./voucherHelpers";

interface SingleVoucherStepProps {
  // State passed from parent
  voucherName: string;
  isCustomVoucherName: boolean;
  valueDigits: string;
  serviceFeeDigits: string;
  serviceFeeReadOnly: boolean;
  serviceFeeType: 'percentage' | 'fixed' | 'none';
  serviceFeeConfigValue: number;
  validFrom: string;
  expiryDate: string;
  redemptionLimit: string;
  minimumOrderDigits: string;
  notes: string;
  // Setters
  onVoucherNameChange: (name: string, isCustom: boolean, config?: VoucherTypeConfig) => void;
  onValueDigitsChange: (digits: string) => void;
  onServiceFeeDigitsChange: (digits: string) => void;
  onValidFromChange: (date: string) => void;
  onExpiryDateChange: (date: string) => void;
  onRedemptionLimitChange: (limit: string) => void;
  onMinimumOrderDigitsChange: (digits: string) => void;
  onNotesChange: (notes: string) => void;
  // Context
  companyProfile?: CompanyProfile | null;
}

const SingleVoucherStep = ({
  voucherName, isCustomVoucherName, valueDigits, serviceFeeDigits,
  serviceFeeReadOnly, serviceFeeType, serviceFeeConfigValue,
  validFrom, expiryDate, redemptionLimit, minimumOrderDigits, notes,
  onVoucherNameChange, onValueDigitsChange, onServiceFeeDigitsChange,
  onValidFromChange, onExpiryDateChange, onRedemptionLimitChange,
  onMinimumOrderDigitsChange, onNotesChange,
  companyProfile,
}: SingleVoucherStepProps) => {
  const [showVoucherNameDropdown, setShowVoucherNameDropdown] = useState(false);
  const [voucherNameSearch, setVoucherNameSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(isCustomVoucherName);
  const [activeKeypad, setActiveKeypad] = useState<'value' | 'serviceFee' | 'minimumOrder' | null>(null);
  const [touched, setTouched] = useState({ voucherName: false, value: false });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowVoucherNameDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const numericValue = posCurrencyToNumber(valueDigits);
  const minimumOrderValue = posCurrencyToNumber(minimumOrderDigits);

  // Compute service fee amount
  const computedServiceFee = (() => {
    if (serviceFeeType === 'none') return 0;
    if (!serviceFeeReadOnly) return posCurrencyToNumber(serviceFeeDigits);
    if (serviceFeeType === 'percentage') return numericValue * (serviceFeeConfigValue / 100);
    return serviceFeeConfigValue;
  })();

  const totalPayable = numericValue + computedServiceFee;
  const minOrderWarning = minimumOrderValue > 0 && numericValue > 0 && minimumOrderValue > numericValue;

  const handlePosKeyPress = useCallback((setter: (d: string) => void, currentDigits: string, key: string) => {
    setter(posCurrencyDigitAppend(currentDigits, key));
  }, []);

  const handlePosDeleteKey = useCallback((setter: (d: string) => void, currentDigits: string) => {
    setter(posCurrencyDigitDelete(currentDigits));
  }, []);

  // Determine voucher types to show (company-preferred first)
  const voucherTypes = (() => {
    if (companyProfile?.preferredVoucherTypes?.length) {
      const preferred = PREDEFINED_VOUCHER_TYPES.filter(t => companyProfile.preferredVoucherTypes!.includes(t.name));
      const others = PREDEFINED_VOUCHER_TYPES.filter(t => !companyProfile.preferredVoucherTypes!.includes(t.name));
      return [...preferred, ...others];
    }
    return PREDEFINED_VOUCHER_TYPES;
  })();

  const filteredTypes = voucherTypes.filter(t =>
    t.name.toLowerCase().includes(voucherNameSearch.toLowerCase())
  );

  const renderKeypad = (
    currentDigits: string,
    onChange: (digits: string) => void,
  ) => (
    <div className="grid grid-cols-3 gap-1.5 mt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button key={n} onClick={() => handlePosKeyPress(onChange, currentDigits, n.toString())} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>
          {n}
        </button>
      ))}
      <button onClick={() => handlePosKeyPress(onChange, currentDigits, '00')} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>00</button>
      <button onClick={() => handlePosKeyPress(onChange, currentDigits, '0')} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>0</button>
      <button onClick={() => handlePosDeleteKey(onChange, currentDigits)} className={`h-11 ${keypadBtnClass}`}>
        <Delete className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
      {/* Voucher Name - full width */}
      <div className="relative md:col-span-2" ref={dropdownRef}>
        <label className={labelClass}>Voucher Name <span className="text-red-400">*</span></label>
        {showCustomInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherName}
              onChange={(e) => onVoucherNameChange(e.target.value.slice(0, 50), true)}
              placeholder="Enter custom voucher name"
              autoFocus
              className={`flex-1 ${inputClass} ${touched.voucherName && !voucherName.trim() ? 'border-red-500' : ''}`}
            />
            <button onClick={() => { if (voucherName.trim()) { setShowCustomInput(false); setShowVoucherNameDropdown(false); } }} className="p-3 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"><Check className="w-4 h-4" /></button>
            <button onClick={() => { onVoucherNameChange('', false); setShowCustomInput(false); }} className="p-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setShowVoucherNameDropdown(p => !p); setVoucherNameSearch(''); }}
            onBlur={() => setTimeout(() => setTouched(p => ({ ...p, voucherName: true })), 200)}
            className={`w-full flex items-center justify-between ${inputClass} cursor-pointer hover:border-neutral-500 ${touched.voucherName && !voucherName.trim() ? 'border-red-500' : ''}`}
          >
            <span className={voucherName ? 'text-white' : 'text-neutral-500'}>{voucherName || 'Select voucher name'}</span>
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showVoucherNameDropdown ? 'rotate-180' : ''}`} />
          </button>
        )}
        {showVoucherNameDropdown && !showCustomInput && (
          <div className="absolute z-[9999] w-full md:w-1/2 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-neutral-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input type="text" value={voucherNameSearch} onChange={(e) => setVoucherNameSearch(e.target.value)} placeholder="Search..." autoFocus className="w-full bg-neutral-900 border border-neutral-700 rounded-md pl-9 pr-3 py-2 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500" />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto scrollbar-hide">
              <button 
                onClick={() => { onVoucherNameChange('', true); setShowCustomInput(true); setShowVoucherNameDropdown(false); }} 
                className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-neutral-700 transition-colors flex items-center gap-2 border-b border-neutral-700"
              >
                <Plus className="w-4 h-4" />Create Custom Voucher Name
              </button>
              {filteredTypes.map(t => (
                <button key={t.name} onClick={() => { onVoucherNameChange(t.name, false, t); setShowVoucherNameDropdown(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-neutral-700 ${voucherName === t.name ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}>
                  <span>{t.name}</span>
                  {t.description && <span className="text-neutral-500 text-xs ml-2">— {t.description}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {touched.voucherName && !voucherName.trim() && <p className="text-red-400 text-xs mt-1">Voucher name is required</p>}
      </div>

      {/* Row 1: Redeemable Value, Service Fee, Minimum Order — 3 columns */}
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        {/* Redeemable Value */}
        <div>
          <label className={labelClass}>Redeemable Value <span className="text-red-400">*</span></label>
          {!isCustomVoucherName && voucherName ? (
            <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-3 text-sm">
              <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
              <span className="text-neutral-300">{posCurrencyFormat(valueDigits)}</span>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setActiveKeypad(p => p === 'value' ? null : 'value')} className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${touched.value && numericValue <= 0 ? 'border-red-500' : activeKeypad === 'value' ? 'border-neutral-400' : 'border-neutral-600'}`}>
                <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
                <span className="text-white">{posCurrencyFormat(valueDigits)}</span>
              </button>
              {touched.value && numericValue <= 0 && <p className="text-red-400 text-xs mt-1">Amount required</p>}
              {activeKeypad === 'value' && renderKeypad(valueDigits, onValueDigitsChange)}
            </>
          )}
        </div>

        {/* Service Fee */}
        <div>
          <label className={labelClass}>Service Fee</label>
          {serviceFeeReadOnly ? (
            <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-3 text-sm">
              <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
              <span className="text-neutral-300">{computedServiceFee.toFixed(2)}</span>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setActiveKeypad(p => p === 'serviceFee' ? null : 'serviceFee')} className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${activeKeypad === 'serviceFee' ? 'border-neutral-400' : 'border-neutral-600'}`}>
                <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
                <span className="text-white">{posCurrencyFormat(serviceFeeDigits)}</span>
              </button>
              {activeKeypad === 'serviceFee' && renderKeypad(serviceFeeDigits, onServiceFeeDigitsChange)}
            </>
          )}
        </div>

        {/* Minimum Order */}
        <div>
          <label className={labelClass}>Minimum Order</label>
          {!isCustomVoucherName && voucherName ? (
            <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-3 text-sm">
              <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
              <span className="text-neutral-300">{posCurrencyFormat(minimumOrderDigits)}</span>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setActiveKeypad(p => p === 'minimumOrder' ? null : 'minimumOrder')} className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${activeKeypad === 'minimumOrder' ? 'border-neutral-400' : 'border-neutral-600'}`}>
                <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
                <span className="text-white">{posCurrencyFormat(minimumOrderDigits)}</span>
              </button>
              {minOrderWarning && (
                <p className="text-amber-400 text-xs mt-1">⚠ Exceeds value</p>
              )}
              {activeKeypad === 'minimumOrder' && renderKeypad(minimumOrderDigits, onMinimumOrderDigitsChange)}
            </>
          )}
        </div>
      </div>

      {/* Row 2: Redemption Limit, Valid From, Expiry Date — 3 columns */}
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        {/* Redemption Limit */}
        <div>
          <label className={labelClass}>Redemption Limit</label>
          {!isCustomVoucherName && voucherName ? (
            <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-neutral-300">
              {REDEMPTION_LIMIT_OPTIONS.find(o => o.value === redemptionLimit)?.label || redemptionLimit}
            </div>
          ) : (
            <Select value={redemptionLimit} onValueChange={onRedemptionLimitChange}>
              <SelectTrigger className="w-full bg-neutral-800 border-neutral-600 text-white h-[46px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-600 z-[9999]">
                {REDEMPTION_LIMIT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Valid From */}
        <div>
          <label className={labelClass}>Valid From</label>
          {!isCustomVoucherName && voucherName ? (
            <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-neutral-300 [color-scheme:dark]">{validFrom || 'Not set'}</div>
          ) : (
            <input type="date" value={validFrom} onChange={(e) => { onValidFromChange(e.target.value); if (expiryDate && e.target.value > expiryDate) onExpiryDateChange(e.target.value); }} className={`${inputClass} [color-scheme:dark]`} />
          )}
        </div>

        {/* Expiry Date */}
        <div>
          <label className={labelClass}>Expiry Date</label>
          {!isCustomVoucherName && voucherName ? (
            <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-neutral-300 [color-scheme:dark]">{expiryDate || 'No expiry'}</div>
          ) : (
            <input type="date" value={expiryDate} min={validFrom || undefined} onChange={(e) => onExpiryDateChange(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
          )}
        </div>
      </div>

      {/* Notes - full width */}
      <div className="md:col-span-2">
        <label className={labelClass}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value.slice(0, 500))}
          placeholder="Internal notes (not printed on voucher)"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Summary area */}
      <div className="md:col-span-2 bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Redeemable Value</span>
          <span className="text-white">{CURRENCY_SYMBOL}{numericValue.toFixed(2)}</span>
        </div>
        {computedServiceFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Service Fee</span>
            <span className="text-white">{CURRENCY_SYMBOL}{computedServiceFee.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-neutral-700 pt-2 flex justify-between text-sm font-semibold">
          <span className="text-white">Total to Pay</span>
          <span className="text-white text-base">{CURRENCY_SYMBOL}{totalPayable.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default SingleVoucherStep;
