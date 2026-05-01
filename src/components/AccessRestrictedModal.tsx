import { useState, useEffect } from "react";
import { ChevronLeft, Delete, Fingerprint, ScanFace } from "lucide-react";

interface AccessRestrictedModalProps {
  /** Subtitle shown below "Access Restricted" title */
  subtitle?: string;
  /** Called when back / close chevron is pressed */
  onBack: () => void;
  /** Called when the correct PIN is entered — after a short success delay */
  onSuccess: () => void;
  /** The PIN to validate against (default "1234") */
  correctPin?: string;
}

const CORRECT_PIN = "1234";

const AccessRestrictedModal = ({
  subtitle = "Enter Manager PIN to continue.",
  onBack,
  onSuccess,
  correctPin = CORRECT_PIN,
}: AccessRestrictedModalProps) => {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Reset state whenever the component mounts fresh
  useEffect(() => {
    setPin("");
    setPinError(false);
  }, []);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      if (newPin === correctPin) {
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

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
    setPinError(false);
  };

  return (
    <div className="manager-pin-root flex flex-col bg-neutral-900 p-6 pb-8">
      {/* Header */}
      <div className="relative flex items-center justify-center mb-6">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-400" />
        </button>
        <div className="text-center">
          <h3 className="text-foreground font-bold text-xl mb-1">Access Restricted</h3>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>

      {/* PIN boxes */}
      <div className={`flex justify-center gap-3 mb-6 ${pinError ? "animate-shake" : ""}`}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all ${
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
            className="h-16 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-2xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            {num}
          </button>
        ))}
        {/* Backspace */}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-16 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
        {/* 0 */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="h-16 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-2xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          0
        </button>
        {/* Clear */}
        <button
          type="button"
          onClick={handleClear}
          className="h-16 rounded-xl bg-neutral-800 border border-neutral-700 text-2xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          C
        </button>
      </div>

      {/* Biometric options */}
      <div className="flex gap-3 mt-4 w-full">
        <button
          type="button"
          className="flex-1 flex items-center justify-center py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors"
        >
          <Fingerprint className="w-6 h-6" />
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors"
        >
          <ScanFace className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default AccessRestrictedModal;
