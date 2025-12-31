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
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-md p-0 gap-0">
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-white">
            Select Service Charge
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-4 pt-2 space-y-2">
          {serviceChargeOptions.map((option) => {
            const amount = calculateAmount(option.percentage);
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary' : 'border-white/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{option.name}</p>
                    <p className="text-white/50 text-sm">{option.percentage}%</p>
                  </div>
                </div>
                <span className="text-white font-medium">+${amount.toFixed(2)}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 pt-2">
          <Button
            onClick={handleApply}
            disabled={!selectedOption}
            className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-medium"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceChargeDialog;
