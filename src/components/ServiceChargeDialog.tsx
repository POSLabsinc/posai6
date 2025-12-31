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
        className="border-0 text-white max-w-md p-0 gap-0 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #4D4D4D 0%, #3A3A3A 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-white/10">
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

        <div className="p-4 pt-3 space-y-2">
          {serviceChargeOptions.map((option) => {
            const amount = calculateAmount(option.percentage);
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(180deg, rgba(255, 94, 0, 0.15) 0%, rgba(255, 94, 0, 0.05) 100%)'
                    : 'linear-gradient(180deg, #5A5A5A 0%, #4A4A4A 100%)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary/20' : 'border-white/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{option.name}</p>
                    <p className="text-white/50 text-xs">{option.percentage}%</p>
                  </div>
                </div>
                <span className="text-primary font-semibold">+${amount.toFixed(2)}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 pt-2">
          <Button
            onClick={handleApply}
            disabled={!selectedOption}
            className="w-full h-11 text-base font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: selectedOption 
                ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                : 'linear-gradient(180deg, #6A6A6A 0%, #5A5A5A 100%)',
              color: selectedOption ? '#000' : '#999'
            }}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceChargeDialog;
