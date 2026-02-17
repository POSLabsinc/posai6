import { useState, useCallback } from "react";
import { Delete, X } from "lucide-react";

interface PinPadProps {
  onComplete: (pin: string) => void;
  onCancel: () => void;
  length?: number;
  error?: string;
}

export const PinPad = ({ onComplete, onCancel, length = 4, error }: PinPadProps) => {
  const [pin, setPin] = useState("");

  const handleNumberPress = useCallback((num: string) => {
    if (pin.length < length) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === length) {
        setTimeout(() => onComplete(newPin), 150);
      }
    }
  }, [pin, length, onComplete]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPin("");
  }, []);

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN Dots */}
      <div className="flex gap-4 mb-2">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length ? "pin-dot-active" : "pin-dot-inactive"
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-destructive text-sm font-medium animate-pulse">{error}</p>
      )}

      {/* Number Grid */}
      <div className="grid grid-cols-3 gap-3">
        {numbers.map((num, i) => {
          if (num === "") {
            return <div key={i} className="w-16 h-16 sm:w-20 sm:h-20" />;
          }
          if (num === "del") {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="pin-button w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
              >
                <Delete className="w-6 h-6 text-foreground/80" />
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleNumberPress(num)}
              className="pin-button w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-semibold text-foreground"
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all"
      >
        <X className="w-5 h-5" />
        <span className="text-sm font-medium">Cancel</span>
      </button>
    </div>
  );
};
