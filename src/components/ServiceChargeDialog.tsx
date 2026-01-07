import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ServiceChargeOption {
  id: string;
  name: string;
  percentage: number;
}

interface ServiceChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onApply: (amount: number, name: string) => void;
}

const serviceChargeOptions: ServiceChargeOption[] = [
  { id: '1', name: 'Auto Gratuity 15%', percentage: 15 },
  { id: '2', name: 'Auto Gratuity 18%', percentage: 18 },
  { id: '3', name: 'Auto Gratuity 20%', percentage: 20 },
  { id: '4', name: 'Auto Gratuity 22%', percentage: 22 },
  { id: '5', name: 'Large Party Fee', percentage: 18 },
];

const ServiceChargeDialog: React.FC<ServiceChargeDialogProps> = ({
  open,
  onOpenChange,
  subtotal,
  onApply,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const calculateAmount = (percentage: number) => {
    return (subtotal * percentage) / 100;
  };

  const handleApply = () => {
    if (selectedOption) {
      const option = serviceChargeOptions.find(o => o.id === selectedOption);
      if (option) {
        const amount = calculateAmount(option.percentage);
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
          {serviceChargeOptions.map((option) => {
            const amount = calculateAmount(option.percentage);
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
                    <p className="text-white text-sm font-medium">{option.name}</p>
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
