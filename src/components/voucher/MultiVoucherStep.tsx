import { useState, useEffect } from "react";
import { Search, Plus, Check, Minus, X, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CURRENCY_SYMBOL, PREDEFINED_VOUCHER_TYPES, REDEMPTION_LIMIT_OPTIONS,
  inputClass, labelClass,
  type VoucherEntry, type VoucherTypeConfig, type CompanyProfile,
} from "./voucherConstants";
import {
  posCurrencyToNumber,
  generateVoucherCode, numberToPosDigits,
} from "./voucherHelpers";
import { getCardTheme } from "./voucherCardThemes";
import { Switch } from "@/components/ui/switch";
import VoucherCurrencyInput from "./VoucherCurrencyInput";

interface MultiVoucherStepProps {
  entries: VoucherEntry[];
  onEntriesChange: (entries: VoucherEntry[]) => void;
  companyProfile?: CompanyProfile | null;
}

type TemplateSelection = { templateName: string; quantity: number };
type SharedRules = {
  voucherType: 'fixed' | 'percentage';
  valueDigits: string;
  serviceFeeDigits: string;
  validFrom: string;
  expiryDate: string;
  redemptionLimit: string;
  minimumOrderDigits: string;
  notes: string;
};
type CustomEntry = {
  id: string;
  voucherName: string;
  voucherType: 'fixed' | 'percentage';
  valueDigits: string;
  serviceFeeDigits: string;
  notes: string;
  quantity: number;
  validFrom: string;
  expiryDate: string;
  redemptionLimit: string;
  minimumOrderDigits: string;
};

const DEFAULT_SHARED_RULES: SharedRules = {
  voucherType: 'fixed',
  valueDigits: '',
  serviceFeeDigits: '',
  validFrom: new Date().toISOString().split('T')[0],
  expiryDate: '',
  redemptionLimit: '1',
  minimumOrderDigits: '',
  notes: '',
};

const createEmptyCustomEntry = (): CustomEntry => ({
  id: generateVoucherCode(),
  voucherName: '',
  voucherType: 'fixed',
  valueDigits: '',
  serviceFeeDigits: '',
  notes: '',
  quantity: 1,
  validFrom: new Date().toISOString().split('T')[0],
  expiryDate: '',
  redemptionLimit: '1',
  minimumOrderDigits: '',
});

