import { useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CURRENCY_SYMBOL, PREDEFINED_VOUCHER_TYPES, REDEMPTION_LIMIT_OPTIONS,
  inputClass, labelClass,
  type VoucherTypeConfig, type CompanyProfile,
} from "./voucherConstants";
import {
  posCurrencyFormat, posCurrencyToNumber,
} from "./voucherHelpers";
import { getCardTheme } from "./voucherCardThemes";
import VoucherCurrencyInput from "./VoucherCurrencyInput";

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
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [touched, setTouched] = useState({ voucherName: false, value: false });
  const [voucherValueType, setVoucherValueType] = useState<'fixed' | 'percentage'>('fixed');

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

  const voucherTypes = (() => {
    if (companyProfile?.preferredVoucherTypes?.length) {
      const preferred = PREDEFINED_VOUCHER_TYPES.filter(t => companyProfile.preferredVoucherTypes!.includes(t.name));
      const others = PREDEFINED_VOUCHER_TYPES.filter(t => !companyProfile.preferredVoucherTypes!.includes(t.name));
      return [...preferred, ...others];
    }
    return PREDEFINED_VOUCHER_TYPES;
  })();

  const today = new Date().toISOString().split('T')[0];

  const applyFilter = (types: VoucherTypeConfig[]) => {
    if (activeFilter === 'all' || activeFilter === 'custom') return types;
    return types.filter(t => {
      switch (activeFilter) {
        case 'personal': return t.buyerType === 'personal' || t.buyerType === 'both';
        case 'company': return t.buyerType === 'company' || t.buyerType === 'both';
        case 'noFee': return t.serviceFeeType === 'none' || t.serviceFeeValue === 0;
        case 'withFee': return t.serviceFeeType !== 'none' && t.serviceFeeValue > 0;
        case 'expiring': return !!t.expiryDefault && t.expiryDefault >= today;
        case 'noExpiry': return !t.expiryDefault;
        default: return true;
      }
    });
  };

  const categoryFiltered = applyFilter(voucherTypes);
  const filteredTypes = categoryFiltered.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filterCounts: Record<string, number> = {
    all: voucherTypes.length,
    personal: voucherTypes.filter(t => t.buyerType === 'personal' || t.buyerType === 'both').length,
    company: voucherTypes.filter(t => t.buyerType === 'company' || t.buyerType === 'both').length,
    noFee: voucherTypes.filter(t => t.serviceFeeType === 'none' || t.serviceFeeValue === 0).length,
    withFee: voucherTypes.filter(t => t.serviceFeeType !== 'none' && t.serviceFeeValue > 0).length,
    expiring: voucherTypes.filter(t => !!t.expiryDefault && t.expiryDefault >= today).length,
    noExpiry: voucherTypes.filter(t => !t.expiryDefault).length,
    custom: 1,
  };

  type FilterOption = { key: string; label: string };
  const FILTER_OPTIONS: FilterOption[] = [
    { key: 'all', label: 'All' },
    { key: 'personal', label: 'Personal' },
    { key: 'company', label: 'Company' },
    { key: 'noFee', label: 'No Fee' },
    { key: 'withFee', label: 'With Fee' },
    { key: 'expiring', label: 'Expiring' },
    { key: 'noExpiry', label: 'No Expiry' },
    { key: 'custom', label: 'Custom' },
  ];

  const showCustomCard = activeFilter === 'all' || activeFilter === 'custom';
  const showTemplateCards = activeFilter !== 'custom';

  const isTemplateSelected = !isCustomVoucherName && voucherName.trim().length > 0;
  const isCustomMode = isCustomVoucherName;

  const handleSelectTemplate = (config: VoucherTypeConfig) => {
    onVoucherNameChange(config.name, false, config);
  };

  const handleSelectCustom = () => {
    onVoucherNameChange('', true);
  };

  const formatServiceFeeBadge = (config: VoucherTypeConfig) => {
    if (config.serviceFeeType === 'none') return 'No Fee';
    if (config.serviceFeeType === 'percentage') return `${config.serviceFeeValue}% Fee`;
    return `${CURRENCY_SYMBOL}${config.serviceFeeValue.toFixed(2)} Fixed`;
  };

  // ---- CARD SELECTION VIEW ----
  if (!isCustomMode) {
    return (
      <div className="space-y-3">
        {/* Search + Create */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher templates..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSelectCustom}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Voucher
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTER_OPTIONS.map(f => {
            const isActive = activeFilter === f.key;
            const count = filterCounts[f.key];
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(isActive ? 'all' : f.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? 'bg-white text-neutral-900 border-white'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-neutral-200'
                }`}
              >
                {f.label}{count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto scrollbar-hide p-1">
          {/* Custom Voucher Card */}

          {showTemplateCards && filteredTypes.map((config, idx) => {
            const selected = isTemplateSelected && voucherName === config.name;
            const theme = getCardTheme(idx);
            return (
              <button
                key={config.name}
                onClick={() => handleSelectTemplate(config)}
                className={`text-left rounded-2xl transition-all duration-300 relative overflow-hidden ${theme.bg} border ${
                  selected
                    ? `${theme.glow} scale-[1.02]`
                    : `${theme.border} hover:scale-[1.01] hover:shadow-lg`
                }`}
              >
                {theme.pattern}
                <div className="relative p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-[15px] leading-tight text-white">{config.name}</h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${theme.badgeBg} ${theme.badgeText}`}>
                        {formatServiceFeeBadge(config)}
                      </span>
                      {selected && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${theme.accent.replace('text-', 'bg-')} animate-scale-in`}>
                          <Check className="w-3 h-3 text-neutral-900" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="my-2">
                    <div className={`text-2xl font-extrabold tracking-tight ${theme.valueBg}`}>
                      {CURRENCY_SYMBOL}{(config.redeemableValue || 0).toFixed(2)}
                    </div>
                    <div className={`text-[11px] font-semibold uppercase tracking-widest mt-0.5 ${theme.accentText}`}>Gift Voucher</div>
                  </div>
                  <div className="flex items-center gap-2 my-2">
                    <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                    <div className={`w-1.5 h-1.5 rounded-full opacity-40 ${theme.accent.replace('text-', 'bg-')}`} />
                    <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-medium">Min Order</span>
                      <span className="text-white font-bold">{config.minOrderDefault ? `${CURRENCY_SYMBOL}${config.minOrderDefault.toFixed(2)}` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-medium">Limit</span>
                      <span className="text-white font-bold">{REDEMPTION_LIMIT_OPTIONS.find(o => o.value === config.redemptionLimitDefault)?.label || '1 time'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-medium">From</span>
                      <span className="text-white font-bold">{config.validFromDefault || 'Today'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-medium">Expires</span>
                      <span className="text-white font-bold">{config.expiryDefault || '—'}</span>
                    </div>
                  </div>
                  <div className={`mt-2 pt-1.5 border-t border-white/10 text-[10px] font-medium tracking-wide uppercase ${theme.accentText}`}>
                    Powered by POS AI
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {showTemplateCards && filteredTypes.length === 0 && (
          <div className="text-center py-6">
            <p className="text-neutral-400 text-sm">No vouchers found.</p>
            <button onClick={() => { setActiveFilter('all'); setSearchQuery(''); }} className="text-neutral-300 hover:text-white text-xs mt-1 underline underline-offset-2 transition-colors">
              Show all vouchers
            </button>
          </div>
        )}

        {/* Summary */}
        {isTemplateSelected && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2 animate-fade-in">
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
      <button
        onClick={() => {
          onVoucherNameChange('', false);
          setSearchQuery('');
          setTouched({ voucherName: false, value: false });
          setVoucherValueType('fixed');
        }}
        className="text-neutral-400 hover:text-white text-xs transition-colors flex items-center gap-1"
      >
        ← Back to templates
      </button>

      <div className="grid grid-cols-3 gap-x-3">
        <div className="col-span-2">
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
        <div>
          <label className={labelClass}>Voucher Type</label>
          <Select value={voucherValueType} onValueChange={(v) => setVoucherValueType(v as 'fixed' | 'percentage')}>
            <SelectTrigger className="w-full bg-neutral-800 border-neutral-600 text-white h-[46px] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-600 z-[9999]">
              <SelectItem value="fixed" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">Fixed Amount</SelectItem>
              <SelectItem value="percentage" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        <VoucherCurrencyInput
          label={voucherValueType === 'percentage' ? "Redeemable (%)" : "Redeemable Value"}
          required
          rawDigits={valueDigits}
          onRawDigitsChange={(d) => { onValueDigitsChange(d); setTouched(p => ({ ...p, value: true })); }}
          error={touched.value && numericValue <= 0 ? "Amount required" : undefined}
          symbolOverride={voucherValueType === 'percentage' ? '%' : undefined}
        />
        <VoucherCurrencyInput
          label="Service Fee"
          rawDigits={serviceFeeDigits}
          onRawDigitsChange={onServiceFeeDigitsChange}
        />
        <VoucherCurrencyInput
          label="Minimum Order"
          rawDigits={minimumOrderDigits}
          onRawDigitsChange={onMinimumOrderDigitsChange}
          warning={minOrderWarning ? "⚠ Exceeds value" : undefined}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        <div>
          <label className={labelClass}>Redemption Limit</label>
          <Select value={redemptionLimit} onValueChange={onRedemptionLimitChange}>
            <SelectTrigger className="w-full bg-neutral-800 border-neutral-600 text-white h-[46px] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-600 z-[9999]">
              {REDEMPTION_LIMIT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelClass}>Valid From</label>
          <input type="date" value={validFrom} onChange={(e) => { onValidFromChange(e.target.value); if (expiryDate && e.target.value > expiryDate) onExpiryDateChange(e.target.value); }} className={`${inputClass} [color-scheme:dark]`} />
        </div>
        <div>
          <label className={labelClass}>Expiry Date</label>
          <input type="date" value={expiryDate} min={validFrom || undefined} onChange={(e) => onExpiryDateChange(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <input type="text" value={notes} onChange={(e) => onNotesChange(e.target.value.slice(0, 500))} placeholder="Internal notes (not printed on voucher)" className={inputClass} />
      </div>

      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">{voucherValueType === 'percentage' ? 'Redeemable (%)' : 'Redeemable Value'}</span>
          <span className="text-white">{voucherValueType === 'percentage' ? `${numericValue}%` : `${CURRENCY_SYMBOL}${numericValue.toFixed(2)}`}</span>
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
