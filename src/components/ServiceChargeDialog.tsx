import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceChargeOption {
  id: string;
  name: string;
  amount: number;
  type: string;
}

interface ServiceChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onApply: (amount: number, name: string) => void;
}

const defaultOptions: ServiceChargeOption[] = [
  { id: '1', name: 'Large Party (6+)', amount: 18, type: 'Percentage' },
  { id: '2', name: 'Delivery Fee', amount: 5, type: 'Fixed' },
  { id: '3', name: 'Holiday Surcharge', amount: 3, type: 'Percentage' },
];

const fetchServiceChargeOptions = async (): Promise<ServiceChargeOption[]> => {
  try {
    const { data, error } = await supabase
      .from('service_charges')
      .select('id, name, amount, type')
      .eq('archived', false)
      .eq('is_active', true)
      .order('sort_order');
    if (error || !data || data.length === 0) return defaultOptions;
    return data.map(c => ({ id: c.id, name: c.name, amount: Number(c.amount), type: c.type }));
  } catch {
    return defaultOptions;
  }
};

const ServiceChargeDialog: React.FC<ServiceChargeDialogProps> = ({
  open,
  onOpenChange,
  subtotal,
  onApply,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [options, setOptions] = useState<ServiceChargeOption[]>([]);

  // Reload options from settings every time dialog opens
  useEffect(() => {
    if (open) {
      setOptions(getServiceChargeOptions());
      setSelectedOption(null);
    }
  }, [open]);

  const calculateAmount = (option: ServiceChargeOption) => {
    return option.type === 'Percentage' ? (subtotal * option.amount) / 100 : option.amount;
  };

  const formatLabel = (option: ServiceChargeOption) => {
    return option.type === 'Percentage' ? `${option.name} (${option.amount}%)` : option.name;
  };

  const handleApply = () => {
    if (selectedOption) {
      const option = options.find(o => o.id === selectedOption);
      if (option) {
        const amount = calculateAmount(option);
        onApply(amount, option.name);
        onOpenChange(false);
        setSelectedOption(null);
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedOption(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="border-0 text-white w-[calc(100%-32px)] max-w-[360px] p-0 gap-0 rounded-xl overflow-hidden [&>button]:hidden"
        style={{
          background: '#2A2A2A',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <DialogHeader className="p-3 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold text-white">
            Select Service Charge
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="px-3 pb-2 space-y-1.5">
          {options.map((option) => {
            const amount = calculateAmount(option);
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-white/30 bg-[#3A3A3A]'
                    : 'border-white/10 bg-[#3A3A3A] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-white bg-transparent' : 'border-white/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{formatLabel(option)}</p>
                  </div>
                </div>
                <span className="text-white text-sm font-medium">+${amount.toFixed(2)}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 pt-2">
          <Button
            onClick={handleApply}
            disabled={!selectedOption}
            className="w-full h-10 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-[#1A1A1A] hover:bg-[#252525] text-white border-0"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceChargeDialog;