const MultiVoucherStep = ({
  entries, onEntriesChange,
  companyProfile,
}: MultiVoucherStepProps) => {
  // Gallery state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [templateSelections, setTemplateSelections] = useState<TemplateSelection[]>([]);

  // Custom builder state
  const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderIndex, setBuilderIndex] = useState(0);
  const [sharedRulesOn, setSharedRulesOn] = useState(true);
  const [sharedRules, setSharedRules] = useState<SharedRules>({ ...DEFAULT_SHARED_RULES });
  const [commonVoucherType, setCommonVoucherType] = useState<'fixed' | 'percentage'>('fixed');

  const today = new Date().toISOString().split('T')[0];

  // Current custom entry in builder
  const currentEntry = customEntries[builderIndex] || null;

  const updateCurrentEntry = (updates: Partial<CustomEntry>) => {
    setCustomEntries(prev => prev.map((e, i) => i === builderIndex ? { ...e, ...updates } : e));
  };

  // Toggle switching logic
  const handleToggleChange = (checked: boolean) => {
    if (checked && customEntries.length > 0) {
      const first = customEntries[0];
      setSharedRules({
        voucherType: first.voucherType,
        valueDigits: first.valueDigits,
        serviceFeeDigits: first.serviceFeeDigits,
        validFrom: first.validFrom,
        expiryDate: first.expiryDate,
        redemptionLimit: first.redemptionLimit,
        minimumOrderDigits: first.minimumOrderDigits,
        notes: first.notes,
      });
    } else if (!checked) {
      // Distribute shared values to all entries
      setCustomEntries(prev => prev.map(ce => ({
        ...ce,
        valueDigits: ce.valueDigits || sharedRules.valueDigits,
        serviceFeeDigits: ce.serviceFeeDigits || sharedRules.serviceFeeDigits,
        validFrom: ce.validFrom || sharedRules.validFrom,
        expiryDate: ce.expiryDate || sharedRules.expiryDate,
        redemptionLimit: ce.redemptionLimit || sharedRules.redemptionLimit,
        minimumOrderDigits: ce.minimumOrderDigits || sharedRules.minimumOrderDigits,
        notes: ce.notes || sharedRules.notes,
      })));
    }
    setSharedRulesOn(checked);
  };

  // Sync internal state → parent entries
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
      const effectiveValue = sharedRulesOn ? sharedRules.valueDigits : ce.valueDigits;
      const effectiveFee = sharedRulesOn ? sharedRules.serviceFeeDigits : ce.serviceFeeDigits;
      for (let i = 0; i < ce.quantity; i++) {
        newEntries.push({
          id: ce.id + (i > 0 ? `-${i}` : ''),
          voucherName: ce.voucherName,
          isCustom: true,
          valueDigits: effectiveValue,
          serviceFeeDigits: effectiveFee,
          serviceFeeReadOnly: false,
          serviceFeeType: 'fixed',
          serviceFeeConfigValue: 0,
        });
      }
    }
    onEntriesChange(newEntries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSelections, customEntries, sharedRulesOn, sharedRules]);

  // --- Filter logic ---
  const voucherTypes = (() => {
    if (companyProfile?.preferredVoucherTypes?.length) {
      const preferred = PREDEFINED_VOUCHER_TYPES.filter(t => companyProfile.preferredVoucherTypes!.includes(t.name));
      const others = PREDEFINED_VOUCHER_TYPES.filter(t => !companyProfile.preferredVoucherTypes!.includes(t.name));
      return [...preferred, ...others];
    }
    return PREDEFINED_VOUCHER_TYPES;
  })();

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

  // --- Template selection helpers ---
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
    if (current > 0) setTemplateQty(name, 0);
    else setTemplateQty(name, 1);
  };

  const formatServiceFeeBadge = (config: VoucherTypeConfig) => {
    if (config.serviceFeeType === 'none') return 'No Fee';
    if (config.serviceFeeType === 'percentage') return `${config.serviceFeeValue}% Fee`;
    return `${CURRENCY_SYMBOL}${config.serviceFeeValue.toFixed(2)} Fixed`;
  };

  // --- Builder navigation ---
  const openBuilder = (index?: number) => {
    if (customEntries.length === 0) {
      setCustomEntries([createEmptyCustomEntry()]);
      setBuilderIndex(0);
    } else {
      setBuilderIndex(index ?? 0);
    }
    setShowBuilder(true);
  };

  const openBuilderForEdit = (entryId: string) => {
    const idx = customEntries.findIndex(e => e.id === entryId);
    if (idx >= 0) {
      setBuilderIndex(idx);
      setShowBuilder(true);
    }
  };

  const handleAddAnother = () => {
    const newEntry = createEmptyCustomEntry();
    if (!sharedRulesOn) {
      newEntry.validFrom = sharedRules.validFrom;
      newEntry.expiryDate = sharedRules.expiryDate;
      newEntry.redemptionLimit = sharedRules.redemptionLimit;
      newEntry.minimumOrderDigits = sharedRules.minimumOrderDigits;
    }
    setCustomEntries(prev => [...prev, newEntry]);
    setBuilderIndex(customEntries.length);
  };

  const removeBuilderEntry = (idx: number) => {
    setCustomEntries(prev => prev.filter((_, i) => i !== idx));
    if (customEntries.length <= 1) {
      setShowBuilder(false);
    } else if (builderIndex >= customEntries.length - 1) {
      setBuilderIndex(Math.max(0, customEntries.length - 2));
    }
  };

  // --- Totals ---
  const totalTemplateCount = templateSelections.reduce((s, t) => s + t.quantity, 0);
  const totalCustomCount = customEntries.reduce((s, c) => s + c.quantity, 0);
  const totalVoucherCount = totalTemplateCount + totalCustomCount;

  const totalRedeemable = (() => {
    let sum = 0;
    for (const sel of templateSelections) {
      const cfg = PREDEFINED_VOUCHER_TYPES.find(t => t.name === sel.templateName);
      sum += (cfg?.redeemableValue || 0) * sel.quantity;
    }
    for (const ce of customEntries) {
      const effectiveValue = sharedRulesOn ? sharedRules.valueDigits : ce.valueDigits;
      sum += posCurrencyToNumber(effectiveValue) * ce.quantity;
    }
    return sum;
  })();

  const totalServiceFee = (() => {
    let sum = 0;
    for (const sel of templateSelections) {
      const cfg = PREDEFINED_VOUCHER_TYPES.find(t => t.name === sel.templateName);
      if (!cfg) continue;
      const val = cfg.redeemableValue || 0;
      if (cfg.serviceFeeType === 'percentage') sum += val * (cfg.serviceFeeValue / 100) * sel.quantity;
      else if (cfg.serviceFeeType === 'fixed') sum += cfg.serviceFeeValue * sel.quantity;
    }
    for (const ce of customEntries) {
      const effectiveFee = sharedRulesOn ? sharedRules.serviceFeeDigits : ce.serviceFeeDigits;
      sum += posCurrencyToNumber(effectiveFee) * ce.quantity;
    }
    return sum;
  })();

  const totalPayable = totalRedeemable + totalServiceFee;

  // =============================
  // CUSTOM VOUCHER BUILDER VIEW
  // =============================
  if (showBuilder) {
    const entry = currentEntry;
    if (!entry) {
      setShowBuilder(false);
      return null;
    }

    const sharedValue = posCurrencyToNumber(sharedRules.valueDigits);
    const sharedMinOrder = posCurrencyToNumber(sharedRules.minimumOrderDigits);
    const sharedMinOrderWarning = sharedMinOrder > 0 && sharedValue > 0 && sharedMinOrder > sharedValue;

    const entryValue = posCurrencyToNumber(entry.valueDigits);
    const entryMinOrder = posCurrencyToNumber(entry.minimumOrderDigits);
    const indepMinOrderWarning = entryMinOrder > 0 && entryValue > 0 && entryMinOrder > entryValue;

    return (
      <div className="space-y-3">
        {/* Back + header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setShowBuilder(false); }}
            className="text-neutral-400 hover:text-white text-xs transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to templates
          </button>
          <span className="text-neutral-500 text-[11px]">
            {customEntries.length} custom voucher{customEntries.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2">
          <label className="text-neutral-300 text-[11px] font-medium cursor-pointer">
            Apply same settings to all custom vouchers
          </label>
          <Switch
            checked={sharedRulesOn}
            onCheckedChange={handleToggleChange}
            className="scale-90"
          />
        </div>

        {/* ===== SHARED MODE (ON) ===== */}
        {sharedRulesOn && (
          <>
            {/* Voucher Names + Voucher Type row */}
            <div className="space-y-2">
              <span className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">Voucher Names</span>
              {customEntries.map((ce, idx) => (
                <div key={ce.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-neutral-800/40 border border-neutral-700/50 rounded-lg px-3 py-2 flex-1">
                    <input
                      type="text"
                      value={ce.voucherName}
                      onChange={(e) => setCustomEntries(prev => prev.map((c, i) => i === idx ? { ...c, voucherName: e.target.value.slice(0, 50) } : c))}
                      placeholder={`Voucher Name #${idx + 1}`}
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setCustomEntries(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))}
                        className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-white font-bold text-sm w-6 text-center">{ce.quantity}</span>
                      <button onClick={() => setCustomEntries(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.min(50, c.quantity + 1) } : c))}
                        className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {idx === 0 && (
                    <Select value={commonVoucherType} onValueChange={(v) => setCommonVoucherType(v as 'fixed' | 'percentage')}>
                      <SelectTrigger className="w-[140px] bg-neutral-800/40 border-neutral-700/50 text-white h-[42px] rounded-lg text-xs flex-shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {customEntries.length > 1 && (
                    <button onClick={() => removeBuilderEntry(idx)} className="text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddAnother}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-xs font-medium w-fit"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another
              </button>
            </div>

            {/* Shared Settings Block */}
            <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-3 space-y-2">
              <span className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider block">Shared Settings</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
                <VoucherCurrencyInput
                  label="Redeemable Value"
                  required
                  rawDigits={sharedRules.valueDigits}
                  onRawDigitsChange={(d) => setSharedRules(p => ({ ...p, valueDigits: d }))}
                  prefix={commonVoucherType === 'percentage' ? '%' : undefined}
                />
                <VoucherCurrencyInput
                  label="Service Fee"
                  rawDigits={sharedRules.serviceFeeDigits}
                  onRawDigitsChange={(d) => setSharedRules(p => ({ ...p, serviceFeeDigits: d }))}
                />
                <VoucherCurrencyInput
                  label="Minimum Order"
                  rawDigits={sharedRules.minimumOrderDigits}
                  onRawDigitsChange={(d) => setSharedRules(p => ({ ...p, minimumOrderDigits: d }))}
                  warning={sharedMinOrderWarning ? "⚠ Exceeds value" : undefined}
                />
                <div>
                  <label className={labelClass}>Redemption Limit</label>
                  <Select value={sharedRules.redemptionLimit} onValueChange={(v) => setSharedRules(p => ({ ...p, redemptionLimit: v }))}>
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
                  <input type="date" value={sharedRules.validFrom} onChange={(e) => setSharedRules(p => ({ ...p, validFrom: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div>
                  <label className={labelClass}>Expiry Date</label>
                  <input type="date" value={sharedRules.expiryDate} min={sharedRules.validFrom || undefined} onChange={(e) => setSharedRules(p => ({ ...p, expiryDate: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className={labelClass}>Notes</label>
                  <input type="text" value={sharedRules.notes} onChange={(e) => setSharedRules(p => ({ ...p, notes: e.target.value.slice(0, 500) }))} placeholder="Internal notes (not printed on voucher)" className={inputClass} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== INDEPENDENT MODE (OFF) ===== */}
        {!sharedRulesOn && (
          <>
            {/* Entry navigator (compact pill list) */}
            {customEntries.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                {customEntries.map((ce, idx) => (
                  <button
                    key={ce.id}
                    onClick={() => { setBuilderIndex(idx); }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 flex-shrink-0 flex items-center gap-1.5 ${
                      idx === builderIndex
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {ce.voucherName || `Custom #${idx + 1}`}
                    {ce.quantity > 1 && <span className="text-[9px] opacity-70">×{ce.quantity}</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBuilderEntry(idx); }}
                      className="ml-0.5 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Full per-entry form */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 bg-neutral-800/40 border border-neutral-700/50 rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={entry.voucherName}
                    onChange={(e) => updateCurrentEntry({ voucherName: e.target.value.slice(0, 50) })}
                    placeholder="Enter custom voucher name"
                    autoFocus
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateCurrentEntry({ quantity: Math.max(1, entry.quantity - 1) })} className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-white font-bold text-sm w-6 text-center">{entry.quantity}</span>
                    <button onClick={() => updateCurrentEntry({ quantity: Math.min(50, entry.quantity + 1) })} className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <Select value={commonVoucherType} onValueChange={(v) => setCommonVoucherType(v as 'fixed' | 'percentage')}>
                  <SelectTrigger className="w-[140px] bg-neutral-800/40 border-neutral-700/50 text-white h-[42px] rounded-lg text-xs flex-shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
                <VoucherCurrencyInput
                  label="Redeemable Value"
                  required
                  rawDigits={entry.valueDigits}
                  onRawDigitsChange={(d) => updateCurrentEntry({ valueDigits: d })}
                  prefix={commonVoucherType === 'percentage' ? '%' : undefined}
                />
                <VoucherCurrencyInput
                  label="Service Fee"
                  rawDigits={entry.serviceFeeDigits}
                  onRawDigitsChange={(d) => updateCurrentEntry({ serviceFeeDigits: d })}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
                <VoucherCurrencyInput
                  label="Minimum Order"
                  rawDigits={entry.minimumOrderDigits}
                  onRawDigitsChange={(d) => updateCurrentEntry({ minimumOrderDigits: d })}
                  warning={indepMinOrderWarning ? "⚠ Exceeds value" : undefined}
                />
                <div>
                  <label className={labelClass}>Redemption Limit</label>
                  <Select value={entry.redemptionLimit} onValueChange={(v) => updateCurrentEntry({ redemptionLimit: v })}>
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
                  <input type="date" value={entry.validFrom} onChange={(e) => updateCurrentEntry({ validFrom: e.target.value })} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div>
                  <label className={labelClass}>Expiry Date</label>
                  <input type="date" value={entry.expiryDate} min={entry.validFrom || undefined} onChange={(e) => updateCurrentEntry({ expiryDate: e.target.value })} className={`${inputClass} [color-scheme:dark]`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <input type="text" value={entry.notes} onChange={(e) => updateCurrentEntry({ notes: e.target.value.slice(0, 500) })} placeholder="Internal notes (not printed on voucher)" className={inputClass} />
              </div>
            </div>

            {/* Add another + navigation */}
            <div className="flex items-center justify-between">
              <button onClick={handleAddAnother} className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-xs font-medium w-fit">
                <Plus className="w-3.5 h-3.5" /> Add another custom voucher
              </button>
              <div className="flex items-center gap-1.5">
                <button disabled={builderIndex <= 0} onClick={() => { setBuilderIndex(p => p - 1); }}
                  className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={builderIndex >= customEntries.length - 1} onClick={() => { setBuilderIndex(p => p + 1); }}
                  className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Totals (all vouchers including templates) */}
        {totalVoucherCount > 0 && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2 animate-fade-in">
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
  }

  // =============================
  // GALLERY VIEW (default)
  // =============================
  return (
    <div className="space-y-3">
      {/* Search + Create Voucher */}
      <div className="flex gap-2 items-center">
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
          onClick={() => openBuilder()}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-dashed border-emerald-500/50 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all text-sm font-medium whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Voucher</span>
          {customEntries.length > 0 && (
            <span className="bg-emerald-500 text-neutral-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1">
              {customEntries.length}
            </span>
          )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-1">



        {/* Created custom voucher preview cards */}
        {showCustomCard && customEntries.map((ce) => {
          const ceValue = posCurrencyToNumber(sharedRulesOn ? sharedRules.valueDigits : ce.valueDigits);
          const ceFee = posCurrencyToNumber(sharedRulesOn ? sharedRules.serviceFeeDigits : ce.serviceFeeDigits);
          const ceMinOrder = posCurrencyToNumber(sharedRulesOn ? sharedRules.minimumOrderDigits : ce.minimumOrderDigits);
          const ceLimit = sharedRulesOn ? sharedRules.redemptionLimit : ce.redemptionLimit;
          const ceValidFrom = sharedRulesOn ? sharedRules.validFrom : ce.validFrom;
          const ceExpiry = sharedRulesOn ? sharedRules.expiryDate : ce.expiryDate;
          const theme = getCardTheme(3); // emerald theme for custom

          return (
            <div
              key={ce.id}
              className={`text-left rounded-2xl transition-all duration-300 relative overflow-hidden ${theme.bg} border ${theme.glow} scale-[1.02] cursor-pointer`}
              onClick={() => openBuilderForEdit(ce.id)}
            >
              {theme.pattern}
              <div className="relative p-3.5 pb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-[15px] leading-tight text-white">{ce.voucherName || 'Untitled Custom'}</h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">Custom</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {ceFee > 0 && (
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${theme.badgeBg} ${theme.badgeText}`}>
                        {CURRENCY_SYMBOL}{ceFee.toFixed(2)} Fee
                      </span>
                    )}
                    {ceFee <= 0 && (
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${theme.badgeBg} ${theme.badgeText}`}>
                        No Fee
                      </span>
                    )}
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-400 animate-scale-in">
                      <Edit2 className="w-3 h-3 text-neutral-900" strokeWidth={3} />
                    </div>
                  </div>
                </div>
                <div className="my-1">
                  <div className={`text-2xl font-extrabold tracking-tight ${theme.valueBg}`}>
                    {CURRENCY_SYMBOL}{ceValue.toFixed(2)}
                  </div>
                  <div className={`text-[11px] font-semibold uppercase tracking-widest mt-0.5 ${theme.accentText}`}>
                    Custom Voucher{ce.quantity > 1 ? ` ×${ce.quantity}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 my-1.5">
                  <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                  <div className={`w-1.5 h-1.5 rounded-full opacity-40 ${theme.accent.replace('text-', 'bg-')}`} />
                  <div className={`flex-1 h-px opacity-30 ${theme.accent.replace('text-', 'bg-')}`} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-medium">Min Order</span>
                    <span className="text-white font-bold">{ceMinOrder > 0 ? `${CURRENCY_SYMBOL}${ceMinOrder.toFixed(2)}` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-medium">Limit</span>
                    <span className="text-white font-bold">{REDEMPTION_LIMIT_OPTIONS.find(o => o.value === ceLimit)?.label || '1 time'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-medium">From</span>
                    <span className="text-white font-bold">{ceValidFrom || 'Today'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-medium">Expires</span>
                    <span className="text-white font-bold">{ceExpiry || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Quantity adjuster */}
              <div className="relative px-3.5 pb-3 pt-1 flex items-center justify-between">
                <span className="text-neutral-400 text-[11px] font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCustomEntries(prev => prev.map(e2 => e2.id === ce.id ? { ...e2, quantity: Math.max(1, e2.quantity - 1) } : e2)); }}
                    className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white font-bold text-sm w-6 text-center">{ce.quantity}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCustomEntries(prev => prev.map(e2 => e2.id === ce.id ? { ...e2, quantity: Math.min(50, e2.quantity + 1) } : e2)); }}
                    className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

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
              <button onClick={() => toggleTemplate(config.name)} className="w-full text-left">
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

      {/* Summary */}
      {totalVoucherCount > 0 && (
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2 animate-fade-in">
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
              const val = posCurrencyToNumber(sharedRulesOn ? sharedRules.valueDigits : ce.valueDigits);
              const fee = posCurrencyToNumber(sharedRulesOn ? sharedRules.serviceFeeDigits : ce.serviceFeeDigits);
              return (
                <div key={ce.id} className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">{ce.voucherName || 'Custom'} ×{ce.quantity}</span>
                  <span className="text-white font-medium">{CURRENCY_SYMBOL}{((val + fee) * ce.quantity).toFixed(2)}</span>
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
