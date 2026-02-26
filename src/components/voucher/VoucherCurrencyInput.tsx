import { useState, useRef, useCallback } from "react";
import { CURRENCY_SYMBOL } from "./voucherConstants";

interface VoucherCurrencyInputProps {
  /** Raw POS digit string (e.g. "2500" = $25.00) stored as integer cents */
  rawDigits: string;
  /** Called with new raw digits string (integer cents) */
  onRawDigitsChange: (digits: string) => void;
  label: string;
  required?: boolean;
  error?: string;
  warning?: string;
}

/** Convert raw POS cents string → display string for editing */
const centsToDisplay = (raw: string): string => {
  const cents = parseInt(raw || "0", 10);
  if (isNaN(cents) || cents === 0) return "";
  return (cents / 100).toFixed(2);
};

/** Convert display string → raw cents string */
const displayToCents = (display: string): string => {
  if (!display || display === "." || display === "0." || display === "0.0" || display === "0.00") return "";
  const num = parseFloat(display);
  if (isNaN(num) || num <= 0) return "";
  return Math.round(num * 100).toString();
};

/** Format a raw display string on blur: normalize leading zeros, ensure 2 decimals */
const formatOnBlur = (raw: string): string => {
  if (!raw || raw.trim() === "" || raw === ".") return "";
  // Parse to number to normalize (handles .5 → 0.5, 00025 → 25, etc.)
  const num = parseFloat(raw);
  if (isNaN(num) || num < 0) return "";
  if (num === 0) return "";
  // Cap at max
  const capped = Math.min(num, 999999.99);
  // Round to 2 decimals using integer cents to avoid floating point drift
  const cents = Math.round(capped * 100);
  return (cents / 100).toFixed(2);
};

/**
 * Sanitize currency input while preserving cursor-friendly editing.
 * Rules:
 * - Only digits and one decimal point
 * - Max 2 digits after decimal
 * - No negatives, no letters, no spaces
 * - Max value 999999.99
 */
const sanitize = (value: string, previous: string): string => {
  // Strip everything except digits and dots
  let cleaned = value.replace(/[^0-9.]/g, "");

  // Handle multiple decimal points: keep only the first
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    const beforeDot = cleaned.slice(0, firstDot + 1);
    const afterDot = cleaned.slice(firstDot + 1).replace(/\./g, "");
    // Max 2 decimal digits
    cleaned = beforeDot + afterDot.slice(0, 2);
  }

  // Cap integer part length (6 digits max for 999999)
  const dotIdx = cleaned.indexOf(".");
  if (dotIdx === -1) {
    // No decimal: max 6 digits
    if (cleaned.length > 6) cleaned = cleaned.slice(0, 6);
  } else {
    // With decimal: max 6 integer digits
    const intPart = cleaned.slice(0, dotIdx);
    if (intPart.length > 6) {
      cleaned = intPart.slice(0, 6) + cleaned.slice(dotIdx);
    }
  }

  // Final numeric cap check
  const num = parseFloat(cleaned || "0");
  if (!isNaN(num) && num > 999999.99) {
    return previous; // block the change
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

  // When focused: show local editable value. When blurred: show formatted from rawDigits.
  const displayValue = isFocused && localValue !== null ? localValue : centsToDisplay(rawDigits);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    const display = centsToDisplay(rawDigits);
    setLocalValue(display);
  }, [rawDigits]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (localValue !== null) {
      const formatted = formatOnBlur(localValue);
      const newCents = displayToCents(formatted);
      onRawDigitsChange(newCents);
      setLocalValue(null);
    }
  }, [localValue, onRawDigitsChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const prev = localValue || "";
    const sanitized = sanitize(newVal, prev);
    setLocalValue(sanitized);
    // Live update totals using cents
    const liveCents = displayToCents(sanitized);
    onRawDigitsChange(liveCents);
  }, [localValue, onRawDigitsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block minus, plus, e (scientific notation)
    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
      e.preventDefault();
      return;
    }
    // Enter → blur and move to next field
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
      const container = inputRef.current?.closest(".space-y-3, .space-y-2, form");
      if (container) {
        const focusable = container.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([type="date"]), select:not([disabled])'
        );
        const arr = Array.from(focusable);
        const idx = arr.indexOf(inputRef.current!);
        if (idx >= 0 && idx < arr.length - 1) {
          arr[idx + 1].focus();
        }
      }
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain");
    const prev = localValue || "";
    const sanitized = sanitize(pasted, prev);
    setLocalValue(sanitized);
    const liveCents = displayToCents(sanitized);
    onRawDigitsChange(liveCents);
  }, [localValue, onRawDigitsChange]);

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
          autoComplete="off"
          value={displayValue}
          placeholder="0.00"
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-full bg-transparent pl-7 pr-3 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {warning && !error && <p className="text-amber-400 text-xs mt-1">{warning}</p>}
    </div>
  );
};

export default VoucherCurrencyInput;
