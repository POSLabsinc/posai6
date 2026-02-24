import { useState, useCallback } from "react";
import { Delete, Search, Plus, Check, Sparkles, Gift, Star } from "lucide-react";
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

// Visual themes for voucher cards
type CardTheme = {
  bg: string;
  border: string;
  glow: string;
  accent: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  valueBg: string;
  subtitle: string;
  pattern: React.ReactNode;
};

const CARD_THEMES: CardTheme[] = [
  // Elegant: dark + gold
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900',
    border: 'border-amber-900/40',
    glow: 'shadow-[0_0_20px_rgba(217,169,78,0.25)] border-amber-500/60 ring-1 ring-amber-400/30',
    accent: 'text-amber-400',
    accentText: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-300',
    valueBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent',
    subtitle: 'text-amber-500/70',
    pattern: (
      <>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]" style={{ background: 'radial-gradient(circle at 70% 30%, #d4af37 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-20 h-20 opacity-[0.03]" style={{ background: 'radial-gradient(circle at 30% 70%, #d4af37 0%, transparent 70%)' }} />
        <div className="absolute top-3 right-3 opacity-[0.06]"><Star className="w-8 h-8 text-amber-400" /></div>
      </>
    ),
  },
  // Modern: gradient + bold
  {
    bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
    border: 'border-blue-800/40',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.25)] border-blue-400/60 ring-1 ring-blue-400/30',
    accent: 'text-blue-400',
    accentText: 'text-blue-300',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    badgeText: 'text-blue-300',
    valueBg: 'bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent',
    subtitle: 'text-blue-500/70',
    pattern: (
      <>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(96,165,250,0.3) 20px, rgba(96,165,250,0.3) 21px)' }} />
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />
      </>
    ),
  },
  // Festive: warm accent
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-rose-950/30 to-neutral-900',
    border: 'border-rose-800/40',
    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.25)] border-rose-400/60 ring-1 ring-rose-400/30',
    accent: 'text-rose-400',
    accentText: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    badgeText: 'text-rose-300',
    valueBg: 'bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300 bg-clip-text text-transparent',
    subtitle: 'text-rose-500/70',
    pattern: (
      <>
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(244,114,182,0.4) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(244,114,182,0.3) 0%, transparent 50%)' }} />
        <div className="absolute top-2 right-3 opacity-[0.08]"><Sparkles className="w-6 h-6 text-rose-400" /></div>
      </>
    ),
  },
  // Emerald luxury
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-emerald-950/30 to-neutral-900',
    border: 'border-emerald-800/40',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)] border-emerald-400/60 ring-1 ring-emerald-400/30',
    accent: 'text-emerald-400',
    accentText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    valueBg: 'bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent',
    subtitle: 'text-emerald-500/70',
    pattern: (
      <>
        <div className="absolute bottom-0 right-0 w-28 h-28 opacity-[0.04]" style={{ background: 'radial-gradient(circle at 80% 80%, #34d399 0%, transparent 60%)' }} />
        <div className="absolute top-2 left-3 opacity-[0.07]"><Gift className="w-5 h-5 text-emerald-400" /></div>
      </>
    ),
  },
  // Violet premium
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-violet-950/30 to-neutral-900',
    border: 'border-violet-800/40',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.25)] border-violet-400/60 ring-1 ring-violet-400/30',
    accent: 'text-violet-400',
    accentText: 'text-violet-300',
    badgeBg: 'bg-violet-500/15 border-violet-500/30',
    badgeText: 'text-violet-300',
    valueBg: 'bg-gradient-to-r from-violet-300 via-purple-200 to-violet-300 bg-clip-text text-transparent',
    subtitle: 'text-violet-500/70',
    pattern: (
      <>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(167,139,250,0.2) 15px, rgba(167,139,250,0.2) 16px)' }} />
      </>
    ),
  },
];

