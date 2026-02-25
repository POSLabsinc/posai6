import { useState, useEffect } from "react";
import { Ticket, Gift, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CustomerStep from "./voucher/CustomerStep";
import PurchaseTypeStep from "./voucher/PurchaseTypeStep";
import SingleVoucherStep from "./voucher/SingleVoucherStep";
import MultiVoucherStep from "./voucher/MultiVoucherStep";
import {
  CURRENCY_SYMBOL, PREDEFINED_VOUCHER_TYPES, detectCompanyForCustomer,
  type PurchaseMode, type BuyerType, type VoucherCustomer, type VoucherEntry, type CompanyProfile, type VoucherTypeConfig,
} from "./voucher/voucherConstants";
import {
  posCurrencyToNumber, posCurrencyFormat, generateVoucherCode, numberToPosDigits,
} from "./voucher/voucherHelpers";
import type { VoucherInitialData } from "./VoucherDialog";

interface SellVoucherScreenProps {
  onBack: () => void;
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
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }) => void;
  initialData?: VoucherInitialData | null;
  guestData?: { name?: string; phone?: string; email?: string } | null;
}

const SellVoucherScreen = ({ onBack, onAddVoucher, initialData, guestData }: SellVoucherScreenProps) => {
  const isEditMode = !!(initialData?.editingItemId);

  // Customer
  const [customer, setCustomer] = useState<VoucherCustomer | null>(null);
  const [customerConfirmed, setCustomerConfirmed] = useState(isEditMode);

  // Purchase type
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(null);
  const [buyerType, setBuyerType] = useState<BuyerType>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);

  // Single voucher fields
  const [voucherName, setVoucherName] = useState('');
  const [isCustomVoucherName, setIsCustomVoucherName] = useState(false);
  const [valueDigits, setValueDigits] = useState('');
  const [serviceFeeDigits, setServiceFeeDigits] = useState('');
  const [serviceFeeReadOnly, setServiceFeeReadOnly] = useState(true);
  const [serviceFeeType, setServiceFeeType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [serviceFeeConfigValue, setServiceFeeConfigValue] = useState(0);
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [redemptionLimit, setRedemptionLimit] = useState('1');
  const [minimumOrderDigits, setMinimumOrderDigits] = useState('');
  const [notes, setNotes] = useState('');

  // Multi voucher entries
  const [multiEntries, setMultiEntries] = useState<VoucherEntry[]>([
    { id: generateVoucherCode(), voucherName: '', isCustom: false, valueDigits: '', serviceFeeDigits: '', serviceFeeReadOnly: true, serviceFeeType: 'none', serviceFeeConfigValue: 0 },
  ]);

  // Gift toggle
  const [isGift, setIsGift] = useState(false);

  // Edit mode: prefill
  useEffect(() => {
    if (initialData) {
      setCustomerConfirmed(true);
      setPurchaseMode('single');
      setVoucherName(initialData.voucherName || '');
      setValueDigits(numberToPosDigits(initialData.value));
      setExpiryDate(initialData.expiryDate || '');
      setValidFrom(initialData.validFrom || new Date().toISOString().split('T')[0]);
      setRedemptionLimit(initialData.redemptionLimit?.toString() || '1');
      setMinimumOrderDigits(numberToPosDigits(initialData.minimumOrder || 0));
      setNotes(initialData.notes || '');
      const config = PREDEFINED_VOUCHER_TYPES.find(t => t.name === initialData.voucherName);
      if (config) {
        setServiceFeeReadOnly(true);
        setServiceFeeType(config.serviceFeeType);
        setServiceFeeConfigValue(config.serviceFeeValue);
      } else {
        setServiceFeeReadOnly(false);
        setServiceFeeType('fixed');
        setIsCustomVoucherName(true);
      }
      const redeemable = initialData.value;
      const selling = initialData.sellingPrice;
      const fee = selling - redeemable;
      if (fee > 0) setServiceFeeDigits(numberToPosDigits(fee));
    }
  }, [initialData]);

  const handleVoucherNameChange = (name: string, isCustom: boolean, config?: VoucherTypeConfig) => {
    setVoucherName(name);
    setIsCustomVoucherName(isCustom);
    if (config) {
      setServiceFeeReadOnly(true);
      setServiceFeeType(config.serviceFeeType);
      setServiceFeeConfigValue(config.serviceFeeValue);
      setServiceFeeDigits('');
      if (config.redeemableValue != null && config.redeemableValue > 0) {
        setValueDigits(numberToPosDigits(config.redeemableValue));
      }
      setValidFrom(config.validFromDefault || new Date().toISOString().split('T')[0]);
      if (config.expiryDefault) setExpiryDate(config.expiryDefault);
      if (config.redemptionLimitDefault) setRedemptionLimit(config.redemptionLimitDefault);
      if (config.minOrderDefault != null && config.minOrderDefault > 0) {
        setMinimumOrderDigits(numberToPosDigits(config.minOrderDefault));
      } else {
        setMinimumOrderDigits('');
      }
    } else if (isCustom) {
      setServiceFeeReadOnly(false);
      setServiceFeeType('fixed');
      setServiceFeeConfigValue(0);
      setServiceFeeDigits('');
      setValueDigits('');
      setValidFrom(new Date().toISOString().split('T')[0]);
      setExpiryDate('');
      setRedemptionLimit('1');
      setMinimumOrderDigits('');
    }
  };

  // Compute totals for single
  const numericValue = posCurrencyToNumber(valueDigits);
  const computedSingleServiceFee = (() => {
    if (serviceFeeType === 'none') return 0;
    if (!serviceFeeReadOnly) return posCurrencyToNumber(serviceFeeDigits);
    if (serviceFeeType === 'percentage') return numericValue * (serviceFeeConfigValue / 100);
    return serviceFeeConfigValue;
  })();
  const singleTotalPayable = numericValue + computedSingleServiceFee;

  // Compute totals for multi
  const multiTotalRedeemable = multiEntries.reduce((s, e) => s + posCurrencyToNumber(e.valueDigits), 0);
  const multiTotalServiceFee = multiEntries.reduce((s, e) => {
    const v = posCurrencyToNumber(e.valueDigits);
    if (e.serviceFeeType === 'none') return s;
    if (e.serviceFeeType === 'percentage') return s + v * (e.serviceFeeConfigValue / 100);
    if (e.serviceFeeReadOnly) return s + e.serviceFeeConfigValue;
    return s + posCurrencyToNumber(e.serviceFeeDigits);
  }, 0);
  const multiTotalPayable = multiTotalRedeemable + multiTotalServiceFee;

  // Validation
  const isSingleValid = purchaseMode === 'single' && voucherName.trim().length > 0 && numericValue > 0;
  const isMultiValid = purchaseMode === 'multiple' && multiEntries.every(e => e.voucherName.trim().length > 0 && posCurrencyToNumber(e.valueDigits) > 0);
  const isConfigValid = customerConfirmed && (isSingleValid || isMultiValid);

  const totalPayable = purchaseMode === 'single' ? singleTotalPayable : multiTotalPayable;

  // Derived: is customer selected?
  const hasCustomer = customerConfirmed && !!customer;
  const sectionsEnabled = hasCustomer || isEditMode;

  const handleAddToOrder = () => {
    if (!isConfigValid) return;

    if (purchaseMode === 'single') {
      const parsedRedemptionLimit = parseInt(redemptionLimit) || undefined;
      const parsedMinimumOrder = posCurrencyToNumber(minimumOrderDigits) || undefined;

      onAddVoucher(singleTotalPayable, {
        type: 'fixed',
        value: numericValue,
        expiryDate: expiryDate || undefined,
        sellingPrice: singleTotalPayable,
        quantity: 1,
        voucherName: voucherName.trim(),
        validFrom: validFrom || undefined,
        redemptionLimit: parsedRedemptionLimit,
        minimumOrder: parsedMinimumOrder,
        notes: notes.trim() || undefined,
        voucherCode: generateVoucherCode(),
        customerName: customer?.name,
        customerPhone: customer?.phone,
        customerEmail: customer?.email,
      });
    } else {
      for (const entry of multiEntries) {
        const entryValue = posCurrencyToNumber(entry.valueDigits);
        let entryFee = 0;
        if (entry.serviceFeeType === 'percentage') entryFee = entryValue * (entry.serviceFeeConfigValue / 100);
        else if (entry.serviceFeeType === 'fixed' && entry.serviceFeeReadOnly) entryFee = entry.serviceFeeConfigValue;
        else if (!entry.serviceFeeReadOnly) entryFee = posCurrencyToNumber(entry.serviceFeeDigits);

        const parsedRedemptionLimit = parseInt(redemptionLimit) || undefined;
        const parsedMinimumOrder = posCurrencyToNumber(minimumOrderDigits) || undefined;

        onAddVoucher(entryValue + entryFee, {
          type: 'fixed',
          value: entryValue,
          expiryDate: expiryDate || undefined,
          sellingPrice: entryValue + entryFee,
          quantity: 1,
          voucherName: entry.voucherName.trim(),
          validFrom: validFrom || undefined,
          redemptionLimit: parsedRedemptionLimit,
          minimumOrder: parsedMinimumOrder,
          notes: notes.trim() || undefined,
          voucherCode: generateVoucherCode(),
          customerName: customer?.name,
          customerPhone: customer?.phone,
          customerEmail: customer?.email,
        });
      }
    }

    toast({ title: isEditMode ? "Voucher updated" : `${purchaseMode === 'single' ? 'Voucher' : `${multiEntries.length} vouchers`} added to order` });
    onBack();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-700 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">
            {isEditMode ? 'Edit Voucher' : 'Sell Voucher'}
          </span>
        </div>
        {isConfigValid && totalPayable > 0 && (
          <div className="bg-neutral-700 px-2.5 py-1 rounded-md">
            <span className="text-white font-medium text-sm">{CURRENCY_SYMBOL}{totalPayable.toFixed(2)}</span>
          </div>
        )}
        {!(isConfigValid && totalPayable > 0) && <div className="w-16" />}
      </div>

      {/* Scrollable content - ALL sections always visible */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 md:px-4 py-3 space-y-4">

        {/* Section A: Customer Identification — always visible */}
        {!isEditMode && (
          <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Guest Details <span className="text-muted-foreground font-normal normal-case tracking-normal">(Provide email or phone number)</span></h3>
              {customerConfirmed && customer && (
                <button
                  onClick={() => { setCustomerConfirmed(false); setCustomer(null); }}
                  className="text-neutral-400 hover:text-white text-[11px] transition-colors"
                >
                  Change
                </button>
              )}
            </div>
            {!customerConfirmed ? (
              <CustomerStep
                customer={customer}
                initialGuestData={guestData}
                onCustomerIdentified={(c) => {
                  setCustomer(c);
                  const detectedCompany = detectCompanyForCustomer(c.email);
                  if (detectedCompany) {
                    setBuyerType('company');
                    setSelectedCompany(detectedCompany);
                  }
                }}
                onContinue={() => setCustomerConfirmed(true)}
              />
            ) : (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{customer?.name}</p>
                  <p className="text-emerald-400/70 text-xs truncate">
                    {customer?.phone}{customer?.email ? ` · ${customer.email}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section B: Purchase Type — always visible, disabled if no customer */}
        {!isEditMode && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-3 md:p-4 transition-opacity ${
                    !sectionsEnabled ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Purchase Type</h3>
                  <PurchaseTypeStep
                    purchaseMode={purchaseMode}
                    buyerType={buyerType}
                    selectedCompany={selectedCompany}
                    onPurchaseModeChange={setPurchaseMode}
                    onBuyerTypeChange={setBuyerType}
                    onCompanySelect={setSelectedCompany}
                    onContinue={() => {}}
                    onBack={() => {}}
                  />
                </div>
              </TooltipTrigger>
              {!sectionsEnabled && (
                <TooltipContent side="top">
                   <p>Select guest to continue</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Section C+D: Voucher Configuration — always visible, disabled if no customer */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-3 md:p-4 transition-opacity ${
                  !sectionsEnabled ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                  {purchaseMode === 'single' ? 'Select Voucher' : 'Select Vouchers'}
                </h3>

                {purchaseMode === null && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-neutral-500 text-sm">Select a purchase type above to configure vouchers</p>
                  </div>
                )}

                {purchaseMode === 'single' && (
                  <>
                    <SingleVoucherStep
                      voucherName={voucherName}
                      isCustomVoucherName={isCustomVoucherName}
                      valueDigits={valueDigits}
                      serviceFeeDigits={serviceFeeDigits}
                      serviceFeeReadOnly={serviceFeeReadOnly}
                      serviceFeeType={serviceFeeType}
                      serviceFeeConfigValue={serviceFeeConfigValue}
                      validFrom={validFrom}
                      expiryDate={expiryDate}
                      redemptionLimit={redemptionLimit}
                      minimumOrderDigits={minimumOrderDigits}
                      notes={notes}
                      onVoucherNameChange={handleVoucherNameChange}
                      onValueDigitsChange={setValueDigits}
                      onServiceFeeDigitsChange={setServiceFeeDigits}
                      onValidFromChange={setValidFrom}
                      onExpiryDateChange={setExpiryDate}
                      onRedemptionLimitChange={setRedemptionLimit}
                      onMinimumOrderDigitsChange={setMinimumOrderDigits}
                      onNotesChange={setNotes}
                      companyProfile={selectedCompany}
                    />

                    {/* Gift toggle */}
                    <div className="mt-3 border border-neutral-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-neutral-400" />
                          <div>
                            <span className="text-white text-sm font-medium">Gift via System Link</span>
                            <p className="text-neutral-500 text-xs">Voucher link sent to customer. Transfers tracked in-system only.</p>
                          </div>
                        </div>
                        <Switch checked={isGift} onCheckedChange={setIsGift} />
                      </div>
                      {isGift && (
                        <p className="text-amber-400/80 text-xs mt-2">
                          Recipient must activate via the system link. Forwarding outside the system will prevent activation.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {purchaseMode === 'multiple' && (
                  <MultiVoucherStep
                    entries={multiEntries}
                    onEntriesChange={setMultiEntries}
                    companyProfile={selectedCompany}
                  />
                )}
              </div>
            </TooltipTrigger>
            {!sectionsEnabled && (
              <TooltipContent side="top">
                <p>Select customer to continue</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Footer - ADD TO ORDER — always visible */}
      <div className="px-3 md:px-4 py-3 border-t border-neutral-700 flex-shrink-0 flex items-center gap-2">
        {isEditMode && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-transparent border border-neutral-500 hover:bg-neutral-800 h-10"
          >
            CANCEL
          </Button>
        )}
        <Button
          onClick={handleAddToOrder}
          disabled={!isConfigValid}
          className={`${isEditMode ? 'flex-[2]' : 'flex-1'} py-2 rounded-full font-bold text-sm h-10 disabled:opacity-40`}
          style={{
            background: isConfigValid ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' : undefined,
            color: isConfigValid ? 'black' : undefined,
          }}
        >
          {isConfigValid
            ? `${isEditMode ? 'UPDATE' : 'ADD TO ORDER'} ${CURRENCY_SYMBOL}${totalPayable.toFixed(2)}`
            : (isEditMode ? 'UPDATE' : 'ADD TO ORDER')
          }
        </Button>
      </div>
    </div>
  );
};

export default SellVoucherScreen;
