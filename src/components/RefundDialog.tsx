import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, DollarSign, Percent, FileText, Printer, MessageSquare, Mail, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/orderUtils';
import tickSuccessIcon from '@/assets/icons/tick-success.svg';
import { toast } from 'sonner';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  tipAmount?: number;
  orderId?: string;
  guestName?: string;
  onRefundComplete?: (refundAmount: number, reason: string) => void;
}

type RefundStep = 'select-type' | 'full-refund' | 'partial-refund' | 'tip-refund' | 'custom-refund' | 'confirm' | 'success';

const refundReasons = [
  'Customer Dissatisfaction',
  'Order Error',
  'Quality Issue',
  'Wrong Order Delivered',
  'Other'
];

const RefundDialog: React.FC<RefundDialogProps> = ({
  open,
  onOpenChange,
  orderTotal,
  tipAmount = 0,
  orderId = '123423',
  guestName = 'Mike Wheelers',
  onRefundComplete
}) => {
  const [step, setStep] = useState<RefundStep>('select-type');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [includeTip, setIncludeTip] = useState(true);
  const [refundAmount, setRefundAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');

  const totalWithTip = orderTotal + tipAmount;
  const maxRefund = totalWithTip;

  const resetAndClose = () => {
    setStep('select-type');
    setSelectedReason('');
    setIncludeTip(true);
    setRefundAmount(0);
    setCustomAmount('');
    onOpenChange(false);
  };

  const handleSelectRefundType = (type: 'full' | 'partial' | 'tip' | 'custom') => {
    switch (type) {
      case 'full':
        setRefundAmount(includeTip ? totalWithTip : orderTotal);
        setStep('full-refund');
        break;
      case 'partial':
        setStep('partial-refund');
        break;
      case 'tip':
        setRefundAmount(tipAmount);
        setStep('tip-refund');
        break;
      case 'custom':
        setStep('custom-refund');
        break;
    }
  };

  const handleProceedRefund = () => {
    if (!selectedReason) {
      toast.error('Please select a reason for refund');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmRefund = () => {
    onRefundComplete?.(refundAmount, selectedReason);
    setStep('success');
  };

  const glassStyle = {
    background: "#7575754D",
    boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
  };

  const renderHeader = (title: string, showBack: boolean = true) => (
    <div className="relative flex items-center justify-center py-4 border-b border-neutral-700">
      {showBack && (
        <button
          onClick={() => setStep(step === 'confirm' ? 'full-refund' : 'select-type')}
          className="absolute left-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      <span className="text-white font-semibold text-lg">{title}</span>
      <button
        onClick={resetAndClose}
        className="absolute right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  );

  // Select Refund Type Screen
  const renderSelectType = () => (
    <div className="flex flex-col h-full">
      {renderHeader('Select Refund Type', false)}
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Full Refund */}
        <button
          onClick={() => handleSelectRefundType('full')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block">Full Refund</span>
            <span className="text-white/60 text-sm">Refund the entire order amount</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>

        {/* Partial Refund */}
        <button
          onClick={() => handleSelectRefundType('partial')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
            <Percent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block">Partial Refund</span>
            <span className="text-white/60 text-sm">Refund specific items</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>

        {/* Tip Refund */}
        <button
          onClick={() => handleSelectRefundType('tip')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block">Tip Refund</span>
            <span className="text-white/60 text-sm">Refund tip amount ({formatPrice(tipAmount)})</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>

        {/* Custom Refund */}
        <button
          onClick={() => handleSelectRefundType('custom')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block">Custom Refund</span>
            <span className="text-white/60 text-sm">Enter a custom amount (max {formatPrice(maxRefund)})</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>
      </div>
    </div>
  );

  // Full Refund Screen
  const renderFullRefund = () => {
    const currentRefundAmount = includeTip ? totalWithTip : orderTotal;
    
    return (
      <div className="flex flex-col h-full">
        {renderHeader('Full Refund')}
        
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Refund Amount Display */}
          <div className="text-center py-6 border-b border-neutral-700 mb-4">
            <span className="text-white/60 text-sm block mb-2">Refund Amount</span>
            <span className="text-white text-4xl font-bold block">{formatPrice(currentRefundAmount)}</span>
            <span className="text-white/50 text-sm block mt-2">
              Total {formatPrice(orderTotal)} + Tip {formatPrice(tipAmount)}
            </span>
            <span className="text-white/40 text-sm block mt-1">
              Order #{orderId} • {guestName}
            </span>
          </div>

          {/* Include Tip Toggle */}
          <div className="flex items-center justify-between py-4 border-b border-neutral-700 mb-4">
            <div>
              <span className="text-white font-semibold block">Include Tip in Refund</span>
              <span className="text-white/50 text-sm">Tip amount: {formatPrice(tipAmount)}</span>
            </div>
            <button
              onClick={() => setIncludeTip(!includeTip)}
              className={`w-12 h-6 rounded-full transition-colors relative ${includeTip ? 'bg-orange-500' : 'bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${includeTip ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Reason Selection */}
          <div className="mb-4">
            <span className="text-white/60 text-sm block mb-3">Reason for Refund</span>
            <div className="space-y-2">
              {refundReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                    selectedReason === reason 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={selectedReason !== reason ? glassStyle : undefined}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedReason === reason ? 'border-red-500 bg-red-500' : 'border-white/40'
                  }`}>
                    {selectedReason === reason && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-white">{reason}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="p-4">
          <button
            onClick={() => {
              setRefundAmount(currentRefundAmount);
              handleProceedRefund();
            }}
            className="w-full h-12 rounded-full font-semibold text-white"
            style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
          >
            PROCEED REFUND
          </button>
        </div>
      </div>
    );
  };

  // Confirm Refund Screen
  const renderConfirm = () => {
    const refundWithoutTip = includeTip ? orderTotal : refundAmount;
    const tipRefund = includeTip ? tipAmount : 0;
    const remainingAfterRefund = totalWithTip - refundAmount;

    return (
      <div className="flex flex-col h-full">
        {renderHeader('Confirm Refund')}
        
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Total Refund Amount */}
          <div className="text-center py-6 border-b border-neutral-700 mb-4">
            <span className="text-white/60 text-sm block mb-2">Total Refund Amount</span>
            <span className="text-white text-4xl font-bold block">{formatPrice(refundAmount)}</span>
            <span className="text-white/40 text-sm block mt-2">
              Order #{orderId} • {guestName}
            </span>
          </div>

          {/* Refund Details */}
          <div className="mb-4">
            <span className="text-white/60 text-sm block mb-3">Refund Details</span>
            
            <div className="p-4 rounded-xl border border-white/10 space-y-3" style={glassStyle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-white block">Cash</span>
                    <span className="text-white/50 text-sm">Original: {formatPrice(orderTotal)} + Tip: {formatPrice(tipAmount)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-semibold">-{formatPrice(refundAmount)}</span>
                  <span className="text-white/50 text-sm block">of {formatPrice(totalWithTip)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center gap-4">
                <span className="text-white">Order <span className="font-semibold">{formatPrice(orderTotal)}</span></span>
                <span className="text-white">Tip <span className="font-semibold">{formatPrice(tipAmount)}</span></span>
              </div>

              <div className="flex items-center justify-between text-white/50">
                <span>Remaining after refund</span>
                <span>{formatPrice(remainingAfterRefund)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 rounded-xl border border-white/10 flex items-center justify-between" style={glassStyle}>
            <span className="text-white/60">Reason</span>
            <span className="text-white">{selectedReason}</span>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-4">
          <button
            onClick={handleConfirmRefund}
            className="w-full h-12 rounded-full font-semibold text-white"
            style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
          >
            CONFIRM REFUND ({formatPrice(refundAmount)})
          </button>
        </div>
      </div>
    );
  };

  // Success Screen
  const renderSuccess = () => (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center py-4 border-b border-neutral-700">
        <span className="text-white font-semibold text-lg">Refund Successful</span>
        <button
          onClick={resetAndClose}
          className="absolute right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <img src={tickSuccessIcon} alt="Success" className="w-20 h-20 mb-4" />
        <span className="text-white font-semibold text-xl mb-2">Refund Successful</span>
        <span className="text-amber-400 text-3xl font-bold mb-6">{formatPrice(refundAmount)}</span>
        
        <span className="text-white/50 text-sm mb-4">Send refund receipt</span>
        
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button 
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2"
            style={glassStyle}
          >
            <Printer className="w-4 h-4 text-white" />
            <span className="text-white font-medium">Print</span>
          </button>
          <button 
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2"
            style={glassStyle}
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-white font-medium">Text</span>
          </button>
          <button 
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2"
            style={glassStyle}
          >
            <Mail className="w-4 h-4 text-white" />
            <span className="text-white font-medium">Email</span>
          </button>
        </div>
      </div>

      {/* Done Button */}
      <div className="p-4">
        <button
          onClick={resetAndClose}
          className="w-full h-12 rounded-full font-semibold text-black"
          style={{ background: 'linear-gradient(180deg, #FFC107 0%, #FF9800 100%)' }}
        >
          DONE
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'select-type':
        return renderSelectType();
      case 'full-refund':
        return renderFullRefund();
      case 'confirm':
        return renderConfirm();
      case 'success':
        return renderSuccess();
      default:
        return renderSelectType();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 border-0 bg-transparent max-w-md w-full h-auto max-h-[80vh]"
        style={{ background: 'none' }}
      >
        <div 
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{ 
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '80vh'
          }}
        >
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;
