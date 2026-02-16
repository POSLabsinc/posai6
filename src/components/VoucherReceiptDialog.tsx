import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Printer, MessageSquare, Mail, ChevronDown, Delete, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { VoucherFormData } from './CreateVoucherForm';
import eatosLogo from '@/assets/icons/orderos-logo.png';

interface VoucherReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucherData: VoucherFormData | null;
}

type ReceiptStep = 'selection' | 'phone-input' | 'email-input';

const VoucherReceiptDialog = ({ open, onOpenChange, voucherData }: VoucherReceiptDialogProps) => {
  const [step, setStep] = useState<ReceiptStep>('selection');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [noMarketing, setNoMarketing] = useState(false);

  const handleClose = () => {
    setStep('selection');
    setPhoneNumber('');
    setEmailAddress('');
    setNoMarketing(false);
    onOpenChange(false);
  };

  const handlePrint = () => {
    toast.success('Voucher sent to printer');
    handleClose();
  };

  const handleSendText = () => {
    if (phoneNumber.replace(/\D/g, '').length >= 10) {
      toast.success('Voucher sent via SMS');
      handleClose();
    }
  };

  const handleSendEmail = () => {
    if (emailAddress.includes('@') && emailAddress.includes('.')) {
      toast.success('Voucher sent via Email');
      handleClose();
    }
  };

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

  const emailKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'delete'],
    ['@', '.', '_', '-', '.com', '.net', '@gmail.com']
  ];

  const getVoucherCodeDisplay = () => {
    if (!voucherData) return '';
    return voucherData.customCode;
  };

  const getVoucherTypeLabel = () => {
    if (!voucherData) return '';
    if (voucherData.type === 'percentage') return `${voucherData.value}% Off`;
    if (voucherData.type === 'fixed') return `$${voucherData.value} Off`;
    return 'Free Item';
  };

  const formatExpirationDate = () => {
    if (!voucherData?.expirationDate) return '';
    const date = new Date(voucherData.expirationDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 p-0 max-w-md w-full overflow-hidden [&>button]:hidden">
        {step === 'selection' && (
          <div className="flex flex-col p-6">
            <h2 className="text-white text-xl font-semibold text-center mb-6">
              How would you like to<br />send the voucher?
            </h2>

            {/* Voucher Code + Details in one row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <div className="border-[1.5px] border-dashed border-white/25 rounded-lg px-4 py-2.5">
                  <span className="text-white text-lg font-semibold tracking-[0.25em]">{getVoucherCodeDisplay()}</span>
                </div>
                <span className="text-neutral-400 text-[11px] mt-1.5">{getVoucherTypeLabel()}</span>
              </div>
              <div className="flex flex-col gap-2 ml-auto">
                <div className="flex flex-col">
                  <span className="text-neutral-500 text-[10px] uppercase tracking-wide">Expires</span>
                  <span className="text-white text-[13px] font-medium">{formatExpirationDate()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-500 text-[10px] uppercase tracking-wide">Max Uses</span>
                  <span className="text-white text-[13px] font-medium">{voucherData?.maximumUses || '1'}</span>
                </div>
              </div>
            </div>

            {/* Receipt Options */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handlePrint}
                className="flex-1 flex flex-col items-center gap-3 py-6 border border-neutral-700 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <Printer className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Print</span>
              </button>
              <button
                onClick={() => setStep('phone-input')}
                className="flex-1 flex flex-col items-center gap-3 py-6 border border-neutral-700 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <MessageSquare className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Text</span>
              </button>
              <button
                onClick={() => setStep('email-input')}
                className="flex-1 flex flex-col items-center gap-3 py-6 border border-neutral-700 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <Mail className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Email</span>
              </button>
            </div>

            {/* No Receipt Button */}
            <button
              onClick={handleClose}
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
            <p className="text-neutral-500 text-xs text-center mb-4">
              Your information will be securely processed under<br />
              Point of Sale AI's <span className="text-purple-400">Terms of Service</span> and <span className="text-purple-400">Privacy Policy</span><br />
              to protect your privacy.
            </p>

            <p className="text-neutral-500 text-xs text-center">
              Powered by <span className="text-white font-semibold">eatOS</span>
            </p>
          </div>
        )}

        {step === 'phone-input' && (
          <div className="flex flex-col h-[520px]">
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
              <button
                onClick={() => setStep('selection')}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-base font-semibold flex-1 text-center pr-8">Where should we text the voucher?</h2>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center bg-neutral-800 rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-3 border-r border-neutral-700">
                  <span className="text-white text-sm font-medium">US +1</span>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
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

            <div className="px-4 py-2 text-center">
              <p className="text-neutral-500 text-[10px] leading-relaxed">
                Your phone number will be used only to send the voucher. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.
              </p>
            </div>

            <div className="px-4 py-2">
              <button
                onClick={handleSendText}
                disabled={phoneNumber.replace(/\D/g, '').length < 10}
                className="w-full py-3 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SEND
              </button>
            </div>

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
        )}

        {step === 'email-input' && (
          <div className="flex flex-col h-[520px]">
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
              <button
                onClick={() => setStep('selection')}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-base font-semibold flex-1 text-center pr-8">Where should we email the voucher?</h2>
            </div>

            <div className="px-4 py-3">
              <input
                type="text"
                placeholder="email@example.com"
                value={emailAddress}
                readOnly
                className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg text-sm placeholder:text-neutral-500 outline-none"
              />
            </div>

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

            <div className="px-4 py-2">
              <button
                onClick={handleSendEmail}
                disabled={!emailAddress.includes('@') || !emailAddress.includes('.')}
                className="w-full py-3 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SEND
              </button>
            </div>

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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoucherReceiptDialog;
