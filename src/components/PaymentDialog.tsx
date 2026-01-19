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

              {/* Quick Amounts OR Keypad */}
              <div className="p-3 space-y-1.5 flex-1">
                {showKeypad || selectedPaymentMethod === 'card' || selectedPaymentMethod === 'gift-card' || selectedPaymentMethod === 'pay-link' || selectedPaymentMethod === 'loyalty' ? (
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
