import { useState, useEffect } from "react";
import { Check, ChevronDown, X, CreditCard, User, Gift, Link, QrCode, Banknote, Delete, Printer, MessageSquare, Mail, CheckCircle, Truck, ShoppingBag, Utensils, UtensilsCrossed, ArrowLeft, Tag, ExternalLink, Clipboard, Grid3X3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  guestName?: string;
  orderInfo?: { orderNo?: string; table?: string; type?: string; check?: number };
  onPaymentComplete?: (details: { method: string; amount: number }) => void;
}

const PaymentDialog = ({ open, onClose, totalAmount, orderItems = [], guestName = "Guest", orderInfo = {}, onPaymentComplete }: PaymentDialogProps) => {
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

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0) || totalAmount / 1.12;
  const tax = subtotal * 0.02;
  const finalTotal = totalAmount;

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

  useEffect(() => {
    const total = Object.entries(amountQuantities).reduce((sum, [amount, qty]) => sum + (parseFloat(amount) * qty), 0);
    if (total > 0) setPaymentAmount(total.toFixed(2));
  }, [amountQuantities]);

  const handleSelectFromDropdown = (method: PaymentMethodType) => {
    const lastVisible = visiblePaymentMethods[visiblePaymentMethods.length - 1];
    const newDropdown = dropdownPaymentMethods.filter(m => m.id !== method.id);
    newDropdown.unshift(lastVisible);
    setVisiblePaymentMethods([method, ...visiblePaymentMethods.slice(0, -1)]);
    setDropdownPaymentMethods(newDropdown);
    setSelectedPaymentMethod(method.id);
    setShowOtherPayments(false);
  };

  const handleKeypadPress = (key: string) => {
    if (key === 'C') setPaymentAmount('');
    else if (key === '←') setPaymentAmount(prev => prev.slice(0, -1));
    else if (key === '.' && !paymentAmount.includes('.')) setPaymentAmount(prev => prev + '.');
    else if (key !== '.') setPaymentAmount(prev => prev + key);
  };

  const handleAddAmount = (amount: number) => setAmountQuantities(prev => ({ ...prev, [amount]: (prev[amount] || 0) + 1 }));
  const handleRemoveAmount = (amount: number) => setAmountQuantities(prev => {
    const newQty = (prev[amount] || 0) - 1;
    if (newQty <= 0) { const { [amount]: _, ...rest } = prev; return rest; }
    return { ...prev, [amount]: newQty };
  });

  const handleCharge = () => {
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'amount') { setGiftCardStep('enter-card'); return; }
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card') {
      setGiftCardStep('processing');
      setTimeout(() => { setPaidAmount(parseFloat(paymentAmount) || 0); setPaymentProcessed(true); }, 1500);
      return;
    }
    if (['doordash', 'blizzful', 'ubereats', 'grubhub'].includes(selectedPaymentMethod)) {
      const stepMap = { doordash: doordashStep, blizzful: blizzfulStep, ubereats: ubereatsStep, grubhub: grubhubStep };
      if (stepMap[selectedPaymentMethod as keyof typeof stepMap] === 'amount') {
        if (selectedPaymentMethod === 'doordash') setDoordashStep('reference');
        if (selectedPaymentMethod === 'blizzful') setBlizzfulStep('reference');
        if (selectedPaymentMethod === 'ubereats') setUbereatsStep('reference');
        if (selectedPaymentMethod === 'grubhub') setGrubhubStep('reference');
        return;
      }
    }
    setPaidAmount(parseFloat(paymentAmount) || 0);
    setPaymentProcessed(true);
  };

  const handleComplete = () => {
    if (onPaymentComplete) onPaymentComplete({ method: selectedPaymentMethod, amount: paidAmount });
    onClose();
  };

  if (!open) return null;

  const getChargeButtonText = () => {
    if (selectedPaymentMethod === 'gift-card') return giftCardStep === 'amount' ? 'CONTINUE' : 'PROCESS GIFT CARD';
    if (['doordash', 'blizzful', 'ubereats', 'grubhub'].includes(selectedPaymentMethod)) {
      const stepMap = { doordash: doordashStep, blizzful: blizzfulStep, ubereats: ubereatsStep, grubhub: grubhubStep };
      if (stepMap[selectedPaymentMethod as keyof typeof stepMap] === 'amount') return 'CONTINUE';
    }
    return `CHARGE $${paymentAmount}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative flex bg-neutral-900 rounded-xl overflow-hidden animate-scale-in" style={{ width: '700px', height: '550px', maxWidth: '95vw', maxHeight: '90vh' }}>
        {/* Payment Methods Panel */}
        <div className="flex-1 flex flex-col border-r border-neutral-700">
          {paymentProcessed ? (
            textReceiptStep === 'phone-input' ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center p-3 border-b border-neutral-700">
                  <button onClick={() => setTextReceiptStep('receipt')} className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600"><ArrowLeft className="w-4 h-4 text-white" /></button>
                </div>
                <div className="px-4 pt-3 pb-2 text-center"><h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2></div>
                <div className="px-4 mb-2">
                  <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600"><span className="text-white text-xs font-medium">US +1</span><ChevronDown className="w-3 h-3 text-neutral-400" /></div>
                    <input type="text" placeholder="(000) 000-0000" value={textReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                  </div>
                </div>
                <div className="px-4 mb-2"><label className="flex items-center gap-2 cursor-pointer"><div onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>{textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}</div><span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span></label></div>
                <div className="px-4 mb-2"><button onClick={handleComplete} disabled={textReceiptPhone.replace(/\D/g, '').length < 10} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg disabled:opacity-50 text-sm">SEND</button></div>
                <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden"><div className="grid grid-cols-3 h-full">{['1','2','3','4','5','6','7','8','9','','0','←'].map((key) => (<button key={key} onClick={() => { if (key === '←') { const d = textReceiptPhone.replace(/\D/g, '').slice(0,-1); setTextReceiptPhone(d.length > 0 ? `(${d.slice(0,3)}${d.length >= 3 ? ') ' + d.slice(3,6) : ''}${d.length >= 6 ? '-' + d.slice(6,10) : ''}` : ''); } else if (key) { const d = textReceiptPhone.replace(/\D/g, '') + key; if (d.length <= 10) setTextReceiptPhone(`(${d.slice(0,3)}${d.length >= 3 ? ') ' + d.slice(3,6) : ''}${d.length >= 6 ? '-' + d.slice(6,10) : ''}`); }}} className={`py-2 flex items-center justify-center hover:bg-neutral-700 border-b border-r border-neutral-700 ${key === '' ? 'invisible' : ''}`}>{key === '←' ? <Delete className="w-5 h-5 text-neutral-400" /> : <span className="text-white text-xl">{key}</span>}</button>))}</div></div>
              </div>
            ) : emailReceiptStep === 'email-input' ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center p-3 border-b border-neutral-700"><button onClick={() => setEmailReceiptStep('receipt')} className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600"><ArrowLeft className="w-4 h-4 text-white" /></button></div>
                <div className="px-4 pt-3 pb-2 text-center"><h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2></div>
                <div className="px-4 mb-2"><div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden"><div className="px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div><input type="email" placeholder="email@example.com" value={emailReceiptEmail} onChange={(e) => setEmailReceiptEmail(e.target.value)} className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" /></div></div>
                <div className="px-4 mb-4"><button onClick={handleComplete} disabled={!emailReceiptEmail.includes('@')} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg disabled:opacity-50 text-sm">SEND</button></div>
                <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">{[['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']].map((row, i) => (<div key={i} className="flex flex-1">{row.map(k => (<button key={k} onClick={() => setEmailReceiptEmail(emailReceiptEmail + k)} className="flex-1 flex items-center justify-center hover:bg-neutral-700"><span className="text-white text-lg">{k}</span></button>))}{i === 2 && <button onClick={() => setEmailReceiptEmail(emailReceiptEmail.slice(0,-1))} className="w-10 flex items-center justify-center hover:bg-neutral-700"><Delete className="w-5 h-5 text-neutral-400" /></button>}</div>))}<div className="flex flex-1 gap-1 px-1">{['@','.','_','-','.com','.net'].map(k => (<button key={k} onClick={() => setEmailReceiptEmail(emailReceiptEmail + k)} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600"><span className="text-white text-sm">{k}</span></button>))}</div></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4"><CheckCircle className="w-12 h-12 text-green-500" /></div>
                <p className="text-center mb-2"><span className="text-green-500 font-bold text-lg">${paidAmount.toFixed(2)}</span><span className="text-neutral-400 text-sm"> has been successfully processed</span></p>
                {paidAmount > finalTotal && <p className="text-center mb-4"><span className="text-neutral-400 text-sm">Change Due: </span><span className="text-white font-bold text-lg">${(paidAmount - finalTotal).toFixed(2)}</span></p>}
                <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
                <div className="flex gap-4 mb-6">
                  <button onClick={handleComplete} className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 min-w-[80px]"><Printer className="w-6 h-6 text-neutral-300" /><span className="text-neutral-300 text-xs">Print</span></button>
                  <button onClick={() => { setTextReceiptPhone(''); setTextReceiptStep('phone-input'); }} className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 min-w-[80px]"><MessageSquare className="w-6 h-6 text-neutral-300" /><span className="text-neutral-300 text-xs">Text</span></button>
                  <button onClick={() => { setEmailReceiptEmail(''); setEmailReceiptStep('email-input'); }} className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 min-w-[80px]"><Mail className="w-6 h-6 text-neutral-300" /><span className="text-neutral-300 text-xs">Email</span></button>
                </div>
                <button onClick={handleComplete} className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800">NO RECEIPT</button>
              </div>
            )
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                <div className="flex items-center gap-2"><span className="text-white text-lg font-medium">Total Due</span><span className="text-red-500 text-lg font-bold">${finalTotal.toFixed(2)}</span></div>
                <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center"><X className="w-4 h-4 text-neutral-300" /></button>
              </div>
              <div className="px-3 py-2 border-b border-neutral-700">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {visiblePaymentMethods.map((m) => (<button key={m.id} onClick={() => setSelectedPaymentMethod(m.id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${selectedPaymentMethod === m.id ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}><m.icon className="w-3.5 h-3.5" />{m.name}</button>))}
                  <Popover open={showOtherPayments} onOpenChange={setShowOtherPayments}><PopoverTrigger asChild><button className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium hover:bg-neutral-700">Other<ChevronDown className="w-3 h-3" /></button></PopoverTrigger><PopoverContent className="w-48 p-1 bg-neutral-800 border-neutral-700" align="end">{dropdownPaymentMethods.map((m) => (<button key={m.id} onClick={() => handleSelectFromDropdown(m)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-md"><m.icon className="w-4 h-4" />{m.name}</button>))}</PopoverContent></Popover>
                </div>
              </div>
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-2"><span className="text-neutral-400 text-sm">Payment Amount</span><button onClick={() => setShowKeypad(!showKeypad)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700"><Grid3X3 className="w-4 h-4 text-neutral-400" /></button></div>
                <div className="text-3xl font-bold text-white">${paymentAmount || '0.00'}</div>
              </div>
              <div className="flex-1 px-3 pb-3 overflow-auto" style={{ scrollbarWidth: 'none' }}>
                {showKeypad ? (
                  <div className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','.','0','←'].map((k) => (<button key={k} onClick={() => handleKeypadPress(k)} className={`h-14 rounded-xl text-xl font-medium ${k === '←' ? 'bg-neutral-800 text-red-400' : 'bg-neutral-800 text-white'} hover:bg-neutral-700`}>{k === '←' ? <Delete className="w-6 h-6 mx-auto" /> : k}</button>))}<button onClick={() => handleKeypadPress('C')} className="col-span-3 h-12 rounded-xl text-lg font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30">CLEAR</button></div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((amt) => { const qty = amountQuantities[amt] || 0; return (<div key={amt} className="bg-neutral-800 rounded-xl p-3 text-center"><div className="text-white text-lg font-bold mb-1">${amt}</div><div className="flex items-center justify-center gap-2"><button onClick={() => handleRemoveAmount(amt)} disabled={qty === 0} className="w-6 h-6 rounded-full bg-neutral-700 text-white text-sm font-bold disabled:opacity-30">-</button><span className="text-neutral-400 text-sm w-6 text-center">{qty}</span><button onClick={() => handleAddAmount(amt)} className="w-6 h-6 rounded-full bg-neutral-700 text-white text-sm font-bold">+</button></div></div>); })}
                    <button onClick={() => setPaymentAmount(finalTotal.toFixed(2))} className="bg-green-500/20 rounded-xl p-3 text-center hover:bg-green-500/30"><div className="text-green-500 text-sm font-bold">EXACT</div><div className="text-green-400 text-xs">${finalTotal.toFixed(2)}</div></button>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-neutral-700"><button onClick={handleCharge} className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-sm">{getChargeButtonText()}</button></div>
            </>
          )}
        </div>
        {/* Order Details Panel */}
        <div className="w-[260px] flex flex-col bg-neutral-900">
          <div className="p-3 border-b border-neutral-700" style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}>
            <div className="flex items-center justify-between"><h3 className="text-white font-semibold text-sm">{guestName}</h3><button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-neutral-600 flex items-center justify-center"><X className="w-4 h-4 text-neutral-300" /></button></div>
            <p className="text-neutral-300 text-xs mt-0.5">Order At {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            <div className="flex items-center justify-between mt-2"><span className="text-neutral-400 text-[10px]">ORDER# {orderInfo.orderNo || "105"}</span><span className="text-neutral-400 text-[10px]">TABLE# {orderInfo.table || "14"}</span><span className="text-red-400 text-[10px] font-medium">{orderInfo.type?.toUpperCase() || "DINE IN"}</span></div>
          </div>
          <div className="mx-3 mt-3 bg-neutral-800 rounded-lg p-3 relative overflow-hidden">
            <div className="flex items-center justify-between"><span className="text-white font-medium text-sm">Check {orderInfo.check || "62"}</span><span className="text-white font-bold">${finalTotal.toFixed(2)}</span></div>
            {paymentProcessed && paidAmount >= finalTotal && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">PAID</span>}
            {paymentProcessed && paidAmount < finalTotal && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">PARTIAL</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
            {orderItems.map((item, i) => (<div key={i} className="p-2 border border-neutral-700 rounded-lg" style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}><div className="flex items-center gap-2"><span className="w-5 h-5 rounded bg-neutral-700 border border-neutral-600 text-white text-[10px] font-medium flex items-center justify-center">{item.qty}</span><div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="text-xs font-medium text-white truncate">{item.name}</span><span className="text-xs font-medium text-white ml-2">${item.price.toFixed(2)}</span></div></div></div></div>))}
          </div>
          {paymentProcessed && (<div className="p-3 border-t border-neutral-700"><h4 className="text-white text-sm font-medium mb-2">Payment History</h4><div className="flex items-center justify-between"><div className="flex items-center gap-2">{selectedPaymentMethod === 'card' || selectedPaymentMethod === 'manual-cc' ? <CreditCard className="w-4 h-4 text-neutral-400" /> : selectedPaymentMethod === 'gift-card' ? <Gift className="w-4 h-4 text-neutral-400" /> : selectedPaymentMethod === 'doordash' ? <Truck className="w-4 h-4 text-red-500" /> : selectedPaymentMethod === 'ubereats' ? <ShoppingBag className="w-4 h-4 text-green-500" /> : selectedPaymentMethod === 'grubhub' ? <UtensilsCrossed className="w-4 h-4 text-orange-500" /> : <Banknote className="w-4 h-4 text-neutral-400" />}<span className="text-neutral-300 text-xs">{selectedPaymentMethod === 'gift-card' ? 'Gift Card' : selectedPaymentMethod === 'doordash' ? 'DoorDash' : selectedPaymentMethod === 'ubereats' ? 'UberEats' : selectedPaymentMethod === 'grubhub' ? 'Grubhub' : selectedPaymentMethod === 'card' ? 'Card' : 'Cash'}</span></div><span className="text-green-500 text-xs font-medium">${paidAmount.toFixed(2)}</span></div>{paidAmount < finalTotal && <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-600"><span className="text-neutral-400 text-xs">Remaining Due</span><span className="text-red-500 text-xs font-medium">${(finalTotal - paidAmount).toFixed(2)}</span></div>}</div>)}
          {!paymentProcessed && (<div className="p-3 border-t border-neutral-700 space-y-1.5"><div className="flex items-center justify-between text-xs"><span className="text-neutral-400">Sub Total</span><span className="text-white">${subtotal.toFixed(2)}</span></div><div className="flex items-center justify-between text-xs"><span className="text-neutral-400">Tax</span><span className="text-white">${tax.toFixed(2)}</span></div><div className="flex items-center justify-between text-sm font-medium pt-1"><span className="text-white">Total Due</span><span className="text-red-500 font-bold">${finalTotal.toFixed(2)}</span></div></div>)}
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