const getTheme = (index: number) => CARD_THEMES[index % CARD_THEMES.length];

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

  const formatServiceFeeBadge = (config: VoucherTypeConfig) => {
    if (config.serviceFeeType === 'none') return 'No Fee';
    if (config.serviceFeeType === 'percentage') return `${config.serviceFeeValue}% Fee`;
    return `${CURRENCY_SYMBOL}${config.serviceFeeValue.toFixed(2)} Fixed`;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto scrollbar-hide pr-0.5">
          {/* Custom Voucher Card */}
          <button
            onClick={handleSelectCustom}
            className="text-left border-2 border-dashed border-neutral-600 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 hover:bg-emerald-500/5 group relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(52,211,153,0.3) 10px, rgba(52,211,153,0.3) 11px)' }} />
            <div className="relative flex flex-col items-center justify-center py-3 gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-center">
                <span className="text-emerald-400 font-semibold text-sm block">Custom Voucher</span>
                <span className="text-neutral-500 text-[11px]">Create your own voucher</span>
              </div>
            </div>
          </button>

          {/* Template cards */}
          {filteredTypes.map((config, idx) => {
            const selected = isTemplateSelected && voucherName === config.name;
            const theme = getTheme(idx);
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
                {/* Pattern overlay */}
                {theme.pattern}

                <div className="relative p-3.5">
                  {/* Top: Name + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-[15px] leading-tight text-white">
                      {config.name}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${theme.badgeBg} ${theme.badgeText}`}>
                      {formatServiceFeeBadge(config)}
                    </span>
                  </div>

                  {/* Center: Hero value */}
                  <div className="my-2">
                    <div className={`text-2xl font-extrabold tracking-tight ${theme.valueBg}`}>
                      {CURRENCY_SYMBOL}{(config.redeemableValue || 0).toFixed(2)}
                    </div>
                    <div className={`text-[11px] font-semibold uppercase tracking-widest mt-0.5 ${theme.accentText}`}>
                      Gift Voucher
                    </div>
                  </div>

                  {/* Decorative divider */}
                  <div className="flex items-center gap-2 my-2">
                    <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                    <div className={`w-1.5 h-1.5 rounded-full opacity-40 ${theme.accent.replace('text-', 'bg-')}`} />
                    <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                  </div>

                  {/* Bottom: Details */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-medium">Min Order</span>
                      <span className="text-white font-bold">{config.minOrderDefault ? `${CURRENCY_SYMBOL}${config.minOrderDefault.toFixed(2)}` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-medium">Limit</span>
                      <span className="text-white font-bold">
                        {REDEMPTION_LIMIT_OPTIONS.find(o => o.value === config.redemptionLimitDefault)?.label || '1 time'}
                      </span>
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

                  {/* Footer */}
                  <div className={`mt-2 pt-1.5 border-t border-white/10 text-[10px] font-medium tracking-wide uppercase ${theme.accentText}`}>
                    Powered by POS AI
                  </div>
                </div>

                {/* Selection checkmark */}
                {selected && (
                  <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center ${theme.accent.replace('text-', 'bg-')} animate-scale-in`}>
                    <Check className="w-3.5 h-3.5 text-neutral-900" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredTypes.length === 0 && searchQuery && (
          <p className="text-neutral-500 text-sm text-center py-4">No templates match "{searchQuery}"</p>
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
          setActiveKeypad(null);
          setTouched({ voucherName: false, value: false });
        }}
        className="text-neutral-400 hover:text-white text-xs transition-colors flex items-center gap-1"
      >
        ← Back to templates
      </button>

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

      {/* Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
        <div>
          <label className={labelClass}>Redeemable Value <span className="text-red-400">*</span></label>
          <button type="button" onClick={() => setActiveKeypad(p => p === 'value' ? null : 'value')} onBlur={() => setTouched(p => ({ ...p, value: true }))}
            className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${touched.value && numericValue <= 0 ? 'border-red-500' : activeKeypad === 'value' ? 'border-neutral-400' : 'border-neutral-600'}`}>
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(valueDigits)}</span>
          </button>
          {touched.value && numericValue <= 0 && <p className="text-red-400 text-xs mt-1">Amount required</p>}
          {activeKeypad === 'value' && renderKeypad(valueDigits, onValueDigitsChange)}
        </div>
        <div>
          <label className={labelClass}>Service Fee</label>
          <button type="button" onClick={() => setActiveKeypad(p => p === 'serviceFee' ? null : 'serviceFee')}
            className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${activeKeypad === 'serviceFee' ? 'border-neutral-400' : 'border-neutral-600'}`}>
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(serviceFeeDigits)}</span>
          </button>
          {activeKeypad === 'serviceFee' && renderKeypad(serviceFeeDigits, onServiceFeeDigitsChange)}
        </div>
        <div>
          <label className={labelClass}>Minimum Order</label>
          <button type="button" onClick={() => setActiveKeypad(p => p === 'minimumOrder' ? null : 'minimumOrder')}
            className={`w-full bg-neutral-800 border rounded-lg px-3 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${activeKeypad === 'minimumOrder' ? 'border-neutral-400' : 'border-neutral-600'}`}>
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(minimumOrderDigits)}</span>
          </button>
          {minOrderWarning && <p className="text-amber-400 text-xs mt-1">⚠ Exceeds value</p>}
          {activeKeypad === 'minimumOrder' && renderKeypad(minimumOrderDigits, onMinimumOrderDigitsChange)}
        </div>
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
