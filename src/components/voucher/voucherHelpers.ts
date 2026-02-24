// POS shift-decimal currency helpers
export const MAX_CURRENCY_DIGITS = 8; // e.g. 999,999.99

export const posCurrencyDigitAppend = (rawDigits: string, key: string): string => {
  const newDigits = key === '00' ? rawDigits + '00' : rawDigits + key;
  const stripped = newDigits.replace(/^0+/, '') || '';
  return stripped.slice(0, MAX_CURRENCY_DIGITS);
};

export const posCurrencyDigitDelete = (rawDigits: string): string => {
  return rawDigits.slice(0, -1);
};

export const posCurrencyFormat = (rawDigits: string): string => {
  const cents = parseInt(rawDigits || '0', 10);
  return (cents / 100).toFixed(2);
};

export const posCurrencyToNumber = (rawDigits: string): number => {
  return parseInt(rawDigits || '0', 10) / 100;
};

export const numberToPosDigits = (num: number): string => {
  if (!num || num <= 0) return '';
  return Math.round(num * 100).toString();
};

// Phone formatting
export const formatPhone = (digits: string, pattern: string): string => {
  if (!digits) return '';
  let result = '';
  let digitIdx = 0;
  for (let i = 0; i < pattern.length && digitIdx < digits.length; i++) {
    if (pattern[i] === 'X') {
      result += digits[digitIdx++];
    } else {
      result += pattern[i];
    }
  }
  return result;
};

// Voucher code generation
export const generateVoucherCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VC-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
