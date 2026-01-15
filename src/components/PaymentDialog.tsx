import { useState, useEffect } from "react";
import { 
  Check, ChevronDown, X, CreditCard, User, Gift, Link, QrCode, 
  Banknote, Delete, Printer, MessageSquare, Mail, Truck, 
  ShoppingBag, Clipboard, ExternalLink, Utensils, UtensilsCrossed, 
  ArrowLeft, UserPlus, Search, Phone, AlertTriangle, Clock, Zap, Users
} from "lucide-react";
import tickSuccessIcon from "@/assets/icons/tick-success.svg";

// Payment method type
type PaymentMethodType = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Guest type for Pay by Link
interface GuestType {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  loyaltyPoints?: number;
}

// Order item type
interface OrderItemType {
  id: number;
  qty: number;
  name: string;
  price: number;
  seats?: number[];
}

// Initial visible payment methods
const initialPaymentMethods: PaymentMethodType[] = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'gift-card', name: 'Gift Card', icon: Gift },
  { id: 'pay-link', name: 'Pay by Link', icon: Link }
];

// Initial other payment methods (in dropdown)
const initialOtherPaymentMethods: PaymentMethodType[] = [
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'manual-card', name: 'Manual card', icon: Clipboard },
  { id: 'blizzful', name: 'Blizzful', icon: Utensils },
  { id: 'ubereats', name: 'UberEats', icon: ShoppingBag },
  { id: 'doordash', name: 'DoorDash', icon: Truck },
  { id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed }
];

// Quick amount values
const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

// Mock guests data
const mockGuests: GuestType[] = [
  { name: "Ayden Veum", phone: "(346) 346-3636", email: "cow@user.com", avatar: "AV", loyaltyPoints: 850 },
  { name: "Arjun Gerhold", phone: "(574) 747-3634", email: "cow@user.com", avatar: "AG", loyaltyPoints: 1250 },
  { name: "Bergnaum", phone: "(643) 636-4377", email: "abc@gmail.com", avatar: "B", loyaltyPoints: 320 },
  { name: "Cleora Hills", phone: "(100) 000-0000", email: "cleorahills@gmail.com", avatar: "CH", loyaltyPoints: 1580 },
  { name: "Eden Kautzer", phone: "(353) 253-2523", email: "dog@Test.com", avatar: "EK", loyaltyPoints: 920 }
];

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  orderItems?: OrderItemType[];
  guestName?: string;
  tableName?: string;
}

