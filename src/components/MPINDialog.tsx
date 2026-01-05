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

  const renderPinDots = () => {
    return (
      <div className="flex items-center justify-center gap-3 mb-6">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index < pin.length
                ? error
                  ? "bg-red-500"
                  : "bg-primary"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  const numpadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", "backspace"]
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] bg-[#1a1a1a] border-neutral-700 p-6 gap-0">
        {/* Manager Profile */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-primary/30">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
              alt="Manager"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Mia Jones</h3>
          <p className="text-sm text-muted-foreground">Manager</p>
        </div>

        {/* PIN Dots */}
        {renderPinDots()}

        {/* Title */}
        <p className="text-center text-muted-foreground text-sm mb-6">Enter your PIN</p>

        {/* Numpad */}
        <div className="flex flex-col gap-3">
          {numpadButtons.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-3">
              {row.map((btn) => (
                btn === "backspace" ? (
                  <button
                    key={btn}
                    onClick={handleBackspace}
                    className="w-20 h-16 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                  >
                    <Delete className="w-6 h-6 text-foreground" />
                  </button>
                ) : (
                  <button
                    key={btn}
                    onClick={() => handleNumberClick(btn)}
                    className="w-20 h-16 rounded-xl bg-neutral-800 border border-neutral-700 text-2xl font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                  >
                    {btn}
                  </button>
                )
              ))}
              {/* Add empty placeholder for the last row to align 0 with 8 */}
              {rowIndex === 3 && <div className="w-20 h-16" />}
            </div>
          ))}
        </div>

        {/* Biometric Options */}
        <div className="flex justify-center gap-4 mt-6">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800/50 border border-neutral-700 text-muted-foreground hover:bg-neutral-700/50 transition-colors">
            <Fingerprint className="w-5 h-5" />
            <span className="text-sm">Touch ID</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800/50 border border-neutral-700 text-muted-foreground hover:bg-neutral-700/50 transition-colors">
            <ScanFace className="w-5 h-5" />
            <span className="text-sm">Face ID</span>
          </button>
        </div>

        {/* Forgot PIN */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          Forgot PIN? Contact your manager
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default MPINDialog;
