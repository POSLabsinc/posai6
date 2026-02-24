import { useState, useRef, useCallback } from "react";
import { CURRENCY_SYMBOL, inputClass } from "./voucherConstants";

interface VoucherCurrencyInputProps {
  /** Raw POS digit string (e.g. "2500" = $25.00) */
  rawDigits: string;
  /** Called with new raw digits string */
  onRawDigitsChange: (digits: string) => void;
  label: string;
  required?: boolean;
  error?: string;
  warning?: string;
}

/** Convert raw POS digits to display value string */
const digitsToDisplay = (raw: string): string => {
  const cents = parseInt(raw || "0", 10);
  if (isNaN(cents) || cents === 0) return "";
  return (cents / 100).toFixed(2);
};

/** Convert a display value string back to raw POS digits */
const displayToDigits = (display: string): string => {
  const num = parseFloat(display);
  if (isNaN(num) || num <= 0) return "";
  return Math.round(num * 100).toString();
};

/** Sanitize input: only digits and one decimal, max 2 decimal places, no negatives */
const sanitizeCurrencyInput = (value: string): string => {
  // Remove everything except digits and dot
  let cleaned = value.replace(/[^0-9.]/g, "");
  // Only allow one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  // Max 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + "." + parts[1].slice(0, 2);
  }
  // Max value guard (999999.99)
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 999999.99) {
    cleaned = "999999.99";
  }
  return cleaned;
};

const VoucherCurrencyInput = ({
  rawDigits,
  onRawDigitsChange,
  label,
  required,
  error,
  warning,
}: VoucherCurrencyInputProps) => {
  const [localValue, setLocalValue] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display: when focused show local editable value, otherwise show formatted from rawDigits
  const displayValue = isFocused && localValue !== null ? localValue : digitsToDisplay(rawDigits);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    const display = digitsToDisplay(rawDigits);
    setLocalValue(display);
  }, [rawDigits]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (localValue !== null) {
      const sanitized = sanitizeCurrencyInput(localValue);
      const newDigits = displayToDigits(sanitized);
      onRawDigitsChange(newDigits);
      setLocalValue(null);
    }
  }, [localValue, onRawDigitsChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeCurrencyInput(raw);
    setLocalValue(sanitized);
    // Live update for totals
    const newDigits = displayToDigits(sanitized);
    onRawDigitsChange(newDigits);
  }, [onRawDigitsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block minus key
    if (e.key === "-") {
      e.preventDefault();
      return;
    }
    // Enter → move to next field
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
      // Focus next focusable element
      const form = inputRef.current?.closest("form, div");
      if (form) {
        const focusable = form.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        );
        const idx = Array.from(focusable).indexOf(inputRef.current!);
        if (idx >= 0 && idx < focusable.length - 1) {
          focusable[idx + 1].focus();
        }
      }
    }
  }, []);

  const borderClass = error
    ? "border-red-500"
    : isFocused
    ? "border-neutral-400"
    : "border-neutral-600";

  return (
    <div>
      <label className="text-neutral-400 text-xs font-medium mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className={`relative w-full bg-neutral-800 border rounded-lg transition-colors ${borderClass}`}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
          {CURRENCY_SYMBOL}
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder="0.00"
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent pl-7 pr-3 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {warning && !error && <p className="text-amber-400 text-xs mt-1">{warning}</p>}
    </div>
  );
};

export default VoucherCurrencyInput;