export const PaymentDialog = ({
  isOpen,
  onClose,
  totalAmount,
  orderItems = [],
  guestName = "Guest",
  tableName = "T1"
}: PaymentDialogProps) => {
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState(totalAmount.toFixed(2));
  const [showKeypad, setShowKeypad] = useState(false);
  const [amountQuantities, setAmountQuantities] = useState<Record<number, number>>({});
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Array<{ method: string; amount: number; methodLabel: string }>>([]);
  
  // Dynamic payment methods
  const [visiblePaymentMethods, setVisiblePaymentMethods] = useState<PaymentMethodType[]>(initialPaymentMethods);
  const [dropdownPaymentMethods, setDropdownPaymentMethods] = useState<PaymentMethodType[]>(initialOtherPaymentMethods);
  
  // Gift card state
  const [giftCardStep, setGiftCardStep] = useState<'amount' | 'enter-card' | 'processing'>('amount');
  const [giftCardNumber, setGiftCardNumber] = useState('');
  
  // Pay by Link state
  const [payByLinkStep, setPayByLinkStep] = useState<'amount' | 'select-guest' | 'add-guest' | 'guest-confirmed' | 'pending' | 'expired' | 'complete'>('amount');
  const [selectedGuest, setSelectedGuest] = useState<GuestType | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [sendLinkMethod, setSendLinkMethod] = useState<'text' | 'email'>('text');
  const [newGuestForLink, setNewGuestForLink] = useState({ name: '', phone: '', email: '' });
  
  // QR Code state
  const [qrCodeStep, setQrCodeStep] = useState<'amount' | 'qr-display' | 'pending' | 'complete'>('amount');
  
  // Manual CC state
  const [manualCCStep, setManualCCStep] = useState<'amount' | 'tap-card' | 'processing' | 'complete'>('amount');
  
  // External CC state
  const [externalCCStep, setExternalCCStep] = useState<'amount' | 'complete'>('amount');
  
  // Manual Card state
  const [manualCardStep, setManualCardStep] = useState<'amount' | 'card-details' | 'complete'>('amount');
  const [manualCardDetails, setManualCardDetails] = useState({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
  
  // DoorDash state
  const [doordashStep, setDoordashStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [doordashReference, setDoordashReference] = useState('');
  
  // Receipt states
  const [textReceiptStep, setTextReceiptStep] = useState<'receipt' | 'phone-input'>('receipt');
  const [textReceiptPhone, setTextReceiptPhone] = useState('');
  const [textReceiptNoMarketing, setTextReceiptNoMarketing] = useState(false);
  const [emailReceiptStep, setEmailReceiptStep] = useState<'receipt' | 'email-input'>('receipt');
  const [emailReceiptEmail, setEmailReceiptEmail] = useState('');
  const [emailReceiptNoMarketing, setEmailReceiptNoMarketing] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(totalAmount.toFixed(2));
      setPaymentProcessed(false);
      setPaymentHistory([]);
      setAmountQuantities({});
      setSelectedPaymentMethod('cash');
      setGiftCardStep('amount');
      setGiftCardNumber('');
      setPayByLinkStep('amount');
      setQrCodeStep('amount');
      setManualCCStep('amount');
      setExternalCCStep('amount');
      setManualCardStep('amount');
      setDoordashStep('amount');
      setTextReceiptStep('receipt');
      setEmailReceiptStep('receipt');
    }
  }, [isOpen, totalAmount]);

  // Calculate payment amount from quantities
  useEffect(() => {
    const total = Object.entries(amountQuantities).reduce((sum, [amount, qty]) => {
      return sum + parseFloat(amount) * qty;
    }, 0);
    if (total > 0) {
      setPaymentAmount(total.toFixed(2));
    }
  }, [amountQuantities]);

  const handleAddAmount = (amount: number) => {
    setAmountQuantities(prev => ({ ...prev, [amount]: (prev[amount] || 0) + 1 }));
  };

  const handleRemoveAmount = (amount: number) => {
    setAmountQuantities(prev => {
      const current = prev[amount] || 0;
      if (current <= 1) {
        const { [amount]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [amount]: current - 1 };
    });
  };

  const handleKeypadPress = (key: string) => {
    setAmountQuantities({});
    if (key === 'backspace') {
      setPaymentAmount(prev => prev.slice(0, -1) || '0.00');
    } else if (key === '.') {
      if (!paymentAmount.includes('.')) {
        setPaymentAmount(prev => prev + '.');
      }
    } else {
      setPaymentAmount(prev => {
        if (prev === '0.00' || prev === '') return key;
        return prev + key;
      });
    }
  };

  const handleSelectFromDropdown = (selectedMethod: PaymentMethodType) => {
    const lastVisibleMethod = visiblePaymentMethods[visiblePaymentMethods.length - 1];
    const newDropdownMethods = dropdownPaymentMethods.filter(m => m.id !== selectedMethod.id);
    newDropdownMethods.unshift(lastVisibleMethod);
    const newVisibleMethods = [selectedMethod, ...visiblePaymentMethods.slice(0, -1)];
    setVisiblePaymentMethods(newVisibleMethods);
    setDropdownPaymentMethods(newDropdownMethods);
    setSelectedPaymentMethod(selectedMethod.id);
    setShowOtherPayments(false);
  };

  const handleChargeClick = () => {
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'amount') {
      setGiftCardStep('enter-card');
      return;
    }
    if (selectedPaymentMethod === 'pay-link' && payByLinkStep === 'amount') {
      setPayByLinkStep('select-guest');
      return;
    }
    if (selectedPaymentMethod === 'qr-code' && qrCodeStep === 'amount') {
      setQrCodeStep('qr-display');
      return;
    }
    if (selectedPaymentMethod === 'manual-cc' && manualCCStep === 'amount') {
      setManualCCStep('tap-card');
      return;
    }
    if (selectedPaymentMethod === 'external-cc' && externalCCStep === 'amount') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(paid);
      setExternalCCStep('complete');
      return;
    }
    if (selectedPaymentMethod === 'manual-card' && manualCardStep === 'amount') {
      setManualCardStep('card-details');
      return;
    }
    if (selectedPaymentMethod === 'doordash' && doordashStep === 'amount') {
      setDoordashStep('reference');
      return;
    }
    
    const paid = parseFloat(paymentAmount) || 0;
    const methodLabel = selectedPaymentMethod === 'card' ? 'Card' : 
                       selectedPaymentMethod === 'gift-card' ? 'Gift Card' : 
                       selectedPaymentMethod === 'pay-link' ? 'Pay By Link' : 'Cash';
    setPaymentHistory(prev => [...prev, { method: selectedPaymentMethod, amount: paid, methodLabel }]);
    setPaidAmount(paid);
    setPaymentProcessed(true);
  };

  const handleClose = () => {
    setPaymentProcessed(false);
    setPaymentHistory([]);
    onClose();
  };

  if (!isOpen) return null;

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const finalTotal = totalAmount;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const remainingDue = finalTotal - totalPaid;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
      onClick={handleClose}
    >
      <div 
        className="bg-neutral-900 rounded-xl border border-neutral-700 flex overflow-hidden mx-4 animate-scale-in max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Payment Options Panel OR Receipt View */}
        <div className="w-[480px] flex flex-col bg-neutral-900 max-h-[90vh] overflow-hidden">
          {paymentProcessed ? (
            /* Receipt View */
            <>
              {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                <>
                  {/* Success Header */}
                  <div className="flex flex-col items-center py-8 px-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <img src={tickSuccessIcon} alt="Success" className="w-10 h-10" />
                    </div>
                    <p className="text-neutral-300 text-sm">
                      <span className="text-green-500 font-medium">${totalPaid.toFixed(2)}</span> has been successfully processed
                    </p>
                  </div>

                  {/* Change Due / Due Amount Box */}
                  {totalPaid >= finalTotal ? (
                    <div className="mx-6 mb-6 border-2 border-green-500 rounded-lg p-4 bg-green-500/10">
                      <p className="text-green-500 text-sm text-center mb-1">Change Due</p>
                      <p className="text-green-500 text-3xl font-bold text-center">
                        ${(totalPaid - finalTotal).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div className="mx-6 mb-4 border-2 border-red-500 rounded-lg p-4 bg-red-500/10">
                      <p className="text-red-500 text-sm text-center mb-1">Due Amount</p>
                      <p className="text-red-500 text-3xl font-bold text-center">
                        ${remainingDue.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Pay Remaining Button */}
                  {totalPaid < finalTotal && (
                    <div className="mx-6 mb-6">
                      <button
                        onClick={() => {
                          setPaymentAmount(remainingDue.toFixed(2));
                          setPaymentProcessed(false);
                          setSelectedPaymentMethod('cash');
                          setAmountQuantities({});
                        }}
                        className="w-full py-3.5 bg-gradient-to-b from-orange-400 to-orange-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all shadow-lg"
                      >
                        PAY REMAINING ${remainingDue.toFixed(2)}
                      </button>
                    </div>
                  )}

                  {/* Receipt Section */}
                  <div className="px-6 pb-6">
                    <h3 className="text-white font-semibold text-center mb-4">Receipt</h3>
                    <div className="flex gap-4 justify-center mb-4">
                      <button className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors">
                        <Printer className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Print</span>
                      </button>
                      <button 
                        onClick={() => {
                          setTextReceiptPhone('');
                          setTextReceiptNoMarketing(false);
                          setTextReceiptStep('phone-input');
                        }} 
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <MessageSquare className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Text</span>
                      </button>
                      <button 
                        onClick={() => {
                          setEmailReceiptEmail('');
                          setEmailReceiptNoMarketing(false);
                          setEmailReceiptStep('email-input');
                        }} 
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <Mail className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Email</span>
                      </button>
                    </div>
                    <button 
                      onClick={handleClose} 
                      className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      NO RECEIPT
                    </button>
                  </div>
                </>
              ) : textReceiptStep === 'phone-input' ? (
                /* Text Receipt Phone Input Screen */
                <div className="flex flex-col h-[500px]">
                  <div className="flex items-center p-3 border-b border-neutral-700">
                    <button 
                      onClick={() => setTextReceiptStep('receipt')} 
                      className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="px-4 pt-3 pb-2 text-center">
                    <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                  </div>
                  <div className="px-4 mb-2">
                    <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                        <span className="text-white text-xs font-medium">US +1</span>
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="(000) 000-0000" 
                        value={textReceiptPhone} 
                        readOnly 
                        className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="px-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div 
                        onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}
                      >
                        {textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                    </label>
                  </div>
                  <div className="px-4 mb-2">
                    <button 
                      onClick={() => {
                        setTextReceiptStep('receipt');
                        handleClose();
                      }} 
                      disabled={textReceiptPhone.replace(/\D/g, '').length < 10} 
                      className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      SEND
                    </button>
                  </div>
                  {/* Numeric Keypad */}
                  <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden">
                    <div className="grid grid-cols-3 h-full">
                      {[
                        { num: '1', sub: '' }, { num: '2', sub: 'ABC' }, { num: '3', sub: 'DEF' },
                        { num: '4', sub: 'JKL' }, { num: '5', sub: 'MNO' }, { num: '6', sub: 'PQRS' },
                        { num: '7', sub: 'TUV' }, { num: '8', sub: 'WXYZ' }, { num: '9', sub: '' }
                      ].map(key => (
                        <button 
                          key={key.num} 
                          onClick={() => {
                            const digits = textReceiptPhone.replace(/\D/g, '');
                            if (digits.length < 10) {
                              const newDigits = digits + key.num;
                              let formatted = '';
                              if (newDigits.length > 0) {
                                formatted = '(' + newDigits.slice(0, 3);
                                if (newDigits.length >= 3) {
                                  formatted += ') ' + newDigits.slice(3, 6);
                                  if (newDigits.length >= 6) {
                                    formatted += '-' + newDigits.slice(6, 10);
                                  }
                                }
                              }
                              setTextReceiptPhone(formatted);
                            }
                          }} 
                          className="py-2 flex flex-col items-center justify-center hover:bg-neutral-700 transition-colors border-b border-r border-neutral-700 active:bg-neutral-600"
                        >
                          <span className="text-white text-xl font-light">{key.num}</span>
                          {key.sub && <span className="text-neutral-500 text-[8px] tracking-wider">{key.sub}</span>}
                        </button>
                      ))}
                      <div className="py-2 border-b border-r border-neutral-700"></div>
                      <button 
                        onClick={() => {
                          const digits = textReceiptPhone.replace(/\D/g, '');
                          if (digits.length < 10) {
                            const newDigits = digits + '0';
                            let formatted = '';
                            if (newDigits.length > 0) {
                              formatted = '(' + newDigits.slice(0, 3);
                              if (newDigits.length >= 3) {
                                formatted += ') ' + newDigits.slice(3, 6);
                                if (newDigits.length >= 6) {
                                  formatted += '-' + newDigits.slice(6, 10);
                                }
                              }
                            }
                            setTextReceiptPhone(formatted);
                          }
                        }} 
                        className="py-2 flex items-center justify-center hover:bg-neutral-700 transition-colors border-b border-r border-neutral-700 active:bg-neutral-600"
                      >
                        <span className="text-white text-xl font-light">0</span>
                      </button>
                      <button 
                        onClick={() => {
                          const digits = textReceiptPhone.replace(/\D/g, '');
                          if (digits.length > 0) {
                            const newDigits = digits.slice(0, -1);
                            let formatted = '';
                            if (newDigits.length > 0) {
                              formatted = '(' + newDigits.slice(0, 3);
                              if (newDigits.length >= 3) {
                                formatted += ') ' + newDigits.slice(3, 6);
                                if (newDigits.length >= 6) {
                                  formatted += '-' + newDigits.slice(6, 10);
                                }
                              }
                            }
                            setTextReceiptPhone(formatted);
                          }
                        }} 
                        className="py-2 flex items-center justify-center hover:bg-neutral-700 transition-colors border-b border-neutral-700 active:bg-neutral-600"
                      >
                        <Delete className="w-5 h-5 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Receipt Input Screen */
                <div className="flex flex-col h-[500px]">
                  <div className="flex items-center p-3 border-b border-neutral-700">
                    <button 
                      onClick={() => setEmailReceiptStep('receipt')} 
                      className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="px-4 pt-3 pb-2 text-center">
                    <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                  </div>
                  <div className="px-4 mb-2">
                    <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600">
                        <Mail className="w-4 h-4 text-neutral-400" />
                      </div>
                      <input 
                        type="email" 
                        placeholder="email@example.com" 
                        value={emailReceiptEmail} 
                        onChange={e => setEmailReceiptEmail(e.target.value)} 
                        className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="px-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div 
                        onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)} 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}
                      >
                        {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                    </label>
                  </div>
                  <div className="px-4 mb-4">
                    <button 
                      onClick={() => {
                        setEmailReceiptStep('receipt');
                        handleClose();
                      }} 
                      disabled={!emailReceiptEmail.includes('@') || !emailReceiptEmail.includes('.')} 
                      className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      SEND
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Payment Options View */
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleClose} 
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Payment</span>
                </div>
                <span className="text-red-500 text-lg font-bold">${paymentAmount}</span>
              </div>

              {/* Amount Display */}
              <div className="p-4">
                <div 
                  className="bg-neutral-800 rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-750 transition-colors"
                  onClick={() => setShowKeypad(!showKeypad)}
                >
                  <p className="text-neutral-400 text-sm mb-1">Amount</p>
                  <p className="text-green-500 text-3xl font-bold">${paymentAmount}</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {visiblePaymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-colors flex-shrink-0 min-w-[80px] ${
                        selectedPaymentMethod === method.id
                          ? 'border-white bg-neutral-800'
                          : 'border-neutral-600 bg-neutral-800/50 hover:border-neutral-500'
                      }`}
                    >
                      <method.icon className={`w-5 h-5 ${selectedPaymentMethod === method.id ? 'text-white' : 'text-neutral-400'}`} />
                      <span className={`text-xs ${selectedPaymentMethod === method.id ? 'text-white' : 'text-neutral-400'}`}>
                        {method.name}
                      </span>
                    </button>
                  ))}
                  {/* More/Other button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowOtherPayments(!showOtherPayments)}
                      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-neutral-600 bg-neutral-800/50 hover:border-neutral-500 transition-colors flex-shrink-0 min-w-[80px]"
                    >
                      <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${showOtherPayments ? 'rotate-180' : ''}`} />
                      <span className="text-xs text-neutral-400">Other</span>
                    </button>
                    {showOtherPayments && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-50">
                        {dropdownPaymentMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => handleSelectFromDropdown(method)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                          >
                            <method.icon className="w-5 h-5 text-neutral-400" />
                            <span className="text-white text-sm">{method.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Keypad or Quick Amounts */}
              <div className="flex-1 px-4 pb-2 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {showKeypad ? (
                  /* Numeric Keypad */
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeypadPress(key)}
                        className="py-4 bg-neutral-800 rounded-lg text-white text-xl font-medium hover:bg-neutral-700 transition-colors"
                      >
                        {key === 'backspace' ? <Delete className="w-6 h-6 mx-auto" /> : key}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Quick Amounts */
                  <>
                    <div className="flex gap-4 px-2">
                      <button
                        onClick={() => setPaymentAmount(totalAmount.toFixed(2))}
                        className="flex-1 py-3 bg-neutral-700 rounded-lg text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
                      >
                        Full Amount
                      </button>
                      {quickAmounts.slice(0, 3).map((amount) => {
                        const qty = amountQuantities[amount] || 0;
                        return (
                          <div key={amount} className="flex-1 relative py-1">
                            <button
                              onClick={() => handleAddAmount(amount)}
                              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                                qty > 0
                                  ? 'bg-neutral-900 text-white border border-neutral-600'
                                  : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                              }`}
                            >
                              ${amount}
                            </button>
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAmount(amount);
                                  }}
                                  className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center leading-none text-xs hover:bg-red-600 transition-colors z-10"
                                >
                                  ×
                                </button>
                                <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                  x{qty}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 px-2 mt-2">
                      {quickAmounts.slice(3).map((amount) => {
                        const qty = amountQuantities[amount] || 0;
                        return (
                          <div key={amount} className="flex-1 relative py-1">
                            <button
                              onClick={() => handleAddAmount(amount)}
                              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                                qty > 0
                                  ? 'bg-neutral-900 text-white border border-neutral-600'
                                  : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                              }`}
                            >
                              ${amount}
                            </button>
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAmount(amount);
                                  }}
                                  className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                                >
                                  ×
                                </button>
                                <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                  x{qty}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Charge Button */}
              <div className="p-3 pt-0">
                <button
                  onClick={handleChargeClick}
                  className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  CHARGE ${paymentAmount}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Details Panel */}
        <div 
          className="w-[280px] border-l border-neutral-700 flex flex-col rounded-xl" 
          style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}
        >
          {/* Guest Info Header */}
          <div 
            className="p-3 border-b border-neutral-600" 
            style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{guestName}</h3>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Phone className="w-3 h-3" />
                <span className="text-xs">(555) 123-4567</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span 
                className="text-white text-[10px] font-medium px-2 py-1 rounded" 
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                TABLE {tableName}
              </span>
              <div className="flex items-center gap-2 text-neutral-300">
                <Users className="w-3 h-3" />
                <span className="text-xs">4</span>
              </div>
            </div>
          </div>

          {/* Check Info with PAID stamp when processed */}
          <div className="mx-3 mt-3 bg-neutral-800 rounded-lg p-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">Check 62 a</span>
              <span className="text-white font-bold">${finalTotal.toFixed(2)}</span>
            </div>
            {totalPaid >= finalTotal && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                PAID
              </span>
            )}
            {totalPaid > 0 && totalPaid < finalTotal && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                PARTIAL
              </span>
            )}
          </div>

          {/* Order Items */}
          <div 
            className="flex-1 overflow-y-auto p-3 space-y-2" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {orderItems.map((item) => (
              <div 
                key={item.id} 
                className="p-2 border border-sidebar-border rounded-lg" 
                style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-neutral-700 border border-neutral-600 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                    {item.qty}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{item.name}</span>
                      <span className="text-xs font-medium text-foreground ml-2">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="p-3 border-t border-neutral-700">
              <h4 className="text-white text-sm font-medium mb-2">Payment History</h4>
              <div className="space-y-2">
                {paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {payment.method === 'card' ? (
                        <CreditCard className="w-4 h-4 text-neutral-400" />
                      ) : payment.method === 'gift-card' ? (
                        <Gift className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <Banknote className="w-4 h-4 text-neutral-400" />
                      )}
                      <span className="text-neutral-300 text-xs">{payment.methodLabel}</span>
                    </div>
                    <span className="text-green-500 text-xs font-medium">${payment.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-600">
                <span className="text-neutral-400 text-xs">Total Paid</span>
                <span className="text-green-500 text-xs font-medium">${totalPaid.toFixed(2)}</span>
              </div>
              {remainingDue > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-400 text-xs">Remaining Due</span>
                  <span className="text-red-500 text-xs font-medium">${remainingDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Order Summary */}
          {!paymentProcessed && (
            <div className="p-3 border-t border-neutral-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Sub Total</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Tax</span>
                <span className="text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium pt-1">
                <span className="text-white">Total Due</span>
                <span className="text-red-500 font-bold">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
