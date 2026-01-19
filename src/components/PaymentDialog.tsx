import { useState, useEffect } from "react";
import { 
  Check, ChevronDown, X, Tag, CreditCard, User, Gift, Link, QrCode, 
  ArrowRightCircle, Banknote, Grid3X3, Delete, Printer, MessageSquare, 
  Mail, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, 
  UtensilsCrossed, ArrowLeft, UserPlus, Search, Phone, AlertTriangle, 
  RefreshCw, Send, Zap, Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import tickSuccessIcon from "@/assets/icons/tick-success.svg";

// ============= TYPES =============
export interface PaymentDialogOrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
}

export interface PaymentDialogOrderDetails {
  guest?: string;
  phone?: string;
  table?: string;
  check?: number | string;
  items: PaymentDialogOrderItem[];
}

export interface PaymentHistoryItem {
  method: string;
  amount: number;
  methodLabel: string;
}

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetails: PaymentDialogOrderDetails;
  subtotal: number;
  tax: number;
  total: number;
  onPaymentComplete?: (paymentHistory: PaymentHistoryItem[]) => void;
}

// ============= CONSTANTS =============
interface GuestType {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  loyaltyPoints?: number;
}

const mockGuests: GuestType[] = [
  { name: "Ayden Veum", phone: "(346) 346-3636", email: "cow@user.com", avatar: "AV", loyaltyPoints: 850 },
  { name: "Arjun Gerhold", phone: "(574) 747-3634", email: "cow@user.com", avatar: "AG", loyaltyPoints: 1250 },
  { name: "Bergnaum", phone: "(643) 636-4377", email: "abc@gmail.com", avatar: "B", loyaltyPoints: 320 },
  { name: "Cleora Hills", phone: "(100) 000-0000", email: "cleorahills@gmail.com", avatar: "CH", loyaltyPoints: 1580 },
  { name: "Eden Kautzer", phone: "(353) 253-2523", email: "dog@Test.com", avatar: "EK", loyaltyPoints: 920 },
  { name: "Wunderlich", phone: "(234) 235-2323", email: "alaskanm@dog.com", avatar: "W", loyaltyPoints: 450 },
  { name: "Simeon Wilderman", phone: "(643) 634-6334", email: "dominate@user.com", avatar: "SW", loyaltyPoints: 2100 },
  { name: "Gino Yost", phone: "(234) 254-3235", email: "dominate@user.com", avatar: "GY", loyaltyPoints: 680 },
  { name: "Miss Estrella", phone: "(643) 634-6352", email: "guest@synd.com", avatar: "ME", loyaltyPoints: 1100 },
  { name: "Teresa Barton", phone: "(325) 235-2324", email: "Rem@user.com", avatar: "TB", loyaltyPoints: 780 },
];

type PaymentMethodType = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

const initialPaymentMethods: PaymentMethodType[] = [
  { id: 'loyalty', name: 'Loyalty', icon: Tag },
  { id: 'account', name: 'Account', icon: User },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'gift-card', name: 'Gift Card', icon: Gift },
  { id: 'pay-link', name: 'Pay by Link', icon: Link },
];

const initialOtherPaymentMethods: PaymentMethodType[] = [
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'manual-card', name: 'Manual card', icon: Clipboard },
  { id: 'blizzful', name: 'Blizzful', icon: Utensils },
  { id: 'ubereats', name: 'UberEats', icon: ShoppingBag },
  { id: 'doordash', name: 'DoorDash', icon: Truck },
  { id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed },
];

const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

