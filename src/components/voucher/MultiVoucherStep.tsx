import { useState, useCallback, useEffect } from "react";
import { Delete, Search, Plus, Check, Minus, X } from "lucide-react";
import {
  CURRENCY_SYMBOL, PREDEFINED_VOUCHER_TYPES, REDEMPTION_LIMIT_OPTIONS,
  keypadBtnClass,
  type VoucherEntry, type VoucherTypeConfig, type CompanyProfile,
} from "./voucherConstants";
import {
  posCurrencyDigitAppend, posCurrencyDigitDelete, posCurrencyFormat, posCurrencyToNumber,
  generateVoucherCode, numberToPosDigits,
} from "./voucherHelpers";
import { getCardTheme } from "./voucherCardThemes";

interface MultiVoucherStepProps {
  entries: VoucherEntry[];
  onEntriesChange: (entries: VoucherEntry[]) => void;
  companyProfile?: CompanyProfile | null;
}

// Track selections: template name → quantity, plus custom entries
type TemplateSelection = { templateName: string; quantity: number };
type CustomEntry = {
  id: string;
  voucherName: string;
  valueDigits: string;
  serviceFeeDigits: string;
};

const MultiVoucherStep = ({
  entries, onEntriesChange,
  companyProfile,
}: MultiVoucherStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [templateSelections, setTemplateSelections] = useState<TemplateSelection[]>([]);
  const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [activeKeypad, setActiveKeypad] = useState<{ id: string; field: 'value' | 'fee' } | 'minimumOrder' | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Sync internal state → parent entries whenever selections change
  useEffect(() => {
    const newEntries: VoucherEntry[] = [];

    for (const sel of templateSelections) {
      const config = PREDEFINED_VOUCHER_TYPES.find(t => t.name === sel.templateName);
      if (!config) continue;
      for (let i = 0; i < sel.quantity; i++) {
        newEntries.push({
          id: generateVoucherCode(),
          voucherName: sel.templateName,
          isCustom: false,
          valueDigits: config.redeemableValue ? numberToPosDigits(config.redeemableValue) : '',
          serviceFeeDigits: '',
          serviceFeeReadOnly: true,
          serviceFeeType: config.serviceFeeType,
          serviceFeeConfigValue: config.serviceFeeValue,
        });
      }
    }

    for (const ce of customEntries) {
      newEntries.push({
        id: ce.id,
        voucherName: ce.voucherName,
        isCustom: true,
        valueDigits: ce.valueDigits,
        serviceFeeDigits: ce.serviceFeeDigits,
        serviceFeeReadOnly: false,
        serviceFeeType: 'fixed',
        serviceFeeConfigValue: 0,
      });
    }

    onEntriesChange(newEntries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSelections, customEntries]);

  const voucherTypes = (() => {
    if (companyProfile?.preferredVoucherTypes?.length) {
      const preferred = PREDEFINED_VOUCHER_TYPES.filter(t => companyProfile.preferredVoucherTypes!.includes(t.name));
      const others = PREDEFINED_VOUCHER_TYPES.filter(t => !companyProfile.preferredVoucherTypes!.includes(t.name));
      return [...preferred, ...others];
    }
    return PREDEFINED_VOUCHER_TYPES;
  })();

  // Filtering
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
    custom: customEntries.length || 1,
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

  // Selection helpers
  const getTemplateQty = (name: string) => templateSelections.find(s => s.templateName === name)?.quantity || 0;

  const setTemplateQty = (name: string, qty: number) => {
    if (qty <= 0) {
      setTemplateSelections(prev => prev.filter(s => s.templateName !== name));
    } else {
      setTemplateSelections(prev => {
        const existing = prev.find(s => s.templateName === name);
        if (existing) return prev.map(s => s.templateName === name ? { ...s, quantity: Math.min(qty, 50) } : s);
        return [...prev, { templateName: name, quantity: Math.min(qty, 50) }];
      });
    }
  };

  const toggleTemplate = (name: string) => {
    const current = getTemplateQty(name);
    if (current > 0) {
      setTemplateQty(name, 0);
    } else {
      setTemplateQty(name, 1);
    }
  };

  const addCustomEntry = () => {
    setCustomEntries(prev => [...prev, {
      id: generateVoucherCode(),
      voucherName: '',
      valueDigits: '',
      serviceFeeDigits: '',
    }]);
    setShowCustomForm(true);
  };

  const removeCustomEntry = (id: string) => {
    setCustomEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      if (next.length === 0) setShowCustomForm(false);
      return next;
    });
  };

  const updateCustomEntry = (id: string, updates: Partial<CustomEntry>) => {
    setCustomEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
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

  // Totals
  const totalTemplateCount = templateSelections.reduce((s, t) => s + t.quantity, 0);
  const totalCustomCount = customEntries.length;
  const totalVoucherCount = totalTemplateCount + totalCustomCount;

  const totalRedeemable = entries.reduce((sum, e) => sum + posCurrencyToNumber(e.valueDigits), 0);
  const totalServiceFee = entries.reduce((sum, e) => {
    const val = posCurrencyToNumber(e.valueDigits);
    if (e.serviceFeeType === 'none') return sum;
    if (e.serviceFeeType === 'percentage') return sum + val * (e.serviceFeeConfigValue / 100);
    if (e.serviceFeeReadOnly) return sum + e.serviceFeeConfigValue;
    return sum + posCurrencyToNumber(e.serviceFeeDigits);
  }, 0);
  const totalPayable = totalRedeemable + totalServiceFee;

  const renderKeypad = (currentDigits: string, onChange: (digits: string) => void) => (
    <div className="grid grid-cols-3 gap-1 mt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button key={n} onClick={() => handlePosKeyPress(onChange, currentDigits, n.toString())} className={`h-9 text-sm font-medium ${keypadBtnClass}`}>
          {n}
        </button>
      ))}
      <button onClick={() => handlePosKeyPress(onChange, currentDigits, '00')} className={`h-9 text-sm font-medium ${keypadBtnClass}`}>00</button>
      <button onClick={() => handlePosKeyPress(onChange, currentDigits, '0')} className={`h-9 text-sm font-medium ${keypadBtnClass}`}>0</button>
      <button onClick={() => handlePosDeleteKey(onChange, currentDigits)} className={`h-9 ${keypadBtnClass}`}>
        <Delete className="w-4 h-4" />
      </button>
    </div>
  );

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
        {showCustomCard && (
          <button
            onClick={() => {
              if (!showCustomForm && customEntries.length === 0) addCustomEntry();
              else setShowCustomForm(prev => !prev);
            }}
            className={`text-left border-2 border-dashed rounded-2xl p-4 transition-all duration-300 group relative overflow-hidden ${
              customEntries.length > 0
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-neutral-600 hover:border-emerald-500/50 hover:bg-emerald-500/5'
            }`}
          >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(52,211,153,0.3) 10px, rgba(52,211,153,0.3) 11px)' }} />
            <div className="relative flex flex-col items-center justify-center py-3 gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-center">
                <span className="text-emerald-400 font-semibold text-sm block">Custom Voucher</span>
                <span className="text-neutral-500 text-[11px]">
                  {customEntries.length > 0 ? `${customEntries.length} custom added` : 'Create your own voucher'}
                </span>
              </div>
              {customEntries.length > 0 && (
                <span className="absolute top-0 right-0 bg-emerald-500 text-neutral-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {customEntries.length}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Template cards */}
        {showTemplateCards && filteredTypes.map((config, idx) => {
          const qty = getTemplateQty(config.name);
          const selected = qty > 0;
          const theme = getCardTheme(idx);
          return (
            <div
              key={config.name}
              className={`text-left rounded-2xl transition-all duration-300 relative overflow-hidden ${theme.bg} border ${
                selected
                  ? `${theme.glow} scale-[1.02]`
                  : `${theme.border} hover:scale-[1.01] hover:shadow-lg`
              }`}
            >
              {/* Clickable area */}
              <button
                onClick={() => toggleTemplate(config.name)}
                className="w-full text-left"
              >
                {theme.pattern}
                <div className="relative p-3.5 pb-2">
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
                  <div className="my-1">
                    <div className={`text-2xl font-extrabold tracking-tight ${theme.valueBg}`}>
                      {CURRENCY_SYMBOL}{(config.redeemableValue || 0).toFixed(2)}
                    </div>
                    <div className={`text-[11px] font-semibold uppercase tracking-widest mt-0.5 ${theme.accentText}`}>Gift Voucher</div>
                  </div>
                  <div className="flex items-center gap-2 my-1.5">
                    <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                    <div className={`w-1.5 h-1.5 rounded-full opacity-40 ${theme.accent.replace('text-', 'bg-')}`} />
                    <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
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
                </div>
              </button>

              {/* Quantity controls — inline when selected */}
              {selected && (
                <div className="relative px-3.5 pb-3 pt-1 flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px] font-medium">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setTemplateQty(config.name, qty - 1); }}
                      className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-white font-bold text-sm w-6 text-center">{qty}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setTemplateQty(config.name, qty + 1); }}
                      className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Custom voucher entries form (expanded) */}
      {showCustomForm && customEntries.length > 0 && (
        <div className="space-y-2 border border-neutral-700 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-xs font-semibold">Custom Vouchers</span>
            <button
              onClick={addCustomEntry}
              className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Another
            </button>
          </div>

          {customEntries.map((ce) => (
            <div key={ce.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={ce.voucherName}
                  onChange={(e) => updateCustomEntry(ce.id, { voucherName: e.target.value.slice(0, 50) })}
                  placeholder="Voucher name"
                  className="flex-1 bg-transparent border-none text-white text-sm placeholder:text-neutral-500 focus:outline-none"
                />
                <button onClick={() => removeCustomEntry(ce.id)} className="text-neutral-500 hover:text-red-400 p-1 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-500 text-[10px] mb-0.5 block">Value <span className="text-red-400">*</span></label>
                  <button
                    type="button"
                    onClick={() => setActiveKeypad(
                      typeof activeKeypad === 'object' && activeKeypad?.id === ce.id && activeKeypad?.field === 'value' ? null : { id: ce.id, field: 'value' }
                    )}
                    className={`w-full bg-neutral-800 border rounded-lg px-3 py-2 text-xs text-left cursor-pointer hover:border-neutral-500 transition-colors ${
                      typeof activeKeypad === 'object' && activeKeypad?.id === ce.id && activeKeypad?.field === 'value' ? 'border-neutral-400' : 'border-neutral-600'
                    }`}
                  >
                    <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
                    <span className="text-white">{posCurrencyFormat(ce.valueDigits)}</span>
                  </button>
                </div>
                <div>
                  <label className="text-neutral-500 text-[10px] mb-0.5 block">Service Fee</label>
                  <button
                    type="button"
                    onClick={() => setActiveKeypad(
                      typeof activeKeypad === 'object' && activeKeypad?.id === ce.id && activeKeypad?.field === 'fee' ? null : { id: ce.id, field: 'fee' }
                    )}
                    className={`w-full bg-neutral-800 border rounded-lg px-3 py-2 text-xs text-left cursor-pointer hover:border-neutral-500 transition-colors ${
                      typeof activeKeypad === 'object' && activeKeypad?.id === ce.id && activeKeypad?.field === 'fee' ? 'border-neutral-400' : 'border-neutral-600'
                    }`}
                  >
                    <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
                    <span className="text-white">{posCurrencyFormat(ce.serviceFeeDigits)}</span>
                  </button>
                </div>
              </div>
              {typeof activeKeypad === 'object' && activeKeypad?.id === ce.id && activeKeypad?.field === 'value' && (
                renderKeypad(ce.valueDigits, (d) => updateCustomEntry(ce.id, { valueDigits: d }))
              )}
              {typeof activeKeypad === 'object' && activeKeypad?.id === ce.id && activeKeypad?.field === 'fee' && (
                renderKeypad(ce.serviceFeeDigits, (d) => updateCustomEntry(ce.id, { serviceFeeDigits: d }))
              )}
            </div>
          ))}
        </div>
      )}


      {/* Summary */}
      {totalVoucherCount > 0 && (
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2 animate-fade-in">
          {/* Selected breakdown */}
          <div className="space-y-1 pb-2 border-b border-neutral-700">
            {templateSelections.map(sel => {
              const cfg = PREDEFINED_VOUCHER_TYPES.find(t => t.name === sel.templateName);
              const val = cfg?.redeemableValue || 0;
              let fee = 0;
              if (cfg?.serviceFeeType === 'percentage') fee = val * (cfg.serviceFeeValue / 100);
              else if (cfg?.serviceFeeType === 'fixed') fee = cfg.serviceFeeValue;
              const lineTotal = (val + fee) * sel.quantity;
              return (
                <div key={sel.templateName} className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">{sel.templateName} ×{sel.quantity}</span>
                  <span className="text-white font-medium">{CURRENCY_SYMBOL}{lineTotal.toFixed(2)}</span>
                </div>
              );
            })}
            {customEntries.map(ce => {
              const val = posCurrencyToNumber(ce.valueDigits);
              const fee = posCurrencyToNumber(ce.serviceFeeDigits);
              return (
                <div key={ce.id} className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">{ce.voucherName || 'Custom'} ×1</span>
                  <span className="text-white font-medium">{CURRENCY_SYMBOL}{(val + fee).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400 font-medium">Total Redeemable ({totalVoucherCount} voucher{totalVoucherCount > 1 ? 's' : ''})</span>
            <span className="text-white font-bold">{CURRENCY_SYMBOL}{totalRedeemable.toFixed(2)}</span>
          </div>
          {totalServiceFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400 font-medium">Total Service Fee</span>
              <span className="text-white font-bold">{CURRENCY_SYMBOL}{totalServiceFee.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-neutral-700 pt-2 flex justify-between text-sm font-semibold">
            <span className="text-white">Grand Total</span>
            <span className="text-white text-base">{CURRENCY_SYMBOL}{totalPayable.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiVoucherStep;
