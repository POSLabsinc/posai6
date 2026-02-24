import { useState, useCallback } from "react";
import { Delete, Search, Plus, Check } from "lucide-react";
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
  onVoucherNameChange: (name: string, isCustom: boolean, config?: VoucherTypeConfig) => void;
  onValueDigitsChange: (digits: string) => void;
  onServiceFeeDigitsChange: (digits: string) => void;
  onValidFromChange: (date: string) => void;
  onExpiryDateChange: (date: string) => void;
  onRedemptionLimitChange: (limit: string) => void;
  onMinimumOrderDigitsChange: (digits: string) => void;
  onNotesChange: (notes: string) => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKeypad, setActiveKeypad] = useState<'value' | 'serviceFee' | 'minimumOrder' | null>(null);
  const [touched, setTouched] = useState({ voucherName: false, value: false });

  const numericValue = posCurrencyToNumber(valueDigits);
  const minimumOrderValue = posCurrencyToNumber(minimumOrderDigits);

  const computedServiceFee = (() => {
    if (serviceFeeType === 'none') return 0;
    if (!serviceFeeReadOnly) return posCurrencyToNumber(serviceFeeDigits);
    if (serviceFeeType === 'percentage') return numericValue * (serviceFeeConfigValue / 100);
    return serviceFeeConfigValue;
  })();

  const totalPayable = numericValue + computedServiceFee;
  const minOrderWarning = minimumOrderValue > 0 && numericValue > 0 && minimumOrderValue > numericValue;

  // Determine voucher types (company-preferred first)
  const voucherTypes = (() => {
    if (companyProfile?.preferredVoucherTypes?.length) {
      const preferred = PREDEFINED_VOUCHER_TYPES.filter(t => companyProfile.preferredVoucherTypes!.includes(t.name));
      const others = PREDEFINED_VOUCHER_TYPES.filter(t => !companyProfile.preferredVoucherTypes!.includes(t.name));
      return [...preferred, ...others];
    }
    return PREDEFINED_VOUCHER_TYPES;
  })();

  const filteredTypes = voucherTypes.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTemplateSelected = !isCustomVoucherName && voucherName.trim().length > 0;
  const isCustomMode = isCustomVoucherName;

  const handleSelectTemplate = (config: VoucherTypeConfig) => {
    onVoucherNameChange(config.name, false, config);
    setActiveKeypad(null);
  };

  const handleSelectCustom = () => {
    onVoucherNameChange('', true);
    setActiveKeypad(null);
  };

  const formatServiceFeeLabel = (config: VoucherTypeConfig) => {
    if (config.serviceFeeType === 'none') return 'No fee';
    if (config.serviceFeeType === 'percentage') return `${config.serviceFeeValue}%`;
    return `${CURRENCY_SYMBOL}${config.serviceFeeValue.toFixed(2)} fixed`;
  };

  const handlePosKeyPress = useCallback((setter: (d: string) => void, currentDigits: string, key: string) => {
    setter(posCurrencyDigitAppend(currentDigits, key));
  }, []);

  const handlePosDeleteKey = useCallback((setter: (d: string) => void, currentDigits: string) => {
    setter(posCurrencyDigitDelete(currentDigits));
  }, []);

  const renderKeypad = (currentDigits: string, onChange: (digits: string) => void) => (
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

  // ---- CARD SELECTION VIEW ----
  if (!isCustomMode) {
    return (
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher templates..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Custom Voucher Card */}
          <button
            onClick={handleSelectCustom}
            className="text-left border border-dashed border-neutral-600 hover:border-emerald-500/50 rounded-xl p-3 transition-all hover:bg-neutral-800/60 group"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-emerald-400 font-medium text-sm">Custom Voucher</span>
            </div>
            <p className="text-neutral-500 text-xs">Create a voucher with custom pricing & rules</p>
          </button>

          {/* Template cards */}
          {filteredTypes.map(config => {
            const selected = isTemplateSelected && voucherName === config.name;
            return (
              <button
                key={config.name}
                onClick={() => handleSelectTemplate(config)}
                className={`text-left rounded-xl p-3 transition-all border ${
                  selected
                    ? 'border-white bg-neutral-800 ring-1 ring-white/20'
                    : 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/40 hover:bg-neutral-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-medium text-sm truncate ${selected ? 'text-white' : 'text-neutral-200'}`}>
                    {config.name}
                  </span>
                  {selected && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 ml-2">
                      <Check className="w-3 h-3 text-neutral-900" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                  <div>
                    <span className="text-neutral-500">Value: </span>
                    <span className="text-neutral-300">{CURRENCY_SYMBOL}{(config.redeemableValue || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Fee: </span>
                    <span className="text-neutral-300">{formatServiceFeeLabel(config)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Min Order: </span>
                    <span className="text-neutral-300">{config.minOrderDefault ? `${CURRENCY_SYMBOL}${config.minOrderDefault.toFixed(2)}` : 'None'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Limit: </span>
                    <span className="text-neutral-300">
                      {REDEMPTION_LIMIT_OPTIONS.find(o => o.value === config.redemptionLimitDefault)?.label || '1 time'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">From: </span>
                    <span className="text-neutral-300">{config.validFromDefault || 'Today'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Expiry: </span>
                    <span className="text-neutral-300">{config.expiryDefault || 'None'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTypes.length === 0 && searchQuery && (
          <p className="text-neutral-500 text-sm text-center py-4">No templates match "{searchQuery}"</p>
        )}

        {/* Summary (only when a template is selected) */}
        {isTemplateSelected && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2">
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
        )}
      </div>
    );
  }

  // ---- CUSTOM FORM VIEW ----
  return (
    <div className="space-y-3">
      {/* Back to cards link */}
      <button
        onClick={() => {
          onVoucherNameChange('', false);
          setSearchQuery('');
          setActiveKeypad(null);
          setTouched({ voucherName: false, value: false });
        }}
        className="text-neutral-400 hover:text-white text-xs transition-colors flex items-center gap-1"
      >
        ← Back to templates
      </button>

      {/* Voucher Name */}
      <div>
        <label className={labelClass}>Voucher Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={voucherName}
          onChange={(e) => onVoucherNameChange(e.target.value.slice(0, 50), true)}
          placeholder="Enter custom voucher name"
          autoFocus
          onBlur={() => setTouched(p => ({ ...p, voucherName: true }))}
          className={`${inputClass} ${touched.voucherName && !voucherName.trim() ? 'border-red-500' : ''}`}
        />
        {touched.voucherName && !voucherName.trim() && <p className="text-red-400 text-xs mt-1">Voucher name is required</p>}
      </div>

      {/* Row 1: Redeemable Value, Service Fee, Minimum Order */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        {/* Redeemable Value */}
        <div>
          <label className={labelClass}>Redeemable Value <span className="text-red-400">*</span></label>
          <button
            type="button"
            onClick={() => setActiveKeypad(p => p === 'value' ? null : 'value')}
            onBlur={() => setTouched(p => ({ ...p, value: true }))}
            className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${
              touched.value && numericValue <= 0 ? 'border-red-500' : activeKeypad === 'value' ? 'border-neutral-400' : 'border-neutral-600'
            }`}
          >
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(valueDigits)}</span>
          </button>
          {touched.value && numericValue <= 0 && <p className="text-red-400 text-xs mt-1">Amount required</p>}
          {activeKeypad === 'value' && renderKeypad(valueDigits, onValueDigitsChange)}
        </div>

        {/* Service Fee */}
        <div>
          <label className={labelClass}>Service Fee</label>
          <button
            type="button"
            onClick={() => setActiveKeypad(p => p === 'serviceFee' ? null : 'serviceFee')}
            className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${
              activeKeypad === 'serviceFee' ? 'border-neutral-400' : 'border-neutral-600'
            }`}
          >
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(serviceFeeDigits)}</span>
          </button>
          {activeKeypad === 'serviceFee' && renderKeypad(serviceFeeDigits, onServiceFeeDigitsChange)}
        </div>

        {/* Minimum Order */}
        <div>
          <label className={labelClass}>Minimum Order</label>
          <button
            type="button"
            onClick={() => setActiveKeypad(p => p === 'minimumOrder' ? null : 'minimumOrder')}
            className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${
              activeKeypad === 'minimumOrder' ? 'border-neutral-400' : 'border-neutral-600'
            }`}
          >
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(minimumOrderDigits)}</span>
          </button>
          {minOrderWarning && <p className="text-amber-400 text-xs mt-1">⚠ Exceeds value</p>}
          {activeKeypad === 'minimumOrder' && renderKeypad(minimumOrderDigits, onMinimumOrderDigitsChange)}
        </div>
      </div>

      {/* Row 2: Redemption Limit, Valid From, Expiry Date */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        <div>
          <label className={labelClass}>Redemption Limit</label>
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
        </div>
        <div>
          <label className={labelClass}>Valid From</label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => { onValidFromChange(e.target.value); if (expiryDate && e.target.value > expiryDate) onExpiryDateChange(e.target.value); }}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>
        <div>
          <label className={labelClass}>Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            min={validFrom || undefined}
            onChange={(e) => onExpiryDateChange(e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value.slice(0, 500))}
          placeholder="Internal notes (not printed on voucher)"
          className={inputClass}
        />
      </div>

      {/* Summary */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2">
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