// ============= COMPONENT =============
export function PaymentDialog({
  open,
  onOpenChange,
  orderDetails,
  subtotal,
  tax,
  total,
  onPaymentComplete,
}: PaymentDialogProps) {
  // Core payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [amountQuantities, setAmountQuantities] = useState<Record<number, number>>({});
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);

  // Dynamic payment methods
  const [visiblePaymentMethods, setVisiblePaymentMethods] = useState<PaymentMethodType[]>(initialPaymentMethods);
  const [dropdownPaymentMethods, setDropdownPaymentMethods] = useState<PaymentMethodType[]>(initialOtherPaymentMethods);

  // Gift Card states
  const [giftCardStep, setGiftCardStep] = useState<'amount' | 'enter-card' | 'processing'>('amount');
  const [giftCardNumber, setGiftCardNumber] = useState('');

  // Pay by Link states
  const [payByLinkStep, setPayByLinkStep] = useState<'amount' | 'select-guest' | 'add-guest' | 'guest-confirmed' | 'pending' | 'expired' | 'complete'>('amount');
  const [selectedGuest, setSelectedGuest] = useState<GuestType | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [sendLinkMethod, setSendLinkMethod] = useState<'text' | 'email'>('text');
  const [newGuestForLink, setNewGuestForLink] = useState({ name: '', phone: '', email: '' });
  const [hoveredGuestIndex, setHoveredGuestIndex] = useState<number | null>(null);

  // QR Code states
  const [qrCodeStep, setQrCodeStep] = useState<'amount' | 'qr-display' | 'pending' | 'complete'>('amount');
  const [qrPhoneNumber, setQrPhoneNumber] = useState('');
  const [showQrPhoneInput, setShowQrPhoneInput] = useState(false);

  // Loyalty states
  const [loyaltyStep, setLoyaltyStep] = useState<'guest-list' | 'guest-selected' | 'points-input' | 'otp' | 'complete'>('guest-list');
  const [loyaltySelectedGuest, setLoyaltySelectedGuest] = useState<GuestType | null>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState('');
  const [showLoyaltyAddGuest, setShowLoyaltyAddGuest] = useState(false);
  const [loyaltyNewGuest, setLoyaltyNewGuest] = useState({ name: '', phone: '', email: '' });
  const [loyaltyOtp, setLoyaltyOtp] = useState(['', '', '', '']);
  const [loyaltySearchQuery, setLoyaltySearchQuery] = useState('');
  const [showLoyaltyKeypad, setShowLoyaltyKeypad] = useState(false);

  // Manual CC states
  const [manualCCStep, setManualCCStep] = useState<'amount' | 'tap-card' | 'processing' | 'complete'>('amount');

  // External CC states
  const [externalCCStep, setExternalCCStep] = useState<'amount' | 'complete'>('amount');

  // Manual Card states
  const [manualCardStep, setManualCardStep] = useState<'amount' | 'card-details' | 'complete'>('amount');
  const [manualCardDetails, setManualCardDetails] = useState({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });

  // Delivery services states
  const [doordashStep, setDoordashStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [doordashReference, setDoordashReference] = useState('');
  const [blizzfulStep, setBlizzfulStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [blizzfulReference, setBlizzfulReference] = useState('');
  const [ubereatsStep, setUbereatsStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [ubereatsReference, setUbereatsReference] = useState('');
  const [grubhubStep, setGrubhubStep] = useState<'amount' | 'reference' | 'complete'>('amount');
  const [grubhubReference, setGrubhubReference] = useState('');

  // Receipt states
  const [textReceiptStep, setTextReceiptStep] = useState<'receipt' | 'phone-input'>('receipt');
  const [textReceiptPhone, setTextReceiptPhone] = useState('');
  const [textReceiptNoMarketing, setTextReceiptNoMarketing] = useState(false);
  const [emailReceiptStep, setEmailReceiptStep] = useState<'receipt' | 'email-input'>('receipt');
  const [emailReceiptEmail, setEmailReceiptEmail] = useState('');
  const [emailReceiptNoMarketing, setEmailReceiptNoMarketing] = useState(false);

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentAmount(total.toFixed(2));
      setPaymentProcessed(false);
      setShowKeypad(false);
      setShowOtherPayments(false);
      setAmountQuantities({});
      setPaymentHistory([]);
      setPaidAmount(0);
      setSelectedPaymentMethod('cash');
      setGiftCardStep('amount');
      setGiftCardNumber('');
      setPayByLinkStep('amount');
      setSelectedGuest(null);
      setQrCodeStep('amount');
      setLoyaltyStep('guest-list');
      setManualCCStep('amount');
      setExternalCCStep('amount');
      setManualCardStep('amount');
      setDoordashStep('amount');
      setBlizzfulStep('amount');
      setUbereatsStep('amount');
      setGrubhubStep('amount');
      setTextReceiptStep('receipt');
      setEmailReceiptStep('receipt');
    }
  }, [open, total]);

  // Calculate payment amount from quantities
  useEffect(() => {
    const totalFromQuantities = Object.entries(amountQuantities).reduce((sum, [amount, qty]) => {
      return sum + parseFloat(amount) * qty;
    }, 0);
    if (totalFromQuantities > 0) {
      setPaymentAmount(totalFromQuantities.toFixed(2));
    }
  }, [amountQuantities]);

  // Keypad handler
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

  // Gift card keypad handler
  const handleGiftCardKeypadPress = (key: string) => {
    if (key === 'C') {
      setGiftCardNumber('');
    } else if (giftCardNumber.replace(/\s/g, '').length < 16) {
      setGiftCardNumber(prev => prev.replace(/\s/g, '') + key);
    }
  };

  // Amount handlers
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

  // Handle selecting from dropdown
  const handleSelectFromDropdown = (selectedMethod: PaymentMethodType) => {
    const lastVisibleMethod = visiblePaymentMethods[visiblePaymentMethods.length - 1];
    const newDropdownMethods = dropdownPaymentMethods.filter(m => m.id !== selectedMethod.id);
    newDropdownMethods.unshift(lastVisibleMethod);
    const newVisibleMethods = [selectedMethod, ...visiblePaymentMethods.slice(0, -1)];
    
    setVisiblePaymentMethods(newVisibleMethods);
    setDropdownPaymentMethods(newDropdownMethods);
    setSelectedPaymentMethod(selectedMethod.id);
    setShowOtherPayments(false);
    
    // Reset steps for special payment methods
    if (selectedMethod.id === 'manual-cc') setManualCCStep('amount');
    if (selectedMethod.id === 'external-cc') setExternalCCStep('amount');
    if (selectedMethod.id === 'manual-card') {
      setManualCardStep('amount');
      setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
    }
    if (selectedMethod.id === 'doordash') {
      setDoordashStep('amount');
      setDoordashReference('');
    }
    if (selectedMethod.id === 'blizzful') {
      setBlizzfulStep('amount');
      setBlizzfulReference('');
    }
    if (selectedMethod.id === 'ubereats') {
      setUbereatsStep('amount');
      setUbereatsReference('');
    }
    if (selectedMethod.id === 'grubhub') {
      setGrubhubStep('amount');
      setGrubhubReference('');
    }
  };

  // Get method label for history
  const getMethodLabel = (methodId: string) => {
    const allMethods = [...visiblePaymentMethods, ...dropdownPaymentMethods];
    return allMethods.find(m => m.id === methodId)?.name || methodId;
  };

  // Handle charge/process payment
  const handleChargePayment = () => {
    // For DoorDash, go to reference step first
    if (selectedPaymentMethod === 'doordash' && doordashStep === 'amount') {
      setDoordashStep('reference');
      return;
    }
    
    const amount = parseFloat(paymentAmount) || 0;
    const methodLabel = getMethodLabel(selectedPaymentMethod);
    
    setPaymentHistory(prev => [...prev, { method: selectedPaymentMethod, amount, methodLabel }]);
    setPaidAmount(prev => prev + amount);
    setPaymentProcessed(true);
  };

  // Handle close and complete
  const handleComplete = () => {
    onPaymentComplete?.(paymentHistory);
    onOpenChange(false);
  };

  // Calculate remaining due
  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const remainingDue = total - totalPaid;
  const isFullyPaid = remainingDue <= 0;

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-neutral-900 rounded-xl border border-neutral-700 flex overflow-hidden mx-4 animate-scale-in max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel - Payment Methods & Keypad */}
        <div className="w-[480px] flex flex-col bg-neutral-900 max-h-[90vh] overflow-hidden">
          {paymentProcessed ? (
            // Receipt Screen
            <div className="flex-1 flex flex-col items-center py-8 px-6">
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <img src={tickSuccessIcon} alt="Success" className="w-10 h-10" />
              </div>
              
              <p className="text-neutral-300 text-sm mb-6">
                <span className="text-green-500 font-medium">${totalPaid.toFixed(2)}</span> has been successfully processed
              </p>

              {/* Change Due / Due Amount Box */}
              {isFullyPaid ? (
                <div className="w-full max-w-xs mb-6 border-2 border-green-500 rounded-lg p-4 bg-green-500/10">
                  <p className="text-green-500 text-sm text-center mb-1">Change Due</p>
                  <p className="text-green-500 text-3xl font-bold text-center">
                    ${Math.abs(remainingDue).toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-xs mb-4 border-2 border-red-500 rounded-lg p-4 bg-red-500/10">
                  <p className="text-red-500 text-sm text-center mb-1">Due Amount</p>
                  <p className="text-red-500 text-3xl font-bold text-center">
                    ${remainingDue.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Pay Remaining Button - Show when there's still due amount */}
              {!isFullyPaid && (
                <div className="w-full max-w-xs mb-6">
                  <button
                    onClick={() => {
                      setPaymentAmount(remainingDue.toFixed(2));
                      setPaymentProcessed(false);
                      setSelectedPaymentMethod('cash');
                      setAmountQuantities({});
                      setGiftCardStep('amount');
                      setGiftCardNumber('');
                      setPayByLinkStep('amount');
                      setQrCodeStep('amount');
                      setManualCCStep('amount');
                      setExternalCCStep('amount');
                      setManualCardStep('amount');
                      setDoordashStep('amount');
                      setBlizzfulStep('amount');
                      setUbereatsStep('amount');
                      setGrubhubStep('amount');
                    }}
                    className="w-full py-3.5 bg-gradient-to-b from-orange-400 to-orange-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all shadow-lg"
                  >
                    PAY REMAINING ${remainingDue.toFixed(2)}
                  </button>
                </div>
              )}

              {/* Receipt Section */}
              <div className="w-full max-w-xs">
                <h3 className="text-white font-semibold text-center mb-4">Receipt</h3>
                <div className="flex gap-4 justify-center mb-4">
                  <button 
                    onClick={handleComplete}
                    className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Printer className="w-6 h-6 text-neutral-400" />
                    <span className="text-neutral-400 text-sm">Print</span>
                  </button>
                  <button 
                    onClick={() => setTextReceiptStep('phone-input')}
                    className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <MessageSquare className="w-6 h-6 text-neutral-400" />
                    <span className="text-neutral-400 text-sm">Text</span>
                  </button>
                  <button 
                    onClick={() => setEmailReceiptStep('email-input')}
                    className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Mail className="w-6 h-6 text-neutral-400" />
                    <span className="text-neutral-400 text-sm">Email</span>
                  </button>
                </div>
                <button 
                  onClick={handleComplete}
                  className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  NO RECEIPT
                </button>
              </div>
            </div>
          ) : (
            // Payment Entry View
            <>
              {/* Header */}
              <div className="flex items-center justify-center py-6 border-b border-neutral-700">
                <span className="text-white text-lg font-medium">Total Due</span>
                <span className="text-red-500 text-lg font-bold ml-2">${total.toFixed(2)}</span>
              </div>

              {/* Payment Methods */}
              <div className="p-6 border-b border-neutral-700">
                <div className="flex justify-center gap-4">
                  {visiblePaymentMethods.map(method => {
                    const IconComponent = method.icon;
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <button 
                        key={method.id}
                        onClick={() => {
                          setSelectedPaymentMethod(method.id);
                          setShowOtherPayments(false);
                          if (method.id === 'card' || method.id === 'gift-card' || method.id === 'pay-link') {
                            setShowKeypad(true);
                          }
                          if (method.id === 'gift-card') {
                            setGiftCardStep('amount');
                            setGiftCardNumber('');
                          }
                          if (method.id === 'pay-link') {
                            setPayByLinkStep('amount');
                            setSelectedGuest(null);
                            setGuestSearchQuery('');
                          }
                          if (method.id === 'loyalty') {
                            setLoyaltyStep('guest-list');
                          }
                        }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${isSelected ? 'bg-white border-white' : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'}`}>
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-neutral-900' : 'text-neutral-300'}`} />
                        </div>
                        <span className={`text-[11px] ${isSelected ? 'text-white font-medium' : 'text-neutral-400'}`}>
                          {method.name}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* "Other" button */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowOtherPayments(!showOtherPayments)}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${showOtherPayments ? 'bg-white border-white' : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'}`}>
                        <ArrowRightCircle className={`w-5 h-5 ${showOtherPayments ? 'text-neutral-900' : 'text-neutral-300'}`} />
                      </div>
                      <span className={`text-[11px] ${showOtherPayments ? 'text-white font-medium' : 'text-neutral-400'}`}>
                        Other
                      </span>
                    </button>
                    
                    {/* Dropdown */}
                    {showOtherPayments && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setShowOtherPayments(false)} />
                        <div className="absolute top-full right-0 mt-2 z-[101] bg-neutral-800 rounded-lg border border-neutral-600 p-4 shadow-xl min-w-[420px]">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-white font-medium">Other Payment Methods</span>
                            <button onClick={() => setShowOtherPayments(false)} className="w-6 h-6 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors">
                              <X className="w-4 h-4 text-neutral-400" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-6 gap-3 mb-3">
                            {dropdownPaymentMethods.slice(0, 6).map(otherMethod => {
                              const OtherIcon = otherMethod.icon;
                              return (
                                <button 
                                  key={otherMethod.id}
                                  onClick={() => handleSelectFromDropdown(otherMethod)}
                                  className="flex flex-col items-center gap-1"
                                >
                                  <div className="w-12 h-12 rounded-full bg-neutral-700 border border-neutral-600 hover:border-neutral-500 flex items-center justify-center transition-colors">
                                    <OtherIcon className="w-5 h-5 text-neutral-300" />
                                  </div>
                                  <span className="text-[10px] text-neutral-400 text-center leading-tight">{otherMethod.name}</span>
                                </button>
                              );
                            })}
                          </div>
                          
                          {dropdownPaymentMethods.length > 6 && (
                            <div className="flex justify-center gap-3">
                              {dropdownPaymentMethods.slice(6).map(otherMethod => {
                                const OtherIcon = otherMethod.icon;
                                return (
                                  <button 
                                    key={otherMethod.id}
                                    onClick={() => handleSelectFromDropdown(otherMethod)}
                                    className="flex flex-col items-center gap-1"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-neutral-700 border border-neutral-600 hover:border-neutral-500 flex items-center justify-center transition-colors">
                                      <OtherIcon className="w-5 h-5 text-neutral-300" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 text-center leading-tight">{otherMethod.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              <div className="px-6 py-4 border-b border-neutral-700">
                <div className="flex items-center justify-center gap-2 bg-neutral-800 rounded-lg px-4 py-4">
                  <span className="flex-1 text-green-500 text-2xl font-bold text-center">${paymentAmount}</span>
                  {selectedPaymentMethod !== 'card' && selectedPaymentMethod !== 'gift-card' && selectedPaymentMethod !== 'pay-link' && selectedPaymentMethod !== 'loyalty' && (
                    <button 
                      onClick={() => setShowKeypad(!showKeypad)}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${showKeypad ? 'bg-white border-white' : 'bg-neutral-700 border-neutral-600 hover:bg-neutral-600'}`}
                    >
                      <Grid3X3 className={`w-5 h-5 ${showKeypad ? 'text-neutral-900' : 'text-neutral-300'}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* DoorDash Flow */}
              {selectedPaymentMethod === 'doordash' && doordashStep !== 'amount' ? (
                <div className="flex-1 flex flex-col">
                  {doordashStep === 'reference' && (
                    <div className="flex-1 flex flex-col">
                      {/* Back Button */}
                      <div className="px-4 pt-2">
                        <button 
                          onClick={() => setDoordashStep('amount')}
                          className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5 text-neutral-300" />
                        </button>
                      </div>

                      {/* DoorDash Logo */}
                      <div className="flex justify-center py-6">
                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                          <Truck className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Reference Number Label */}
                      <div className="px-4 mb-1">
                        <span className="text-neutral-400 text-xs">Reference number</span>
                      </div>

                      {/* Reference Number Input */}
                      <div className="px-4 mb-3">
                        <div className="bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-700">
                          <span className="text-white text-base font-medium">
                            {doordashReference.replace(/(.{4})/g, '$1 ').trim() || 'Enter reference number'}
                          </span>
                        </div>
                      </div>

                      {/* Keypad */}
                      <div className="flex-1 px-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'C'].map(key => (
                            <button 
                              key={key}
                              onClick={() => {
                                if (key === 'C') {
                                  setDoordashReference('');
                                } else {
                                  setDoordashReference(doordashReference + key);
                                }
                              }}
                              className={`h-12 rounded-xl text-lg font-medium transition-colors ${
                                key === 'C' 
                                  ? 'bg-neutral-800 border border-neutral-700 text-red-500 hover:bg-neutral-700' 
                                  : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 active:bg-neutral-600'
                              }`}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Continue Button */}
                      <div className="p-4">
                        <button 
                          onClick={() => {
                            const paid = parseFloat(paymentAmount) || 0;
                            setPaidAmount(prev => prev + paid);
                            setPaymentHistory(prev => [...prev, { method: 'doordash', amount: paid, methodLabel: 'DoorDash' }]);
                            setDoordashStep('complete');
                          }}
                          disabled={!doordashReference}
                          className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${
                            doordashReference 
                              ? 'bg-white hover:bg-neutral-200 text-neutral-900' 
                              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          CONTINUE
                        </button>
                      </div>
                    </div>
                  )}

                  {doordashStep === 'complete' && (
                    <>
                      {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                          {/* Back Button */}
                          <div className="absolute top-4 left-4">
                            <button 
                              onClick={() => setDoordashStep('amount')}
                              className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                            >
                              <ArrowLeft className="w-5 h-5 text-neutral-300" />
                            </button>
                          </div>

                          {/* Success Icon */}
                          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <img src={tickSuccessIcon} alt="Success" className="w-12 h-12" />
                          </div>
                          
                          <p className="text-center mb-2">
                            <span className="text-green-500 font-bold text-lg">${(parseFloat(paymentAmount) || 0).toFixed(2)}</span>
                            <span className="text-neutral-400 text-sm"> has been successfully processed</span>
                          </p>
                          
                          <p className="text-neutral-400 text-sm text-center mb-6">
                            DoorDash Ref: {doordashReference.replace(/(.{4})/g, '$1 ').trim()}
                          </p>

                          {/* Receipt Options */}
                          <div className="w-full max-w-xs">
                            <h3 className="text-white font-semibold text-center mb-4">Receipt</h3>
                            <div className="flex gap-4 justify-center mb-4">
                              <button 
                                onClick={handleComplete}
                                className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                              >
                                <Printer className="w-6 h-6 text-neutral-400" />
                                <span className="text-neutral-400 text-sm">Print</span>
                              </button>
                              <button 
                                onClick={() => setTextReceiptStep('phone-input')}
                                className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                              >
                                <MessageSquare className="w-6 h-6 text-neutral-400" />
                                <span className="text-neutral-400 text-sm">Text</span>
                              </button>
                              <button 
                                onClick={() => setEmailReceiptStep('email-input')}
                                className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                              >
                                <Mail className="w-6 h-6 text-neutral-400" />
                                <span className="text-neutral-400 text-sm">Email</span>
                              </button>
                            </div>
                            <button 
                              onClick={handleComplete}
                              className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                              NO RECEIPT
                            </button>
                          </div>
                        </div>
                      ) : textReceiptStep === 'phone-input' ? (
                        <div className="flex-1 flex flex-col px-6 py-6">
                          <button 
                            onClick={() => setTextReceiptStep('receipt')}
                            className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors mb-4"
                          >
                            <ArrowLeft className="w-5 h-5 text-neutral-300" />
                          </button>
                          <h3 className="text-white font-semibold text-center mb-4">Enter Phone Number</h3>
                          <Input
                            value={textReceiptPhone}
                            onChange={(e) => setTextReceiptPhone(e.target.value)}
                            placeholder="(555) 555-5555"
                            className="mb-4 bg-neutral-800 border-neutral-700 text-white"
                          />
                          <button 
                            onClick={handleComplete}
                            className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-900 font-bold rounded-xl transition-colors"
                          >
                            SEND RECEIPT
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col px-6 py-6">
                          <button 
                            onClick={() => setEmailReceiptStep('receipt')}
                            className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors mb-4"
                          >
                            <ArrowLeft className="w-5 h-5 text-neutral-300" />
                          </button>
                          <h3 className="text-white font-semibold text-center mb-4">Enter Email Address</h3>
                          <Input
                            value={emailReceiptEmail}
                            onChange={(e) => setEmailReceiptEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="mb-4 bg-neutral-800 border-neutral-700 text-white"
                          />
                          <button 
                            onClick={handleComplete}
                            className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-900 font-bold rounded-xl transition-colors"
                          >
                            SEND RECEIPT
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : selectedPaymentMethod === 'doordash' && doordashStep !== 'amount' ? (
                // DoorDash Step-by-Step Flow (separate screens)
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (textReceiptStep === 'phone-input') {
                            setTextReceiptStep('receipt');
                          } else if (emailReceiptStep === 'email-input') {
                            setEmailReceiptStep('receipt');
                          } else if (doordashStep === 'reference') {
                            setDoordashStep('amount');
                          } else if (doordashStep === 'complete') {
                            setDoordashStep('amount');
                          }
                        }} 
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Pay by DoorDash</span>
                    </div>
                  </div>

                  {/* Reference Number Entry Screen */}
                  {doordashStep === 'reference' && (
                    <div className="flex-1 flex flex-col">
                      {/* DoorDash Logo */}
                      <div className="flex justify-center py-6">
                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                          <Truck className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Reference Number Label */}
                      <div className="px-4 mb-1">
                        <span className="text-neutral-400 text-xs">Reference number</span>
                      </div>

                      {/* Reference Number Input */}
                      <div className="px-4 mb-3">
                        <div className="bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-700">
                          <span className="text-white text-base font-medium">
                            {doordashReference.replace(/(.{4})/g, '$1 ').trim() || 'Enter reference number'}
                          </span>
                        </div>
                      </div>

                      {/* Keypad */}
                      <div className="flex-1 px-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'C'].map(key => (
                            <button 
                              key={key} 
                              onClick={() => {
                                if (key === 'C') {
                                  setDoordashReference('');
                                } else {
                                  setDoordashReference(doordashReference + key);
                                }
                              }} 
                              className={`h-12 rounded-xl text-lg font-medium transition-colors ${
                                key === 'C' 
                                  ? 'bg-neutral-800 border border-neutral-700 text-red-500 hover:bg-neutral-700' 
                                  : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 active:bg-neutral-600'
                              }`}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Continue Button */}
                      <div className="p-4">
                        <button 
                          onClick={() => {
                            const paid = parseFloat(paymentAmount) || 0;
                            setPaidAmount(prev => prev + paid);
                            setDoordashStep('complete');
                          }} 
                          disabled={!doordashReference} 
                          className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${
                            doordashReference 
                              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          CONTINUE
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Complete Screen with Receipt Options */}
                  {doordashStep === 'complete' && (
                    <>
                      {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                          {/* Success Icon */}
                          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <img src={tickSuccessIcon} alt="Success" className="w-12 h-12" />
                          </div>
                          
                          <p className="text-center mb-2">
                            <span className="text-green-500 font-bold text-lg">${parseFloat(paymentAmount).toFixed(2)}</span>
                            <span className="text-neutral-400 text-sm"> has been successfully processed</span>
                          </p>
                          
                          <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
                          
                          {/* Receipt Options */}
                          <div className="flex gap-4 mb-6">
                            <button 
                              onClick={() => {
                                setPaymentHistory(prev => [...prev, { method: 'doordash', amount: parseFloat(paymentAmount), methodLabel: 'DoorDash' }]);
                                setDoordashStep('amount');
                                setDoordashReference('');
                                setPaymentProcessed(true);
                              }} 
                              className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                            >
                              <Printer className="w-6 h-6 text-neutral-300" />
                              <span className="text-neutral-300 text-xs">Print</span>
                            </button>
                            <button 
                              onClick={() => {
                                setTextReceiptPhone('');
                                setTextReceiptNoMarketing(false);
                                setTextReceiptStep('phone-input');
                              }} 
                              className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                            >
                              <MessageSquare className="w-6 h-6 text-neutral-300" />
                              <span className="text-neutral-300 text-xs">Text</span>
                            </button>
                            <button 
                              onClick={() => {
                                setEmailReceiptEmail('');
                                setEmailReceiptNoMarketing(false);
                                setEmailReceiptStep('email-input');
                              }} 
                              className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                            >
                              <Mail className="w-6 h-6 text-neutral-300" />
                              <span className="text-neutral-300 text-xs">Email</span>
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => {
                              setPaymentHistory(prev => [...prev, { method: 'doordash', amount: parseFloat(paymentAmount), methodLabel: 'DoorDash' }]);
                              setDoordashStep('amount');
                              setDoordashReference('');
                              setPaymentProcessed(true);
                            }} 
                            className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                          >
                            NO RECEIPT
                          </button>
                        </div>
                      ) : textReceiptStep === 'phone-input' ? (
                        /* Text Receipt Phone Input Screen for DoorDash */
                        <div className="flex flex-col flex-1">
                          {/* Title */}
                          <div className="px-4 pt-4 pb-2 text-center">
                            <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                          </div>

                          {/* Phone Input */}
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

                          {/* Marketing Checkbox */}
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

                          {/* Privacy Text */}
                          <div className="px-4 mb-2 text-center">
                            <p className="text-neutral-500 text-[10px] leading-relaxed">
                              Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.
                            </p>
                          </div>

                          {/* Send Button */}
                          <div className="px-4 mb-2">
                            <button 
                              onClick={() => {
                                setTextReceiptStep('receipt');
                                setPaymentHistory(prev => [...prev, { method: 'doordash', amount: parseFloat(paymentAmount), methodLabel: 'DoorDash' }]);
                                setDoordashStep('amount');
                                setDoordashReference('');
                                setPaymentProcessed(true);
                              }} 
                              disabled={textReceiptPhone.replace(/\D/g, '').length < 10} 
                              className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              SEND
                            </button>
                          </div>

                          {/* Number Keypad */}
                          <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                            <div className="grid grid-cols-3 gap-2">
                              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                                <button 
                                  key={key} 
                                  onClick={() => {
                                    if (key === 'delete') {
                                      const digits = textReceiptPhone.replace(/\D/g, '');
                                      const newDigits = digits.slice(0, -1);
                                      if (newDigits.length === 0) {
                                        setTextReceiptPhone('');
                                      } else if (newDigits.length <= 3) {
                                        setTextReceiptPhone(`(${newDigits}`);
                                      } else if (newDigits.length <= 6) {
                                        setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`);
                                      } else {
                                        setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`);
                                      }
                                    } else if (key !== '') {
                                      const digits = textReceiptPhone.replace(/\D/g, '');
                                      if (digits.length < 10) {
                                        const newDigits = digits + key;
                                        if (newDigits.length <= 3) {
                                          setTextReceiptPhone(`(${newDigits}`);
                                        } else if (newDigits.length <= 6) {
                                          setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`);
                                        } else {
                                          setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`);
                                        }
                                      }
                                    }
                                  }} 
                                  className={`h-12 rounded-lg text-lg font-medium transition-colors ${
                                    key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                  }`}
                                >
                                  {key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : emailReceiptStep === 'email-input' ? (
                        /* Email Receipt Input Screen for DoorDash */
                        <div className="flex flex-col flex-1">
                          {/* Title */}
                          <div className="px-4 pt-4 pb-2 text-center">
                            <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                          </div>

                          {/* Email Input */}
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

                          {/* Marketing Checkbox */}
                          <div className="px-4 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
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
                          </div>

                          {/* Privacy Text */}
                          <div className="px-4 mb-2 text-center">
                            <p className="text-neutral-500 text-[10px] leading-relaxed">
                              Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.
                            </p>
                          </div>

                          {/* Send Button */}
                          <div className="px-4 mb-4">
                            <button 
                              onClick={() => {
                                setEmailReceiptStep('receipt');
                                setPaymentHistory(prev => [...prev, { method: 'doordash', amount: parseFloat(paymentAmount), methodLabel: 'DoorDash' }]);
                                setDoordashStep('amount');
                                setDoordashReference('');
                                setPaymentProcessed(true);
                              }} 
                              disabled={!emailReceiptEmail.includes('@')} 
                              className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              SEND
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              ) : selectedPaymentMethod === 'loyalty' && loyaltyStep !== 'guest-list' ? (
                /* Loyalty Multi-Step Flow */
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (loyaltyStep === 'guest-selected') {
                            setLoyaltyStep('guest-list');
                            setLoyaltySelectedGuest(null);
                          } else if (loyaltyStep === 'points-input') {
                            setLoyaltyStep('guest-selected');
                            setLoyaltyPointsToRedeem('');
                          } else if (loyaltyStep === 'otp') {
                            setLoyaltyStep('points-input');
                            setLoyaltyOtp(['', '', '', '']);
                          } else if (loyaltyStep === 'complete') {
                            setLoyaltyStep('guest-list');
                            setLoyaltySelectedGuest(null);
                            setLoyaltyPointsToRedeem('');
                          }
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  {/* Guest Selected with Points Screen */}
                  {loyaltyStep === 'guest-selected' && loyaltySelectedGuest && (
                    <div className="flex flex-col overflow-hidden flex-1">
                      {/* Selected Guest Card with Points */}
                      <div className="p-3">
                        <div className="bg-neutral-800 rounded-xl p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center text-sm text-white font-medium overflow-hidden">
                              {loyaltySelectedGuest.avatar}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold text-sm">{loyaltySelectedGuest.name}</h3>
                              <div className="flex items-center gap-3 mt-0.5">
                                <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                  <Phone className="w-3 h-3" />
                                  <span>{loyaltySelectedGuest.phone}</span>
                                </div>
                                <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                  <Mail className="w-3 h-3" />
                                  <span>{loyaltySelectedGuest.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-neutral-400" />
                                  <span className="text-white text-xs font-medium">{(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} Points</span>
                                </div>
                                <span className="text-green-500 text-xs">Value ${(loyaltySelectedGuest.loyaltyPoints || 1250).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* REDEEM Button */}
                      <div className="px-3 pb-3">
                        <button 
                          onClick={() => {
                            const suggestedPoints = Math.ceil(parseFloat(paymentAmount));
                            setLoyaltyPointsToRedeem(suggestedPoints.toString());
                            setLoyaltyStep('points-input');
                          }} 
                          className="w-full py-2.5 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          REDEEM
                        </button>
                      </div>

                      {/* Remaining Guest List */}
                      <div className="flex-1 overflow-auto px-3 min-h-0 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Search Input */}
                        <div className="mb-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                            <Input 
                              type="text" 
                              placeholder="Search Guest" 
                              value={loyaltySearchQuery} 
                              onChange={e => setLoyaltySearchQuery(e.target.value)} 
                              className="w-full pl-9 py-1.5 text-sm bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                            />
                          </div>
                        </div>
                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-3 py-1.5 text-[10px] text-neutral-400 border-b border-neutral-700">
                          <span>Name</span>
                          <span>Phone Number</span>
                          <span>Email</span>
                        </div>
                        {/* Guest Rows */}
                        {mockGuests
                          .filter(g => g.name !== loyaltySelectedGuest.name)
                          .filter(guest => 
                            loyaltySearchQuery === '' || 
                            guest.name.toLowerCase().includes(loyaltySearchQuery.toLowerCase()) || 
                            guest.phone.includes(loyaltySearchQuery) || 
                            guest.email.toLowerCase().includes(loyaltySearchQuery.toLowerCase())
                          )
                          .map((guest, index) => (
                            <div 
                              key={index} 
                              onClick={() => setLoyaltySelectedGuest(guest)} 
                              className="grid grid-cols-3 gap-3 py-2 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-white font-medium">
                                  {guest.avatar}
                                </div>
                                <span className="text-white text-xs">{guest.name}</span>
                              </div>
                              <span className="text-neutral-300 text-xs flex items-center">{guest.phone}</span>
                              <span className="text-neutral-300 text-xs flex items-center truncate">{guest.email}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Points Input Screen */}
                  {loyaltyStep === 'points-input' && loyaltySelectedGuest && (
                    <div className="flex flex-col overflow-hidden flex-1">
                      {/* Selected Guest Card */}
                      <div className="p-3 border-b border-neutral-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-xs text-white font-medium overflow-hidden">
                            {loyaltySelectedGuest.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-white font-semibold text-sm">{loyaltySelectedGuest.name}</h3>
                              <div className="flex items-center gap-1 text-neutral-400 text-[10px]">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{loyaltySelectedGuest.phone}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <div className="flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-neutral-400" />
                                <span className="text-white text-xs">{(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} Points</span>
                              </div>
                              <span className="text-green-500 text-[10px]">Value ${(loyaltySelectedGuest.loyaltyPoints || 1250).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Points to Redeem */}
                      <div className="p-3 flex-1 flex flex-col">
                        <div className="mb-1.5">
                          <h4 className="text-white font-semibold text-sm">Points to Redeem</h4>
                          <p className="text-neutral-400 text-xs">Due: ${paymentAmount} (Suggested: {Math.ceil(parseFloat(paymentAmount))} pts)</p>
                        </div>

                        {/* Points Input Box */}
                        <div 
                          onClick={() => setShowLoyaltyKeypad(!showLoyaltyKeypad)} 
                          className="w-full py-2.5 px-3 bg-neutral-800 border border-neutral-600 rounded-lg text-center text-xl text-white font-medium cursor-pointer mb-1"
                        >
                          {loyaltyPointsToRedeem || '0'}
                        </div>
                        <p className="text-neutral-400 text-[10px] mb-2">Maximum: {(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} points</p>

                        {/* Keypad */}
                        {showLoyaltyKeypad && (
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <button 
                                key={num} 
                                onClick={() => setLoyaltyPointsToRedeem((loyaltyPointsToRedeem + num.toString()).slice(0, 6))} 
                                className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                {num}
                              </button>
                            ))}
                            <button 
                              onClick={() => setLoyaltyPointsToRedeem(loyaltyPointsToRedeem + '.')} 
                              className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              .
                            </button>
                            <button 
                              onClick={() => setLoyaltyPointsToRedeem((loyaltyPointsToRedeem + '0').slice(0, 6))} 
                              className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              0
                            </button>
                            <button 
                              onClick={() => setLoyaltyPointsToRedeem('')} 
                              className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-red-400 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              C
                            </button>
                          </div>
                        )}

                        {/* REDEEM Button */}
                        <button 
                          onClick={() => {
                            const points = parseInt(loyaltyPointsToRedeem) || 0;
                            if (points > 0 && points <= (loyaltySelectedGuest.loyaltyPoints || 1250)) {
                              setLoyaltyStep('otp');
                            }
                          }} 
                          disabled={!loyaltyPointsToRedeem || parseInt(loyaltyPointsToRedeem) <= 0 || parseInt(loyaltyPointsToRedeem) > (loyaltySelectedGuest.loyaltyPoints || 1250)} 
                          className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-auto ${
                            loyaltyPointsToRedeem && parseInt(loyaltyPointsToRedeem) > 0 && parseInt(loyaltyPointsToRedeem) <= (loyaltySelectedGuest.loyaltyPoints || 1250) 
                              ? 'bg-neutral-800 text-white hover:bg-neutral-700' 
                              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          REDEEM
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Verification Screen */}
                  {loyaltyStep === 'otp' && loyaltySelectedGuest && (
                    <div className="flex flex-col overflow-hidden flex-1 p-3">
                      {/* Points Summary */}
                      <div className="flex items-center justify-between py-2 border-b border-neutral-700 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          <span className="text-white text-xs">{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseInt(loyaltyPointsToRedeem || '0')).toLocaleString()} Points Available</span>
                        </div>
                        <span className="text-white text-xs">Deduct <span className="font-bold">{loyaltyPointsToRedeem}</span></span>
                      </div>

                      {/* Instructions */}
                      <p className="text-neutral-400 text-xs text-center mb-3">
                        Scan QR or enter OTP from {loyaltySelectedGuest.phone}
                      </p>

                      {/* QR Code */}
                      <div className="flex justify-center mb-4">
                        <div className="w-40 h-40 bg-white rounded-xl p-2 relative">
                          <div className="w-full h-full bg-white relative overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0.5">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`${
                                    i < 3 || (i >= 8 && i < 11) || (i >= 16 && i < 19) || 
                                    (i >= 5 && i < 8) || (i >= 13 && i < 16) || (i >= 21 && i < 24) || 
                                    (i >= 40 && i < 43) || (i >= 48 && i < 51) || (i >= 56 && i < 59) || 
                                    Math.random() > 0.6 ? 'bg-black' : 'bg-white'
                                  }`} 
                                />
                              ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-neutral-200">
                              <span className="text-black font-bold text-sm">e</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* OTP Label */}
                      <p className="text-white text-center text-base font-medium mb-3">OTP</p>

                      {/* OTP Input Boxes */}
                      <div className="flex justify-center gap-3 mb-4">
                        {[0, 1, 2, 3].map(index => (
                          <input 
                            key={index} 
                            type="text" 
                            maxLength={1} 
                            value={loyaltyOtp[index]} 
                            onChange={e => {
                              const newOtp = [...loyaltyOtp];
                              newOtp[index] = e.target.value;
                              setLoyaltyOtp(newOtp);
                              // Auto-focus next input
                              if (e.target.value && index < 3) {
                                const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                nextInput?.focus();
                              }
                            }} 
                            className="w-14 h-14 bg-neutral-800 border border-neutral-600 rounded-xl text-center text-white text-2xl font-medium focus:outline-none focus:border-white" 
                          />
                        ))}
                      </div>

                      {/* REDEEM Button */}
                      <button 
                        onClick={() => {
                          // Simulate OTP verification and complete payment
                          const points = parseInt(loyaltyPointsToRedeem) || 0;
                          setPaidAmount(points);
                          setPaymentHistory(prev => [...prev, { method: 'loyalty', amount: points, methodLabel: 'Loyalty' }]);
                          setLoyaltyStep('complete');
                        }} 
                        className="w-full py-2.5 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 mt-auto"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        REDEEM
                      </button>
                    </div>
                  )}

                  {/* Payment Complete Screen */}
                  {loyaltyStep === 'complete' && loyaltySelectedGuest && (
                    <div className="flex flex-col items-center justify-center flex-1 px-4 py-4">
                      <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <img src={tickSuccessIcon} alt="Success" className="w-8 h-8" />
                      </div>
                      <h2 className="text-white text-lg font-semibold mb-1">Payment Complete</h2>
                      <p className="text-neutral-400 text-xs mb-4">Your Payment has been Processed Successfully</p>
                      
                      <div className="w-full space-y-2 mb-4">
                        <div className="flex items-center justify-between py-1.5 border-b border-neutral-700">
                          <span className="text-neutral-400 text-xs">Points Used</span>
                          <span className="text-red-500 text-sm font-medium">-{loyaltyPointsToRedeem} points</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-neutral-700">
                          <span className="text-neutral-400 text-xs">Available point balance</span>
                          <span className="text-green-500 text-sm font-medium">{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseInt(loyaltyPointsToRedeem || '0')).toLocaleString()} points</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-neutral-700">
                          <span className="text-neutral-400 text-xs">Equivalent Value</span>
                          <span className="text-white text-sm font-medium">${((loyaltySelectedGuest.loyaltyPoints || 1250) - parseInt(loyaltyPointsToRedeem || '0')).toFixed(2)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setPaymentProcessed(true)} 
                        className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        CONTINUE
                      </button>
                    </div>
                  )}
                </>
              ) : selectedPaymentMethod === 'loyalty' && loyaltyStep === 'guest-list' ? (
                /* Loyalty Guest List Screen */
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedPaymentMethod('cash');
                          setLoyaltyStep('guest-list');
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden flex-1">
                    {/* Info Text */}
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                        <div className="w-4 h-4 rounded-full border border-neutral-400 flex items-center justify-center">
                          <span className="text-[10px]">i</span>
                        </div>
                        <span>Search guest to redeem points or add details</span>
                      </div>
                      <button 
                        onClick={() => setShowLoyaltyAddGuest(true)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-white" />
                        <span className="text-white text-xs font-medium">Add Guest</span>
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <Input 
                          type="text" 
                          placeholder="Search Guest" 
                          value={loyaltySearchQuery} 
                          onChange={e => setLoyaltySearchQuery(e.target.value)} 
                          className="w-full pl-9 py-1.5 text-sm bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                        />
                      </div>
                    </div>

                    {/* Guest List Table */}
                    <div className="flex-1 overflow-auto px-3 min-h-0 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-3 py-1.5 text-[10px] text-neutral-400 border-b border-neutral-700">
                        <span>Name</span>
                        <span>Phone Number</span>
                        <span>Email</span>
                      </div>
                      {/* Guest Rows */}
                      {mockGuests
                        .filter(guest => 
                          loyaltySearchQuery === '' || 
                          guest.name.toLowerCase().includes(loyaltySearchQuery.toLowerCase()) || 
                          guest.phone.includes(loyaltySearchQuery) || 
                          guest.email.toLowerCase().includes(loyaltySearchQuery.toLowerCase())
                        )
                        .map((guest, index) => (
                          <div 
                            key={index} 
                            onClick={() => {
                              setLoyaltySelectedGuest(guest);
                              setLoyaltyStep('guest-selected');
                            }} 
                            className="grid grid-cols-3 gap-3 py-2 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-white font-medium">
                                {guest.avatar}
                              </div>
                              <span className="text-white text-xs">{guest.name}</span>
                            </div>
                            <span className="text-neutral-300 text-xs flex items-center">{guest.phone}</span>
                            <span className="text-neutral-300 text-xs flex items-center truncate">{guest.email}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Add Guest Modal */}
                  {showLoyaltyAddGuest && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
                      <div className="bg-white rounded-xl w-[400px] overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative p-4 pb-2">
                          <button 
                            onClick={() => setShowLoyaltyAddGuest(false)} 
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <h3 className="text-black text-xl font-semibold text-center">Add Guest</h3>
                          <p className="text-neutral-500 text-sm text-center mt-1">Search for existing or add new guest information to continue with the order</p>
                        </div>

                        {/* Form Fields */}
                        <div className="p-4 space-y-3">
                          <input 
                            type="text" 
                            placeholder="Guest Name*" 
                            value={loyaltyNewGuest.name} 
                            onChange={e => setLoyaltyNewGuest({ ...loyaltyNewGuest, name: e.target.value })} 
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                          />
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-3 py-2">
                              <span className="text-lg">🇺🇸</span>
                              <span className="text-black text-sm">+1</span>
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            </div>
                            <input 
                              type="tel" 
                              placeholder="Phone Number*" 
                              value={loyaltyNewGuest.phone} 
                              onChange={e => setLoyaltyNewGuest({ ...loyaltyNewGuest, phone: e.target.value })} 
                              className="flex-1 px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                            />
                          </div>
                          <input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={loyaltyNewGuest.email} 
                            onChange={e => setLoyaltyNewGuest({ ...loyaltyNewGuest, email: e.target.value })} 
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                          />
                        </div>

                        {/* ADD Button */}
                        <div className="p-4 pt-2">
                          <button 
                            onClick={() => {
                              if (loyaltyNewGuest.name && loyaltyNewGuest.phone) {
                                const newGuest: GuestType = {
                                  name: loyaltyNewGuest.name,
                                  phone: loyaltyNewGuest.phone,
                                  email: loyaltyNewGuest.email || 'guest@example.com',
                                  avatar: loyaltyNewGuest.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                                  loyaltyPoints: 1250
                                };
                                setLoyaltySelectedGuest(newGuest);
                                setShowLoyaltyAddGuest(false);
                                setLoyaltyStep('guest-selected');
                                setLoyaltyNewGuest({ name: '', phone: '', email: '' });
                              }
                            }} 
                            disabled={!loyaltyNewGuest.name || !loyaltyNewGuest.phone} 
                            className={`w-full py-3 font-medium rounded-lg transition-colors ${
                              loyaltyNewGuest.name && loyaltyNewGuest.phone 
                                ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Quick Amounts OR Keypad */}
                  <div className="p-3 space-y-1.5 flex-1">
                    {showKeypad || selectedPaymentMethod === 'card' || selectedPaymentMethod === 'gift-card' || selectedPaymentMethod === 'pay-link' ? (
                      // Numeric Keypad
                      <div className="flex flex-col gap-1.5">
                        {[['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']].map((row, rowIndex) => (
                          <div key={rowIndex} className="flex gap-1.5">
                            {row.map(key => (
                              <button 
                                key={key}
                                onClick={() => handleKeypadPress(key)}
                                className="flex-1 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                {key}
                              </button>
                            ))}
                          </div>
                        ))}
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleKeypadPress('.')}
                            className="flex-1 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                          >
                            .
                          </button>
                          <button 
                            onClick={() => handleKeypadPress('0')}
                            className="flex-1 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                          >
                            0
                          </button>
                          <button 
                            onClick={() => handleKeypadPress('backspace')}
                            className="flex-1 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors flex items-center justify-center"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Quick Amount Buttons with quantity tracking - 2 row layout
                      <>
                        <div className="flex gap-4 px-2">
                          <div className="flex-1 relative py-1">
                            <button 
                              onClick={() => {
                                setAmountQuantities({});
                                setPaymentAmount(total.toFixed(2));
                              }} 
                              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                                paymentAmount === total.toFixed(2) && Object.keys(amountQuantities).length === 0 
                                  ? 'bg-neutral-900 text-white border border-neutral-600' 
                                  : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                              }`}
                            >
                              ${total.toFixed(2)}
                            </button>
                          </div>
                          {quickAmounts.slice(0, 3).map(amount => {
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
                        <div className="flex gap-4 px-2">
                          {quickAmounts.slice(3).map(amount => {
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
                      onClick={handleChargePayment}
                      className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      CHARGE ${paymentAmount}
                    </button>
                  </div>
                </>
              )}
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
          {/* Guest Info Header - Matching Order Panel Style */}
          <div 
            className="p-3 border-b border-neutral-600 rounded-t-xl" 
            style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
          >
            {/* Row 1: Name, Phone, Time */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{orderDetails.guest || "Guest"}</h3>
              {orderDetails.phone && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{orderDetails.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-neutral-300 text-xs">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
            
            {/* Row 2: Table, Guests, Server */}
            <div className="flex items-center justify-between mt-3">
              {orderDetails.table && (
                <span 
                  className="text-white text-[10px] font-medium px-2 py-1 rounded" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  TABLE {orderDetails.table}
                </span>
              )}
              <div className="flex items-center gap-2 text-neutral-300">
                <Users className="w-3 h-3" />
                <span className="text-xs">4</span>
                <span className="text-white font-medium text-xs ml-1">10</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <User className="w-3 h-3" />
                <span className="text-xs">SERVER</span>
              </div>
            </div>
          </div>

          {/* Check Info with PAID/PARTIAL stamp when processed */}
          <div className="mx-3 mt-3 bg-neutral-800 rounded-lg p-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">Check {orderDetails.check || "1"}</span>
              <span className="text-white font-bold">${total.toFixed(2)}</span>
            </div>
            {isFullyPaid && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                PAID
              </span>
            )}
            {paymentHistory.length > 0 && !isFullyPaid && (
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
            {orderDetails.items.map(item => (
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
                      <span className="text-white text-xs font-medium truncate">{item.name}</span>
                      <span className="text-white text-xs font-medium ml-2">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="px-3 pb-2">
              <span className="text-white/60 text-xs mb-2 block">Payments</span>
              {paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-green-400 text-sm">{payment.methodLabel}</span>
                  <span className="text-green-400 text-sm">${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="p-3 border-t border-neutral-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Subtotal</span>
              <span className="text-white text-sm">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Tax</span>
              <span className="text-white text-sm">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
              <span className="text-white font-medium">Total Due</span>
              <span className="text-red-500 font-bold">${remainingDue > 0 ? remainingDue.toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentDialog;
