import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// USA phone format: (XXX) XXX-XXXX
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

// Validate phone number has exactly 10 digits (USA format)
export const isValidPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10;
};

// Get phone validation error message
export const getPhoneValidationError = (value: string): string | null => {
  if (!value || value.trim() === "") return null; // Empty is OK (optional field)
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length < 10) return "Phone number must be 10 digits";
  return null;
};

// Validate CSS color value to prevent injection
export const isValidCSSColor = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  
  // Allow only safe CSS color formats:
  // - Named colors (letters only)
  // - Hex colors (#fff, #ffffff, #ffffffff)
  // - HSL/HSLA: hsl(0, 0%, 0%) or hsla(0, 0%, 0%, 0.5)
  // - RGB/RGBA: rgb(0, 0, 0) or rgba(0, 0, 0, 0.5)
  // - CSS variables: var(--color-name)
  const trimmed = value.trim();
  
  // Named colors (letters only, no special chars)
  const namedColorRegex = /^[a-zA-Z]+$/;
  
  // Hex colors
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  
  // HSL/HSLA
  const hslRegex = /^hsla?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
  
  // RGB/RGBA
  const rgbRegex = /^rgba?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
  
  // CSS variables
  const cssVarRegex = /^var\(--[a-zA-Z0-9-]+\)$/;
  
  return (
    namedColorRegex.test(trimmed) ||
    hexRegex.test(trimmed) ||
    hslRegex.test(trimmed) ||
    rgbRegex.test(trimmed) ||
    cssVarRegex.test(trimmed)
  );
};

// Sanitize CSS color value - returns empty string if invalid
export const sanitizeCSSColor = (value: string): string => {
  return isValidCSSColor(value) ? value.trim() : '';
};
