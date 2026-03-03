import { useState } from "react";
import { Fingerprint, ScanFace } from "lucide-react";
import { lookupEmployeeByPin } from "@/lib/employeePinLookup";

interface ManagerPinScreenProps {
  onSuccess: () => void;
  correctPin?: string; // Deprecated - now validates against database
}

const ManagerPinScreen = ({ onSuccess }: ManagerPinScreenProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || error) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      // Validate against the database
      const employee = await lookupEmployeeByPin(newPin);
      if (employee) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 800);
      }
    }
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  const handleDelete = () => {
    if (error) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometric = () => {
    onSuccess();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* PIN dots */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-4xl font-bold select-none transition-colors duration-200 ${
              error
                ? i < pin.length
                  ? "text-red-500"
                  : "text-foreground/20"
                : i < pin.length
                  ? "text-foreground"
                  : "text-foreground/20"
            }`}
          >
            ✱
          </span>
        ))}
      </div>

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[300px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="w-20 h-20 rounded-xl bg-muted text-foreground text-2xl font-medium flex items-center justify-center active:bg-accent transition-colors mx-auto"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Fingerprint / 0 / Delete */}
        <button
          onClick={handleBiometric}
          className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground active:bg-accent transition-colors mx-auto"
        >
          <Fingerprint size={28} />
        </button>
        <button
          onClick={() => handleDigit("0")}
          className="w-20 h-20 rounded-xl bg-muted text-foreground text-2xl font-medium flex items-center justify-center active:bg-accent transition-colors mx-auto"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground active:bg-accent transition-colors mx-auto"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H21V21H9L2 12L9 3Z" />
            <path d="M13 9L17 15M17 9L13 15" />
          </svg>
        </button>
      </div>

      {/* Face ID row */}
      <button
        onClick={handleBiometric}
        className="mt-4 flex items-center justify-center gap-2 text-muted-foreground active:text-foreground transition-colors"
      >
        <ScanFace size={22} />
        <span className="text-sm font-medium">Face ID</span>
      </button>
    </div>
  );
};

export default ManagerPinScreen;
