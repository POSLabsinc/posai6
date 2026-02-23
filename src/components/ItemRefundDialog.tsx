import React, { useState } from 'react';
import { X, ChevronLeft, Printer, MessageSquare, Mail } from 'lucide-react';

interface ItemRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemPrice: number;
  itemQty: number;
  /** If set, this is a modifier-level refund */
  isModifier?: boolean;
  onRefundComplete: (reason: string) => void;
}

const refundReasons = [
  'Customer Dissatisfaction',
  'Order Error',
  'Quality Issue',
  'Wrong Order Delivered',
  'Other',
];

type Step = 'reason' | 'confirm' | 'success';

const ItemRefundDialog: React.FC<ItemRefundDialogProps> = ({
  open,
  onOpenChange,
  itemName,
  itemPrice,
  itemQty,
  isModifier = false,
  onRefundComplete,
}) => {
  const [step, setStep] = useState<Step>('reason');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const totalRefund = isModifier ? itemPrice : itemPrice * itemQty;
  const formatPrice = (p: number) => `$${p.toFixed(2)}`;

  const handleClose = () => {
    setStep('reason');
    setSelectedReason(null);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selectedReason) return;
    onRefundComplete(selectedReason);
    setStep('success');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={handleClose}>
      <div
        className="w-[90%] max-w-[380px] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#1B1C20', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {step !== 'reason' && step !== 'success' && (
              <button
                onClick={() => setStep('reason')}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>
            )}
            <h2 className="text-white font-semibold text-base">
              {step === 'reason' ? (isModifier ? 'Refund Add-on' : 'Refund Product') : step === 'confirm' ? 'Confirm Refund' : 'Refund Successful'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Product Info */}
        {step !== 'success' && (
          <div className="px-4 py-3 border-b border-white/10" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isModifier && (
                  <span className="w-6 h-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold">
                    {itemQty}
                  </span>
                )}
                <span className="text-white font-medium text-sm">{itemName}</span>
              </div>
              <span className="text-white font-bold text-sm">{formatPrice(totalRefund)}</span>
            </div>
          </div>
        )}

        {/* Step: Reason Selection */}
        {step === 'reason' && (
          <div className="p-4">
            <span className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Reason for Refund</span>
            <div className="space-y-1.5">
              {refundReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                    selectedReason === reason
                      ? 'bg-red-500/20 border border-red-500/50 text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedReason && setStep('confirm')}
              disabled={!selectedReason}
              className="w-full mt-4 py-2.5 rounded-full text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: selectedReason ? 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' : '#555' }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === 'confirm' && (
          <div className="p-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">{isModifier ? 'Add-on' : 'Product'}</span>
                <span className="text-white">{isModifier ? itemName : `${itemName} × ${itemQty}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Refund Amount</span>
                <span className="text-red-400 font-bold">{formatPrice(totalRefund)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Reason</span>
                <span className="text-white/80">{selectedReason}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('reason')}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-medium border border-white/20 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-bold"
                style={{ background: 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' }}
              >
                Confirm Refund
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-4 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)' }}>
              <span className="text-white text-2xl">✓</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Refund Processed</h3>
            <p className="text-white/50 text-sm mb-1">{itemName} × {itemQty}</p>
            <p className="text-red-400 font-bold text-lg mb-4">{formatPrice(totalRefund)}</p>
            <p className="text-white/40 text-xs mb-3">Send receipt to customer?</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors min-w-[72px]">
                <Printer className="w-5 h-5 text-white/60" />
                <span className="text-white/60 text-[10px]">Print</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors min-w-[72px]">
                <MessageSquare className="w-5 h-5 text-white/60" />
                <span className="text-white/60 text-[10px]">Text</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors min-w-[72px]">
                <Mail className="w-5 h-5 text-white/60" />
                <span className="text-white/60 text-[10px]">Email</span>
              </button>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-full text-black text-sm font-bold"
              style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemRefundDialog;
