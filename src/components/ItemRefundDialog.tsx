import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, Printer, MessageSquare, Mail, Delete } from 'lucide-react';
import tickSuccessIcon from '@/assets/icons/tick-success.svg';
import { toast } from 'sonner';

interface ItemRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemPrice: number;
  orderId?: string;
  guestName?: string;
  paymentMethod?: string;
  orderTotal?: number;
  tipAmount?: number;
  isModifier?: boolean;
  onRefundComplete?: (amount: number, reason: string) => void;
}

type Step = 'reason' | 'confirm' | 'success' | 'phone-input' | 'email-input';

const refundReasons = [
  'Customer Dissatisfaction',
  'Order Error',
  'Quality Issue',
  'Wrong Order Delivered',
  'Other'
];

const ItemRefundDialog: React.FC<ItemRefundDialogProps> = ({
  open,
  onOpenChange,
  itemName,
  itemPrice,
  orderId = '123423',
  guestName = 'Mike Wheelers',
  paymentMethod = 'Cash',
  orderTotal = 128.47,
  tipAmount = 15.00,
  isModifier = false,
  onRefundComplete
}) => {
  const [step, setStep] = useState<Step>('reason');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  const resetAndClose = () => {
    setStep('reason');
    setSelectedReason('');
    setPhoneNumber('');
    setEmailAddress('');
    onOpenChange(false);
  };

  const handleProceed = () => {
    if (!selectedReason) {
      toast.error('Please select a reason for refund');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmRefund = () => {
    onRefundComplete?.(itemPrice, selectedReason);
    setStep('success');
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
      setPhoneNumber(formatPhoneNumber(digits.slice(0, -1)));
    } else if (key !== '') {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length < 10) setPhoneNumber(formatPhoneNumber(digits + key));
    }
  };

  const handleEmailKeyPress = (key: string) => {
    if (key === 'delete') setEmailAddress(prev => prev.slice(0, -1));
    else if (key !== 'space') setEmailAddress(prev => prev + key);
  };

  const emailKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'delete'],
    ['@', '.', '_', '-', '.com', '.net', '@gmail.com']
  ];

  const fp = (n: number) => `$${n.toFixed(2)}`;
  const remainingAfterRefund = orderTotal - itemPrice;

  // ─── REASON SELECTION ───
  const renderReason = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        <button onClick={resetAndClose} className="absolute left-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-semibold text-base">Item Refund</span>
        <button onClick={resetAndClose} className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
        {/* Refund Amount Display */}
        <div className="text-center mb-5">
          <p className="text-white/60 text-sm mb-1">Refund Amount</p>
          <p className="text-white text-4xl font-bold">{fp(itemPrice)}</p>
          <p className="text-white/50 text-sm mt-1">{itemName}</p>
          <p className="text-white/40 text-xs">Order #{orderId} • {guestName}</p>
        </div>

        {/* Reason Selection */}
        <p className="text-white/60 text-sm font-medium mb-2">Reason for Refund</p>
        <div className="space-y-2">
          {refundReasons.map(reason => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                selectedReason === reason
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedReason === reason ? 'border-red-500 bg-red-500' : 'border-white/30'
              }`}>
                {selectedReason === reason && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-white text-sm">{reason}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Proceed Button */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={handleProceed}
          disabled={!selectedReason}
          className="w-full py-3 rounded-full text-white font-bold text-sm transition-all disabled:opacity-40"
          style={{ background: selectedReason ? 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' : '#555' }}
        >
          PROCEED REFUND
        </button>
      </div>
    </div>
  );

  // ─── CONFIRM ───
  const renderConfirm = () => (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        <button onClick={() => setStep('reason')} className="absolute left-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-semibold text-base">Confirm Refund</span>
        <button onClick={resetAndClose} className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
        {/* Amount */}
        <div className="text-center mb-5">
          <p className="text-white/60 text-sm mb-1">Total Refund Amount</p>
          <p className="text-white text-4xl font-bold">{fp(itemPrice)}</p>
          <p className="text-white/40 text-xs mt-1">Order #{orderId} • {guestName}</p>
        </div>

        {/* Refund Details */}
        <p className="text-white/60 text-sm font-medium mb-2">Refund Details</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{paymentMethod}</p>
                <p className="text-white/40 text-xs">Original: {fp(orderTotal)} + Tip: {fp(tipAmount)}</p>
              </div>
            </div>
            <span className="text-red-400 font-bold text-sm">–{fp(itemPrice)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Order {fp(itemPrice)}</span>
              <span className="text-white/50">Tip {fp(0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Remaining after refund</span>
              <span className="text-white">{fp(Math.max(0, remainingAfterRefund))}</span>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex justify-between">
          <span className="text-white/50 text-sm">Reason</span>
          <span className="text-white text-sm font-medium">{selectedReason}</span>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={handleConfirmRefund}
          className="w-full py-3 rounded-full text-white font-bold text-sm"
          style={{ background: 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' }}
        >
          CONFIRM REFUND ({fp(itemPrice)})
        </button>
      </div>
    </div>
  );

  // ─── SUCCESS ───
  const renderSuccess = () => (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        <span className="text-white font-semibold text-base">Refund Successful</span>
        <button onClick={resetAndClose} className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <img src={tickSuccessIcon} alt="Success" className="w-10 h-10" />
        </div>
        <p className="text-white text-lg font-semibold mb-1">Refund Successful</p>
        <p className="text-amber-400 text-3xl font-bold mb-4">{fp(itemPrice)}</p>
        <p className="text-white/50 text-sm mb-6">Send refund receipt</p>

        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => { toast.success('Refund receipt sent to printer'); resetAndClose(); }}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Printer className="w-5 h-5 text-white/70" />
            <span className="text-white text-xs">Print</span>
          </button>
          <button
            onClick={() => setStep('phone-input')}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-white/70" />
            <span className="text-white text-xs">Text</span>
          </button>
          <button
            onClick={() => setStep('email-input')}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Mail className="w-5 h-5 text-white/70" />
            <span className="text-white text-xs">Email</span>
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={resetAndClose}
          className="w-full py-3 rounded-full text-black font-bold text-sm"
          style={{ background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' }}
        >
          DONE
        </button>
      </div>
    </div>
  );

  // ─── PHONE INPUT ───
  const renderPhoneInput = () => (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        <button onClick={() => setStep('success')} className="absolute left-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-semibold text-base">Send via Text</span>
        <button onClick={resetAndClose} className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center p-6">
        <p className="text-white/50 text-sm mb-4">Enter phone number</p>
        <div className="text-white text-2xl font-bold mb-6 min-h-[36px]">
          {phoneNumber || <span className="text-white/20">(___) ___-____</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {['1','2','3','4','5','6','7','8','9','','0','delete'].map(key => (
            <button
              key={key}
              onClick={() => key && handlePhoneKeyPress(key)}
              className={`h-12 rounded-xl flex items-center justify-center text-white text-lg font-medium transition-colors ${key ? 'bg-white/10 hover:bg-white/20 active:bg-white/30' : ''}`}
              disabled={!key}
            >
              {key === 'delete' ? <Delete className="w-5 h-5" /> : key}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={() => {
            if (phoneNumber.replace(/\D/g, '').length >= 10) {
              toast.success('Refund receipt sent via SMS');
              resetAndClose();
            }
          }}
          disabled={phoneNumber.replace(/\D/g, '').length < 10}
          className="w-full py-3 rounded-full text-white font-bold text-sm disabled:opacity-40"
          style={{ background: phoneNumber.replace(/\D/g, '').length >= 10 ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' : '#555' }}
        >
          SEND
        </button>
      </div>
    </div>
  );

  // ─── EMAIL INPUT ───
  const renderEmailInput = () => (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        <button onClick={() => setStep('success')} className="absolute left-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-semibold text-base">Send via Email</span>
        <button onClick={resetAndClose} className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center p-6">
        <p className="text-white/50 text-sm mb-4">Enter email address</p>
        <div className="text-white text-lg font-bold mb-6 min-h-[28px] break-all">
          {emailAddress || <span className="text-white/20">email@example.com</span>}
        </div>
        <div className="w-full max-w-sm space-y-1">
          {emailKeys.map((row, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleEmailKeyPress(key)}
                  className={`rounded-lg flex items-center justify-center text-white transition-colors bg-white/10 hover:bg-white/20 active:bg-white/30 ${
                    key.length > 1 ? 'px-2 h-9 text-xs' : 'w-8 h-9 text-sm'
                  }`}
                >
                  {key === 'delete' ? <Delete className="w-4 h-4" /> : key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={() => {
            if (emailAddress.includes('@') && emailAddress.includes('.')) {
              toast.success('Refund receipt sent via email');
              resetAndClose();
            }
          }}
          disabled={!emailAddress.includes('@') || !emailAddress.includes('.')}
          className="w-full py-3 rounded-full text-white font-bold text-sm disabled:opacity-40"
          style={{ background: emailAddress.includes('@') && emailAddress.includes('.') ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' : '#555' }}
        >
          SEND
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'reason': return renderReason();
      case 'confirm': return renderConfirm();
      case 'success': return renderSuccess();
      case 'phone-input': return renderPhoneInput();
      case 'email-input': return renderEmailInput();
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        className="p-0 gap-0 border-neutral-700 bg-neutral-900 overflow-hidden"
        style={{ maxWidth: '420px', maxHeight: '90vh' }}
      >
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};

export default ItemRefundDialog;
