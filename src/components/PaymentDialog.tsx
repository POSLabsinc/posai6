import { useState, useEffect } from "react";
import { Check, ChevronDown, X, CreditCard, User, Gift, Link, QrCode, Banknote, Delete, Printer, MessageSquare, Mail, CheckCircle, Truck, ShoppingBag, Utensils, UtensilsCrossed, ArrowLeft, Tag, ExternalLink, Clipboard } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Payment method type
type PaymentMethodType = { id: string; name: string; icon: React.ComponentType<{ className?: string }> };

// Initial payment methods data (visible)
const initialPaymentMethods: PaymentMethodType[] = [
  { id: 'loyalty', name: 'Loyalty', icon: Tag },
  { id: 'account', name: 'Account', icon: User },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'gift-card', name: 'Gift Card', icon: Gift },
  { id: 'pay-link', name: 'Pay by Link', icon: Link },
];

// Initial other payment methods (in dropdown)
const initialOtherPaymentMethods: PaymentMethodType[] = [
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'account2', name: 'Account', icon: User },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'manual-card', name: 'Manual card', icon: Clipboard },
  { id: 'blizzful', name: 'Blizzful', icon: Utensils },
  { id: 'ubereats', name: 'UberEats', icon: ShoppingBag },
  { id: 'doordash', name: 'DoorDash', icon: Truck },
  { id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed },
];

// Quick amount values
const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  orderItems?: Array<{ name: string; price: number; qty: number }>;
}

