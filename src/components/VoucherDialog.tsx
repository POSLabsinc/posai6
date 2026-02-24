import { useState, useEffect } from "react";
import { Ticket, X, Gift } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
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

type WizardStep = 'customer' | 'purchaseType' | 'voucherConfig';

const STEP_LABELS: Record<WizardStep, string> = {
  customer: 'Customer',
  purchaseType: 'Type',
  voucherConfig: 'Configure',
};

const VoucherDialog = ({ isOpen, onClose, onAddVoucher, initialData }: VoucherDialogProps) => {
  const isEditMode = !!(initialData?.editingItemId);

  // Wizard step
  const [step, setStep] = useState<WizardStep>(isEditMode ? 'voucherConfig' : 'customer');

  // Step 0: Customer
  const [customer, setCustomer] = useState<VoucherCustomer | null>(null);

  // Step 1: Purchase type
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('single');
  const [buyerType, setBuyerType] = useState<BuyerType>('personal');
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);

  // Step 2: Single voucher fields
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

  // Step 2B: Multi voucher entries
  const [multiEntries, setMultiEntries] = useState<VoucherEntry[]>([
    { id: generateVoucherCode(), voucherName: '', isCustom: false, valueDigits: '', serviceFeeDigits: '', serviceFeeReadOnly: true, serviceFeeType: 'none', serviceFeeConfigValue: 0 },
  ]);

  // Gift toggle
  const [isGift, setIsGift] = useState(false);

  // Edit mode: prefill and skip to config
  useEffect(() => {
    if (isOpen && initialData) {
      setStep('voucherConfig');
      setPurchaseMode('single');
      setVoucherName(initialData.voucherName || '');
      setValueDigits(numberToPosDigits(initialData.value));
      setExpiryDate(initialData.expiryDate || '');
      setValidFrom(initialData.validFrom || new Date().toISOString().split('T')[0]);
      setRedemptionLimit(initialData.redemptionLimit?.toString() || '1');
      setMinimumOrderDigits(numberToPosDigits(initialData.minimumOrder || 0));
      setNotes(initialData.notes || '');
      // Attempt to match config for service fee
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
      // Compute selling price -> service fee digits
      const redeemable = initialData.value;
      const selling = initialData.sellingPrice;
      const fee = selling - redeemable;
      if (fee > 0) setServiceFeeDigits(numberToPosDigits(fee));
    }
  }, [isOpen, initialData]);

  const resetState = () => {
    setStep('customer');
    setCustomer(null);
    setPurchaseMode('single');
    setBuyerType('personal');
    setSelectedCompany(null);
    setVoucherName('');
    setIsCustomVoucherName(false);
    setValueDigits('');
    setServiceFeeDigits('');
    setServiceFeeReadOnly(true);
    setServiceFeeType('none');
    setServiceFeeConfigValue(0);
    setValidFrom(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setRedemptionLimit('1');
    setMinimumOrderDigits('');
    setNotes('');
    setMultiEntries([
      { id: generateVoucherCode(), voucherName: '', isCustom: false, valueDigits: '', serviceFeeDigits: '', serviceFeeReadOnly: true, serviceFeeType: 'none', serviceFeeConfigValue: 0 },
    ]);
    setIsGift(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleVoucherNameChange = (name: string, isCustom: boolean, config?: VoucherTypeConfig) => {
    setVoucherName(name);
    setIsCustomVoucherName(isCustom);
    if (config) {
      setServiceFeeReadOnly(true);
      setServiceFeeType(config.serviceFeeType);
      setServiceFeeConfigValue(config.serviceFeeValue);
      setServiceFeeDigits('');
    } else if (isCustom) {
      setServiceFeeReadOnly(false);
      setServiceFeeType('fixed');
      setServiceFeeConfigValue(0);
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
  const isConfigValid = step === 'voucherConfig' && (isSingleValid || isMultiValid);

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
      });
    } else {
      // Multiple: add each as separate line item
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
        });
      }
    }

    toast({ title: isEditMode ? "Voucher updated" : `${purchaseMode === 'single' ? 'Voucher' : `${multiEntries.length} vouchers`} added to order` });
    resetState();
  };

  const stepOrder: WizardStep[] = ['customer', 'purchaseType', 'voucherConfig'];
  const currentStepIdx = stepOrder.indexOf(step);

  const goBack = () => {
    if (currentStepIdx > 0 && !isEditMode) {
      setStep(stepOrder[currentStepIdx - 1]);
    }
  };

  const totalPayable = purchaseMode === 'single' ? singleTotalPayable : multiTotalPayable;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 p-0 w-[95vw] max-w-md md:max-w-3xl rounded-2xl flex flex-col max-h-[90vh] [&>button]:hidden">
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-12 h-1 bg-neutral-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 md:px-6 pb-2 pt-2 md:pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white bg-neutral-800 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-white font-bold text-base leading-tight">
                {isEditMode ? 'Edit Voucher' : 'Sell Voucher'}
              </span>
              {customer && step !== 'customer' && (
                <p className="text-neutral-400 text-xs mt-0.5 truncate">
                  For: {customer.name}{buyerType === 'company' && selectedCompany ? ` · ${selectedCompany.name}` : ''}
                </p>
              )}
            </div>
            {step === 'voucherConfig' && totalPayable > 0 && (
              <div className="bg-neutral-700 px-2.5 py-1 rounded-md flex-shrink-0">
                <span className="text-white font-medium text-sm">{CURRENCY_SYMBOL}{totalPayable.toFixed(2)}</span>
              </div>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          {!isEditMode && (
            <div className="flex items-center gap-1 mt-3">
              {stepOrder.map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStepIdx ? 'bg-white' : 'bg-neutral-700'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className={`flex-1 px-4 md:px-6 pb-2 scrollbar-hide ${step === 'customer' || step === 'purchaseType' ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {step === 'customer' && (
            <CustomerStep
              customer={customer}
              onCustomerIdentified={(c) => {
                setCustomer(c);
                // Auto-detect company association
                const detectedCompany = detectCompanyForCustomer(c.email);
                if (detectedCompany) {
                  setBuyerType('company');
                  setSelectedCompany(detectedCompany);
                }
              }}
              onContinue={() => setStep('purchaseType')}
            />
          )}

          {step === 'purchaseType' && (
            <PurchaseTypeStep
              purchaseMode={purchaseMode}
              buyerType={buyerType}
              selectedCompany={selectedCompany}
              onPurchaseModeChange={setPurchaseMode}
              onBuyerTypeChange={setBuyerType}
              onCompanySelect={setSelectedCompany}
              onContinue={() => setStep('voucherConfig')}
              onBack={() => setStep('customer')}
            />
          )}

          {step === 'voucherConfig' && purchaseMode === 'single' && (
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

          {step === 'voucherConfig' && purchaseMode === 'multiple' && (
            <MultiVoucherStep
              entries={multiEntries}
              onEntriesChange={setMultiEntries}
              validFrom={validFrom}
              expiryDate={expiryDate}
              redemptionLimit={redemptionLimit}
              minimumOrderDigits={minimumOrderDigits}
              notes={notes}
              onValidFromChange={setValidFrom}
              onExpiryDateChange={setExpiryDate}
              onRedemptionLimitChange={setRedemptionLimit}
              onMinimumOrderDigitsChange={setMinimumOrderDigits}
              onNotesChange={setNotes}
              companyProfile={selectedCompany}
            />
          )}
        </div>

        {/* Footer */}
        {step === 'voucherConfig' && (
          <div className="px-4 md:px-6 py-3 border-t border-neutral-700 mt-auto flex items-center gap-2">
            {!isEditMode && (
              <Button
                variant="outline"
                onClick={goBack}
                className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-transparent border border-neutral-500 hover:bg-neutral-800 h-10"
              >
                BACK
              </Button>
            )}
            {isEditMode && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-transparent border border-neutral-500 hover:bg-neutral-800 h-10"
              >
                CANCEL
              </Button>
            )}
            <Button
              onClick={handleAddToOrder}
              disabled={!isConfigValid}
              className="flex-[2] py-2 rounded-full font-bold text-sm h-10 disabled:opacity-40"
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoucherDialog;
