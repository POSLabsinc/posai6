import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Printer, Mail, ChevronDown, Delete, Check, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { VoucherFormData } from './CreateVoucherForm';
import { customers, Customer } from '@/data/customers';
import { Input } from '@/components/ui/input';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [noMarketing, setNoMarketing] = useState(false);

  const handleClose = () => {
    setStep('selection');
    setPhoneNumber('');
    setEmailAddress('');
    setFirstName('');
    setLastName('');
    setSearchQuery('');
    setNoMarketing(false);
    onOpenChange(false);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone.includes(searchQuery)
    ).slice(0, 5);
  }, [searchQuery]);

  const handleSelectCustomer = (customer: Customer) => {
    const nameParts = customer.name.split(' ');
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' ') || '');
    setEmailAddress(customer.email || '');
    setSearchQuery('');
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
    if (!voucherData?.expirationDate) return 'NA';
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

            {/* Voucher Code Display */}
            <div className="flex flex-col items-center mb-6">
              <div className="border-[1.5px] border-dashed border-white/25 rounded-lg px-5 py-2.5">
                <span className="text-white text-lg font-semibold tracking-[0.25em]">{getVoucherCodeDisplay()}</span>
              </div>
              <span className="text-neutral-500 text-[11px] mt-2">
                <span className="text-white">{getVoucherTypeLabel()}</span> · Expires <span className="text-white">{formatExpirationDate()}</span> · Max Uses <span className="text-white">{voucherData?.maximumUses || '1'}</span>
              </span>
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
                onClick={() => setStep('email-input')}
                className="flex-1 flex flex-col items-center gap-3 py-6 border border-neutral-700 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <Mail className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Email</span>
              </button>
              <div
                className="flex-1 flex flex-col items-center gap-3 py-6 border border-neutral-700 rounded-xl opacity-50 cursor-not-allowed relative"
              >
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-white text-sm font-medium">WhatsApp</span>
                <span className="text-[10px] text-neutral-400 absolute bottom-2">Coming Soon</span>
              </div>
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
          <div className="flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
              <button
                onClick={() => { setStep('selection'); setSearchQuery(''); setFirstName(''); setLastName(''); setEmailAddress(''); }}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-base font-semibold flex-1 text-center pr-8">Where should we email the voucher?</h2>
            </div>

            {/* Search Guest */}
            <div className="px-4 pt-4 pb-2 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search existing guest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-800 border-neutral-700 text-white pl-9 pr-4 py-3 rounded-lg text-sm placeholder:text-neutral-500"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-4 right-4 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
                  {searchResults.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full flex flex-col px-4 py-2.5 hover:bg-neutral-700 transition-colors text-left"
                    >
                      <span className="text-white text-sm font-medium">{customer.name}</span>
                      <span className="text-neutral-400 text-xs">{customer.email || 'No email'} · {customer.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="px-4 py-2 flex gap-3">
              <div className="flex-1">
                <label className="text-neutral-400 text-xs mb-1 block">First Name</label>
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-sm placeholder:text-neutral-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-neutral-400 text-xs mb-1 block">Last Name</label>
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-sm placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div className="px-4 py-2">
              <label className="text-neutral-400 text-xs mb-1 block">Email <span className="text-red-400">*</span></label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white text-sm placeholder:text-neutral-500"
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

            <div className="px-4 py-3">
              <button
                onClick={handleSendEmail}
                disabled={!emailAddress.includes('@') || !emailAddress.includes('.')}
                className="w-full py-3 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SEND
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoucherReceiptDialog;
