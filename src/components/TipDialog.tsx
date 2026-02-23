import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, Printer, MessageSquare, Mail, Check, ArrowLeft, Delete, DollarSign } from "lucide-react";
import { formatPrice } from "@/data/orders";
import { toast } from "sonner";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  existingTip?: number;
  onTipSelected: (tip: number) => void;
}

type TipStep = 'tip-selection' | 'custom-tip' | 'receipt-selection' | 'phone-input' | 'email-input';

const TipDialog = ({ open, onOpenChange, orderTotal, existingTip = 0, onTipSelected }: TipDialogProps) => {
  const [step, setStep] = useState<TipStep>('tip-selection');
  const [customAmount, setCustomAmount] = useState("0.00");
  const [isPercentMode, setIsPercentMode] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [noMarketing, setNoMarketing] = useState(false);
  const [isCFDOn, setIsCFDOn] = useState(false);

  const hasExistingTip = existingTip > 0;

  const tipPercentages = [
    { percent: 25, amount: orderTotal * 0.25 },
    { percent: 20, amount: orderTotal * 0.20 },
    { percent: 15, amount: orderTotal * 0.15 },
    { percent: 10, amount: orderTotal * 0.10 },
  ];

  const resetAndClose = () => {
    setStep('tip-selection');
    setCustomAmount("0.00");
    setIsPercentMode(false);
    setSelectedTip(0);
    setPhoneNumber('');
    setEmailAddress('');
    setNoMarketing(false);
    setIsCFDOn(false);
    onOpenChange(false);
  };

  const handleTipSelect = (amount: number) => {
    // For existing tips, the new tip is additive
    const finalTip = hasExistingTip ? existingTip + amount : amount;
    setSelectedTip(finalTip);
    onTipSelected(finalTip);
    setStep('receipt-selection');
  };

  const handleNoTip = () => {
    // If existing tip, keep it (don't remove)
    if (hasExistingTip) {
      // No change - user must use refund to reduce
      resetAndClose();
      return;
    }
    setSelectedTip(0);
    onTipSelected(0);
    setStep('receipt-selection');
  };

  const handleKeypadPress = (key: string) => {
    if (key === "C") {
      setCustomAmount("0.00");
    } else if (key === "backspace") {
      const newValue = customAmount.slice(0, -1);
      setCustomAmount(newValue.length > 0 ? newValue : "0");
    } else if (key === ".") {
      if (!customAmount.includes(".")) {
        setCustomAmount(customAmount + ".");
      }
    } else {
      if (customAmount === "0.00" || customAmount === "0") {
        setCustomAmount(key);
      } else {
        setCustomAmount(customAmount + key);
      }
    }
  };

  const handleCustomTipConfirm = () => {
    const value = parseFloat(customAmount) || 0;
    const tipAmount = isPercentMode ? (orderTotal * value / 100) : value;
    const finalTip = hasExistingTip ? existingTip + tipAmount : tipAmount;
    setSelectedTip(finalTip);
    onTipSelected(finalTip);
    setStep('receipt-selection');
  };

  // Receipt handling functions
  const formatPhoneNumber = (digits: string) => {
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneKeyPress = (key: string) => {
    if (key === 'delete') {
      const digits = phoneNumber.replace(/\D/g, '');
      const newDigits = digits.slice(0, -1);
      setPhoneNumber(formatPhoneNumber(newDigits));
    } else if (key !== '') {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length < 10) {
        const newDigits = digits + key;
        setPhoneNumber(formatPhoneNumber(newDigits));
      }
    }
  };

  const handleEmailKeyPress = (key: string) => {
    if (key === 'delete') {
      setEmailAddress(prev => prev.slice(0, -1));
    } else if (key === 'space') {
      // No space in email
    } else {
      setEmailAddress(prev => prev + key);
    }
  };

  const handlePrint = () => {
    toast.success('Receipt sent to printer');
    resetAndClose();
  };

  const handleSendText = () => {
    if (phoneNumber.replace(/\D/g, '').length >= 10) {
      toast.success('Receipt sent via SMS');
      resetAndClose();
    }
  };

  const handleSendEmail = () => {
    if (emailAddress.includes('@') && emailAddress.includes('.')) {
      toast.success('Receipt sent via Email');
      resetAndClose();
    }
  };

  const emailKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'delete'],
    ['@', '.', '_', '-', '.com', '.net', '@gmail.com']
  ];

  // Custom Tip Screen with keypad (matching the design)
  if (step === 'custom-tip') {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden [&>button]:hidden">
          <div className="flex flex-col">
            {/* Header with back button */}
            <div className="flex items-center p-4">
              <button 
                onClick={() => setStep('tip-selection')}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Total Display */}
            <div className="text-center pb-4">
              <h2 className="text-white text-2xl font-bold">Total {formatPrice(orderTotal)}</h2>
            </div>

            {/* Amount Input with $ / % Toggle */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="flex-1 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: "#7575754D",
                    boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                  }}
                >
                  <span className="text-white text-xl font-semibold">
                    {isPercentMode ? `${customAmount}%` : `$${customAmount}`}
                  </span>
                </div>
                <div 
                  className="flex items-center rounded-full overflow-hidden"
                  style={{
                    background: "#7575754D",
                    boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                  }}
                >
                  <button
                    onClick={() => setIsPercentMode(false)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-semibold transition-all ${!isPercentMode ? 'bg-white text-black rounded-full' : 'text-white/60'}`}
                  >
                    $
                  </button>
                  <button
                    onClick={() => setIsPercentMode(true)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-semibold transition-all ${isPercentMode ? 'bg-white text-black rounded-full' : 'text-white/60'}`}
                  >
                    %
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-2">
              <p className="text-white/40 text-xs text-center">
                I acknowledge that tips are distributed according to the company's tip pooling policy
              </p>
            </div>

            {/* Confirm Button */}
            <div className="px-4 py-2">
              <button
                onClick={handleCustomTipConfirm}
                className="w-full h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                <span className="text-white font-semibold">CONFIRM</span>
              </button>
            </div>

            {/* Keypad - 7 8 9 / 4 5 6 / 1 2 3 / . 0 C */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "C"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeypadPress(key)}
                  className="h-16 rounded-xl flex items-center justify-center text-white text-2xl font-medium transition-all hover:opacity-80"
                  style={{
                    background: "#1B1C20"
                  }}
                >
                  {key === "C" ? <span className="text-red-500">C</span> : key}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Receipt Selection Screen
  if (step === 'receipt-selection') {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden [&>button]:hidden">
          <div className="flex flex-col p-6">
            {/* Header */}
            <h2 className="text-white text-xl font-semibold text-center mb-8">
              How would you like to<br />receive your receipt?
            </h2>

            {/* Receipt Options */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handlePrint}
                className="flex-1 flex flex-col items-center gap-3 py-6 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"
              >
                <Printer className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Print</span>
              </button>
              <button
                onClick={() => setStep('phone-input')}
                className="flex-1 flex flex-col items-center gap-3 py-6 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"
              >
                <MessageSquare className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Text</span>
              </button>
              <button
                onClick={() => setStep('email-input')}
                className="flex-1 flex flex-col items-center gap-3 py-6 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"
              >
                <Mail className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Email</span>
              </button>
            </div>

            {/* No Receipt Button */}
            <button
              onClick={resetAndClose}
              className="w-full py-4 bg-neutral-800 text-neutral-300 font-semibold rounded-xl hover:bg-neutral-700 transition-colors mb-6"
            >
              NO RECEIPT
            </button>

            {/* Marketing Checkbox */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <div 
                onClick={() => setNoMarketing(!noMarketing)} 
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${noMarketing ? 'bg-white border-white' : 'border-neutral-600 bg-transparent'}`}
              >
                {noMarketing && <Check className="w-3 h-3 text-black" />}
              </div>
              <span className="text-neutral-400 text-sm">Do not use my email or phone number for marketing</span>
            </label>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-neutral-500 text-xs text-center">
                Your information will be securely processed under<br />
                eatOS' <span className="text-purple-400">Terms of Service</span> and <span className="text-purple-400">Privacy Policy</span><br />
                to protect your privacy.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Phone Input Screen
  if (step === 'phone-input') {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden [&>button]:hidden">
          <div className="flex flex-col h-[520px]">
            {/* Header with Back Button */}
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
              <button 
                onClick={() => setStep('receipt-selection')}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-base font-semibold flex-1 text-center pr-8">Where should we text your receipt?</h2>
            </div>

            {/* Phone Input */}
            <div className="px-4 py-3">
              <div className="flex items-center bg-neutral-800 rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-3 border-r border-neutral-700">
                  <span className="text-white text-sm font-medium">US +1</span>
                </div>
                <input 
                  type="text" 
                  placeholder="(000) 000-0000" 
                  value={phoneNumber} 
                  readOnly 
                  className="flex-1 bg-transparent text-white px-3 py-3 text-sm placeholder:text-neutral-500 outline-none" 
                />
              </div>
            </div>

            {/* Marketing Checkbox */}
            <div className="px-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div 
                  onClick={() => setNoMarketing(!noMarketing)} 
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${noMarketing ? 'bg-white border-white' : 'border-neutral-600 bg-transparent'}`}
                >
                  {noMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                </div>
                <span className="text-neutral-400 text-xs">Do not use my phone number for marketing</span>
              </label>
            </div>

            {/* Terms */}
            <div className="px-4 py-2 text-center">
              <p className="text-neutral-500 text-[10px] leading-relaxed">
                Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.
              </p>
            </div>

            {/* Send Button */}
            <div className="px-4 py-2">
              <button 
                onClick={handleSendText}
                disabled={phoneNumber.replace(/\D/g, '').length < 10}
                className="w-full py-3 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SEND
              </button>
            </div>

            {/* Numeric Keypad */}
            <div className="flex-1 flex flex-col justify-end px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                  <button 
                    key={key}
                    onClick={() => handlePhoneKeyPress(key)}
                    className={`h-12 rounded-lg text-lg font-medium transition-colors ${
                      key === '' ? 'invisible' : 
                      key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 
                      'bg-neutral-800 text-white hover:bg-neutral-700'
                    }`}
                  >
                    {key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Email Input Screen
  if (step === 'email-input') {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden [&>button]:hidden">
          <div className="flex flex-col h-[520px]">
            {/* Header with Back Button */}
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
              <button 
                onClick={() => setStep('receipt-selection')}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-base font-semibold flex-1 text-center pr-8">Where should we email your receipt?</h2>
            </div>

            {/* Email Input */}
            <div className="px-4 py-3">
              <input 
                type="text" 
                placeholder="email@example.com" 
                value={emailAddress} 
                readOnly 
                className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg text-sm placeholder:text-neutral-500 outline-none" 
              />
            </div>

            {/* Marketing Checkbox */}
            <div className="px-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div 
                  onClick={() => setNoMarketing(!noMarketing)} 
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${noMarketing ? 'bg-white border-white' : 'border-neutral-600 bg-transparent'}`}
                >
                  {noMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                </div>
                <span className="text-neutral-400 text-xs">Do not use my email address for marketing</span>
              </label>
            </div>

            {/* Send Button */}
            <div className="px-4 py-2">
              <button 
                onClick={handleSendEmail}
                disabled={!emailAddress.includes('@') || !emailAddress.includes('.')}
                className="w-full py-3 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SEND
              </button>
            </div>

            {/* QWERTY Keyboard */}
            <div className="flex-1 flex flex-col justify-end px-2 pb-4 gap-1">
              {emailKeys.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                  {row.map(key => (
                    <button 
                      key={key}
                      onClick={() => handleEmailKeyPress(key)}
                      className={`rounded-md text-sm font-medium transition-colors ${
                        key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600 px-3 h-10' :
                        key.length > 1 ? 'bg-neutral-700 text-white hover:bg-neutral-600 px-2 h-10 text-xs' :
                        'bg-neutral-800 text-white hover:bg-neutral-700 w-8 h-10'
                      }`}
                    >
                      {key === 'delete' ? <Delete className="w-4 h-4 mx-auto" /> : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default: Tip Selection Screen
  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden [&>button]:hidden max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={resetAndClose}
              className="p-2 rounded-full hover:opacity-80 transition-opacity"
              style={{
                background: "#7575754D",
                boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={() => {
                setIsCFDOn(!isCFDOn);
                if (!isCFDOn) {
                  toast.success("CFD screen activated for customer tip selection");
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                isCFDOn 
                  ? 'text-amber-400 border border-amber-500/50' 
                  : 'text-white/80'
              }`}
              style={{
                background: isCFDOn 
                  ? "rgba(180, 130, 50, 0.3)" 
                  : "#7575754D",
                boxShadow: isCFDOn
                  ? "inset 0px 0px 12px 0px rgba(200, 150, 50, 0.3)"
                  : "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}
            >
              {isCFDOn ? "CFD • On" : "Request tip on built-in CFD"}
            </button>
          </div>

          {/* Total Display */}
          <div className="text-center py-4">
            <h2 className="text-white text-3xl font-bold">Total {formatPrice(orderTotal)}</h2>
          </div>

          {/* Existing Tip Banner - only shown when tip already exists */}
          {hasExistingTip && (
            <div className="mx-4 mb-3 rounded-xl border border-emerald-500/30 p-4 flex items-center gap-3" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-emerald-400 font-semibold text-sm">Adding to Existing Tip</p>
                <p className="text-white/50 text-xs">Your selection will be added to the current tip</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white/50 text-xs">Current Tip</p>
                <p className="text-emerald-400 font-bold text-lg">{formatPrice(existingTip)}</p>
              </div>
            </div>
          )}

          {/* Subtitle */}
          <div className="text-center pb-3">
            <p className="text-white/50 text-sm">
              {hasExistingTip ? "Select additional tip amount" : `Suggestions based on original amount of ${formatPrice(orderTotal)}`}
            </p>
          </div>

          {/* Tip Percentage Grid */}
          <div className="grid grid-cols-2 gap-3 px-4">
            {tipPercentages.map(({ percent, amount }) => (
              <button
                key={percent}
                onClick={() => handleTipSelect(amount)}
                className="py-6 rounded-xl border border-white/20 hover:border-white/40 transition-all flex flex-col items-center justify-center gap-1"
                style={{
                  background: "#1B1C20"
                }}
              >
                <span className="text-white text-2xl font-bold">{percent}%</span>
                <span className="text-white/50 text-sm">{formatPrice(amount)}</span>
                {hasExistingTip && (
                  <span className="text-emerald-400 text-xs font-medium">
                    New total: {formatPrice(existingTip + amount)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Custom Tip Button */}
          <div className="px-4 pt-3">
            <button
              onClick={() => setStep('custom-tip')}
              className="w-full py-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              style={{
                background: "#1B1C20"
              }}
            >
              <span className="text-white font-bold">CUSTOM TIP</span>
            </button>
          </div>

          {/* No Tip */}
          <div className="py-4 text-center">
            <button
              onClick={handleNoTip}
              className="text-white font-medium hover:opacity-80 transition-opacity"
            >
              No Tip
            </button>
            {hasExistingTip && (
              <p className="text-white/40 text-xs mt-1.5">
                Current tip: {formatPrice(existingTip)} • Use REFUND to reduce or remove tip
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className="border-t border-white/10 px-4 py-4">
            <p className="text-white/40 text-xs text-center">
              I acknowledge that tips are distributed according to the company's tip pooling policy
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipDialog;