export const PaymentDialog = ({ open, onClose, totalAmount, orderItems = [] }: PaymentDialogProps) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [amountQuantities, setAmountQuantities] = useState<Record<number, number>>({});
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [visiblePaymentMethods, setVisiblePaymentMethods] = useState<PaymentMethodType[]>(initialPaymentMethods);
  const [dropdownPaymentMethods, setDropdownPaymentMethods] = useState<PaymentMethodType[]>(initialOtherPaymentMethods);
  
  // Gift card state
  const [giftCardStep, setGiftCardStep] = useState<'amount' | 'enter-card' | 'processing'>('amount');
  const [giftCardNumber, setGiftCardNumber] = useState('');
  
  // Delivery apps state
  const [doordashStep, setDoordashStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [doordashReference, setDoordashReference] = useState('');
  const [blizzfulStep, setBlizzfulStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [blizzfulReference, setBlizzfulReference] = useState('');
  const [ubereatsStep, setUbereatsStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [ubereatsReference, setUbereatsReference] = useState('');
  const [grubhubStep, setGrubhubStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [grubhubReference, setGrubhubReference] = useState('');
  
  // Receipt state
  const [textReceiptStep, setTextReceiptStep] = useState<'receipt' | 'phone-input'>('receipt');
  const [textReceiptPhone, setTextReceiptPhone] = useState('');
  const [textReceiptNoMarketing, setTextReceiptNoMarketing] = useState(false);
  const [emailReceiptStep, setEmailReceiptStep] = useState<'receipt' | 'email-input'>('receipt');
  const [emailReceiptEmail, setEmailReceiptEmail] = useState('');
  const [emailReceiptNoMarketing, setEmailReceiptNoMarketing] = useState(false);

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentAmount(totalAmount.toFixed(2));
      setAmountQuantities({});
      setPaymentProcessed(false);
      setPaidAmount(0);
      setShowKeypad(false);
      setShowOtherPayments(false);
      setSelectedPaymentMethod('cash');
      setGiftCardStep('amount');
      setGiftCardNumber('');
      setDoordashStep('amount');
      setDoordashReference('');
      setBlizzfulStep('amount');
      setBlizzfulReference('');
      setUbereatsStep('amount');
      setUbereatsReference('');
      setGrubhubStep('amount');
      setGrubhubReference('');
      setTextReceiptStep('receipt');
      setEmailReceiptStep('receipt');
    }
  }, [open, totalAmount]);

  // Calculate payment amount from quantities
  useEffect(() => {
    const total = Object.entries(amountQuantities).reduce((sum, [amount, qty]) => {
      return sum + (parseFloat(amount) * qty);
    }, 0);
    if (total > 0) {
      setPaymentAmount(total.toFixed(2));
    }
  }, [amountQuantities]);

  const handleKeypadPress = (key: string) => {
    if (key === 'C') {
      setPaymentAmount('');
      setAmountQuantities({});
    } else if (key === '⌫') {
      setPaymentAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!paymentAmount.includes('.')) {
        setPaymentAmount(prev => prev + '.');
      }
    } else {
      setPaymentAmount(prev => prev + key);
    }
  };

  const handleAddAmount = (amount: number) => {
    setAmountQuantities(prev => ({
      ...prev,
      [amount]: (prev[amount] || 0) + 1
    }));
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

  const handleCharge = () => {
    // Handle delivery app flows
    if (selectedPaymentMethod === 'doordash' && doordashStep === 'amount') {
      setDoordashStep('reference');
      return;
    }
    if (selectedPaymentMethod === 'doordash' && doordashStep === 'reference') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(paid);
      setDoordashStep('complete');
      setPaymentProcessed(true);
      return;
    }
    if (selectedPaymentMethod === 'blizzful' && blizzfulStep === 'amount') {
      setBlizzfulStep('reference');
      return;
    }
    if (selectedPaymentMethod === 'blizzful' && blizzfulStep === 'reference') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(paid);
      setBlizzfulStep('complete');
      setPaymentProcessed(true);
      return;
    }
    if (selectedPaymentMethod === 'ubereats' && ubereatsStep === 'amount') {
      setUbereatsStep('reference');
      return;
    }
    if (selectedPaymentMethod === 'ubereats' && ubereatsStep === 'reference') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(paid);
      setUbereatsStep('complete');
      setPaymentProcessed(true);
      return;
    }
    if (selectedPaymentMethod === 'grubhub' && grubhubStep === 'amount') {
      setGrubhubStep('reference');
      return;
    }
    if (selectedPaymentMethod === 'grubhub' && grubhubStep === 'reference') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(paid);
      setGrubhubStep('complete');
      setPaymentProcessed(true);
      return;
    }
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'amount') {
      setGiftCardStep('enter-card');
      return;
    }
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(paid);
      setPaymentProcessed(true);
      return;
    }
    
    // Default charge flow
    const paid = parseFloat(paymentAmount) || 0;
    setPaidAmount(paid);
    setPaymentProcessed(true);
  };

  const handleBack = () => {
    if (selectedPaymentMethod === 'doordash' && doordashStep === 'reference') {
      setDoordashStep('amount');
      return;
    }
    if (selectedPaymentMethod === 'blizzful' && blizzfulStep === 'reference') {
      setBlizzfulStep('amount');
      return;
    }
    if (selectedPaymentMethod === 'ubereats' && ubereatsStep === 'reference') {
      setUbereatsStep('amount');
      return;
    }
    if (selectedPaymentMethod === 'grubhub' && grubhubStep === 'reference') {
      setGrubhubStep('amount');
      return;
    }
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card') {
      setGiftCardStep('amount');
      return;
    }
    onClose();
  };

  const isDeliveryApp = ['doordash', 'blizzful', 'ubereats', 'grubhub'].includes(selectedPaymentMethod);
  const isInReferenceStep = (selectedPaymentMethod === 'doordash' && doordashStep === 'reference') ||
    (selectedPaymentMethod === 'blizzful' && blizzfulStep === 'reference') ||
    (selectedPaymentMethod === 'ubereats' && ubereatsStep === 'reference') ||
    (selectedPaymentMethod === 'grubhub' && grubhubStep === 'reference');

  const getCurrentReference = () => {
    if (selectedPaymentMethod === 'doordash') return doordashReference;
    if (selectedPaymentMethod === 'blizzful') return blizzfulReference;
    if (selectedPaymentMethod === 'ubereats') return ubereatsReference;
    if (selectedPaymentMethod === 'grubhub') return grubhubReference;
    return '';
  };

  const setCurrentReference = (value: string) => {
    if (selectedPaymentMethod === 'doordash') setDoordashReference(value);
    if (selectedPaymentMethod === 'blizzful') setBlizzfulReference(value);
    if (selectedPaymentMethod === 'ubereats') setUbereatsReference(value);
    if (selectedPaymentMethod === 'grubhub') setGrubhubReference(value);
  };

  const getDeliveryAppIcon = () => {
    if (selectedPaymentMethod === 'doordash') return <Truck className="w-8 h-8 text-red-500" />;
    if (selectedPaymentMethod === 'blizzful') return <Utensils className="w-8 h-8 text-blue-500" />;
    if (selectedPaymentMethod === 'ubereats') return <ShoppingBag className="w-8 h-8 text-green-500" />;
    if (selectedPaymentMethod === 'grubhub') return <UtensilsCrossed className="w-8 h-8 text-orange-500" />;
    return null;
  };

  const getDeliveryAppName = () => {
    if (selectedPaymentMethod === 'doordash') return 'DoorDash';
    if (selectedPaymentMethod === 'blizzful') return 'Blizzful';
    if (selectedPaymentMethod === 'ubereats') return 'UberEats';
    if (selectedPaymentMethod === 'grubhub') return 'Grubhub';
    return '';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-neutral-900 rounded-xl border border-neutral-700 flex overflow-hidden mx-4 animate-scale-in max-h-[90vh]">
        <div className="w-[480px] flex flex-col bg-neutral-900 max-h-[90vh] overflow-hidden">
          {paymentProcessed ? (
            /* Receipt View */
            <>
              {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                <>
                  {/* Success Header */}
                  <div className="flex flex-col items-center py-8 px-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-neutral-300 text-sm">
                      <span className="text-green-500 font-medium">${paidAmount.toFixed(2)}</span> has been successfully processed
                    </p>
                  </div>

                  {/* Change Due / Due Amount Box */}
                  {paidAmount >= totalAmount ? (
                    <div className="mx-6 mb-6 border-2 border-green-500 rounded-lg p-4 bg-green-500/10">
                      <p className="text-green-500 text-sm text-center mb-1">Change Due</p>
                      <p className="text-green-500 text-3xl font-bold text-center">
                        ${(paidAmount - totalAmount).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div className="mx-6 mb-6 border-2 border-red-500 rounded-lg p-4 bg-red-500/10">
                      <p className="text-red-500 text-sm text-center mb-1">Due Amount</p>
                      <p className="text-red-500 text-3xl font-bold text-center">
                        ${(totalAmount - paidAmount).toFixed(2)}
                      </p>
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
                      onClick={() => {
                        setPaymentProcessed(false);
                        onClose();
                      }}
                      className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      NO RECEIPT
                    </button>
                  </div>
                </>
              ) : textReceiptStep === 'phone-input' ? (
                /* Text Receipt Phone Input */
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
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'
                        }`}
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
                        setPaymentProcessed(false);
                        onClose();
                      }}
                      disabled={textReceiptPhone.replace(/\D/g, '').length < 10}
                      className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      SEND
                    </button>
                  </div>
                  {/* Keypad */}
                  <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden">
                    <div className="grid grid-cols-3 h-full">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (key === '⌫') {
                              const digits = textReceiptPhone.replace(/\D/g, '');
                              if (digits.length > 0) {
                                const newDigits = digits.slice(0, -1);
                                let formatted = '';
                                if (newDigits.length > 0) {
                                  formatted = '(' + newDigits.slice(0, 3);
                                  if (newDigits.length >= 3) formatted += ') ' + newDigits.slice(3, 6);
                                  if (newDigits.length >= 6) formatted += '-' + newDigits.slice(6, 10);
                                }
                                setTextReceiptPhone(formatted);
                              }
                            } else if (key !== '') {
                              const digits = textReceiptPhone.replace(/\D/g, '');
                              if (digits.length < 10) {
                                const newDigits = digits + key;
                                let formatted = '(' + newDigits.slice(0, 3);
                                if (newDigits.length >= 3) formatted += ') ' + newDigits.slice(3, 6);
                                if (newDigits.length >= 6) formatted += '-' + newDigits.slice(6, 10);
                                setTextReceiptPhone(formatted);
                              }
                            }
                          }}
                          disabled={key === ''}
                          className="py-2 flex items-center justify-center hover:bg-neutral-700 transition-colors border-b border-r border-neutral-700 active:bg-neutral-600 disabled:opacity-0"
                        >
                          {key === '⌫' ? <Delete className="w-5 h-5 text-neutral-400" /> : <span className="text-white text-xl font-light">{key}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Receipt Input */
                <div className="flex flex-col p-6">
                  <div className="flex items-center mb-4">
                    <button 
                      onClick={() => setEmailReceiptStep('receipt')}
                      className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <h2 className="text-white text-base font-semibold text-center mb-4">Where should we email your receipt?</h2>
                  <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden mb-4">
                    <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600">
                      <Mail className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={emailReceiptEmail}
                      onChange={(e) => setEmailReceiptEmail(e.target.value)}
                      className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <div 
                      onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'
                      }`}
                    >
                      {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                  </label>
                  <button 
                    onClick={() => {
                      setEmailReceiptStep('receipt');
                      setPaymentProcessed(false);
                      onClose();
                    }}
                    disabled={!emailReceiptEmail.includes('@')}
                    className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    SEND
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Payment Input View */
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                <button 
                  onClick={handleBack}
                  className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
                <span className="text-white font-medium">
                  {isInReferenceStep ? `${getDeliveryAppName()} Reference` : 
                   selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card' ? 'Enter Gift Card' :
                   'Payment'}
                </span>
                <button 
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Payment Methods */}
              {!isInReferenceStep && !(selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card') && (
                <div className="p-3 border-b border-neutral-700">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {visiblePaymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedPaymentMethod(method.id);
                          if (method.id === 'gift-card') setGiftCardStep('amount');
                          if (method.id === 'doordash') setDoordashStep('amount');
                          if (method.id === 'blizzful') setBlizzfulStep('amount');
                          if (method.id === 'ubereats') setUbereatsStep('amount');
                          if (method.id === 'grubhub') setGrubhubStep('amount');
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                          selectedPaymentMethod === method.id
                            ? 'bg-white text-black'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        <method.icon className="w-4 h-4" />
                        {method.name}
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowOtherPayments(!showOtherPayments)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors"
                      >
                        Other
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {showOtherPayments && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10 overflow-hidden">
                          {dropdownPaymentMethods.map(method => (
                            <button
                              key={method.id}
                              onClick={() => handleSelectFromDropdown(method)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                            >
                              <method.icon className="w-4 h-4" />
                              {method.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Display */}
              <div className="p-4 text-center">
                <div className="text-neutral-400 text-sm mb-1">Total: ${totalAmount.toFixed(2)}</div>
                {isInReferenceStep ? (
                  <div className="flex flex-col items-center gap-2">
                    {getDeliveryAppIcon()}
                    <span className="text-white text-lg font-medium">{getDeliveryAppName()} Order Reference</span>
                    <input
                      type="text"
                      value={getCurrentReference()}
                      onChange={(e) => setCurrentReference(e.target.value)}
                      placeholder="Enter reference number"
                      className="w-full max-w-xs bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-center text-lg placeholder:text-neutral-500 outline-none focus:border-neutral-500"
                    />
                  </div>
                ) : selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Gift className="w-8 h-8 text-purple-500" />
                    <span className="text-white text-lg font-medium">Gift Card Number</span>
                    <input
                      type="text"
                      value={giftCardNumber}
                      onChange={(e) => setGiftCardNumber(e.target.value)}
                      placeholder="Enter card number"
                      className="w-full max-w-xs bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-center text-lg placeholder:text-neutral-500 outline-none focus:border-neutral-500"
                    />
                  </div>
                ) : (
                  <div className="text-white text-4xl font-bold">${paymentAmount || '0.00'}</div>
                )}
              </div>

              {/* Quick Amounts - Only show for cash/card methods */}
              {!isDeliveryApp && !['gift-card', 'loyalty', 'pay-link', 'qr-code'].includes(selectedPaymentMethod) && !showKeypad && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => handleAddAmount(amount)}
                        className="relative bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-medium transition-colors"
                      >
                        ${amount}
                        {amountQuantities[amount] && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center font-bold">
                            {amountQuantities[amount]}
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowKeypad(true)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      #
                    </button>
                  </div>
                  {/* Selected amounts */}
                  {Object.keys(amountQuantities).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(amountQuantities).map(([amount, qty]) => (
                        <button
                          key={amount}
                          onClick={() => handleRemoveAmount(parseFloat(amount))}
                          className="flex items-center gap-1 bg-neutral-700 text-white px-2 py-1 rounded-full text-sm"
                        >
                          ${amount} x{qty}
                          <X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Keypad - Show for delivery apps always, or when toggled */}
              {(showKeypad || isDeliveryApp || ['gift-card', 'loyalty'].includes(selectedPaymentMethod)) && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map(key => (
                      <button
                        key={key}
                        onClick={() => {
                          if (isInReferenceStep) {
                            if (key === 'C') {
                              setCurrentReference('');
                            } else {
                              setCurrentReference(getCurrentReference() + key);
                            }
                          } else if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card') {
                            if (key === 'C') {
                              setGiftCardNumber('');
                            } else {
                              setGiftCardNumber(giftCardNumber + key);
                            }
                          } else {
                            handleKeypadPress(key);
                          }
                        }}
                        className={`h-12 rounded-xl text-lg font-medium transition-colors ${
                          key === 'C'
                            ? 'bg-neutral-800 border border-neutral-700 text-destructive hover:bg-neutral-700'
                            : 'bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  {!isDeliveryApp && !['gift-card', 'loyalty'].includes(selectedPaymentMethod) && (
                    <button
                      onClick={() => setShowKeypad(false)}
                      className="w-full mt-2 py-2 text-neutral-400 text-sm hover:text-white transition-colors"
                    >
                      Show quick amounts
                    </button>
                  )}
                </div>
              )}

              {/* Charge Button */}
              <div className="p-4 border-t border-neutral-700 mt-auto">
                <button
                  onClick={handleCharge}
                  className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  {isInReferenceStep ? 'CONTINUE' : `CHARGE $${paymentAmount || '0.00'}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
