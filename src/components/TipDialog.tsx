import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft } from "lucide-react";
import { formatPrice } from "@/data/orders";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  onTipSelected: (tip: number) => void;
}

const TipDialog = ({ open, onOpenChange, orderTotal, onTipSelected }: TipDialogProps) => {
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [customAmount, setCustomAmount] = useState("0.00");

  const tipPercentages = [
    { percent: 25, amount: orderTotal * 0.25 },
    { percent: 20, amount: orderTotal * 0.20 },
    { percent: 15, amount: orderTotal * 0.15 },
    { percent: 10, amount: orderTotal * 0.10 },
  ];

  const handleTipSelect = (amount: number) => {
    onTipSelected(amount);
    onOpenChange(false);
  };

  const handleNoTip = () => {
    onTipSelected(0);
    onOpenChange(false);
  };

  const handleKeypadPress = (key: string) => {
    if (key === "backspace") {
      const newValue = customAmount.slice(0, -1);
      setCustomAmount(newValue.length > 0 ? newValue : "0");
    } else if (key === "clear") {
      setCustomAmount("0.00");
    } else if (key === ".") {
      if (!customAmount.includes(".")) {
        setCustomAmount(customAmount + ".");
      }
    } else {
      if (customAmount === "0.00" || customAmount === "0") {
        setCustomAmount(key);
      } else {
        setCustomAmount(customAmount + key);
      }
    }
  };

  const handleCustomTipConfirm = () => {
    const amount = parseFloat(customAmount) || 0;
    handleTipSelect(amount);
    setShowCustomTip(false);
    setCustomAmount("0.00");
  };

  if (showCustomTip) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <button 
                onClick={() => setShowCustomTip(false)}
                className="p-2 rounded-full hover:opacity-80 transition-opacity"
                style={{
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-white/60 text-sm">Custom Tip</span>
            </div>

            {/* Amount Display */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              <span className="text-white text-4xl font-bold">${customAmount}</span>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeypadPress(key)}
                  className="h-14 rounded-xl flex items-center justify-center text-white text-xl font-medium transition-all hover:opacity-80"
                  style={{
                    background: "#7575754D",
                    boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                  }}
                >
                  {key === "backspace" ? "⌫" : key}
                </button>
              ))}
            </div>

            {/* Confirm Button */}
            <div className="p-4">
              <button
                onClick={handleCustomTipConfirm}
                className="w-full h-12 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
              >
                <span className="text-black font-semibold">CONFIRM TIP</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:opacity-80 transition-opacity"
              style={{
                background: "#7575754D",
                boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button 
              className="px-3 py-1.5 rounded-full text-white/80 text-xs"
              style={{
                background: "#7575754D",
                boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}
            >
              Request tip on built-in CFD
            </button>
          </div>

          {/* Total Display */}
          <div className="text-center py-6">
            <h2 className="text-white text-3xl font-bold">Total {formatPrice(orderTotal)}</h2>
            <p className="text-white/50 text-sm mt-2">
              Suggestions based on original amount of {formatPrice(orderTotal)}
            </p>
          </div>

          {/* Tip Percentage Grid */}
          <div className="grid grid-cols-2 gap-3 px-4">
            {tipPercentages.map(({ percent, amount }) => (
              <button
                key={percent}
                onClick={() => handleTipSelect(amount)}
                className="py-6 rounded-xl border border-white/20 hover:border-white/40 transition-all flex flex-col items-center justify-center gap-1"
                style={{
                  background: "#1B1C20"
                }}
              >
                <span className="text-white text-2xl font-bold">{percent}%</span>
                <span className="text-white/50 text-sm">+{formatPrice(amount)}</span>
              </button>
            ))}
          </div>

          {/* Custom Tip Button */}
          <div className="px-4 pt-3">
            <button
              onClick={() => setShowCustomTip(true)}
              className="w-full py-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              style={{
                background: "#1B1C20"
              }}
            >
              <span className="text-white font-bold">CUSTOM TIP</span>
            </button>
          </div>

          {/* No Tip */}
          <div className="py-4 text-center">
            <button
              onClick={handleNoTip}
              className="text-white font-medium hover:opacity-80 transition-opacity"
            >
              No Tip
            </button>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-white/10 px-4 py-4">
            <p className="text-white/40 text-xs text-center">
              I acknowledge that tips are distributed according to the company's tip pooling policy
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipDialog;
