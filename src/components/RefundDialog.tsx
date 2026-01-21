import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, DollarSign, Percent, FileText, Printer, MessageSquare, Mail, CreditCard, ArrowLeft, Check, Delete, ChevronDown } from 'lucide-react';
import { formatPrice } from '@/lib/orderUtils';
import tickSuccessIcon from '@/assets/icons/tick-success.svg';
import { toast } from 'sonner';

interface ModifierForRefund {
  name: string;
  price: number;
}

interface OrderItemForRefund {
  name: string;
  price: number;
  qty: number;
  modifiers?: ModifierForRefund[];
}

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  tipAmount?: number;
  orderId?: string;
  guestName?: string;
  orderItems?: OrderItemForRefund[];
  onRefundComplete?: (refundAmount: number, reason: string) => void;
}

type RefundStep = 'select-type' | 'full-refund' | 'partial-refund' | 'tip-refund' | 'custom-refund' | 'confirm' | 'success' | 'phone-input' | 'email-input';

const refundReasons = [
  'Customer Dissatisfaction',
  'Order Error',
  'Quality Issue',
  'Wrong Order Delivered',
  'Other'
];

const tipRefundReasons = [
  'Wrongly Given High Tip Amount',
  'Customer Request',
  'Service Issue',
  'System Error',
  'Other'
];

const emailKeys = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'delete'],
  ['@', '.', '_', '-', '.com', '.net', '@gmail.com']
];

