// ---- Currency config (from locale/database in production) ----
export const CURRENCY_SYMBOL = '$';
export const CURRENCY_CODE = 'USD';

// ---- Country codes for phone input ----
export const COUNTRY_CODES = [
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', phoneLength: 10, placeholder: '(555) 123-4567', hint: '10-digit phone number', format: '(XXX) XXX-XXXX' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', phoneLength: 11, placeholder: '07123 456789', hint: '11-digit UK phone number', format: 'XXXXX XXXXXX' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', phoneLength: 10, placeholder: '(555) 123-4567', hint: '10-digit phone number', format: '(XXX) XXX-XXXX' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', phoneLength: 9, placeholder: '412 345 678', hint: '9-digit mobile number', format: 'XXX XXX XXX' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', phoneLength: 10, placeholder: '98765 43210', hint: '10-digit mobile number', format: 'XXXXX XXXXX' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', phoneLength: 9, placeholder: '50 123 4567', hint: '9-digit mobile number', format: 'XX XXX XXXX' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia', phoneLength: 9, placeholder: '51 234 5678', hint: '9-digit mobile number', format: 'XX XXX XXXX' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', phoneLength: 8, placeholder: '9123 4567', hint: '8-digit phone number', format: 'XXXX XXXX' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', phoneLength: 11, placeholder: '151 12345678', hint: '11-digit phone number', format: 'XXX XXXXXXXX' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', phoneLength: 9, placeholder: '6 12 34 56 78', hint: '9-digit phone number', format: 'X XX XX XX XX' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan', phoneLength: 10, placeholder: '90 1234 5678', hint: '10-digit phone number', format: 'XX XXXX XXXX' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil', phoneLength: 11, placeholder: '11 91234 5678', hint: '11-digit phone number', format: 'XX XXXXX XXXX' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico', phoneLength: 10, placeholder: '55 1234 5678', hint: '10-digit phone number', format: 'XX XXXX XXXX' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea', phoneLength: 10, placeholder: '10 1234 5678', hint: '10-digit phone number', format: 'XX XXXX XXXX' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa', phoneLength: 9, placeholder: '71 123 4567', hint: '9-digit phone number', format: 'XX XXX XXXX' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria', phoneLength: 10, placeholder: '801 234 5678', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines', phoneLength: 10, placeholder: '917 123 4567', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', phoneLength: 10, placeholder: '301 234 5678', hint: '10-digit phone number', format: 'XXX XXX XXXX' },
] as const;

export type CountryCodeEntry = typeof COUNTRY_CODES[number];

// ---- Predefined voucher types with backend pricing config ----
export type RedemptionMode = 'in-person' | 'online' | 'both';

export interface VoucherTypeConfig {
  name: string;
  serviceFeeType: 'percentage' | 'fixed' | 'none';
  serviceFeeValue: number; // percentage or fixed amount
  description?: string;
  redemptionMode?: RedemptionMode;
}

export const PREDEFINED_VOUCHER_TYPES: VoucherTypeConfig[] = [
  { name: 'Summer Sale 20% Off', serviceFeeType: 'fixed', serviceFeeValue: 2.00, description: 'Seasonal promotion voucher', redemptionMode: 'both' },
  { name: 'Welcome Offer', serviceFeeType: 'percentage', serviceFeeValue: 5, description: 'New customer welcome voucher', redemptionMode: 'both' },
  { name: 'Loyalty Reward', serviceFeeType: 'none', serviceFeeValue: 0, description: 'Points-based loyalty redemption', redemptionMode: 'in-person' },
  { name: 'Festive Discount', serviceFeeType: 'fixed', serviceFeeValue: 3.00, description: 'Holiday special voucher', redemptionMode: 'both' },
  { name: 'Birthday Special', serviceFeeType: 'none', serviceFeeValue: 0, description: 'Birthday celebration voucher', redemptionMode: 'in-person' },
];

// ---- Redemption limit options ----
export const REDEMPTION_LIMIT_OPTIONS = [
  { value: '0', label: 'Unlimited' },
  { value: '1', label: '1 time' },
  { value: '2', label: '2 times' },
  { value: '3', label: '3 times' },
  { value: '5', label: '5 times' },
  { value: '10', label: '10 times' },
  { value: '25', label: '25 times' },
  { value: '50', label: '50 times' },
];

// ---- Mock company profiles ----
export interface CompanyProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  preferredVoucherTypes?: string[];
  employeeEmails?: string[];
}

/** Detect if a customer belongs to a company by email */
export const detectCompanyForCustomer = (customerEmail?: string): CompanyProfile | null => {
  if (!customerEmail) return null;
  const lowerEmail = customerEmail.toLowerCase();
  return MOCK_COMPANIES.find(c => c.employeeEmails?.some(e => e.toLowerCase() === lowerEmail)) || null;
};

export const MOCK_COMPANIES: CompanyProfile[] = [
  { id: 'c1', name: 'Acme Corp', email: 'orders@acme.com', phone: '(555) 100-2000', preferredVoucherTypes: ['Welcome Offer', 'Festive Discount'], employeeEmails: ['john@example.com'] },
  { id: 'c2', name: 'TechStart Inc', email: 'admin@techstart.io', phone: '(555) 200-3000', preferredVoucherTypes: ['Loyalty Reward'], employeeEmails: ['jane@example.com'] },
  { id: 'c3', name: 'Global Foods LLC', email: 'purchasing@globalfoods.com', phone: '(555) 300-4000', employeeEmails: [] },
];

// ---- Shared style classes ----
export const inputClass = "w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors";
export const labelClass = "text-neutral-400 text-xs font-medium mb-1.5 block";
export const keypadBtnClass = "rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-white transition-all duration-100 active:scale-95 flex items-center justify-center";

// ---- Types for wizard state ----
export type PurchaseMode = 'single' | 'multiple';
export type BuyerType = 'personal' | 'company';

export interface VoucherCustomer {
  id?: string;
  name: string;
  phone: string;
  email: string;
  isNew: boolean;
}

export interface VoucherEntry {
  id: string;
  voucherName: string;
  isCustom: boolean;
  valueDigits: string;
  serviceFeeDigits: string;
  serviceFeeReadOnly: boolean;
  serviceFeeType: 'percentage' | 'fixed' | 'none';
  serviceFeeConfigValue: number;
}
