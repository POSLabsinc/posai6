import { useState, useCallback } from "react";
import { Delete, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CURRENCY_SYMBOL, PREDEFINED_VOUCHER_TYPES, REDEMPTION_LIMIT_OPTIONS,
  inputClass, labelClass, keypadBtnClass,
  type VoucherEntry, type CompanyProfile,
} from "./voucherConstants";
import {
  posCurrencyDigitAppend, posCurrencyDigitDelete, posCurrencyFormat, posCurrencyToNumber,
  generateVoucherCode,
} from "./voucherHelpers";

interface MultiVoucherStepProps {
  entries: VoucherEntry[];
  onEntriesChange: (entries: VoucherEntry[]) => void;
  validFrom: string;
  expiryDate: string;
  redemptionLimit: string;
  minimumOrderDigits: string;
  notes: string;
  onValidFromChange: (date: string) => void;
  onExpiryDateChange: (date: string) => void;
  onRedemptionLimitChange: (limit: string) => void;
  onMinimumOrderDigitsChange: (digits: string) => void;
  onNotesChange: (notes: string) => void;
  companyProfile?: CompanyProfile | null;
}

const QUANTITY_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const MultiVoucherStep = ({
  entries, onEntriesChange,
  validFrom, expiryDate, redemptionLimit, minimumOrderDigits, notes,
  onValidFromChange, onExpiryDateChange, onRedemptionLimitChange,
  onMinimumOrderDigitsChange, onNotesChange,
  companyProfile,
}: MultiVoucherStepProps) => {
  const [activeKeypad, setActiveKeypad] = useState<{ entryId: string; field: 'value' } | 'minimumOrder' | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [quantityConfirmed, setQuantityConfirmed] = useState(entries.length > 1);
  const PAGE_SIZE = 5;

  const generateEntries = (count: number) => {
    const newEntries: VoucherEntry[] = Array.from({ length: count }, () => ({
      id: generateVoucherCode(),
      voucherName: '',
      isCustom: false,
      valueDigits: '',
      serviceFeeDigits: '',
      serviceFeeReadOnly: true,
      serviceFeeType: 'none' as const,
      serviceFeeConfigValue: 0,
    }));
    onEntriesChange(newEntries);
    setQuantityConfirmed(true);
    setCurrentPage(0);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    onEntriesChange(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<VoucherEntry>) => {
    onEntriesChange(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const selectVoucherType = (entryId: string, typeName: string) => {
    const config = PREDEFINED_VOUCHER_TYPES.find(t => t.name === typeName);
    if (config) {
      updateEntry(entryId, {
        voucherName: typeName,
        isCustom: false,
        serviceFeeReadOnly: true,
        serviceFeeType: config.serviceFeeType,
        serviceFeeConfigValue: config.serviceFeeValue,
      });
    }
  };

  const handlePosKeyPress = useCallback((currentDigits: string, key: string): string => {
    return posCurrencyDigitAppend(currentDigits, key);
  }, []);

  const totalRedeemable = entries.reduce((sum, e) => sum + posCurrencyToNumber(e.valueDigits), 0);
  const totalServiceFee = entries.reduce((sum, e) => {
    const val = posCurrencyToNumber(e.valueDigits);
    if (e.serviceFeeType === 'none') return sum;
    if (e.serviceFeeType === 'percentage') return sum + val * (e.serviceFeeConfigValue / 100);
    if (e.serviceFeeReadOnly) return sum + e.serviceFeeConfigValue;
    return sum + posCurrencyToNumber(e.serviceFeeDigits);
  }, 0);
  const totalPayable = totalRedeemable + totalServiceFee;
  const minimumOrderValue = posCurrencyToNumber(minimumOrderDigits);
  const minOrderWarning = minimumOrderValue > 0 && totalRedeemable > 0 && minimumOrderValue > totalRedeemable;

  const pagedEntries = entries.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);

  const voucherTypes = (() => {
    if (companyProfile?.preferredVoucherTypes?.length) {
      const preferred = PREDEFINED_VOUCHER_TYPES.filter(t => companyProfile.preferredVoucherTypes!.includes(t.name));
      const others = PREDEFINED_VOUCHER_TYPES.filter(t => !companyProfile.preferredVoucherTypes!.includes(t.name));
      return [...preferred, ...others];
    }
    return PREDEFINED_VOUCHER_TYPES;
  })();

  // Quantity selection screen
  if (!quantityConfirmed) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-white font-semibold text-sm">How many vouchers?</h3>
          <p className="text-neutral-400 text-xs mt-0.5">Select the number of vouchers to create</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {QUANTITY_OPTIONS.map(q => (
            <button
              key={q}
              onClick={() => generateEntries(q)}
              className="flex flex-col items-center gap-1 p-4 rounded-xl border border-neutral-700 text-neutral-400 hover:border-white hover:text-white hover:bg-white/10 transition-all"
            >
              <span className="text-lg font-bold">{q}</span>
              <span className="text-xs">vouchers</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voucher entries */}
      <div className="space-y-2">
        {pagedEntries.map((entry, idx) => (
          <div key={entry.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-medium">Voucher #{currentPage * PAGE_SIZE + idx + 1}</span>
              {entries.length > 1 && (
                <button onClick={() => removeEntry(entry.id)} className="text-neutral-500 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={entry.voucherName || '_placeholder'} onValueChange={(val) => {
                if (val === '__custom') {
                  updateEntry(entry.id, { voucherName: '', isCustom: true, serviceFeeReadOnly: false, serviceFeeType: 'fixed', serviceFeeConfigValue: 0 });
                } else {
                  selectVoucherType(entry.id, val);
                }
              }}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white text-xs h-10 rounded-lg">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600 z-[9999]">
                  {voucherTypes.map(t => (
                    <SelectItem key={t.name} value={t.name} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white text-xs">{t.name}</SelectItem>
                  ))}
                  <SelectItem value="__custom" className="text-emerald-400 hover:bg-neutral-700 focus:bg-neutral-700 focus:text-emerald-400 text-xs">+ Custom</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setActiveKeypad(activeKeypad && typeof activeKeypad === 'object' && activeKeypad.entryId === entry.id ? null : { entryId: entry.id, field: 'value' })}
                className={`bg-neutral-800 border rounded-lg px-3 py-2 text-xs text-left cursor-pointer hover:border-neutral-500 transition-colors ${typeof activeKeypad === 'object' && activeKeypad?.entryId === entry.id ? 'border-neutral-400' : 'border-neutral-600'}`}
              >
                <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
                <span className="text-white">{posCurrencyFormat(entry.valueDigits)}</span>
              </button>
            </div>
            {entry.isCustom && (
              <input
                type="text"
                value={entry.voucherName}
                onChange={(e) => updateEntry(entry.id, { voucherName: e.target.value.slice(0, 50) })}
                placeholder="Custom voucher name"
                className={`${inputClass} text-xs py-2`}
              />
            )}
            {typeof activeKeypad === 'object' && activeKeypad?.entryId === entry.id && (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => updateEntry(entry.id, { valueDigits: handlePosKeyPress(entry.valueDigits, n.toString()) })} className={`h-9 text-sm font-medium ${keypadBtnClass}`}>{n}</button>
                ))}
                <button onClick={() => updateEntry(entry.id, { valueDigits: handlePosKeyPress(entry.valueDigits, '00') })} className={`h-9 text-sm font-medium ${keypadBtnClass}`}>00</button>
                <button onClick={() => updateEntry(entry.id, { valueDigits: handlePosKeyPress(entry.valueDigits, '0') })} className={`h-9 text-sm font-medium ${keypadBtnClass}`}>0</button>
                <button onClick={() => updateEntry(entry.id, { valueDigits: posCurrencyDigitDelete(entry.valueDigits) })} className={`h-9 ${keypadBtnClass}`}><Delete className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setCurrentPage(i)} className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${currentPage === i ? 'bg-white text-black' : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Shared fields */}
      <div className="border-t border-neutral-700 pt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <label className={labelClass}>Valid From (all)</label>
          <input type="date" value={validFrom} onChange={(e) => { onValidFromChange(e.target.value); if (expiryDate && e.target.value > expiryDate) onExpiryDateChange(e.target.value); }} className={`${inputClass} [color-scheme:dark]`} />
        </div>
        <div>
          <label className={labelClass}>Expiry Date (all)</label>
          <input type="date" value={expiryDate} min={validFrom || undefined} onChange={(e) => onExpiryDateChange(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
        </div>
        <div>
          <label className={labelClass}>Redemption Limit (all)</label>
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
          <label className={labelClass}>Minimum Order (all)</label>
          <button type="button" onClick={() => setActiveKeypad(activeKeypad === 'minimumOrder' ? null : 'minimumOrder')} className={`w-full bg-neutral-800 border rounded-lg px-4 py-3 text-sm text-left cursor-pointer hover:border-neutral-500 transition-colors ${activeKeypad === 'minimumOrder' ? 'border-neutral-400' : 'border-neutral-600'}`}>
            <span className="text-neutral-400 mr-1">{CURRENCY_SYMBOL}</span>
            <span className="text-white">{posCurrencyFormat(minimumOrderDigits)}</span>
          </button>
          {minOrderWarning && (
            <p className="text-amber-400 text-xs mt-1">⚠ Minimum order exceeds total redeemable value</p>
          )}
          {activeKeypad === 'minimumOrder' && (
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => onMinimumOrderDigitsChange(posCurrencyDigitAppend(minimumOrderDigits, n.toString()))} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>{n}</button>
              ))}
              <button onClick={() => onMinimumOrderDigitsChange(posCurrencyDigitAppend(minimumOrderDigits, '00'))} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>00</button>
              <button onClick={() => onMinimumOrderDigitsChange(posCurrencyDigitAppend(minimumOrderDigits, '0'))} className={`h-11 text-lg font-medium ${keypadBtnClass}`}>0</button>
              <button onClick={() => onMinimumOrderDigitsChange(posCurrencyDigitDelete(minimumOrderDigits))} className={`h-11 ${keypadBtnClass}`}><Delete className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Notes (all)</label>
          <textarea value={notes} onChange={(e) => onNotesChange(e.target.value.slice(0, 500))} placeholder="Internal notes" rows={2} className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Consolidated Summary */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Total Redeemable ({entries.length} voucher{entries.length > 1 ? 's' : ''})</span>
          <span className="text-white">{CURRENCY_SYMBOL}{totalRedeemable.toFixed(2)}</span>
        </div>
        {totalServiceFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Total Service Fee</span>
            <span className="text-white">{CURRENCY_SYMBOL}{totalServiceFee.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-neutral-700 pt-2 flex justify-between text-sm font-semibold">
          <span className="text-white">Grand Total</span>
          <span className="text-white text-base">{CURRENCY_SYMBOL}{totalPayable.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default MultiVoucherStep;