const RefundDialog: React.FC<RefundDialogProps> = ({
  open,
  onOpenChange,
  orderTotal,
  tipAmount = 0,
  orderId = '123423',
  guestName = 'Mike Wheelers',
  orderItems,
  onRefundComplete
}) => {
  const [step, setStep] = useState<RefundStep>('select-type');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [includeTip, setIncludeTip] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [noMarketing, setNoMarketing] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'tip' | 'custom'>('full');
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
  const [tipRefundAmount, setTipRefundAmount] = useState('');
  const [tipReasonDropdownOpen, setTipReasonDropdownOpen] = useState(false);

  const totalWithTip = orderTotal + tipAmount;
  const maxRefund = totalWithTip;

  // Default order items for demo with modifiers
  const defaultOrderItems: OrderItemForRefund[] = [
    { 
      name: "New York Strip Steak", 
      price: 28.00, 
      qty: 1,
      modifiers: [
        { name: "Medium Rare", price: 0 },
        { name: "Garlic Butter", price: 2.50 },
        { name: "Side Asparagus", price: 4.00 }
      ]
    },
    { 
      name: "Grilled Salmon", 
      price: 24.00, 
      qty: 1,
      modifiers: [
        { name: "Lemon Herb Sauce", price: 1.50 },
        { name: "Extra Veggies", price: 3.00 }
      ]
    },
    { 
      name: "Caesar Salad", 
      price: 12.00, 
      qty: 1,
      modifiers: [
        { name: "Grilled Chicken", price: 5.00 },
        { name: "Extra Parmesan", price: 1.00 }
      ]
    }
  ];

  const orderItemsToUse = orderItems && orderItems.length > 0 ? orderItems : defaultOrderItems;

  // Calculate partial refund totals including modifiers
  const calculatePartialRefundTotal = () => {
    let itemsTotal = 0;
    
    // Add selected items (base price)
    Object.entries(selectedItems).forEach(([index, qty]) => {
      const item = orderItemsToUse[Number(index)];
      if (item && qty > 0) {
        itemsTotal += item.price * qty;
      }
    });
    
    // Add selected modifiers
    Object.entries(selectedModifiers).forEach(([key, isSelected]) => {
      if (isSelected) {
        const [itemIndex, modIndex] = key.split('-').map(Number);
        const item = orderItemsToUse[itemIndex];
        const modifier = item?.modifiers?.[modIndex];
        if (modifier && modifier.price > 0) {
          itemsTotal += modifier.price;
        }
      }
    });
    
    return itemsTotal;
  };

  const partialItemsTotal = calculatePartialRefundTotal();
  const partialTipTotal = includeTip ? tipAmount : 0;
  const partialRefundTotal = partialItemsTotal + partialTipTotal;
  
  // Count selections (items + modifiers with price)
  const totalItemSelections = Object.values(selectedItems).filter(qty => qty > 0).length;
  const totalModifierSelections = Object.values(selectedModifiers).filter(Boolean).length;
  const totalSelections = totalItemSelections + totalModifierSelections;

  const toggleItemSelection = (index: number) => {
    const item = orderItemsToUse[index];
    if (!item) return;
    
    setSelectedItems(prev => {
      const currentQty = prev[index] || 0;
      if (currentQty > 0) {
        const newItems = { ...prev };
        delete newItems[index];
        return newItems;
      } else {
        return { ...prev, [index]: item.qty };
      }
    });
  };

  const toggleModifierSelection = (itemIndex: number, modIndex: number) => {
    const key = `${itemIndex}-${modIndex}`;
    setSelectedModifiers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleItemExpanded = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const resetAndClose = () => {
    setStep('select-type');
    setSelectedReason('');
    setIncludeTip(false);
    setRefundAmount(0);
    setCustomAmount('');
    setPhoneNumber('');
    setEmailAddress('');
    setNoMarketing(false);
    setRefundType('full');
    setSelectedItems({});
    setSelectedModifiers({});
    setExpandedItems({});
    setReasonDropdownOpen(false);
    setTipRefundAmount('');
    setTipReasonDropdownOpen(false);
    onOpenChange(false);
  };

  const handleTipKeyPress = (key: string) => {
    if (key === 'delete') {
      setTipRefundAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!tipRefundAmount.includes('.')) {
        setTipRefundAmount(prev => prev + '.');
      }
    } else {
      // Limit to 2 decimal places
      const parts = tipRefundAmount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      // Don't exceed tip amount
      const newValue = tipRefundAmount + key;
      if (parseFloat(newValue) <= tipAmount) {
        setTipRefundAmount(newValue);
      }
    }
  };

  const handleFullTip = () => {
    setTipRefundAmount(tipAmount.toFixed(2));
  };

  const handleClearTip = () => {
    setTipRefundAmount('');
  };

  const handleProceedTipRefund = () => {
    if (!selectedReason) {
      toast.error('Please select a reason for refund');
      return;
    }
    const amount = parseFloat(tipRefundAmount) || 0;
    if (amount <= 0) {
      toast.error('Please enter a tip refund amount');
      return;
    }
    setRefundAmount(amount);
    setStep('confirm');
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

  const handlePrint = () => {
    toast.success('Refund receipt sent to printer');
    resetAndClose();
  };

  const handleSendText = () => {
    if (phoneNumber.replace(/\D/g, '').length >= 10) {
      toast.success('Refund receipt sent via SMS');
      resetAndClose();
    }
  };

  const handleSendEmail = () => {
    if (emailAddress.includes('@') && emailAddress.includes('.')) {
      toast.success('Refund receipt sent via Email');
      resetAndClose();
    }
  };

  const handleSelectRefundType = (type: 'full' | 'partial' | 'tip' | 'custom') => {
    setRefundType(type);
    setSelectedReason('');
    setIncludeTip(false);
    setSelectedItems({});
    
    switch (type) {
      case 'full':
        setRefundAmount(orderTotal);
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

  const handleProceedPartialRefund = () => {
    if (!selectedReason) {
      toast.error('Please select a reason for refund');
      return;
    }
    if (partialRefundTotal <= 0) {
      toast.error('Please select at least one item to refund');
      return;
    }
    setRefundAmount(partialRefundTotal);
    setStep('confirm');
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

  const renderHeader = (title: string, showBack: boolean = true) => {
    const handleBack = () => {
      if (step === 'confirm') {
        // Go back to the previous refund type screen
        if (refundType === 'partial') {
          setStep('partial-refund');
        } else if (refundType === 'full') {
          setStep('full-refund');
        } else if (refundType === 'tip') {
          setStep('tip-refund');
        } else if (refundType === 'custom') {
          setStep('custom-refund');
        } else {
          setStep('select-type');
        }
      } else {
        setStep('select-type');
      }
    };

    return (
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        {showBack && (
          <button
            onClick={handleBack}
            className="absolute left-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <span className="text-white font-semibold text-base">{title}</span>
        <button
          onClick={resetAndClose}
          className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    );
  };

  // Select Refund Type Screen
  const renderSelectType = () => (
    <div className="flex flex-col h-full">
      {renderHeader('Select Refund Type', false)}
      
      <div className="flex-1 p-3 space-y-2">
        {/* Full Refund */}
        <button
          onClick={() => handleSelectRefundType('full')}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block text-sm">Full Refund</span>
            <span className="text-white/60 text-xs">Refund the entire order amount</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>

        {/* Partial Refund */}
        <button
          onClick={() => handleSelectRefundType('partial')}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
            <Percent className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block text-sm">Partial Refund</span>
            <span className="text-white/60 text-xs">Refund specific items</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>

        {/* Tip Refund */}
        <button
          onClick={() => handleSelectRefundType('tip')}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block text-sm">Tip Refund</span>
            <span className="text-white/60 text-xs">Refund tip amount ({formatPrice(tipAmount)})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>

        {/* Custom Refund */}
        <button
          onClick={() => handleSelectRefundType('custom')}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          style={glassStyle}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-white font-semibold block text-sm">Custom Refund</span>
            <span className="text-white/60 text-xs">Enter a custom amount (max {formatPrice(maxRefund)})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
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
        
        <div className="flex-1 p-3">
          {/* Refund Amount Display */}
          <div className="text-center py-4 border-b border-neutral-700 mb-3">
            <span className="text-white/60 text-xs block mb-1">Refund Amount</span>
            <span className="text-white text-3xl font-bold block">{formatPrice(currentRefundAmount)}</span>
            <span className="text-white/50 text-xs block mt-1">
              Total {formatPrice(orderTotal)} + Tip {formatPrice(tipAmount)}
            </span>
            <span className="text-white/40 text-xs block mt-0.5">
              Order #{orderId} • {guestName}
            </span>
          </div>

          {/* Include Tip Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-700 mb-3">
            <div>
              <span className="text-white font-semibold block text-sm">Include Tip in Refund</span>
              <span className="text-white/50 text-xs">Tip amount: {formatPrice(tipAmount)}</span>
            </div>
            <button
              onClick={() => setIncludeTip(!includeTip)}
              className={`w-10 h-5 rounded-full transition-colors relative ${includeTip ? 'bg-orange-500' : 'bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeTip ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Reason Selection */}
          <div className="mb-3">
            <span className="text-white/60 text-xs block mb-2">Reason for Refund</span>
            <div className="space-y-1.5">
              {refundReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                    selectedReason === reason 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={selectedReason !== reason ? glassStyle : undefined}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedReason === reason ? 'border-red-500 bg-red-500' : 'border-white/40'
                  }`}>
                    {selectedReason === reason && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-white text-sm">{reason}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="p-3">
          <button
            onClick={() => {
              setRefundAmount(currentRefundAmount);
              handleProceedRefund();
            }}
            className="w-full h-10 rounded-full font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
          >
            PROCEED REFUND
          </button>
        </div>
      </div>
    );
  };

  // Partial Refund Screen
  const renderPartialRefund = () => (
    <div className="flex flex-col h-full">
      {renderHeader('Partial Refund')}
      
      <div className="flex-1 p-3 space-y-3 overflow-hidden">
        {/* Select Items Label */}
        <span className="text-white/60 text-xs block">Select items to refund</span>
        
        {/* Items List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {orderItemsToUse.map((item, index) => {
            const isSelected = (selectedItems[index] || 0) > 0;
            const isExpanded = expandedItems[index] || false;
            const hasModifiers = item.modifiers && item.modifiers.length > 0;
            const paidModifiers = item.modifiers?.filter(m => m.price > 0) || [];
            
            return (
              <div key={index} className="rounded-xl border border-white/10 overflow-hidden" style={glassStyle}>
                {/* Main Item Row */}
                <div className="flex items-center gap-3 p-3">
                  <div 
                    onClick={() => toggleItemSelection(index)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-500 border-amber-500' : 'border-white/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm block truncate">{item.name}</span>
                    <span className="text-white/50 text-xs">${item.price.toFixed(2)} each • Remaining: {item.qty} of {item.qty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">${(item.price * item.qty).toFixed(2)}</span>
                    {hasModifiers && (
                      <button 
                        onClick={() => toggleItemExpanded(index)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Expanded Modifiers Section */}
                {isExpanded && hasModifiers && (
                  <div className="border-t border-white/10 bg-black/20 px-3 py-2 space-y-1.5">
                    <span className="text-white/50 text-xs block mb-2">Add-ons & Modifiers</span>
                    {item.modifiers?.map((modifier, modIndex) => {
                      const modKey = `${index}-${modIndex}`;
                      const isModSelected = selectedModifiers[modKey] || false;
                      const hasCost = modifier.price > 0;
                      
                      return (
                        <div 
                          key={modIndex}
                          className={`flex items-center gap-2 p-2 rounded-lg ${hasCost ? 'cursor-pointer hover:bg-white/5' : ''}`}
                          onClick={() => hasCost && toggleModifierSelection(index, modIndex)}
                        >
                          {hasCost ? (
                            <div 
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                isModSelected ? 'bg-amber-500 border-amber-500' : 'border-white/40'
                              }`}
                            >
                              {isModSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            </div>
                          )}
                          <span className={`flex-1 text-xs ${hasCost ? 'text-white' : 'text-white/50'}`}>
                            {modifier.name}
                          </span>
                          {hasCost && (
                            <span className={`text-xs ${isModSelected ? 'text-amber-400' : 'text-white/60'}`}>
                              +${modifier.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Include Tip Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-neutral-700">
          <div>
            <span className="text-white font-semibold block text-sm">Include Tip in Refund</span>
            <span className="text-white/50 text-xs">Remaining tip: {formatPrice(tipAmount)}</span>
          </div>
          <button
            onClick={() => setIncludeTip(!includeTip)}
            className={`w-10 h-5 rounded-full transition-colors relative ${includeTip ? 'bg-orange-500' : 'bg-neutral-600'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeTip ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Summary Section */}
        <div className="space-y-1 py-2 border-t border-neutral-700">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Selections</span>
            <span className="text-white">{totalSelections}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Items & Modifiers</span>
            <span className="text-white">{formatPrice(partialItemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">+ Tip</span>
            <span className="text-white">{formatPrice(partialTipTotal)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <span className="text-white/60">Refund total</span>
            <span className="text-amber-400 font-semibold">{formatPrice(partialRefundTotal)}</span>
          </div>
        </div>

        {/* Reason Dropdown */}
        <div className="relative">
          <button
            onClick={() => setReasonDropdownOpen(!reasonDropdownOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10"
            style={glassStyle}
          >
            <span className="text-white/60 text-sm">Reason for Refund</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{selectedReason || 'Select reason'}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${reasonDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {reasonDropdownOpen && (
            <div 
              className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 overflow-hidden z-50"
              style={{ background: '#2a2a2a' }}
            >
              {refundReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setSelectedReason(reason);
                    setReasonDropdownOpen(false);
                  }}
                  className={`w-full text-left p-3 text-sm transition-colors ${
                    selectedReason === reason 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proceed Button */}
      <div className="p-3">
        <button
          onClick={handleProceedPartialRefund}
          disabled={partialRefundTotal <= 0}
          className="w-full h-10 rounded-full font-semibold text-white text-sm disabled:opacity-50"
          style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
        >
          PROCEED REFUND
        </button>
      </div>
    </div>
  );

  // Tip Refund Screen
  const renderTipRefund = () => {
    const currentTipRefundAmount = parseFloat(tipRefundAmount) || 0;
    
    return (
      <div className="flex flex-col h-full">
        {renderHeader('Tip Refund')}
        
        <div className="flex-1 p-3 space-y-3">
          {/* Tip Refund Amount Display */}
          <div className="text-center py-4 border-b border-neutral-700">
            <span className="text-white/60 text-xs block mb-1">Tip Refund Amount</span>
            <span className="text-white text-4xl font-bold block">
              ${tipRefundAmount || '0.00'}
            </span>
            <span className="text-white/50 text-xs block mt-1">
              Original tip: {formatPrice(tipAmount)}
            </span>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map(key => (
              <button 
                key={key}
                onClick={() => handleTipKeyPress(key)}
                className={`h-14 rounded-xl text-xl font-medium transition-colors ${
                  key === 'delete' ? 'bg-red-900/50 text-white hover:bg-red-900/70' : 
                  'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                {key === 'delete' ? <Delete className="w-6 h-6 mx-auto" /> : key}
              </button>
            ))}
          </div>

          {/* Full Tip / Clear Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleFullTip}
              className="flex-1 h-10 rounded-full font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' }}
            >
              Full Tip ({formatPrice(tipAmount)})
            </button>
            <button
              onClick={handleClearTip}
              className="flex-1 h-10 rounded-full font-semibold text-white text-sm bg-neutral-700 hover:bg-neutral-600"
            >
              Clear
            </button>
          </div>

          {/* Reason Dropdown */}
          <div className="relative">
            <span className="text-white/60 text-xs block mb-2">Reason for Refund</span>
            <button
              onClick={() => setTipReasonDropdownOpen(!tipReasonDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10"
              style={glassStyle}
            >
              <span className="text-white text-sm">{selectedReason || 'Select reason'}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${tipReasonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {tipReasonDropdownOpen && (
              <div 
                className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 overflow-hidden z-50"
                style={{ background: '#2a2a2a' }}
              >
                {tipRefundReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedReason(reason);
                      setTipReasonDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 text-sm transition-colors ${
                      selectedReason === reason 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Proceed Button */}
        <div className="p-3">
          <button
            onClick={handleProceedTipRefund}
            disabled={currentTipRefundAmount <= 0}
            className="w-full h-12 rounded-full font-semibold text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' }}
          >
            PROCEED REFUND ({formatPrice(currentTipRefundAmount)})
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
        
        <div className="flex-1 p-3">
          {/* Total Refund Amount */}
          <div className="text-center py-4 border-b border-neutral-700 mb-3">
            <span className="text-white/60 text-xs block mb-1">Total Refund Amount</span>
            <span className="text-white text-3xl font-bold block">{formatPrice(refundAmount)}</span>
            <span className="text-white/40 text-xs block mt-1">
              Order #{orderId} • {guestName}
            </span>
          </div>

          {/* Refund Details */}
          <div className="mb-3">
            <span className="text-white/60 text-xs block mb-2">Refund Details</span>
            
            <div className="p-3 rounded-xl border border-white/10 space-y-2" style={glassStyle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-white block text-sm">Cash</span>
                    <span className="text-white/50 text-xs">Original: {formatPrice(orderTotal)} + Tip: {formatPrice(tipAmount)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-semibold text-sm">-{formatPrice(refundAmount)}</span>
                  <span className="text-white/50 text-xs block">of {formatPrice(totalWithTip)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 flex items-center gap-3 text-sm">
                <span className="text-white">Order <span className="font-semibold">{formatPrice(orderTotal)}</span></span>
                <span className="text-white">Tip <span className="font-semibold">{formatPrice(tipAmount)}</span></span>
              </div>

              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Remaining after refund</span>
                <span>{formatPrice(remainingAfterRefund)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-3 rounded-xl border border-white/10 flex items-center justify-between" style={glassStyle}>
            <span className="text-white/60 text-sm">Reason</span>
            <span className="text-white text-sm">{selectedReason}</span>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-3">
          <button
            onClick={handleConfirmRefund}
            className="w-full h-10 rounded-full font-semibold text-white text-sm"
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
      <div className="relative flex items-center justify-center py-3 border-b border-neutral-700">
        <span className="text-white font-semibold text-base">Refund Successful</span>
        <button
          onClick={resetAndClose}
          className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-3">
        <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-3" />
        <span className="text-white font-semibold text-lg mb-1">Refund Successful</span>
        <span className="text-amber-400 text-2xl font-bold mb-4">{formatPrice(refundAmount)}</span>
        
        <span className="text-white/50 text-xs mb-3">Send refund receipt</span>
        
        <div className="flex items-center gap-2 w-full max-w-sm">
          <button 
            onClick={handlePrint}
            className="flex-1 h-10 rounded-full flex items-center justify-center gap-1.5"
            style={glassStyle}
          >
            <Printer className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-sm">Print</span>
          </button>
          <button 
            onClick={() => setStep('phone-input')}
            className="flex-1 h-10 rounded-full flex items-center justify-center gap-1.5"
            style={glassStyle}
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-sm">Text</span>
          </button>
          <button 
            onClick={() => setStep('email-input')}
            className="flex-1 h-10 rounded-full flex items-center justify-center gap-1.5"
            style={glassStyle}
          >
            <Mail className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-sm">Email</span>
          </button>
        </div>
      </div>

      {/* Done Button */}
      <div className="p-3">
        <button
          onClick={resetAndClose}
          className="w-full h-10 rounded-full font-semibold text-black text-sm"
          style={{ background: 'linear-gradient(180deg, #FFC107 0%, #FF9800 100%)' }}
        >
          DONE
        </button>
      </div>
    </div>
  );

  // Phone Input Screen
  const renderPhoneInput = () => (
    <div className="flex flex-col h-[480px]">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 p-3 border-b border-neutral-800">
        <button 
          onClick={() => setStep('success')}
          className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white text-sm font-semibold flex-1 text-center pr-8">Where should we text your receipt?</h2>
      </div>

      {/* Phone Input */}
      <div className="px-3 py-2">
        <div className="flex items-center bg-neutral-800 rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 px-3 py-2.5 border-r border-neutral-700">
            <span className="text-white text-sm font-medium">US +1</span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
          <input 
            type="text" 
            placeholder="(000) 000-0000" 
            value={phoneNumber} 
            readOnly 
            className="flex-1 bg-transparent text-white px-3 py-2.5 text-sm placeholder:text-neutral-500 outline-none" 
          />
        </div>
      </div>

      {/* Marketing Checkbox */}
      <div className="px-3 py-1.5">
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

      {/* Terms */}
      <div className="px-3 py-1 text-center">
        <p className="text-neutral-500 text-[10px] leading-relaxed">
          Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.
        </p>
      </div>

      {/* Send Button */}
      <div className="px-3 py-2">
        <button 
          onClick={handleSendText}
          disabled={phoneNumber.replace(/\D/g, '').length < 10}
          className="w-full py-2.5 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          SEND
        </button>
      </div>

      {/* Numeric Keypad */}
      <div className="flex-1 flex flex-col justify-end px-3 pb-3">
        <div className="grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
            <button 
              key={key}
              onClick={() => handlePhoneKeyPress(key)}
              className={`h-11 rounded-lg text-base font-medium transition-colors ${
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
  );

  // Email Input Screen
  const renderEmailInput = () => (
    <div className="flex flex-col h-[480px]">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 p-3 border-b border-neutral-800">
        <button 
          onClick={() => setStep('success')}
          className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white text-sm font-semibold flex-1 text-center pr-8">Where should we email your receipt?</h2>
      </div>

      {/* Email Input */}
      <div className="px-3 py-2">
        <input 
          type="text" 
          placeholder="email@example.com" 
          value={emailAddress} 
          readOnly 
          className="w-full bg-neutral-800 text-white px-3 py-2.5 rounded-lg text-sm placeholder:text-neutral-500 outline-none" 
        />
      </div>

      {/* Marketing Checkbox */}
      <div className="px-3 py-1.5">
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

      {/* Send Button */}
      <div className="px-3 py-2">
        <button 
          onClick={handleSendEmail}
          disabled={!emailAddress.includes('@') || !emailAddress.includes('.')}
          className="w-full py-2.5 bg-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          SEND
        </button>
      </div>

      {/* QWERTY Keyboard */}
      <div className="flex-1 flex flex-col justify-end px-2 pb-3 gap-1">
        {emailKeys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map(key => (
              <button 
                key={key}
                onClick={() => handleEmailKeyPress(key)}
                className={`rounded-md text-xs font-medium transition-colors ${
                  key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600 px-2.5 h-9' :
                  key.length > 1 ? 'bg-neutral-700 text-white hover:bg-neutral-600 px-1.5 h-9 text-[10px]' :
                  'bg-neutral-800 text-white hover:bg-neutral-700 w-7 h-9'
                }`}
              >
                {key === 'delete' ? <Delete className="w-4 h-4 mx-auto" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'select-type':
        return renderSelectType();
      case 'full-refund':
        return renderFullRefund();
      case 'partial-refund':
        return renderPartialRefund();
      case 'tip-refund':
        return renderTipRefund();
      case 'confirm':
        return renderConfirm();
      case 'success':
        return renderSuccess();
      case 'phone-input':
        return renderPhoneInput();
      case 'email-input':
        return renderEmailInput();
      default:
        return renderSelectType();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 border-0 bg-transparent max-w-md w-full h-auto"
        style={{ background: 'none' }}
      >
        <div 
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{ 
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;
