import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Delete, Fingerprint, ScanFace } from "lucide-react";

interface MPINDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  correctPin?: string;
}

const MPINDialog = ({ open, onOpenChange, onSuccess, correctPin = "1234" }: MPINDialogProps) => {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setError(false);
    }
  }, [open]);

  useEffect(() => {
    if (pin.length === 4) {
      // For now, accept any 4-digit PIN to test the flow
      onSuccess();
      onOpenChange(false);
    }
  }, [pin, onSuccess, onOpenChange]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  const renderPinDots = () => {
    return (
      <div className="flex items-center justify-center gap-2.5 mb-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index < pin.length
                ? error
                  ? "bg-destructive"
                  : "bg-primary"
                : "bg-neutral-600"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none rounded-none bg-neutral-900 border-none p-4 gap-0 flex flex-col justify-center items-center">
        <div className="w-full max-w-[280px] flex flex-col items-center">
          {/* Manager Profile - Compact */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-primary/30">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                alt="Manager"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-base font-semibold text-foreground">Mia Jones</h3>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>

          {/* PIN Dots */}
          {renderPinDots()}

          {/* Title */}
          <p className="text-center text-muted-foreground text-xs mb-4">Enter your PIN</p>

          {/* Numpad - Compact Grid */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
              >
                {num}
              </button>
            ))}
            {/* Backspace button (left) */}
            <button
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
            {/* Zero button (center) */}
            <button
              onClick={() => handleNumberClick("0")}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              0
            </button>
            {/* Clear button (right) - red C */}
            <button
              onClick={handleClear}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              C
            </button>
          </div>

          {/* Biometric Options - Compact */}
          <div className="flex justify-center gap-3 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
              <Fingerprint className="w-4 h-4" />
              <span className="text-xs">Touch ID</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
              <ScanFace className="w-4 h-4" />
              <span className="text-xs">Face ID</span>
            </button>
          </div>

          {/* Forgot PIN */}
          <p className="text-center text-muted-foreground text-[10px] mt-4">
            Forgot PIN? Contact your manager
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MPINDialog;
