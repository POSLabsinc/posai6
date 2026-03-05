import { useState, useEffect } from "react";
import { ChevronLeft, Delete } from "lucide-react";

interface CustomerSupportPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CS_PIN = "000000";

const CustomerSupportPinModal = ({ isOpen, onClose, onSuccess }: CustomerSupportPinModalProps) => {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setPinError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 6) {
      if (newPin === CS_PIN) {
        setTimeout(() => {
          setPin("");
          setPinError(false);
          onSuccess();
        }, 200);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPin("");
          setPinError(false);
        }, 600);
      }
    }
  };

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => { setPin(""); setPinError(false); };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-3xl w-full max-w-sm p-6 pb-8">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-0 w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div className="text-center">
            <h3 className="text-foreground font-bold text-xl mb-1">Customer Support</h3>
            <p className="text-muted-foreground text-sm">Enter 6-digit Customer Support PIN</p>
          </div>
        </div>

        {/* PIN boxes */}
        <div className={`flex justify-center gap-2.5 mb-6 ${pinError ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                index < pin.length
                  ? pinError
                    ? "border-red-500 bg-red-500/10"
                    : "border-neutral-400 bg-neutral-700"
                  : "border-neutral-600 bg-neutral-800"
              }`}
            >
              {index < pin.length ? <span className="text-foreground">✱</span> : ""}
            </div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            C
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportPinModal;
