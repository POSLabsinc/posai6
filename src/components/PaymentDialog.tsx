import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { COUNTRY_CODES, type CountryCodeEntry } from "@/components/voucher/voucherConstants";
import { getActiveTaxRate } from "@/lib/orderUtils";
import { formatPhone } from "@/components/voucher/voucherHelpers";
import { 
  Check, ChevronDown, X, Tag, CreditCard, User, Gift, Link, QrCode, 
  ArrowRightCircle, Banknote, Grid3X3, Delete, Printer, MessageSquare, 
  Mail, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, 
  UtensilsCrossed, ArrowLeft, UserPlus, Search, Phone, AlertTriangle, 
  RefreshCw, Send, Zap, Users, Clock, Share2, GripVertical, Save, Ticket, Percent
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import tickSuccessIcon from "@/assets/icons/tick-success.svg";
import splitCheckIcon from "@/assets/icons/split-check.svg";

// ============= TYPES =============
export interface PaymentDialogOrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  assignedSeats?: number[];  // Which seats this item belongs to
  isShared?: boolean;        // If true, split cost among all seats
}

export interface PaymentDialogOrderDetails {
  guest?: string;
  phone?: string;
  table?: string;
  check?: number | string;
  partySize?: number;        // Number of guests at the table
  orderType?: string;        // "DINE IN", "TAKE OUT", "DELIVERY", etc.
  orderNumber?: number | string;  // Order number for display
  serverName?: string;       // Actual server name
  orderTime?: string;        // Time order was created (formatted string)
  items: PaymentDialogOrderItem[];
}

export interface PaymentHistoryItem {
  method: string;
  amount: number;
  methodLabel: string;
}

export interface VoucherItemDetail {
  name: string;
  price: number;
  index: number; // unique index across all voucher units (expanded by qty)
}

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetails: PaymentDialogOrderDetails;
  subtotal: number;
  tax: number;
  total: number;
  containsVoucher?: boolean;
  voucherCount?: number;
  voucherItems?: VoucherItemDetail[];
  onPaymentComplete?: (paymentHistory: PaymentHistoryItem[]) => void;
  onSaveSplit?: (config: {
    mode: 'seat' | 'evenly' | 'custom';
    numberOfChecks: number;
    checkAssignments: Record<number, number>;
  }) => void;
}

// ============= CONSTANTS =============
interface GuestType {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  loyaltyPoints?: number;
}

const mockGuests: GuestType[] = [
  { name: "Ayden Veum", phone: "(346) 346-3636", email: "cow@user.com", avatar: "AV", loyaltyPoints: 850 },
  { name: "Arjun Gerhold", phone: "(574) 747-3634", email: "cow@user.com", avatar: "AG", loyaltyPoints: 1250 },
  { name: "Bergnaum", phone: "(643) 636-4377", email: "abc@gmail.com", avatar: "B", loyaltyPoints: 320 },
  { name: "Cleora Hills", phone: "(100) 000-0000", email: "cleorahills@gmail.com", avatar: "CH", loyaltyPoints: 1580 },
  { name: "Eden Kautzer", phone: "(353) 253-2523", email: "dog@Test.com", avatar: "EK", loyaltyPoints: 920 },
  { name: "Wunderlich", phone: "(234) 235-2323", email: "alaskanm@dog.com", avatar: "W", loyaltyPoints: 450 },
  { name: "Simeon Wilderman", phone: "(643) 634-6334", email: "dominate@user.com", avatar: "SW", loyaltyPoints: 2100 },
  { name: "Gino Yost", phone: "(234) 254-3235", email: "dominate@user.com", avatar: "GY", loyaltyPoints: 680 },
  { name: "Miss Estrella", phone: "(643) 634-6352", email: "guest@synd.com", avatar: "ME", loyaltyPoints: 1100 },
  { name: "Teresa Barton", phone: "(325) 235-2324", email: "Rem@user.com", avatar: "TB", loyaltyPoints: 780 },
];

type PaymentMethodType = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

const initialPaymentMethods: PaymentMethodType[] = [
  { id: 'loyalty', name: 'Loyalty', icon: Tag },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'gift-card', name: 'Gift Card', icon: Gift },
  { id: 'pay-link', name: 'Pay by Link', icon: Link },
];

const initialOtherPaymentMethods: PaymentMethodType[] = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'manual-card', name: 'Manual card', icon: Clipboard },
  { id: 'third-party-delivery', name: '3rd Party Delivery', icon: Truck },
  { id: 'voucher', name: 'Voucher', icon: Ticket },
];

// Delivery Partners for Third Party Delivery
interface DeliveryPartner {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const deliveryPartners: DeliveryPartner[] = [
  { id: 'blizzful', name: 'Blizzful', icon: Utensils, color: 'bg-blue-500', bgColor: 'hover:bg-blue-500/20' },
  { id: 'ubereats', name: 'UberEats', icon: ShoppingBag, color: 'bg-green-500', bgColor: 'hover:bg-green-500/20' },
  { id: 'doordash', name: 'DoorDash', icon: Truck, color: 'bg-red-500', bgColor: 'hover:bg-red-500/20' },
  { id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed, color: 'bg-orange-500', bgColor: 'hover:bg-orange-500/20' },
];

const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

// ============= COMPONENT =============
export function PaymentDialog({
  open,
  onOpenChange,
  orderDetails,
  subtotal,
  tax,
  total,
  containsVoucher = false,
  voucherCount = 1,
  voucherItems = [],
  onPaymentComplete,
  onSaveSplit,
}: PaymentDialogProps) {
  // Core payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [amountQuantities, setAmountQuantities] = useState<Record<number, number>>({});
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  
  // Voucher delivery step: shows voucher send modal before receipt
  const [voucherDeliveryDone, setVoucherDeliveryDone] = useState(false);
  // Multi-voucher distribution states
  const [voucherDeliveryMethod, setVoucherDeliveryMethod] = useState<'print' | 'text' | 'email' | null>(null);
  const [voucherSendMode, setVoucherSendMode] = useState<'choose-method' | 'send-all' | 'send-individual'>('choose-method');
  const [voucherSendAllContact, setVoucherSendAllContact] = useState('');
  // Country code for "Send All" phone input
  const [sendAllCountry, setSendAllCountry] = useState<CountryCodeEntry>(COUNTRY_CODES[0]);
  const [showSendAllCountryDropdown, setShowSendAllCountryDropdown] = useState(false);
  const [sendAllCountrySearch, setSendAllCountrySearch] = useState('');
  const sendAllCountryRef = useRef<HTMLDivElement>(null);
  // Smart distribution: maps voucher index -> recipient contact string
  const [voucherAssignments, setVoucherAssignments] = useState<Record<number, string>>({});
  // Currently selected voucher indices for batch assignment
  const [selectedVoucherIndices, setSelectedVoucherIndices] = useState<Set<number>>(new Set());
  // Current contact input for assignment
  const [assignContactInput, setAssignContactInput] = useState('');
  // Country code for phone input in voucher assignment
  const [assignCountry, setAssignCountry] = useState<CountryCodeEntry>(COUNTRY_CODES[0]);
  const [showAssignCountryDropdown, setShowAssignCountryDropdown] = useState(false);
  const [assignCountrySearch, setAssignCountrySearch] = useState('');
  const assignCountryRef = useRef<HTMLDivElement>(null);
  // Track recent recipients used in this session
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);
  // Dynamic payment methods
  const [visiblePaymentMethods, setVisiblePaymentMethods] = useState<PaymentMethodType[]>(initialPaymentMethods);
  const [dropdownPaymentMethods, setDropdownPaymentMethods] = useState<PaymentMethodType[]>(initialOtherPaymentMethods);

  // Gift Card states
  const [giftCardStep, setGiftCardStep] = useState<'amount' | 'enter-card' | 'processing'>('amount');
  const [giftCardNumber, setGiftCardNumber] = useState('');

  // Pay by Link states
  const [payByLinkStep, setPayByLinkStep] = useState<'amount' | 'select-guest' | 'add-guest' | 'guest-confirmed' | 'pending' | 'expired' | 'complete'>('amount');
  const [selectedGuest, setSelectedGuest] = useState<GuestType | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [sendLinkMethod, setSendLinkMethod] = useState<'text' | 'email'>('text');
  const [newGuestForLink, setNewGuestForLink] = useState({ name: '', phone: '', email: '' });
  const [hoveredGuestIndex, setHoveredGuestIndex] = useState<number | null>(null);

  // QR Code states
  const [qrCodeStep, setQrCodeStep] = useState<'amount' | 'qr-display' | 'pending' | 'complete'>('amount');
  const [qrPhoneNumber, setQrPhoneNumber] = useState('');
  const [showQrPhoneInput, setShowQrPhoneInput] = useState(false);

  // Loyalty states
  const [loyaltyStep, setLoyaltyStep] = useState<'guest-list' | 'guest-selected' | 'points-input' | 'otp' | 'complete'>('guest-list');
  const [loyaltySelectedGuest, setLoyaltySelectedGuest] = useState<GuestType | null>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState('');
  const [showLoyaltyAddGuest, setShowLoyaltyAddGuest] = useState(false);
  const [loyaltyNewGuest, setLoyaltyNewGuest] = useState({ name: '', phone: '', email: '' });
  const [loyaltyOtp, setLoyaltyOtp] = useState(['', '', '', '']);
  const [loyaltySearchQuery, setLoyaltySearchQuery] = useState('');
  const [showLoyaltyKeypad, setShowLoyaltyKeypad] = useState(false);

  // Manual CC states
  const [manualCCStep, setManualCCStep] = useState<'amount' | 'tap-card' | 'processing' | 'complete'>('amount');

  // External CC states
  const [externalCCStep, setExternalCCStep] = useState<'amount' | 'complete'>('amount');

  // Manual Card states
  const [manualCardStep, setManualCardStep] = useState<'amount' | 'card-details' | 'complete'>('amount');
  const [manualCardDetails, setManualCardDetails] = useState({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });

  // Third Party Delivery states (consolidated from individual delivery methods)
  const [thirdPartyDeliveryStep, setThirdPartyDeliveryStep] = useState<'amount' | 'select-partner' | 'reference' | 'complete'>('amount');
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [deliveryReference, setDeliveryReference] = useState('');

  // Voucher redeem states
  const [voucherStep, setVoucherStep] = useState<'enter-code' | 'validating' | 'summary' | 'error'>('enter-code');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [voucherValidated, setVoucherValidated] = useState<{ code: string; type: 'fixed' | 'percentage'; value: number; expiryDate?: string } | null>(null);
  const [voucherAppliedAmount, setVoucherAppliedAmount] = useState(0);

  // Receipt states
  const [textReceiptStep, setTextReceiptStep] = useState<'receipt' | 'phone-input'>('receipt');
  const [textReceiptPhone, setTextReceiptPhone] = useState('');
  const [textReceiptNoMarketing, setTextReceiptNoMarketing] = useState(false);
  const [emailReceiptStep, setEmailReceiptStep] = useState<'receipt' | 'email-input'>('receipt');
  const [emailReceiptEmail, setEmailReceiptEmail] = useState('');
  const [emailReceiptNoMarketing, setEmailReceiptNoMarketing] = useState(false);

  // Split Check states - New redesigned flow
  const [splitMode, setSplitMode] = useState<'seat' | 'evenly' | 'custom'>('evenly');
  const [numberOfChecks, setNumberOfChecks] = useState(2);
  const [savedNonSeatChecks, setSavedNonSeatChecks] = useState(2); // Preserve manual count when switching modes
  const [checkAssignments, setCheckAssignments] = useState<Record<number, number>>({}); // Maps item.id -> check number
  const [paidChecks, setPaidChecks] = useState<number[]>([]); // Track which checks have been paid
  
  // Split Check ticket-by-ticket payment flow
  const [activePayingCheck, setActivePayingCheck] = useState<number | null>(null); // Which check is being paid
  const [splitCheckPaymentStep, setSplitCheckPaymentStep] = useState<'tickets' | 'payment' | 'receipt'>('tickets');
  
  // Split check receipt states - for per-ticket receipt handling
  const [splitCheckReceiptPhone, setSplitCheckReceiptPhone] = useState('');
  const [splitCheckReceiptEmail, setSplitCheckReceiptEmail] = useState('');
  const [splitCheckReceiptStep, setSplitCheckReceiptStep] = useState<'options' | 'phone-input' | 'email-input'>('options');
  const [splitCheckReceiptNoMarketing, setSplitCheckReceiptNoMarketing] = useState(false);
  const [splitCheckLastPaidAmount, setSplitCheckLastPaidAmount] = useState(0);

  // Custom Split drag-and-drop states
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dragOverCheckNum, setDragOverCheckNum] = useState<number | null>(null);

  // Mobile detection
  const isMobile = useIsMobile();

  // Mobile payment selection state - shows 3-column grid on mobile
  const [mobilePaymentSelectionActive, setMobilePaymentSelectionActive] = useState(true);

  // Helper to get enabled payment methods from settings
  const getEnabledPaymentMethods = () => {
    try {
      const stored = localStorage.getItem("payment-methods-state");
      if (stored) return JSON.parse(stored) as Record<string, boolean>;
    } catch (e) { /* ignore */ }
    return null;
  };

  const settingsToDialogId: Record<string, string> = {
    'account': 'account', 'card': 'card', 'cash': 'cash',
    'external-cc': 'external-cc', 'gift-card': 'gift-card',
    'loyalty': 'loyalty', 'manual-card': 'manual-card',
    'manual-cc': 'manual-cc', 'pay-by-link': 'pay-link', 'voucher': 'voucher',
    'qr-code': 'qr-code', 'split-check': 'split-check',
  };

  const deliveryPartnerSettingsIds = ['blizzful', 'doordash', 'grubhub', 'uber-eats'];

  const getCheckoutOptionsSettings = () => {
    try {
      const stored = localStorage.getItem("checkout-options-settings");
      if (stored) return JSON.parse(stored) as Record<string, boolean>;
    } catch (e) { /* ignore */ }
    return null;
  };

  const filterMethodsBySettings = (methods: PaymentMethodType[], enabledSettings: Record<string, boolean> | null): PaymentMethodType[] => {
    // Check checkout options for split check visibility
    const checkoutOptions = getCheckoutOptionsSettings();
    
    return methods.filter(method => {
      // Hide Split Check if disabled in Checkout Options
      if (method.id === 'split-check' && checkoutOptions?.splitCheck === false) {
        return false;
      }
      if (!enabledSettings) return true;
      if (method.id === 'third-party-delivery') {
        if (enabledSettings['third-party-delivery'] === false) return false;
        return deliveryPartnerSettingsIds.some(id => enabledSettings[id] !== false);
      }
      const settingsKey = Object.entries(settingsToDialogId).find(([, dialogId]) => dialogId === method.id)?.[0];
      if (!settingsKey) return true;
      return enabledSettings[settingsKey] !== false;
    });
  };

  // All mobile payment methods for the selection grid (filtered by settings)
  const allMobilePaymentMethods: PaymentMethodType[] = useMemo(() => {
    const allMethods: PaymentMethodType[] = [
      { id: 'card', name: 'Card', icon: CreditCard },
      { id: 'cash', name: 'Cash', icon: Banknote },
      { id: 'gift-card', name: 'Gift Card', icon: Gift },
      { id: 'split-check', name: 'Split Check', icon: () => <img src={splitCheckIcon} alt="Split Check" className="w-6 h-6" /> },
      { id: 'pay-link', name: 'Pay By Link', icon: Link },
      { id: 'qr-code', name: 'QR Code', icon: QrCode },
      { id: 'account', name: 'Account', icon: User },
      { id: 'loyalty', name: 'Loyalty', icon: Tag },
      { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
      { id: 'manual-card', name: 'Manual Card', icon: Clipboard },
      { id: 'external-cc', name: 'External CC', icon: ExternalLink },
      { id: 'third-party-delivery', name: '3rd Party', icon: Truck },
      { id: 'voucher', name: 'Voucher', icon: Ticket },
    ];
    return filterMethodsBySettings(allMethods, getEnabledPaymentMethods());
  }, [open]);

  // Handler for mobile payment method selection
  const handleMobilePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setMobilePaymentSelectionActive(false);
    
    // Trigger appropriate flow based on method
    if (methodId === 'card') {
      setManualCCStep('tap-card');
    } else if (methodId === 'cash') {
      // Cash shows keypad - no special action needed
    } else if (methodId === 'gift-card') {
      setGiftCardStep('enter-card');
      setGiftCardNumber('');
    } else if (methodId === 'split-check') {
      // Split check flow uses the existing panel
    } else if (methodId === 'pay-link') {
      setPayByLinkStep('select-guest');
      setSelectedGuest(null);
      setGuestSearchQuery('');
    } else if (methodId === 'qr-code') {
      setQrCodeStep('qr-display');
      setQrPhoneNumber('');
      setShowQrPhoneInput(false);
    } else if (methodId === 'account') {
      // Account uses keypad - no special action needed
    } else if (methodId === 'loyalty') {
      setLoyaltyStep('guest-list');
      setLoyaltySelectedGuest(null);
      setLoyaltyPointsToRedeem('');
      setLoyaltyOtp(['', '', '', '']);
    } else if (methodId === 'manual-cc') {
      setManualCCStep('tap-card');
    } else if (methodId === 'manual-card') {
      setManualCardStep('card-details');
      setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
    } else if (methodId === 'external-cc') {
      const paid = parseFloat(paymentAmount) || total;
      setPaidAmount(prev => prev + paid);
      setExternalCCStep('complete');
    } else if (methodId === 'third-party-delivery') {
      setThirdPartyDeliveryStep('select-partner');
      setSelectedDeliveryPartner(null);
      setDeliveryReference('');
    }
  };


  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentAmount(total.toFixed(2));
      setPaymentProcessed(false);
      setShowKeypad(false);
      setShowOtherPayments(false);
      setAmountQuantities({});
      setPaymentHistory([]);
      setPaidAmount(0);
      setSelectedPaymentMethod('cash');
      setGiftCardStep('amount');
      setGiftCardNumber('');
      setPayByLinkStep('amount');
      setSelectedGuest(null);
      setQrCodeStep('amount');
      setLoyaltyStep('guest-list');
      setManualCCStep('amount');
      setExternalCCStep('amount');
      setManualCardStep('amount');
      setThirdPartyDeliveryStep('amount');
      setSelectedDeliveryPartner(null);
      setDeliveryReference('');
      // Reset voucher states
      setVoucherStep('enter-code');
      setVoucherCode('');
      setVoucherError('');
      setVoucherValidated(null);
      setVoucherAppliedAmount(0);
      setTextReceiptStep('receipt');
      setEmailReceiptStep('receipt');
      setVoucherDeliveryDone(false);
      setVoucherDeliveryMethod(null);
      setVoucherSendMode('choose-method');
      setVoucherSendAllContact('');
      setSendAllCountry(COUNTRY_CODES[0]);
      setShowSendAllCountryDropdown(false);
      setSendAllCountrySearch('');
      setVoucherAssignments({});
      setSelectedVoucherIndices(new Set());
      setAssignContactInput('');
      setAssignCountry(COUNTRY_CODES[0]);
      setShowAssignCountryDropdown(false);
      setAssignCountrySearch('');
      setRecentRecipients([]);
      // Reset split check states
      setSplitMode('evenly');
      setNumberOfChecks(2);
      setSavedNonSeatChecks(2);
      setCheckAssignments({});
      setPaidChecks([]);
      setActivePayingCheck(null);
      setSplitCheckPaymentStep('tickets');
      setSplitCheckReceiptPhone('');
      setSplitCheckReceiptEmail('');
      setSplitCheckReceiptStep('options');
      setSplitCheckReceiptNoMarketing(false);
      setSplitCheckLastPaidAmount(0);
      // Reset drag states
      setDraggingItemId(null);
      setDragOverCheckNum(null);
      // Reset mobile payment selection
      setMobilePaymentSelectionActive(true);

      // Apply payment method visibility from settings
      const enabledSettings = getEnabledPaymentMethods();
      setVisiblePaymentMethods(filterMethodsBySettings(initialPaymentMethods, enabledSettings));
      setDropdownPaymentMethods(filterMethodsBySettings(initialOtherPaymentMethods, enabledSettings));
    }
  }, [open, total]);

  // Close country dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignCountryRef.current && !assignCountryRef.current.contains(event.target as Node)) {
        setShowAssignCountryDropdown(false);
      }
      if (sendAllCountryRef.current && !sendAllCountryRef.current.contains(event.target as Node)) {
        setShowSendAllCountryDropdown(false);
      }
    };
    if (showAssignCountryDropdown || showSendAllCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssignCountryDropdown, showSendAllCountryDropdown]);

  // Calculate payment amount from quantities
  useEffect(() => {
    const totalFromQuantities = Object.entries(amountQuantities).reduce((sum, [amount, qty]) => {
      return sum + parseFloat(amount) * qty;
    }, 0);
    if (totalFromQuantities > 0) {
      setPaymentAmount(totalFromQuantities.toFixed(2));
    }
  }, [amountQuantities]);

  // Keypad handler
  const handleKeypadPress = (key: string) => {
    setAmountQuantities({});
    if (key === 'backspace') {
      setPaymentAmount(prev => prev.slice(0, -1) || '0.00');
    } else if (key === '.') {
      if (!paymentAmount.includes('.')) {
        setPaymentAmount(prev => prev + '.');
      }
    } else {
      setPaymentAmount(prev => {
        if (prev === '0.00' || prev === '') return key;
        return prev + key;
      });
    }
  };

  // Generate check labels like "Check 62a", "Check 62b"
  const getCheckLabel = (index: number) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const baseCheck = orderDetails.check || '1';
    return `Check ${baseCheck}${letters[index]}`;
  };

  // Get ticket label based on split mode
  const getTicketLabel = (checkNumber: number) => {
    if (splitMode === 'seat') {
      return `Seat ${checkNumber}`;
    }
    return getCheckLabel(checkNumber - 1);
  };

  // Calculate items for each check based on split mode
  const getItemsForCheck = (checkNumber: number): PaymentDialogOrderItem[] => {
    if (splitMode === 'evenly') {
      // In evenly mode, all items belong to all checks (total is split)
      return orderDetails.items;
    } else if (splitMode === 'seat') {
      // checkNumber corresponds to seat number
      const seatNumber = checkNumber;
      
      return orderDetails.items.filter(item => {
        // Shared items or items with no seat assignment appear on all tickets
        if (item.isShared || (item.assignedSeats?.length === 0)) {
          return true;
        }
        // Item appears on ticket if seat is in assignedSeats
        return item.assignedSeats?.includes(seatNumber);
      });
    } else {
      // Custom mode - use checkAssignments
      return orderDetails.items.filter(item => checkAssignments[item.id] === checkNumber);
    }
  };

  // Calculate totals for a specific check
  const getCheckTotals = (checkNumber: number) => {
    if (splitMode === 'evenly') {
      // Divide total evenly
      const checkTotal = total / numberOfChecks;
      const checkSubtotal = subtotal / numberOfChecks;
      const checkTax = tax / numberOfChecks;
      return { subtotal: checkSubtotal, tax: checkTax, total: checkTotal };
    } else if (splitMode === 'seat') {
      // Calculate based on seat assignments with proper cost splitting
      const seatNumber = checkNumber;
      const partySize = orderDetails.partySize || numberOfChecks;
      
      let checkSubtotal = 0;
      
      orderDetails.items.forEach(item => {
        const isShared = item.isShared || (item.assignedSeats?.length === 0);
        
        if (isShared) {
          // Shared items: divide cost by party size
          checkSubtotal += item.price / partySize;
        } else if (item.assignedSeats?.includes(seatNumber)) {
          // Seat-specific items: divide by number of seats assigned
          const seatsForItem = item.assignedSeats.length;
          checkSubtotal += item.price / seatsForItem;
        }
      });
      
      const checkTax = checkSubtotal * getActiveTaxRate();
      return { subtotal: checkSubtotal, tax: checkTax, total: checkSubtotal + checkTax };
    } else {
      // Calculate based on assigned items
      const items = getItemsForCheck(checkNumber);
      const checkSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const checkTax = checkSubtotal * getActiveTaxRate();
      return { subtotal: checkSubtotal, tax: checkTax, total: checkSubtotal + checkTax };
    }
  };

  // Handle initiating payment for a specific check - transitions to payment method selection
  const handlePayCheck = (checkNumber: number) => {
    const checkTotals = getCheckTotals(checkNumber);
    setActivePayingCheck(checkNumber);
    setSplitCheckPaymentStep('payment');
    setPaymentAmount(checkTotals.total.toFixed(2));
    setSelectedPaymentMethod('cash'); // Default to cash, user can change
    setAmountQuantities({});
    // Reset any payment method specific steps
    setGiftCardStep('amount');
    setPayByLinkStep('amount');
    setQrCodeStep('amount');
    setManualCCStep('amount');
    setExternalCCStep('amount');
    setManualCardStep('amount');
    setThirdPartyDeliveryStep('amount');
    setSelectedDeliveryPartner(null);
    setDeliveryReference('');
    setLoyaltyStep('guest-list');
  };

  // Handle completing payment for a split check ticket
  const handleSplitCheckPaymentComplete = () => {
    if (activePayingCheck === null) return;
    
    const amount = parseFloat(paymentAmount) || 0;
    const methodLabel = getMethodLabel(selectedPaymentMethod);
    const ticketLabel = getTicketLabel(activePayingCheck);
    
    // Mark check as paid
    setPaidChecks(prev => [...prev, activePayingCheck]);
    
    // Record payment with check info
    setPaymentHistory(prev => [...prev, { 
      method: selectedPaymentMethod, 
      amount, 
      methodLabel: `${methodLabel} (${ticketLabel})` 
    }]);
    
    // Update paid amount
    setPaidAmount(prev => prev + amount);
    
    // Store the amount for receipt display
    setSplitCheckLastPaidAmount(amount);
    
    // Check if all checks are now paid
    if (paidChecks.length + 1 >= numberOfChecks) {
      setPaymentProcessed(true);
    } else {
      // Show receipt screen for this check before returning to tickets
      setSplitCheckPaymentStep('receipt');
      setSplitCheckReceiptStep('options');
      // Keep activePayingCheck set so we know which check's receipt to show
    }
  };
  
  // Handle completing the split check receipt step and returning to ticket grid
  const handleSplitCheckReceiptComplete = () => {
    // Reset receipt states
    setSplitCheckReceiptPhone('');
    setSplitCheckReceiptEmail('');
    setSplitCheckReceiptStep('options');
    setSplitCheckReceiptNoMarketing(false);
    
    // Now return to ticket grid
    setActivePayingCheck(null);
    setSplitCheckPaymentStep('tickets');
    setSelectedPaymentMethod('split-check');
  };

  // Handle going back from split check payment to ticket view
  const handleBackToSplitCheck = () => {
    setActivePayingCheck(null);
    setSplitCheckPaymentStep('tickets');
    setSelectedPaymentMethod('split-check');
  };

  // Reset all payment method specific states - used when returning to split check grid
  const resetPaymentMethodStates = () => {
    setGiftCardStep('amount');
    setGiftCardNumber('');
    setPayByLinkStep('amount');
    setSelectedGuest(null);
    setQrCodeStep('amount');
    setQrPhoneNumber('');
    setShowQrPhoneInput(false);
    setManualCCStep('amount');
    setExternalCCStep('amount');
    setManualCardStep('amount');
    setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
    setThirdPartyDeliveryStep('amount');
    setSelectedDeliveryPartner(null);
    setDeliveryReference('');
    setLoyaltyStep('guest-list');
    setLoyaltySelectedGuest(null);
    setLoyaltyPointsToRedeem('');
    setLoyaltyOtp(['', '', '', '']);
    setTextReceiptStep('receipt');
    setTextReceiptPhone('');
    setEmailReceiptStep('receipt');
    setEmailReceiptEmail('');
  };

  // Universal payment completion helper - routes to split check or final receipt appropriately
  const finalizePayment = (methodId: string, amount: number, methodLabel: string) => {
    // If paying a split check ticket, use split check handler
    if (activePayingCheck !== null) {
      const ticketLabel = getTicketLabel(activePayingCheck);
      
      // Mark check as paid
      setPaidChecks(prev => [...prev, activePayingCheck]);
      
      // Record payment with check info
      setPaymentHistory(prev => [...prev, { 
        method: methodId, 
        amount, 
        methodLabel: `${methodLabel} (${ticketLabel})` 
      }]);
      
      // Update paid amount
      setPaidAmount(prev => prev + amount);
      
      // Store the amount for receipt display
      setSplitCheckLastPaidAmount(amount);
      
      // Check if all checks are now paid
      if (paidChecks.length + 1 >= numberOfChecks) {
        setPaymentProcessed(true);
      } else {
        // Show receipt screen for this check before returning to tickets
        setSplitCheckPaymentStep('receipt');
        setSplitCheckReceiptStep('options');
        // Reset method-specific states for next payment
        resetPaymentMethodStates();
        // Keep activePayingCheck set so we know which check's receipt to show
      }
      return;
    }
    
    // Normal payment flow - proceed with final receipt
    setPaymentHistory(prev => [...prev, { method: methodId, amount, methodLabel }]);
    setPaidAmount(prev => prev + amount);
    setPaymentProcessed(true);
  };

  // Toggle item assignment for custom split
  const toggleItemAssignment = (itemId: number, checkNumber: number) => {
    setCheckAssignments(prev => {
      if (prev[itemId] === checkNumber) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: checkNumber };
    });
  };

  // Gift card keypad handler
  const handleGiftCardKeypadPress = (key: string) => {
    if (key === 'C') {
      setGiftCardNumber('');
    } else if (giftCardNumber.replace(/\s/g, '').length < 16) {
      setGiftCardNumber(prev => prev.replace(/\s/g, '') + key);
    }
  };

  // Amount handlers
  const handleAddAmount = (amount: number) => {
    setAmountQuantities(prev => ({
      ...prev,
      [amount]: (prev[amount] || 0) + 1
    }));
  };

  const handleRemoveAmount = (amount: number) => {
    setAmountQuantities(prev => {
      const current = prev[amount] || 0;
      if (current <= 1) {
        const { [amount]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [amount]: current - 1 };
    });
  };

  // Handle selecting from dropdown - skip keypad and go directly to method-specific flow
  const handleSelectFromDropdown = (selectedMethod: PaymentMethodType) => {
    const lastVisibleMethod = visiblePaymentMethods[visiblePaymentMethods.length - 1];
    const newDropdownMethods = dropdownPaymentMethods.filter(m => m.id !== selectedMethod.id);
    newDropdownMethods.unshift(lastVisibleMethod);
    const newVisibleMethods = [selectedMethod, ...visiblePaymentMethods.slice(0, -1)];
    
    setVisiblePaymentMethods(newVisibleMethods);
    setDropdownPaymentMethods(newDropdownMethods);
    setSelectedPaymentMethod(selectedMethod.id);
    setShowOtherPayments(false);
    
    // Direct flow for each payment method (skip keypad except Cash)
    if (selectedMethod.id === 'manual-cc') {
      setManualCCStep('tap-card');
    } else if (selectedMethod.id === 'external-cc') {
      // External CC goes directly to complete/receipt
      const paid = parseFloat(paymentAmount) || total;
      setPaidAmount(prev => prev + paid);
      setExternalCCStep('complete');
    } else if (selectedMethod.id === 'manual-card') {
      setManualCardStep('card-details');
      setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
    } else if (selectedMethod.id === 'third-party-delivery') {
      setThirdPartyDeliveryStep('select-partner');
      setSelectedDeliveryPartner(null);
      setDeliveryReference('');
    } else if (selectedMethod.id === 'qr-code') {
      setQrCodeStep('qr-display');
      setQrPhoneNumber('');
      setShowQrPhoneInput(false);
    } else if (selectedMethod.id === 'gift-card') {
      setGiftCardStep('enter-card');
      setGiftCardNumber('');
    } else if (selectedMethod.id === 'pay-link') {
      setPayByLinkStep('select-guest');
      setSelectedGuest(null);
      setGuestSearchQuery('');
    } else if (selectedMethod.id === 'voucher') {
      setVoucherStep('enter-code');
      setVoucherCode('');
      setVoucherError('');
      setVoucherValidated(null);
    }
    // Cash and Account stay on amount keypad (no action needed)
  };

  // Get method label for history
  const getMethodLabel = (methodId: string) => {
    const allMethods = [...visiblePaymentMethods, ...dropdownPaymentMethods];
    return allMethods.find(m => m.id === methodId)?.name || methodId;
  };

  // Handle charge/process payment
  const handleChargePayment = () => {
    // Gift Card: transition to card entry screen
    if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'amount') {
      setGiftCardStep('enter-card');
      return;
    }
    
    // Pay by Link: transition to guest selection screen
    if (selectedPaymentMethod === 'pay-link' && payByLinkStep === 'amount') {
      setPayByLinkStep('select-guest');
      return;
    }
    
    // QR Code: transition to QR display screen
    if (selectedPaymentMethod === 'qr-code' && qrCodeStep === 'amount') {
      setQrCodeStep('qr-display');
      return;
    }
    
    // Manual CC: transition to tap-card screen
    if (selectedPaymentMethod === 'manual-cc' && manualCCStep === 'amount') {
      setManualCCStep('tap-card');
      return;
    }
    
    // External CC: transition directly to complete/receipt screen
    if (selectedPaymentMethod === 'external-cc' && externalCCStep === 'amount') {
      const paid = parseFloat(paymentAmount) || 0;
      setPaidAmount(prev => prev + paid);
      setExternalCCStep('complete');
      return;
    }
    
    // Manual Card: transition to card details screen
    if (selectedPaymentMethod === 'manual-card' && manualCardStep === 'amount') {
      setManualCardStep('card-details');
      return;
    }
    
    // Third Party Delivery: transition to partner selection
    if (selectedPaymentMethod === 'third-party-delivery' && thirdPartyDeliveryStep === 'amount') {
      setThirdPartyDeliveryStep('select-partner');
      return;
    }
    
    
    // If paying a split check ticket, use the split check completion handler
    if (activePayingCheck !== null) {
      handleSplitCheckPaymentComplete();
      return;
    }
    
    const amount = parseFloat(paymentAmount) || 0;
    const methodLabel = getMethodLabel(selectedPaymentMethod);
    
    setPaymentHistory(prev => [...prev, { method: selectedPaymentMethod, amount, methodLabel }]);
    setPaidAmount(prev => prev + amount);
    setPaymentProcessed(true);
  };

  // Handle close and complete
  const handleComplete = () => {
    onPaymentComplete?.(paymentHistory);
    onOpenChange(false);
  };

  // Calculate remaining due
  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const remainingDue = total - totalPaid;
  const isFullyPaid = remainingDue <= 0;

  if (!open) return null;

  // Fixed dialog width for split check mode - 780px total (460px left + 320px right)
  const getSplitCheckDialogWidth = () => {
    if (selectedPaymentMethod !== 'split-check') return '';
    return 'w-[780px]';
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className={`bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden animate-scale-in transition-all duration-300 ${
          isMobile 
            ? 'flex flex-col w-full h-[100dvh] max-h-[100dvh] rounded-none m-0' 
            : `flex max-h-[90vh] max-w-[95vw] mx-4 ${getSplitCheckDialogWidth()}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Payment Selection Screen */}
        {isMobile && mobilePaymentSelectionActive && !paymentProcessed && (
          <div className="flex flex-col flex-1 bg-neutral-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
              <button 
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-300" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-white text-base font-medium">Total Due</span>
                <span className="text-red-500 text-base font-bold">${total.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            
            {/* Label */}
            <div className="text-center text-neutral-400 text-sm py-4">
              Choose Payment Method
            </div>
            
            {/* Payment Methods Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-6 px-4 pb-8 flex-1 content-start">
              {allMobilePaymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMobilePaymentMethodSelect(method.id)}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-[72px] h-[72px] rounded-full border border-neutral-600 bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 hover:border-neutral-500 transition-colors">
                      {method.id === 'split-check' ? (
                        <img src={splitCheckIcon} alt="Split Check" className="w-8 h-8" />
                      ) : (
                        <IconComponent className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <span className="text-white text-sm text-center">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Order Summary Header - only when not in selection mode */}
        {isMobile && !mobilePaymentSelectionActive && !paymentProcessed && (
          <div className="px-4 py-2 border-b border-neutral-700 bg-neutral-800/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{orderDetails.guest || "Guest"}</span>
                {orderDetails.orderType && !orderDetails.table && (
                  <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 bg-neutral-700 rounded">
                    {orderDetails.orderType}
                  </span>
                )}
                {orderDetails.table && (
                  <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 bg-neutral-700 rounded">
                    TABLE {orderDetails.table}
                  </span>
                )}
              </div>
              <span className="text-red-500 font-bold">${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-neutral-400 text-xs">
              {orderDetails.phone && <span>{orderDetails.phone}</span>}
              {orderDetails.orderNumber && <span>Order #{orderDetails.orderNumber}</span>}
              {orderDetails.serverName && <span>• {orderDetails.serverName}</span>}
            </div>
          </div>
        )}
        
        {/* Left Panel - Payment Methods & Keypad - Hidden on mobile when selection is active */}
        <div className={`flex flex-col bg-neutral-900 overflow-hidden transition-all duration-300 ${
          isMobile && mobilePaymentSelectionActive && !paymentProcessed
            ? 'hidden'
            : isMobile 
              ? 'flex-1 w-full max-h-full overflow-y-auto' 
              : `max-h-[90vh] ${selectedPaymentMethod === 'split-check' ? 'w-full' : 'w-[480px]'}`
        }`}>
          {paymentProcessed ? (
            // Voucher Delivery Modal - shown before receipt when order contains voucher
            containsVoucher && !voucherDeliveryDone ? (
              <div className="flex-1 flex flex-col items-center py-8 px-6 overflow-y-auto">
                {/* Success Icon */}
                <img src={tickSuccessIcon} alt="Success" className="w-14 h-14 mb-4" />
                
                <p className="text-neutral-300 text-sm mb-2">
                  <span className="text-green-500 font-medium">${totalPaid.toFixed(2)}</span> has been successfully processed
                </p>

                {/* Change Due */}
                {isFullyPaid && (
                  <div className="w-full max-w-xs mb-6 border-2 border-green-500 rounded-lg p-4 bg-green-500/10">
                    <p className="text-green-500 text-sm text-center mb-1">Change Due</p>
                    <p className="text-green-500 text-3xl font-bold text-center">
                      ${Math.abs(remainingDue).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Step 1: Choose delivery method */}
                {voucherSendMode === 'choose-method' && (
                  <div className="w-full max-w-xs">
                    <h3 className="text-white font-semibold text-center mb-4">How would you like to send the voucher{voucherCount > 1 ? 's' : ''}?</h3>
                    <div className="flex gap-4 justify-center mb-4">
                      <button 
                        onClick={() => {
                          toast.success(`${voucherCount} voucher${voucherCount > 1 ? 's' : ''} sent to printer`);
                          setVoucherDeliveryDone(true);
                        }}
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <Printer className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Print Voucher</span>
                      </button>
                      <button 
                        onClick={() => {
                          setVoucherDeliveryMethod('text');
                          if (voucherCount <= 1) {
                            setVoucherSendMode('send-all');
                          } else {
                            setVoucherSendMode('send-all');
                          }
                        }}
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <MessageSquare className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Text Voucher</span>
                      </button>
                      <button 
                        onClick={() => {
                          setVoucherDeliveryMethod('email');
                          if (voucherCount <= 1) {
                            setVoucherSendMode('send-all');
                          } else {
                            setVoucherSendMode('send-all');
                          }
                        }}
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <Mail className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Email Voucher</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Send All or Send to Different Recipients */}
                {voucherSendMode === 'send-all' && (
                  <div className="w-full max-w-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        onClick={() => {
                          setVoucherSendMode('choose-method');
                          setVoucherDeliveryMethod(null);
                          setVoucherSendAllContact('');
                          setSendAllCountry(COUNTRY_CODES[0]);
                          setShowSendAllCountryDropdown(false);
                          setSendAllCountrySearch('');
                        }}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <h3 className="text-white font-semibold">Send Voucher{voucherCount > 1 ? 's' : ''}</h3>
                    </div>
                    
                    <p className="text-neutral-400 text-sm mb-3">
                      {voucherCount > 1 
                        ? `Send all ${voucherCount} vouchers to:` 
                        : `Send voucher to:`}
                    </p>

                    {(() => {
                      const isSendAllPhone = voucherDeliveryMethod === 'text';
                      const sendAllDigits = voucherSendAllContact.replace(/\D/g, '');
                      const sendAllDisplayValue = isSendAllPhone ? formatPhone(sendAllDigits, sendAllCountry.format) : voucherSendAllContact;
                      const isSendAllValid = isSendAllPhone ? sendAllDigits.length === sendAllCountry.phoneLength : voucherSendAllContact.trim().length > 0;
                      const filteredSendAllCountries = COUNTRY_CODES.filter(c =>
                        c.name.toLowerCase().includes(sendAllCountrySearch.toLowerCase()) ||
                        c.dial.includes(sendAllCountrySearch) ||
                        c.code.toLowerCase().includes(sendAllCountrySearch.toLowerCase())
                      );

                      return (
                        <>
                          <div className="flex gap-2 items-stretch mb-4">
                            {isSendAllPhone && (
                              <div ref={sendAllCountryRef} className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowSendAllCountryDropdown(!showSendAllCountryDropdown);
                                    setSendAllCountrySearch('');
                                  }}
                                  className="flex items-center gap-1 h-full px-2 bg-neutral-900 border border-neutral-600 rounded-lg hover:bg-neutral-700 transition-colors"
                                >
                                  <span className="text-base">{sendAllCountry.flag}</span>
                                  <span className="text-neutral-300 text-xs">{sendAllCountry.dial}</span>
                                  <ChevronDown className="w-3 h-3 text-neutral-500" />
                                </button>
                                {showSendAllCountryDropdown && (
                                  <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <div className="p-1.5 border-b border-neutral-700">
                                      <div className="flex items-center gap-1.5 bg-neutral-900 rounded px-2 py-1">
                                        <Search className="w-3 h-3 text-neutral-500" />
                                        <input
                                          type="text"
                                          value={sendAllCountrySearch}
                                          onChange={(e) => setSendAllCountrySearch(e.target.value)}
                                          placeholder="Search..."
                                          className="bg-transparent text-white text-xs placeholder:text-neutral-500 focus:outline-none w-full"
                                          autoFocus
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                      {filteredSendAllCountries.map(c => (
                                        <button
                                          key={c.code}
                                          onClick={() => {
                                            setSendAllCountry(c);
                                            setShowSendAllCountryDropdown(false);
                                            setVoucherSendAllContact('');
                                          }}
                                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-neutral-700 transition-colors ${c.code === sendAllCountry.code ? 'bg-neutral-700' : ''}`}
                                        >
                                          <span className="text-sm">{c.flag}</span>
                                          <span className="text-white text-xs flex-1">{c.name}</span>
                                          <span className="text-neutral-400 text-xs">{c.dial}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex-1 relative">
                              <input
                                type={isSendAllPhone ? 'tel' : 'email'}
                                value={sendAllDisplayValue}
                                onChange={(e) => {
                                  if (isSendAllPhone) {
                                    setVoucherSendAllContact(e.target.value.replace(/\D/g, '').slice(0, sendAllCountry.phoneLength));
                                  } else {
                                    setVoucherSendAllContact(e.target.value);
                                  }
                                }}
                                placeholder={isSendAllPhone ? sendAllCountry.format.replace(/X/g, '0') : 'Enter email address'}
                                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 pr-8"
                                autoFocus
                              />
                              {voucherSendAllContact && (
                                <button
                                  onClick={() => setVoucherSendAllContact('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (isSendAllPhone && !isSendAllValid) {
                                toast.error(`Please enter a valid ${sendAllCountry.phoneLength}-digit phone number`);
                                return;
                              }
                              if (!isSendAllValid) {
                                toast.error('Please enter a valid email address');
                                return;
                              }
                              const contactLabel = isSendAllPhone ? `${sendAllCountry.dial} ${sendAllDisplayValue}` : voucherSendAllContact.trim();
                              toast.success(`${voucherCount} voucher${voucherCount > 1 ? 's' : ''} sent to ${contactLabel}`);
                              setVoucherDeliveryDone(true);
                            }}
                            disabled={!isSendAllValid}
                            className={`w-full py-3 font-semibold rounded-lg transition-colors mb-3 ${isSendAllValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'}`}
                          >
                            Send {voucherCount > 1 ? `All ${voucherCount} Vouchers` : 'Voucher'}
                          </button>
                        </>
                      );
                    })()}

                    {voucherCount > 1 && (
                      <button
                        onClick={() => {
                          setVoucherAssignments({});
                          setSelectedVoucherIndices(new Set());
                          setAssignContactInput('');
                          setVoucherSendMode('send-individual');
                        }}
                        className="w-full py-3 border border-neutral-600 hover:bg-neutral-800 text-neutral-300 font-medium rounded-lg transition-colors"
                      >
                        Send to Different Recipients
                      </button>
                    )}
                  </div>
                )}

                {/* Step 3: Smart voucher distribution with chip selection */}
                {voucherSendMode === 'send-individual' && (() => {
                  const assignedCount = Object.keys(voucherAssignments).length;
                  const remainingCount = voucherCount - assignedCount;
                  const selectedCount = selectedVoucherIndices.size;
                  
                  // Group assignments by recipient for summary
                  const groupedByRecipient: Record<string, number[]> = {};
                  Object.entries(voucherAssignments).forEach(([idx, contact]) => {
                    if (!groupedByRecipient[contact]) groupedByRecipient[contact] = [];
                    groupedByRecipient[contact].push(Number(idx));
                  });

                  // Get voucher label for an index - short format for word cloud
                  const getVoucherLabel = (idx: number) => {
                    if (voucherItems.length > 0 && voucherItems[idx]) {
                      return voucherItems[idx].name;
                    }
                    return `Voucher ${idx + 1}`;
                  };

                  return (
                  <div className="w-full max-w-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        onClick={() => {
                          setVoucherSendMode('send-all');
                          setVoucherAssignments({});
                          setSelectedVoucherIndices(new Set());
                          setAssignContactInput('');
                        }}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <h3 className="text-white font-semibold flex-1">Send to Different Recipients</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${remainingCount === 0 ? 'bg-green-600/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {remainingCount === 0 ? 'All assigned ✓' : `${remainingCount} remaining`}
                      </span>
                    </div>

                    {/* Assigned vouchers grouped by recipient */}
                    {Object.keys(groupedByRecipient).length > 0 && (
                      <div className="space-y-2 mb-4">
                        {Object.entries(groupedByRecipient).map(([contact, indices]) => (
                          <div key={contact} className="bg-green-600/10 border border-green-600/30 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-green-400 text-xs font-medium">{contact}</span>
                              <button
                                onClick={() => {
                                  const newAssignments = { ...voucherAssignments };
                                  indices.forEach(idx => delete newAssignments[idx]);
                                  setVoucherAssignments(newAssignments);
                                }}
                                className="text-neutral-500 hover:text-red-400 transition-colors p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {indices.map(idx => (
                                <span key={idx} className="rounded-full text-[11px] px-2.5 py-1 bg-green-600/20 border border-green-600/40 text-green-300 font-medium">
                                  {getVoucherLabel(idx)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Unassigned voucher chips */}
                    {remainingCount > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                        {Array.from({ length: voucherCount }, (_, vIdx) => {
                          if (voucherAssignments[vIdx] !== undefined) return null;
                          const isSelected = selectedVoucherIndices.has(vIdx);
                          const label = getVoucherLabel(vIdx);
                          const sizeClass = 'text-xs px-3 py-2';
                          
                          return (
                            <button
                              key={vIdx}
                              onClick={() => {
                                setSelectedVoucherIndices(prev => {
                                  const next = new Set(prev);
                                  if (next.has(vIdx)) next.delete(vIdx);
                                  else next.add(vIdx);
                                  return next;
                                });
                              }}
                              className={`relative rounded-full font-medium transition-colors duration-200 border-2 whitespace-nowrap ${sizeClass} ${
                                isSelected
                                  ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                                  : 'bg-neutral-800 border-transparent text-neutral-300 hover:border-neutral-500 hover:bg-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Floating action panel when vouchers are selected */}
                    {selectedCount > 0 && (() => {
                      const isPhone = voucherDeliveryMethod === 'text';
                      const phoneDigits = assignContactInput.replace(/\D/g, '');
                      const isPhoneValid = isPhone ? phoneDigits.length === assignCountry.phoneLength : assignContactInput.trim().length > 0;
                      const displayValue = isPhone ? formatPhone(phoneDigits, assignCountry.format) : assignContactInput;
                      const filteredAssignCountries = COUNTRY_CODES.filter(c =>
                        c.name.toLowerCase().includes(assignCountrySearch.toLowerCase()) ||
                        c.dial.includes(assignCountrySearch) ||
                        c.code.toLowerCase().includes(assignCountrySearch.toLowerCase())
                      );

                      const handleAssign = () => {
                        if (isPhone && !isPhoneValid) {
                          toast.error(`Please enter a valid ${assignCountry.phoneLength}-digit phone number`);
                          return;
                        }
                        if (!isPhone && !assignContactInput.trim()) {
                          toast.error('Please enter an email address');
                          return;
                        }
                        const contactLabel = isPhone ? `${assignCountry.dial} ${displayValue}` : assignContactInput.trim();
                        const newAssignments = { ...voucherAssignments };
                        selectedVoucherIndices.forEach(idx => {
                          newAssignments[idx] = contactLabel;
                        });
                        setVoucherAssignments(newAssignments);
                        setRecentRecipients(prev => {
                          if (prev.includes(contactLabel)) return prev;
                          return [contactLabel, ...prev].slice(0, 5);
                        });
                        setSelectedVoucherIndices(new Set());
                        setAssignContactInput('');
                        toast.success(`${selectedCount} voucher${selectedCount !== 1 ? 's' : ''} assigned`);
                      };

                      return (
                      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 mb-4">
                        <p className="text-white text-sm font-medium mb-2">
                          {selectedCount} voucher{selectedCount !== 1 ? 's' : ''} selected
                        </p>
                        
                        {/* Recent recipients suggestions */}
                        {recentRecipients.length > 0 && (
                          <div className="mb-2">
                            <p className="text-neutral-500 text-xs mb-1">Recent Recipients</p>
                            <div className="flex flex-wrap gap-1.5">
                              {recentRecipients.map((r, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    // For recent recipients, directly assign
                                    const newAssignments = { ...voucherAssignments };
                                    selectedVoucherIndices.forEach(idx => {
                                      newAssignments[idx] = r;
                                    });
                                    setVoucherAssignments(newAssignments);
                                    setSelectedVoucherIndices(new Set());
                                    setAssignContactInput('');
                                    toast.success(`${selectedCount} voucher${selectedCount !== 1 ? 's' : ''} assigned to ${r}`);
                                  }}
                                  className="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-md transition-colors"
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Input row: country code + phone + assign button */}
                        <div className="flex gap-2 items-stretch">
                          {isPhone ? (
                            <>
                              {/* Country code selector */}
                              <div ref={assignCountryRef} className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAssignCountryDropdown(!showAssignCountryDropdown);
                                    setAssignCountrySearch('');
                                  }}
                                  className="flex items-center gap-1 h-full px-2 bg-neutral-900 border border-neutral-600 rounded-lg hover:bg-neutral-700 transition-colors"
                                >
                                  <span className="text-base">{assignCountry.flag}</span>
                                  <span className="text-neutral-300 text-xs">{assignCountry.dial}</span>
                                  <ChevronDown className="w-3 h-3 text-neutral-500" />
                                </button>
                                {showAssignCountryDropdown && (
                                  <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <div className="p-1.5 border-b border-neutral-700">
                                      <div className="flex items-center gap-1.5 bg-neutral-700/50 rounded px-2 py-1.5">
                                        <Search className="w-3.5 h-3.5 text-neutral-400" />
                                        <input
                                          type="text"
                                          value={assignCountrySearch}
                                          onChange={(e) => setAssignCountrySearch(e.target.value)}
                                          placeholder="Search..."
                                          className="flex-1 bg-transparent text-white text-xs placeholder:text-neutral-400 outline-none"
                                          autoFocus
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                      {filteredAssignCountries.map((c) => (
                                        <button
                                          key={c.code}
                                          type="button"
                                          onClick={() => {
                                            setAssignCountry(c);
                                            setShowAssignCountryDropdown(false);
                                            setAssignContactInput('');
                                          }}
                                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-700 transition-colors text-left text-xs ${
                                            assignCountry.code === c.code ? 'bg-neutral-700' : ''
                                          }`}
                                        >
                                          <span>{c.flag}</span>
                                          <span className="text-white flex-1">{c.name}</span>
                                          <span className="text-neutral-400">{c.dial}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Phone input with clear X */}
                              <div className="flex-1 relative">
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  value={displayValue}
                                  onChange={(e) => setAssignContactInput(e.target.value.replace(/\D/g, '').slice(0, assignCountry.phoneLength))}
                                  placeholder={assignCountry.placeholder}
                                  className="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-2.5 pr-8 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400"
                                  autoFocus
                                />
                                {assignContactInput && (
                                  <button
                                    onClick={() => setAssignContactInput('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            /* Email input with clear X */
                            <div className="flex-1 relative">
                              <input
                                type="email"
                                value={assignContactInput}
                                onChange={(e) => setAssignContactInput(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-2.5 pr-8 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400"
                                autoFocus
                              />
                              {assignContactInput && (
                                <button
                                  onClick={() => setAssignContactInput('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                          {/* Assign button */}
                          <button
                            onClick={handleAssign}
                            disabled={!isPhoneValid}
                            className={`px-4 py-2.5 font-medium text-xs rounded-lg transition-colors whitespace-nowrap ${
                              isPhoneValid
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            Assign
                          </button>
                        </div>
                        {/* Phone validation hint */}
                        {isPhone && phoneDigits.length > 0 && phoneDigits.length < assignCountry.phoneLength && (
                          <p className="text-amber-400/70 text-[10px] mt-1">{assignCountry.hint}</p>
                        )}
                      </div>
                      );
                    })()}

                    {/* Distribution summary removed - grouped inline above */}

                    {/* Send button */}
                    <button
                      onClick={() => {
                        if (assignedCount < voucherCount) {
                          toast.error(`${remainingCount} voucher${remainingCount !== 1 ? 's' : ''} not yet assigned`);
                          return;
                        }
                        const summaryParts = Object.entries(groupedByRecipient).map(([contact, indices]) => 
                          `${indices.length} to ${contact}`
                        );
                        toast.success(`Vouchers sent: ${summaryParts.join(', ')}`);
                        setVoucherDeliveryDone(true);
                      }}
                      disabled={assignedCount < voucherCount}
                      className={`w-full py-3 font-semibold rounded-lg transition-colors ${
                        assignedCount >= voucherCount
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      Send Vouchers
                    </button>
                  </div>
                  );
                })()}
              </div>
            ) :
            // Receipt Screen with Text/Email input handling
            textReceiptStep === 'phone-input' ? (
              // Text Receipt Phone Input Screen
              <div className="flex flex-col flex-1">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setTextReceiptStep('receipt')}
                      className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-300" />
                    </button>
                    <span className="text-white text-lg font-medium">Text Receipt</span>
                  </div>
                </div>
                
                <div className="px-4 pt-4 pb-2 text-center">
                  <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                </div>
                <div className="px-4 mb-2">
                  <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                      <span className="text-white text-xs font-medium">US +1</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </div>
                    <input type="text" placeholder="(000) 000-0000" value={textReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                  </div>
                </div>
                <div className="px-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                      {textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                  </label>
                </div>
                <div className="px-4 mb-2 text-center">
                  <p className="text-neutral-500 text-[10px] leading-relaxed">Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                </div>
                <div className="px-4 mb-2">
                  <button 
                    onClick={() => { 
                      setTextReceiptStep('receipt'); 
                      setTextReceiptPhone('');
                      handleComplete(); 
                    }} 
                    disabled={textReceiptPhone.replace(/\D/g, '').length < 10} 
                    className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    SEND
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                      <button key={key} onClick={() => { if (key === 'delete') { const digits = textReceiptPhone.replace(/\D/g, ''); const newDigits = digits.slice(0, -1); if (newDigits.length === 0) { setTextReceiptPhone(''); } else if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } else if (key !== '') { const digits = textReceiptPhone.replace(/\D/g, ''); if (digits.length < 10) { const newDigits = digits + key; if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } } }} className={`h-12 rounded-lg text-lg font-medium transition-colors ${key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>{key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : emailReceiptStep === 'email-input' ? (
              // Email Receipt Input Screen
              <div className="flex flex-col flex-1">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setEmailReceiptStep('receipt')}
                      className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-300" />
                    </button>
                    <span className="text-white text-lg font-medium">Email Receipt</span>
                  </div>
                </div>
                
                <div className="px-4 pt-4 pb-2 text-center">
                  <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                </div>
                <div className="px-4 mb-2">
                  <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div>
                    <input type="email" placeholder="email@example.com" value={emailReceiptEmail} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                  </div>
                </div>
                <div className="px-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                      {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                  </label>
                </div>
                <div className="px-4 mb-2 text-center">
                  <p className="text-neutral-500 text-[10px] leading-relaxed">Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                </div>
                <div className="px-4 mb-2">
                  <button 
                    onClick={() => { 
                      setEmailReceiptStep('receipt'); 
                      setEmailReceiptEmail('');
                      handleComplete(); 
                    }} 
                    disabled={!emailReceiptEmail.includes('@') || !emailReceiptEmail.includes('.')} 
                    className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    SEND
                  </button>
                </div>
                {/* Email Keyboard */}
                <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">
                  <div className="flex flex-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                  </div>
                  <div className="flex flex-1">
                    {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                  </div>
                  <div className="flex flex-1 px-2">
                    {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                  </div>
                  <div className="flex flex-1">
                    <div className="w-10"></div>
                    {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail.slice(0, -1))} className="w-10 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><Delete className="w-5 h-5 text-neutral-400" /></button>
                  </div>
                  <div className="flex flex-1 gap-1 px-1">
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">@</span></button>
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">.</span></button>
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '_')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">_</span></button>
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '-')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">-</span></button>
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.com</span></button>
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.net')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.net</span></button>
                    <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@gmail.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-xs font-medium">@gmail</span></button>
                  </div>
                </div>
              </div>
            ) : (
              // Default Receipt Screen
              <div className="flex-1 flex flex-col items-center py-8 px-6">
                {/* Success Icon */}
                <img src={tickSuccessIcon} alt="Success" className="w-14 h-14 mb-4" />
                
                <p className="text-neutral-300 text-sm mb-6">
                  <span className="text-green-500 font-medium">${totalPaid.toFixed(2)}</span> has been successfully processed
                </p>

                {/* Change Due / Due Amount Box */}
                {isFullyPaid ? (
                  <div className="w-full max-w-xs mb-6 border-2 border-green-500 rounded-lg p-4 bg-green-500/10">
                    <p className="text-green-500 text-sm text-center mb-1">Change Due</p>
                    <p className="text-green-500 text-3xl font-bold text-center">
                      ${Math.abs(remainingDue).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-xs mb-4 border-2 border-red-500 rounded-lg p-4 bg-red-500/10">
                    <p className="text-red-500 text-sm text-center mb-1">Due Amount</p>
                    <p className="text-red-500 text-3xl font-bold text-center">
                      ${remainingDue.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Pay Remaining Button - Show when there's still due amount */}
                {!isFullyPaid && (
                  <div className="w-full max-w-xs mb-6">
                    <button
                      onClick={() => {
                        setPaymentAmount(remainingDue.toFixed(2));
                        setPaymentProcessed(false);
                        setSelectedPaymentMethod('cash');
                        setAmountQuantities({});
                        setGiftCardStep('amount');
                        setGiftCardNumber('');
                        setPayByLinkStep('amount');
                        setQrCodeStep('amount');
                        setManualCCStep('amount');
                        setExternalCCStep('amount');
                        setManualCardStep('amount');
                        setThirdPartyDeliveryStep('amount');
                        setSelectedDeliveryPartner(null);
                        setDeliveryReference('');
                        setLoyaltyStep('guest-list');
                      }}
                      className="w-full py-3.5 bg-gradient-to-b from-orange-400 to-orange-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all shadow-lg"
                    >
                      PAY REMAINING ${remainingDue.toFixed(2)}
                    </button>
                  </div>
                )}

                {/* Receipt Section */}
                <div className="w-full max-w-xs">
                  <h3 className="text-white font-semibold text-center mb-4">Receipt</h3>
                  <div className="flex gap-4 justify-center mb-4">
                    <button 
                      onClick={handleComplete}
                      className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      <Printer className="w-6 h-6 text-neutral-400" />
                      <span className="text-neutral-400 text-sm">Print</span>
                    </button>
                    <button 
                      onClick={() => setTextReceiptStep('phone-input')}
                      className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      <MessageSquare className="w-6 h-6 text-neutral-400" />
                      <span className="text-neutral-400 text-sm">Text</span>
                    </button>
                    <button 
                      onClick={() => setEmailReceiptStep('email-input')}
                      className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      <Mail className="w-6 h-6 text-neutral-400" />
                      <span className="text-neutral-400 text-sm">Email</span>
                    </button>
                  </div>
                  <button 
                    onClick={handleComplete}
                    className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    NO RECEIPT
                  </button>
                </div>
              </div>
            )
          ) : selectedPaymentMethod === 'loyalty' ? (
            /* ============= FULL LOYALTY FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Guest List Screen */}
              {loyaltyStep === 'guest-list' && (
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (isMobile) {
                            setMobilePaymentSelectionActive(true);
                          }
                          setSelectedPaymentMethod('cash');
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden flex-1">
                    {/* Info Row with Add Guest Button */}
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-neutral-400 text-xs">Select a guest to redeem loyalty points</p>
                      <button 
                        onClick={() => setShowLoyaltyAddGuest(true)} 
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />
                        Add Guest
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 mb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <Input 
                          type="text" 
                          placeholder="Search Guest" 
                          value={loyaltySearchQuery} 
                          onChange={e => setLoyaltySearchQuery(e.target.value)} 
                          className="w-full pl-9 py-1.5 text-sm bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                        />
                      </div>
                    </div>

                    {/* Guest Table */}
                    <div className="flex-1 overflow-auto px-3 min-h-0 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-3 py-1.5 text-[10px] text-neutral-400 border-b border-neutral-700">
                        <span>Name</span>
                        <span>Phone Number</span>
                        <span>Email</span>
                      </div>
                      {/* Guest Rows */}
                      {mockGuests
                        .filter(guest => 
                          loyaltySearchQuery === '' || 
                          guest.name.toLowerCase().includes(loyaltySearchQuery.toLowerCase()) || 
                          guest.phone.includes(loyaltySearchQuery) || 
                          guest.email.toLowerCase().includes(loyaltySearchQuery.toLowerCase())
                        )
                        .map((guest, index) => (
                          <div 
                            key={index} 
                            onClick={() => {
                              setLoyaltySelectedGuest(guest);
                              setLoyaltyStep('guest-selected');
                            }} 
                            className="grid grid-cols-3 gap-3 py-2 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-white font-medium">
                                {guest.avatar}
                              </div>
                              <span className="text-white text-xs">{guest.name}</span>
                            </div>
                            <span className="text-neutral-300 text-xs flex items-center">{guest.phone}</span>
                            <span className="text-neutral-300 text-xs flex items-center truncate">{guest.email}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Add Guest Modal */}
                  {showLoyaltyAddGuest && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
                      <div className="bg-white rounded-xl w-[400px] overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative p-4 pb-2">
                          <button 
                            onClick={() => setShowLoyaltyAddGuest(false)} 
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <h3 className="text-black text-xl font-semibold text-center">Add Guest</h3>
                          <p className="text-neutral-500 text-sm text-center mt-1">Search for existing or add new guest information to continue with the order</p>
                        </div>

                        {/* Form Fields */}
                        <div className="p-4 space-y-3">
                          <input 
                            type="text" 
                            placeholder="Guest Name*" 
                            value={loyaltyNewGuest.name} 
                            onChange={e => setLoyaltyNewGuest({ ...loyaltyNewGuest, name: e.target.value })} 
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                          />
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-3 py-2">
                              <span className="text-lg">🇺🇸</span>
                              <span className="text-black text-sm">+1</span>
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            </div>
                            <input 
                              type="tel" 
                              placeholder="Phone Number*" 
                              value={loyaltyNewGuest.phone} 
                              onChange={e => setLoyaltyNewGuest({ ...loyaltyNewGuest, phone: e.target.value })} 
                              className="flex-1 px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                            />
                          </div>
                          <input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={loyaltyNewGuest.email} 
                            onChange={e => setLoyaltyNewGuest({ ...loyaltyNewGuest, email: e.target.value })} 
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                          />
                        </div>

                        {/* ADD Button */}
                        <div className="p-4 pt-2">
                          <button 
                            onClick={() => {
                              if (loyaltyNewGuest.name && loyaltyNewGuest.phone) {
                                const newGuest: GuestType = {
                                  name: loyaltyNewGuest.name,
                                  phone: loyaltyNewGuest.phone,
                                  email: loyaltyNewGuest.email || 'guest@example.com',
                                  avatar: loyaltyNewGuest.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                                  loyaltyPoints: 1250
                                };
                                setLoyaltySelectedGuest(newGuest);
                                setShowLoyaltyAddGuest(false);
                                setLoyaltyStep('guest-selected');
                                setLoyaltyNewGuest({ name: '', phone: '', email: '' });
                              }
                            }} 
                            disabled={!loyaltyNewGuest.name || !loyaltyNewGuest.phone} 
                            className={`w-full py-3 font-medium rounded-lg transition-colors ${
                              loyaltyNewGuest.name && loyaltyNewGuest.phone 
                                ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Guest Selected Screen */}
              {loyaltyStep === 'guest-selected' && loyaltySelectedGuest && (
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setLoyaltyStep('guest-list');
                          setLoyaltySelectedGuest(null);
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden flex-1">
                    {/* Selected Guest Card with Points */}
                    <div className="p-3">
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center text-sm text-white font-medium overflow-hidden">
                            {loyaltySelectedGuest.avatar}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-sm">{loyaltySelectedGuest.name}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                              <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                <Phone className="w-3 h-3" />
                                <span>{loyaltySelectedGuest.phone}</span>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                <Mail className="w-3 h-3" />
                                <span>{loyaltySelectedGuest.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-neutral-400" />
                                <span className="text-white text-xs font-medium">{(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} Points</span>
                              </div>
                              <span className="text-green-500 text-xs">Value ${(loyaltySelectedGuest.loyaltyPoints || 1250).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* REDEEM Button */}
                    <div className="px-3 pb-3">
                      <button 
                        onClick={() => {
                          const suggestedPoints = Math.ceil(parseFloat(paymentAmount));
                          setLoyaltyPointsToRedeem(suggestedPoints.toString());
                          setLoyaltyStep('points-input');
                        }} 
                        className="w-full py-2.5 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        REDEEM
                      </button>
                    </div>

                    {/* Remaining Guest List */}
                    <div className="flex-1 overflow-auto px-3 min-h-0 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Search Input */}
                      <div className="mb-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                          <Input 
                            type="text" 
                            placeholder="Search Guest" 
                            value={loyaltySearchQuery} 
                            onChange={e => setLoyaltySearchQuery(e.target.value)} 
                            className="w-full pl-9 py-1.5 text-sm bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                          />
                        </div>
                      </div>
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-3 py-1.5 text-[10px] text-neutral-400 border-b border-neutral-700">
                        <span>Name</span>
                        <span>Phone Number</span>
                        <span>Email</span>
                      </div>
                      {/* Guest Rows */}
                      {mockGuests
                        .filter(g => g.name !== loyaltySelectedGuest.name)
                        .filter(guest => 
                          loyaltySearchQuery === '' || 
                          guest.name.toLowerCase().includes(loyaltySearchQuery.toLowerCase()) || 
                          guest.phone.includes(loyaltySearchQuery) || 
                          guest.email.toLowerCase().includes(loyaltySearchQuery.toLowerCase())
                        )
                        .map((guest, index) => (
                          <div 
                            key={index} 
                            onClick={() => setLoyaltySelectedGuest(guest)} 
                            className="grid grid-cols-3 gap-3 py-2 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-white font-medium">
                                {guest.avatar}
                              </div>
                              <span className="text-white text-xs">{guest.name}</span>
                            </div>
                            <span className="text-neutral-300 text-xs flex items-center">{guest.phone}</span>
                            <span className="text-neutral-300 text-xs flex items-center truncate">{guest.email}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {/* Points Input Screen */}
              {loyaltyStep === 'points-input' && loyaltySelectedGuest && (
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setLoyaltyStep('guest-selected');
                          setLoyaltyPointsToRedeem('');
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden flex-1">
                    {/* Selected Guest Card */}
                    <div className="p-3 border-b border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-xs text-white font-medium overflow-hidden">
                          {loyaltySelectedGuest.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-semibold text-sm">{loyaltySelectedGuest.name}</h3>
                            <div className="flex items-center gap-1 text-neutral-400 text-[10px]">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{loyaltySelectedGuest.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-neutral-400" />
                              <span className="text-white text-xs">{(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} Points</span>
                            </div>
                            <span className="text-green-500 text-[10px]">Value ${(loyaltySelectedGuest.loyaltyPoints || 1250).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Points to Redeem */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="mb-1.5">
                        <h4 className="text-white font-semibold text-sm">Points to Redeem</h4>
                        <p className="text-neutral-400 text-xs">Due: ${paymentAmount} (Suggested: {Math.ceil(parseFloat(paymentAmount))} pts)</p>
                      </div>

                      {/* Points Input Box */}
                      <div 
                        onClick={() => setShowLoyaltyKeypad(!showLoyaltyKeypad)} 
                        className="w-full py-2.5 px-3 bg-neutral-800 border border-neutral-600 rounded-lg text-center text-xl text-white font-medium cursor-pointer mb-1"
                      >
                        {loyaltyPointsToRedeem || '0'}
                      </div>
                      <p className="text-neutral-400 text-[10px] mb-2">Maximum: {(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} points</p>

                      {/* Keypad */}
                      {showLoyaltyKeypad && (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                              key={num} 
                              onClick={() => setLoyaltyPointsToRedeem((loyaltyPointsToRedeem + num.toString()).slice(0, 6))} 
                              className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              {num}
                            </button>
                          ))}
                          <button 
                            onClick={() => setLoyaltyPointsToRedeem(loyaltyPointsToRedeem + '.')} 
                            className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                          >
                            .
                          </button>
                          <button 
                            onClick={() => setLoyaltyPointsToRedeem((loyaltyPointsToRedeem + '0').slice(0, 6))} 
                            className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                          >
                            0
                          </button>
                          <button 
                            onClick={() => setLoyaltyPointsToRedeem('')} 
                            className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-red-500 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                          >
                            C
                          </button>
                        </div>
                      )}

                      {/* REDEEM Button */}
                      <button 
                        onClick={() => {
                          const points = parseFloat(loyaltyPointsToRedeem) || 0;
                          const maxPoints = loyaltySelectedGuest.loyaltyPoints || 1250;
                          if (points > 0 && points <= maxPoints) {
                            setLoyaltyStep('otp');
                          }
                        }} 
                        disabled={!loyaltyPointsToRedeem || parseFloat(loyaltyPointsToRedeem) <= 0}
                        className={`mt-auto w-full py-2.5 font-semibold rounded-lg transition-colors text-sm ${
                          loyaltyPointsToRedeem && parseFloat(loyaltyPointsToRedeem) > 0 
                            ? 'bg-white hover:bg-neutral-200 text-neutral-900' 
                            : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        REDEEM
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* OTP Verification Screen */}
              {loyaltyStep === 'otp' && loyaltySelectedGuest && (
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setLoyaltyStep('points-input');
                          setLoyaltyOtp(['', '', '', '']);
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden flex-1 p-3">
                    {/* Points Summary */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-neutral-800 rounded-lg">
                      <div className="text-center">
                        <p className="text-neutral-400 text-[10px]">Remaining</p>
                        <p className="text-white text-sm font-medium">{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseFloat(loyaltyPointsToRedeem || '0')).toLocaleString()} pts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-neutral-400 text-[10px]">Deducting</p>
                        <p className="text-green-500 text-sm font-medium">-{loyaltyPointsToRedeem} pts</p>
                      </div>
                    </div>

                    {/* Instructions */}
                    <p className="text-neutral-400 text-xs text-center mb-3">
                      Enter OTP sent to {loyaltySelectedGuest.phone}
                    </p>

                    {/* QR Code Placeholder */}
                    <div className="flex justify-center mb-3">
                      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-neutral-900" />
                      </div>
                    </div>

                    {/* OTP Label */}
                    <p className="text-neutral-400 text-xs text-center mb-2">OTP</p>

                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-2 mb-4">
                      {loyaltyOtp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newOtp = [...loyaltyOtp];
                            newOtp[index] = val;
                            setLoyaltyOtp(newOtp);
                            // Auto-focus next input
                            if (val && index < 3) {
                              const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement;
                              nextInput?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && index > 0) {
                              const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement;
                              prevInput?.focus();
                            }
                          }}
                          data-otp-index={index}
                          className="w-10 h-12 text-center text-xl font-bold bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:border-white focus:outline-none"
                        />
                      ))}
                    </div>

                    {/* REDEEM Button */}
                    <button 
                      onClick={() => {
                        const otp = loyaltyOtp.join('');
                        if (otp.length === 4) {
                          // Process payment
                          const pointsValue = parseFloat(loyaltyPointsToRedeem) || 0;
                          setPaidAmount(prev => prev + pointsValue);
                          setPaymentHistory(prev => [...prev, { 
                            method: 'loyalty', 
                            amount: pointsValue, 
                            methodLabel: `Loyalty (${loyaltySelectedGuest.name})` 
                          }]);
                          setLoyaltyStep('complete');
                        }
                      }} 
                      disabled={loyaltyOtp.join('').length !== 4}
                      className={`mt-auto w-full py-2.5 font-semibold rounded-lg transition-colors text-sm ${
                        loyaltyOtp.join('').length === 4 
                          ? 'bg-white hover:bg-neutral-200 text-neutral-900' 
                          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      REDEEM
                    </button>
                  </div>
                </>
              )}

              {/* Payment Complete Screen */}
              {loyaltyStep === 'complete' && loyaltySelectedGuest && (
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setLoyaltyStep('guest-list');
                          setLoyaltySelectedGuest(null);
                          setLoyaltyPointsToRedeem('');
                          setLoyaltyOtp(['', '', '', '']);
                        }} 
                        className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                      </button>
                      <span className="text-white text-sm font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 px-4 py-4">
                    {/* Success Icon */}
                    <img src={tickSuccessIcon} alt="Success" className="w-14 h-14 mb-3" />

                    <h3 className="text-white text-lg font-semibold mb-1">Payment Complete</h3>
                    <p className="text-neutral-400 text-xs mb-4">{loyaltySelectedGuest.name}</p>

                    {/* Points Summary Table */}
                    <div className="w-full max-w-xs bg-neutral-800 rounded-lg p-3 mb-4">
                      <div className="flex justify-between py-1.5 border-b border-neutral-700">
                        <span className="text-neutral-400 text-xs">Points Used</span>
                        <span className="text-white text-xs font-medium">{loyaltyPointsToRedeem} pts</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-700">
                        <span className="text-neutral-400 text-xs">Available Balance</span>
                        <span className="text-white text-xs font-medium">{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseFloat(loyaltyPointsToRedeem || '0')).toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-400 text-xs">Equivalent Value</span>
                        <span className="text-green-500 text-xs font-medium">${parseFloat(loyaltyPointsToRedeem || '0').toFixed(2)}</span>
                      </div>
                    </div>

                    {/* CONTINUE Button */}
                    <button 
                      onClick={() => {
                        const pointsValue = parseFloat(loyaltyPointsToRedeem || '0');
                        finalizePayment('loyalty', pointsValue, 'Loyalty');
                      }} 
                      className="w-full max-w-xs py-2.5 bg-white hover:bg-neutral-200 text-neutral-900 font-semibold rounded-lg transition-colors text-sm"
                    >
                      CONTINUE
                    </button>
                  </div>
                </>
              )}
            </>
          ) : selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card' ? (
            /* ============= GIFT CARD FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (isMobile) {
                        setMobilePaymentSelectionActive(true);
                      }
                      setGiftCardStep('amount');
                      setGiftCardNumber('');
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Pay by Gift Card</span>
                </div>
                <span className="text-red-500 text-lg font-bold">${paymentAmount}</span>
              </div>

              {/* Gift Card Number Display */}
              <div className="px-6 py-6">
                <div className="flex flex-col items-center">
                  <span className="text-neutral-400 text-xs mb-2">Gift Card Number</span>
                  <div className="flex items-center justify-center gap-2 bg-neutral-800 rounded-lg px-4 py-4 w-full">
                    <span className="text-white text-2xl font-bold tracking-widest text-center">
                      {giftCardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() || 'XXXX XXXX XXXX XXXX'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Keypad for Gift Card Number */}
              <div className="flex-1 px-6">
                <div className="flex flex-col gap-1.5">
                  {[['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']].map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1.5">
                      {row.map(key => (
                        <button 
                          key={key}
                          onClick={() => handleGiftCardKeypadPress(key)}
                          className="flex-1 py-3 rounded-lg text-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleGiftCardKeypadPress('0')}
                      className="flex-1 py-3 rounded-lg text-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                    >
                      0
                    </button>
                    <button 
                      onClick={() => handleGiftCardKeypadPress('00')}
                      className="flex-1 py-3 rounded-lg text-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                    >
                      00
                    </button>
                    <button 
                      onClick={() => handleGiftCardKeypadPress('C')}
                      className="flex-1 py-3 rounded-lg text-lg font-medium bg-neutral-800 text-red-500 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                    >
                      C
                    </button>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="p-4">
                <button 
                  onClick={() => {
                    const digits = giftCardNumber.replace(/\s/g, '');
                    if (digits.length === 16) {
                      const paid = parseFloat(paymentAmount) || 0;
                      finalizePayment('gift-card', paid, 'Gift Card');
                    }
                  }}
                  disabled={giftCardNumber.replace(/\s/g, '').length !== 16}
                  className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${
                    giftCardNumber.replace(/\s/g, '').length === 16 
                      ? 'bg-white hover:bg-neutral-200 text-neutral-900' 
                      : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </>
          ) : selectedPaymentMethod === 'pay-link' && payByLinkStep !== 'amount' ? (
            /* ============= PAY BY LINK FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (payByLinkStep === 'select-guest') {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setPayByLinkStep('amount');
                      } else if (payByLinkStep === 'add-guest') {
                        setPayByLinkStep('select-guest');
                      } else if (payByLinkStep === 'guest-confirmed') {
                        setPayByLinkStep('select-guest');
                        setSelectedGuest(null);
                      } else if (payByLinkStep === 'pending' || payByLinkStep === 'expired') {
                        setPayByLinkStep('guest-confirmed');
                      } else if (payByLinkStep === 'complete') {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setPayByLinkStep('amount');
                        setSelectedGuest(null);
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Pay by Link</span>
                </div>
                <span className="text-red-500 text-lg font-bold">${paymentAmount}</span>
              </div>

              {/* Guest Selection Screen */}
              {payByLinkStep === 'select-guest' && (
                <div className="flex flex-col overflow-hidden flex-1">
                  {/* Info Text */}
                  <div className="px-4 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs flex-1 min-w-0">
                      <div className="w-4 h-4 rounded-full border border-neutral-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px]">i</span>
                      </div>
                      <span className="truncate">Search guest to share link or add details.</span>
                    </div>
                    <button 
                      onClick={() => {
                        setNewGuestForLink({ name: '', phone: '', email: '' });
                        setPayByLinkStep('add-guest');
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors flex-shrink-0 whitespace-nowrap"
                    >
                      <UserPlus className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">Add</span>
                    </button>
                  </div>

                  {/* Send Link Toggle Buttons */}
                  <div className="px-4 pb-3 flex gap-2">
                    <button 
                      onClick={() => setSendLinkMethod('text')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sendLinkMethod === 'text' ? 'bg-white text-black' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      Send Link by Text
                    </button>
                    <button 
                      onClick={() => setSendLinkMethod('email')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sendLinkMethod === 'email' ? 'bg-white text-black' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      Send Link by Email
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="px-4 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input 
                        type="text" 
                        placeholder="Search Guest" 
                        value={guestSearchQuery} 
                        onChange={e => setGuestSearchQuery(e.target.value)} 
                        className="w-full pl-10 py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                      />
                    </div>
                  </div>

                  {/* Guest List Table */}
                  <div className="flex-1 overflow-auto px-4 min-h-0 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Table Header */}
                    <div className="grid grid-cols-3 gap-4 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                      <span>Name</span>
                      <span>Phone Number</span>
                      <span>Email</span>
                    </div>
                    {/* Guest Rows */}
                    {mockGuests
                      .filter(guest => 
                        guestSearchQuery === '' || 
                        guest.name.toLowerCase().includes(guestSearchQuery.toLowerCase()) || 
                        guest.phone.includes(guestSearchQuery) || 
                        guest.email.toLowerCase().includes(guestSearchQuery.toLowerCase())
                      )
                      .map((guest, index) => (
                        <div 
                          key={index}
                          onClick={() => {
                            setSelectedGuest(guest);
                            setPayByLinkStep('guest-confirmed');
                          }}
                          className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white font-medium">
                              {guest.avatar}
                            </div>
                            <span className="text-white text-sm">{guest.name}</span>
                          </div>
                          <span className="text-neutral-300 text-sm flex items-center">{guest.phone}</span>
                          <span className="text-neutral-300 text-sm flex items-center truncate">{guest.email}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Add Guest Screen */}
              {payByLinkStep === 'add-guest' && (
                <div className="flex flex-col overflow-hidden flex-1">
                  {/* Info Text */}
                  <div className="px-4 py-2 flex items-center gap-2 text-neutral-400 text-xs">
                    <div className="w-4 h-4 rounded-full border border-neutral-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px]">i</span>
                    </div>
                    <span>Enter guest details to send payment link.</span>
                  </div>

                  {/* Send Link Toggle Buttons */}
                  <div className="px-4 pb-3 flex gap-2">
                    <button 
                      onClick={() => setSendLinkMethod('text')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sendLinkMethod === 'text' ? 'bg-white text-black' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      Send Link by Text
                    </button>
                    <button 
                      onClick={() => setSendLinkMethod('email')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sendLinkMethod === 'email' ? 'bg-white text-black' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      Send Link by Email
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 overflow-auto px-4 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Guest Name */}
                    <div>
                      <label className="text-neutral-400 text-xs mb-1.5 block">
                        Guest Name <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        type="text" 
                        placeholder="Enter full name" 
                        value={newGuestForLink.name} 
                        onChange={e => setNewGuestForLink({ ...newGuestForLink, name: e.target.value })} 
                        className="w-full py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="text-neutral-400 text-xs mb-1.5 block">
                        Phone Number {sendLinkMethod === 'text' && <span className="text-red-500">*</span>}
                      </label>
                      <Input 
                        type="tel" 
                        placeholder="(555) 123-4567" 
                        value={newGuestForLink.phone} 
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          let formatted = value;
                          if (value.length >= 3 && value.length < 6) {
                            formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                          } else if (value.length >= 6) {
                            formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                          }
                          setNewGuestForLink({ ...newGuestForLink, phone: formatted });
                        }} 
                        className="w-full py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-neutral-400 text-xs mb-1.5 block">
                        Email Address {sendLinkMethod === 'email' && <span className="text-red-500">*</span>}
                      </label>
                      <Input 
                        type="email" 
                        placeholder="guest@email.com" 
                        value={newGuestForLink.email} 
                        onChange={e => setNewGuestForLink({ ...newGuestForLink, email: e.target.value })} 
                        className="w-full py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg" 
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 flex gap-3 border-t border-neutral-700">
                    <button 
                      onClick={() => setPayByLinkStep('select-guest')}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (!newGuestForLink.name.trim()) return;
                        if (sendLinkMethod === 'text' && !newGuestForLink.phone.trim()) return;
                        if (sendLinkMethod === 'email' && !newGuestForLink.email.trim()) return;

                        const newGuest: GuestType = {
                          name: newGuestForLink.name,
                          phone: newGuestForLink.phone,
                          email: newGuestForLink.email,
                          avatar: newGuestForLink.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                          loyaltyPoints: 0
                        };
                        setSelectedGuest(newGuest);
                        setPayByLinkStep('pending');
                      }}
                      disabled={!newGuestForLink.name.trim() || (sendLinkMethod === 'text' && !newGuestForLink.phone.trim()) || (sendLinkMethod === 'email' && !newGuestForLink.email.trim())}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Link
                    </button>
                  </div>
                </div>
              )}

              {/* Guest Confirmed Screen */}
              {payByLinkStep === 'guest-confirmed' && selectedGuest && (
                <div className="flex flex-col overflow-hidden flex-1">
                  {/* Selected Guest Card */}
                  <div className="p-4">
                    <div className="bg-neutral-800 rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-neutral-600 flex items-center justify-center text-lg text-white font-medium">
                          {selectedGuest.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{selectedGuest.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-neutral-400 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{selectedGuest.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-neutral-400 text-sm">
                            <Mail className="w-4 h-4" />
                            <span>{selectedGuest.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSendLinkMethod('text');
                              setPayByLinkStep('pending');
                            }}
                            className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-white" />
                          </button>
                          <button 
                            onClick={() => {
                              setSendLinkMethod('text');
                              setPayByLinkStep('pending');
                            }}
                            className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors"
                          >
                            <Phone className="w-4 h-4 text-white" />
                          </button>
                          <button 
                            onClick={() => {
                              setSendLinkMethod('email');
                              setPayByLinkStep('pending');
                            }}
                            className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-400 transition-colors"
                          >
                            <Mail className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Send Link Buttons */}
                  <div className="px-4 pb-4 flex gap-3">
                    <button 
                      onClick={() => {
                        setSendLinkMethod('text');
                        setPayByLinkStep('pending');
                      }}
                      className="flex-1 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Send Link by Text
                    </button>
                    <button 
                      onClick={() => {
                        setSendLinkMethod('email');
                        setPayByLinkStep('pending');
                      }}
                      className="flex-1 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Send Link by Email
                    </button>
                  </div>

                  {/* Remaining Guest List */}
                  <div className="flex-1 overflow-auto px-4 min-h-0 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="grid grid-cols-3 gap-4 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                      <span>Name</span>
                      <span>Phone Number</span>
                      <span>Email</span>
                    </div>
                    {mockGuests
                      .filter(g => g.name !== selectedGuest.name)
                      .map((guest, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedGuest(guest)}
                          className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white font-medium">
                              {guest.avatar}
                            </div>
                            <span className="text-white text-sm">{guest.name}</span>
                          </div>
                          <span className="text-neutral-300 text-sm flex items-center">{guest.phone}</span>
                          <span className="text-neutral-300 text-sm flex items-center truncate">{guest.email}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Payment Pending Screen */}
              {payByLinkStep === 'pending' && selectedGuest && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-white text-2xl font-semibold mb-2">Payment Pending</h2>
                  <p className="text-neutral-400 text-sm mb-8">Waiting for customer to complete payment</p>
                  
                  <div className="w-full space-y-3 mb-8">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Requested</span>
                      <span className="text-white font-medium">${paymentAmount}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Recipient</span>
                      <span className="text-white font-medium">{sendLinkMethod === 'text' ? selectedGuest.phone : selectedGuest.email}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const random = Math.random();
                      if (random < 0.5) {
                        setPayByLinkStep('expired');
                      } else {
                        const paid = parseFloat(paymentAmount) || 0;
                        setPaidAmount(prev => prev + paid);
                        setPayByLinkStep('complete');
                      }
                    }}
                    className="w-full py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    REFRESH STATUS
                  </button>
                </div>
              )}

              {/* Payment Expired Screen */}
              {payByLinkStep === 'expired' && selectedGuest && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-white text-2xl font-semibold mb-2">Payment Link Expired</h2>
                  <p className="text-neutral-400 text-sm mb-8">The payment link has expired</p>
                  
                  <div className="w-full space-y-3 mb-8">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Requested</span>
                      <span className="text-white font-medium">${paymentAmount}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Recipient</span>
                      <span className="text-white font-medium">{sendLinkMethod === 'text' ? selectedGuest.phone : selectedGuest.email}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setPayByLinkStep('pending')}
                    className="w-full py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-400 transition-colors"
                  >
                    RESEND LINK
                  </button>
                </div>
              )}

              {/* Payment Complete Screen */}
              {payByLinkStep === 'complete' && selectedGuest && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-6" />
                  <h2 className="text-white text-2xl font-semibold mb-2">Payment Complete</h2>
                  <p className="text-neutral-400 text-sm mb-8">The guest has completed their payment</p>
                  
                  <div className="w-full space-y-3 mb-8">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Requested</span>
                      <span className="text-white font-medium">${paymentAmount}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Paid</span>
                      <span className="text-green-500 font-medium">${paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Recipient</span>
                      <span className="text-white font-medium">{sendLinkMethod === 'text' ? selectedGuest.phone : selectedGuest.email}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const amount = parseFloat(paymentAmount) || 0;
                      finalizePayment('pay-link', amount, 'Pay by Link');
                    }}
                    className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    CONTINUE
                  </button>
                </div>
              )}
            </>
          ) : selectedPaymentMethod === 'qr-code' && qrCodeStep !== 'amount' ? (
            /* ============= QR CODE FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (qrCodeStep === 'qr-display') {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setQrCodeStep('amount');
                        setQrPhoneNumber('');
                        setShowQrPhoneInput(false);
                      } else if (qrCodeStep === 'pending' || qrCodeStep === 'complete') {
                        setQrCodeStep('qr-display');
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Pay by QR</span>
                </div>
                <span className="text-red-500 text-lg font-bold">${paymentAmount}</span>
              </div>

              {/* QR Display Screen */}
              {qrCodeStep === 'qr-display' && (
                <div className="flex-1 flex flex-col items-center px-6 py-4 overflow-y-auto scrollbar-hide">
                  <span className="text-neutral-400 text-sm mb-1">Scan to Pay</span>
                  <span className={`text-green-500 font-bold ${showQrPhoneInput ? 'text-2xl mb-3' : 'text-3xl mb-6'}`}>${paymentAmount}</span>
                  
                  {/* QR Code Placeholder */}
                  <div className={`${showQrPhoneInput ? 'w-32 h-32 mb-3' : 'w-48 h-48 mb-6'} bg-white rounded-xl flex items-center justify-center relative transition-all`}>
                    <div className="grid grid-cols-8 gap-0.5 p-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`${showQrPhoneInput ? 'w-2 h-2' : 'w-4 h-4'} ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`${showQrPhoneInput ? 'w-8 h-8' : 'w-12 h-12'} bg-white rounded-lg flex items-center justify-center`}>
                        <QrCode className={`${showQrPhoneInput ? 'w-5 h-5' : 'w-8 h-8'} text-black`} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className={`flex gap-3 w-full ${showQrPhoneInput ? 'mb-3' : 'mb-4'}`}>
                    <button className="flex-1 py-3 bg-neutral-800 border border-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-700 transition-colors">
                      SHARE QR
                    </button>
                    <button 
                      onClick={() => setShowQrPhoneInput(!showQrPhoneInput)}
                      className={`flex-1 py-3 font-medium rounded-lg transition-colors ${
                        showQrPhoneInput ? 'bg-white text-black' : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700'
                      }`}
                    >
                      SHARE VIA TEXT
                    </button>
                  </div>
                  
                  {/* Phone Input */}
                  {showQrPhoneInput && (
                    <div className="w-full">
                      <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden mb-3">
                        <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600">
                          <span className="text-white text-sm font-medium">US +1</span>
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="(000) 000-0000" 
                          value={qrPhoneNumber} 
                          readOnly 
                          className="flex-1 bg-transparent text-white px-3 py-2 text-sm placeholder:text-neutral-500 outline-none" 
                        />
                        <button 
                          onClick={() => {
                            if (qrPhoneNumber.replace(/\D/g, '').length >= 10) {
                              setQrCodeStep('pending');
                            }
                          }}
                          disabled={qrPhoneNumber.replace(/\D/g, '').length < 10}
                          className="px-4 py-2 bg-green-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Numeric Keypad */}
                      <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                          <button 
                            key={key} 
                            onClick={() => {
                              if (key === 'delete') {
                                const digits = qrPhoneNumber.replace(/\D/g, '');
                                const newDigits = digits.slice(0, -1);
                                if (newDigits.length === 0) {
                                  setQrPhoneNumber('');
                                } else if (newDigits.length <= 3) {
                                  setQrPhoneNumber(`(${newDigits}`);
                                } else if (newDigits.length <= 6) {
                                  setQrPhoneNumber(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`);
                                } else {
                                  setQrPhoneNumber(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`);
                                }
                              } else if (key !== '') {
                                const digits = qrPhoneNumber.replace(/\D/g, '');
                                if (digits.length < 10) {
                                  const newDigits = digits + key;
                                  if (newDigits.length <= 3) {
                                    setQrPhoneNumber(`(${newDigits}`);
                                  } else if (newDigits.length <= 6) {
                                    setQrPhoneNumber(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`);
                                  } else {
                                    setQrPhoneNumber(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`);
                                  }
                                }
                              }
                            }} 
                            className={`h-12 rounded-lg text-lg font-medium transition-colors ${
                              key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'
                            }`}
                          >
                            {key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Pending Screen */}
              {qrCodeStep === 'pending' && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-white text-2xl font-semibold mb-2">Payment Pending</h2>
                  <p className="text-neutral-400 text-sm mb-8">Waiting for customer to complete payment</p>
                  
                  <div className="w-full space-y-3 mb-8">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Requested</span>
                      <span className="text-white font-medium">${paymentAmount}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Recipient</span>
                      <span className="text-white font-medium">{qrPhoneNumber || 'QR Scan'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const paid = parseFloat(paymentAmount) || 0;
                      setPaidAmount(prev => prev + paid);
                      setQrCodeStep('complete');
                    }}
                    className="w-full py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    REFRESH STATUS
                  </button>
                </div>
              )}

              {/* Payment Complete Screen */}
              {qrCodeStep === 'complete' && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-6" />
                  <h2 className="text-white text-2xl font-semibold mb-2">Payment Complete</h2>
                  <p className="text-neutral-400 text-sm mb-8">The guest has completed their payment</p>
                  
                  <div className="w-full space-y-3 mb-8">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Requested</span>
                      <span className="text-white font-medium">${paymentAmount}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Amount Paid</span>
                      <span className="text-green-500 font-medium">${paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Recipient</span>
                      <span className="text-white font-medium">{qrPhoneNumber || 'QR Scan'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const amount = parseFloat(paymentAmount) || 0;
                      finalizePayment('qr-code', amount, 'QR Code');
                    }}
                    className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    CONTINUE
                  </button>
                </div>
              )}
            </>
          ) : selectedPaymentMethod === 'manual-cc' && manualCCStep !== 'amount' ? (
            /* ============= MANUAL CC FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (textReceiptStep === 'phone-input') {
                        setTextReceiptStep('receipt');
                      } else if (emailReceiptStep === 'email-input') {
                        setEmailReceiptStep('receipt');
                      } else {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setManualCCStep('amount');
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Pay by Manual CC</span>
                </div>
              </div>

              {/* Tap Card Screen */}
              {manualCCStep === 'tap-card' && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  {/* Contactless Icon */}
                  <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" strokeOpacity="0.3"/>
                      <path d="M8.5 12.5a4 4 0 0 1 7 0" />
                      <path d="M6 10a7 7 0 0 1 12 0" />
                      <path d="M3.5 7.5a11 11 0 0 1 17 0" />
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg font-medium mb-2">Please tap credit card on reader</p>
                  <p className="text-neutral-400 text-sm mb-8">Waiting for card...</p>
                  
                  <div className="w-full max-w-xs bg-neutral-800 rounded-xl p-4 mb-6 text-center">
                    <span className="text-neutral-400 text-sm">Total Amount</span>
                    <p className="text-green-500 text-2xl font-bold">${paymentAmount}</p>
                  </div>

                  <button 
                    onClick={() => {
                      setManualCCStep('processing');
                      setTimeout(() => {
                        const paid = parseFloat(paymentAmount) || 0;
                        setPaidAmount(prev => prev + paid);
                        setManualCCStep('complete');
                      }, 2000);
                    }}
                    className="w-full max-w-xs py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    SIMULATE CARD TAP
                  </button>
                </div>
              )}

              {/* Processing Screen */}
              {manualCCStep === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  {/* Contactless Icon */}
                  <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" strokeOpacity="0.3"/>
                      <path d="M8.5 12.5a4 4 0 0 1 7 0" />
                      <path d="M6 10a7 7 0 0 1 12 0" />
                      <path d="M3.5 7.5a11 11 0 0 1 17 0" />
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg font-medium mb-2">Please tap credit card on reader</p>
                  <p className="text-neutral-400 text-sm mb-8">Processing...</p>
                  
                  <div className="w-full max-w-xs bg-neutral-800 rounded-xl p-4 mb-6 text-center">
                    <span className="text-neutral-400 text-sm">Total Amount</span>
                    <p className="text-green-500 text-2xl font-bold">${paymentAmount}</p>
                  </div>

                  <button 
                    disabled
                    className="w-full max-w-xs py-3 bg-neutral-700 text-neutral-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    PROCESSING...
                  </button>
                </div>
              )}

              {/* Complete/Receipt Screen */}
              {manualCCStep === 'complete' && (
                <>
                  {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-4" />
                      
                      <p className="text-center mb-6">
                        <span className="text-green-500 font-bold text-lg">${paidAmount.toFixed(2)}</span>
                        <span className="text-neutral-400 text-sm"> has been successfully processed</span>
                      </p>
                      
                      <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
                      
                      <div className="flex gap-4 mb-6">
                        <button 
                          onClick={() => {
                            const amount = parseFloat(paymentAmount) || 0;
                            finalizePayment('manual-cc', amount, 'Manual CC');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <Printer className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Print</span>
                        </button>
                        <button 
                          onClick={() => {
                            setTextReceiptPhone('');
                            setTextReceiptNoMarketing(false);
                            setTextReceiptStep('phone-input');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <MessageSquare className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Text</span>
                        </button>
                        <button 
                          onClick={() => {
                            setEmailReceiptEmail('');
                            setEmailReceiptNoMarketing(false);
                            setEmailReceiptStep('email-input');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <Mail className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Email</span>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const amount = parseFloat(paymentAmount) || 0;
                          finalizePayment('manual-cc', amount, 'Manual CC');
                        }} 
                        className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        NO RECEIPT
                      </button>
                    </div>
                  ) : textReceiptStep === 'phone-input' ? (
                    <div className="flex flex-col flex-1">
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                      </div>
                      <div className="px-4 mb-2">
                        <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                            <span className="text-white text-xs font-medium">US +1</span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                          </div>
                          <input type="text" placeholder="(000) 000-0000" value={textReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                        </div>
                      </div>
                      <div className="px-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                            {textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                        </label>
                      </div>
                      <div className="px-4 mb-2 text-center">
                        <p className="text-neutral-500 text-[10px] leading-relaxed">Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                      </div>
                      <div className="px-4 mb-2">
                        <button onClick={() => { setTextReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('manual-cc', amount, 'Manual CC'); }} disabled={textReceiptPhone.replace(/\D/g, '').length < 10} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                      </div>
                      <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                            <button key={key} onClick={() => { if (key === 'delete') { const digits = textReceiptPhone.replace(/\D/g, ''); const newDigits = digits.slice(0, -1); if (newDigits.length === 0) { setTextReceiptPhone(''); } else if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } else if (key !== '') { const digits = textReceiptPhone.replace(/\D/g, ''); if (digits.length < 10) { const newDigits = digits + key; if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } } }} className={`h-12 rounded-lg text-lg font-medium transition-colors ${key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>{key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1">
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                      </div>
                      <div className="px-4 mb-2">
                        <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div>
                          <input type="email" placeholder="email@example.com" value={emailReceiptEmail} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                        </div>
                      </div>
                      <div className="px-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                            {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                        </label>
                      </div>
                      <div className="px-4 mb-2 text-center">
                        <p className="text-neutral-500 text-[10px] leading-relaxed">Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                      </div>
                      <div className="px-4 mb-2">
                        <button onClick={() => { setEmailReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('manual-cc', amount, 'Manual CC'); }} disabled={!emailReceiptEmail.includes('@') || !emailReceiptEmail.includes('.')} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                      </div>
                      {/* Email Keyboard */}
                      <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">
                        <div className="flex flex-1">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1">
                          {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1 px-2">
                          {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1">
                          <div className="w-10"></div>
                          {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail.slice(0, -1))} className="w-10 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><Delete className="w-5 h-5 text-neutral-400" /></button>
                        </div>
                        <div className="flex flex-1 gap-1 px-1">
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">@</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">.</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '_')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">_</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '-')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">-</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.com</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.net')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.net</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@gmail.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-xs font-medium">@gmail</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : selectedPaymentMethod === 'external-cc' && externalCCStep === 'complete' ? (
            /* ============= EXTERNAL CC FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (textReceiptStep === 'phone-input') {
                        setTextReceiptStep('receipt');
                      } else if (emailReceiptStep === 'email-input') {
                        setEmailReceiptStep('receipt');
                      } else {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setExternalCCStep('amount');
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">External CC</span>
                </div>
              </div>

              {/* Complete/Receipt Screen */}
              {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                  <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-4" />
                  
                  <p className="text-center mb-6">
                    <span className="text-green-500 font-bold text-lg">${paidAmount.toFixed(2)}</span>
                    <span className="text-neutral-400 text-sm"> has been successfully processed</span>
                  </p>
                  
                  <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
                  
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => {
                        const amount = parseFloat(paymentAmount) || 0;
                        finalizePayment('external-cc', amount, 'External CC');
                      }} 
                      className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                    >
                      <Printer className="w-6 h-6 text-neutral-300" />
                      <span className="text-neutral-300 text-xs">Print</span>
                    </button>
                    <button 
                      onClick={() => {
                        setTextReceiptPhone('');
                        setTextReceiptNoMarketing(false);
                        setTextReceiptStep('phone-input');
                      }} 
                      className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                    >
                      <MessageSquare className="w-6 h-6 text-neutral-300" />
                      <span className="text-neutral-300 text-xs">Text</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEmailReceiptEmail('');
                        setEmailReceiptNoMarketing(false);
                        setEmailReceiptStep('email-input');
                      }} 
                      className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                    >
                      <Mail className="w-6 h-6 text-neutral-300" />
                      <span className="text-neutral-300 text-xs">Email</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const amount = parseFloat(paymentAmount) || 0;
                      finalizePayment('external-cc', amount, 'External CC');
                    }} 
                    className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    NO RECEIPT
                  </button>
                </div>
              ) : textReceiptStep === 'phone-input' ? (
                <div className="flex flex-col flex-1">
                  <div className="px-4 pt-4 pb-2 text-center">
                    <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                  </div>
                  <div className="px-4 mb-2">
                    <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                        <span className="text-white text-xs font-medium">US +1</span>
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                      </div>
                      <input type="text" placeholder="(000) 000-0000" value={textReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                    </div>
                  </div>
                  <div className="px-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                        {textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                    </label>
                  </div>
                  <div className="px-4 mb-2 text-center">
                    <p className="text-neutral-500 text-[10px] leading-relaxed">Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                  </div>
                  <div className="px-4 mb-2">
                    <button onClick={() => { setTextReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('external-cc', amount, 'External CC'); }} disabled={textReceiptPhone.replace(/\D/g, '').length < 10} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                  </div>
                  <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                        <button key={key} onClick={() => { if (key === 'delete') { const digits = textReceiptPhone.replace(/\D/g, ''); const newDigits = digits.slice(0, -1); if (newDigits.length === 0) { setTextReceiptPhone(''); } else if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } else if (key !== '') { const digits = textReceiptPhone.replace(/\D/g, ''); if (digits.length < 10) { const newDigits = digits + key; if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } } }} className={`h-12 rounded-lg text-lg font-medium transition-colors ${key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>{key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="px-4 pt-4 pb-2 text-center">
                    <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                  </div>
                  <div className="px-4 mb-2">
                    <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div>
                      <input type="email" placeholder="email@example.com" value={emailReceiptEmail} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                    </div>
                  </div>
                  <div className="px-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                        {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                    </label>
                  </div>
                  <div className="px-4 mb-2 text-center">
                    <p className="text-neutral-500 text-[10px] leading-relaxed">Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                  </div>
                  <div className="px-4 mb-2">
                    <button onClick={() => { setEmailReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('external-cc', amount, 'External CC'); }} disabled={!emailReceiptEmail.includes('@') || !emailReceiptEmail.includes('.')} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                  </div>
                  {/* Email Keyboard */}
                  <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">
                    <div className="flex flex-1">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    </div>
                    <div className="flex flex-1">
                      {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    </div>
                    <div className="flex flex-1 px-2">
                      {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    </div>
                    <div className="flex flex-1">
                      <div className="w-10"></div>
                      {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail.slice(0, -1))} className="w-10 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><Delete className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="flex flex-1 gap-1 px-1">
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">@</span></button>
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">.</span></button>
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '_')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">_</span></button>
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '-')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">-</span></button>
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.com</span></button>
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.net')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.net</span></button>
                      <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@gmail.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-xs font-medium">@gmail</span></button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : selectedPaymentMethod === 'manual-card' && manualCardStep !== 'amount' ? (
            /* ============= MANUAL CARD FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (textReceiptStep === 'phone-input') {
                        setTextReceiptStep('receipt');
                      } else if (emailReceiptStep === 'email-input') {
                        setEmailReceiptStep('receipt');
                      } else if (manualCardStep === 'complete') {
                        setManualCardStep('card-details');
                      } else {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setManualCardStep('amount');
                        setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Pay by Manual Card</span>
                </div>
              </div>

              {/* Card Details Screen */}
              {manualCardStep === 'card-details' && (
                <div className="flex-1 flex flex-col px-6 py-6">
                  {/* Amount Display */}
                  <div className="bg-neutral-800 rounded-xl p-4 mb-6 text-center">
                    <span className="text-green-500 text-3xl font-bold">${paymentAmount}</span>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-neutral-400 text-xs mb-1.5 block">Card Number</label>
                      <input 
                        type="text" 
                        placeholder="1234 5678 9012 3456" 
                        value={manualCardDetails.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                          setManualCardDetails({ ...manualCardDetails, cardNumber: formatted.slice(0, 19) });
                        }}
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 text-xs mb-1.5 block">Card Holder Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={manualCardDetails.cardHolder}
                        onChange={(e) => setManualCardDetails({ ...manualCardDetails, cardHolder: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-neutral-400 text-xs mb-1.5 block">Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          value={manualCardDetails.expiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setManualCardDetails({ ...manualCardDetails, expiry: value });
                          }}
                          className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-neutral-400 text-xs mb-1.5 block">CVV</label>
                        <input 
                          type="text" 
                          placeholder="123" 
                          value={manualCardDetails.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setManualCardDetails({ ...manualCardDetails, cvv: value });
                          }}
                          className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Charge Button */}
                  <button 
                    onClick={() => {
                      const paid = parseFloat(paymentAmount) || 0;
                      setPaidAmount(prev => prev + paid);
                      setManualCardStep('complete');
                    }}
                    disabled={!manualCardDetails.cardNumber || !manualCardDetails.cardHolder || !manualCardDetails.expiry || !manualCardDetails.cvv}
                    className={`w-full py-3 font-bold rounded-xl transition-colors text-sm mt-4 ${
                      manualCardDetails.cardNumber && manualCardDetails.cardHolder && manualCardDetails.expiry && manualCardDetails.cvv 
                        ? 'bg-white hover:bg-neutral-200 text-neutral-900' 
                        : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    CHARGE ${paymentAmount}
                  </button>
                </div>
              )}

              {/* Complete/Receipt Screen */}
              {manualCardStep === 'complete' && (
                <>
                  {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-4" />
                      
                      <p className="text-center mb-6">
                        <span className="text-green-500 font-bold text-lg">${paidAmount.toFixed(2)}</span>
                        <span className="text-neutral-400 text-sm"> has been successfully processed</span>
                      </p>
                      
                      <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
                      
                      <div className="flex gap-4 mb-6">
                        <button 
                          onClick={() => {
                            const amount = parseFloat(paymentAmount) || 0;
                            finalizePayment('manual-card', amount, 'Manual Card');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <Printer className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Print</span>
                        </button>
                        <button 
                          onClick={() => {
                            setTextReceiptPhone('');
                            setTextReceiptNoMarketing(false);
                            setTextReceiptStep('phone-input');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <MessageSquare className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Text</span>
                        </button>
                        <button 
                          onClick={() => {
                            setEmailReceiptEmail('');
                            setEmailReceiptNoMarketing(false);
                            setEmailReceiptStep('email-input');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <Mail className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Email</span>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const amount = parseFloat(paymentAmount) || 0;
                          finalizePayment('manual-card', amount, 'Manual Card');
                        }} 
                        className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        NO RECEIPT
                      </button>
                    </div>
                  ) : textReceiptStep === 'phone-input' ? (
                    <div className="flex flex-col flex-1">
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                      </div>
                      <div className="px-4 mb-2">
                        <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                            <span className="text-white text-xs font-medium">US +1</span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                          </div>
                          <input type="text" placeholder="(000) 000-0000" value={textReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                        </div>
                      </div>
                      <div className="px-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                            {textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                        </label>
                      </div>
                      <div className="px-4 mb-2 text-center">
                        <p className="text-neutral-500 text-[10px] leading-relaxed">Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                      </div>
                      <div className="px-4 mb-2">
                        <button onClick={() => { setTextReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('manual-card', amount, 'Manual Card'); }} disabled={textReceiptPhone.replace(/\D/g, '').length < 10} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                      </div>
                      <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                            <button key={key} onClick={() => { if (key === 'delete') { const digits = textReceiptPhone.replace(/\D/g, ''); const newDigits = digits.slice(0, -1); if (newDigits.length === 0) { setTextReceiptPhone(''); } else if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } else if (key !== '') { const digits = textReceiptPhone.replace(/\D/g, ''); if (digits.length < 10) { const newDigits = digits + key; if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } } }} className={`h-12 rounded-lg text-lg font-medium transition-colors ${key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>{key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1">
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                      </div>
                      <div className="px-4 mb-2">
                        <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div>
                          <input type="email" placeholder="email@example.com" value={emailReceiptEmail} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                        </div>
                      </div>
                      <div className="px-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                            {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                        </label>
                      </div>
                      <div className="px-4 mb-2 text-center">
                        <p className="text-neutral-500 text-[10px] leading-relaxed">Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                      </div>
                      <div className="px-4 mb-2">
                        <button onClick={() => { setEmailReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('manual-card', amount, 'Manual Card'); }} disabled={!emailReceiptEmail.includes('@') || !emailReceiptEmail.includes('.')} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                      </div>
                      {/* Email Keyboard */}
                      <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">
                        <div className="flex flex-1">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1">
                          {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1 px-2">
                          {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1">
                          <div className="w-10"></div>
                          {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail.slice(0, -1))} className="w-10 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><Delete className="w-5 h-5 text-neutral-400" /></button>
                        </div>
                        <div className="flex flex-1 gap-1 px-1">
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">@</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">.</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '_')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">_</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '-')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">-</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.com</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.net')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.net</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@gmail.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-xs font-medium">@gmail</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : selectedPaymentMethod === 'third-party-delivery' && thirdPartyDeliveryStep !== 'amount' ? (
            /* ============= THIRD PARTY DELIVERY FLOW - CONSOLIDATED ============= */
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (textReceiptStep === 'phone-input') {
                        setTextReceiptStep('receipt');
                      } else if (emailReceiptStep === 'email-input') {
                        setEmailReceiptStep('receipt');
                      } else if (thirdPartyDeliveryStep === 'reference') {
                        setThirdPartyDeliveryStep('select-partner');
                      } else if (thirdPartyDeliveryStep === 'select-partner') {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setThirdPartyDeliveryStep('amount');
                        setSelectedDeliveryPartner(null);
                      } else if (thirdPartyDeliveryStep === 'complete') {
                        if (isMobile) {
                          setMobilePaymentSelectionActive(true);
                        }
                        setThirdPartyDeliveryStep('amount');
                        setSelectedDeliveryPartner(null);
                      }
                    }} 
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">
                    {thirdPartyDeliveryStep === 'select-partner' 
                      ? 'Select Delivery Partner' 
                      : selectedDeliveryPartner 
                        ? `Pay by ${selectedDeliveryPartner.name}` 
                        : 'Third Party Delivery'}
                  </span>
                </div>
              </div>

              {/* Step 1: Partner Selection */}
              {thirdPartyDeliveryStep === 'select-partner' && (
                <div className="flex-1 flex flex-col p-4">
                  <p className="text-neutral-400 text-sm mb-4">Choose your delivery partner</p>
                  <div className="grid grid-cols-2 gap-3">
                    {deliveryPartners.map((partner) => (
                      <button
                        key={partner.id}
                        onClick={() => {
                          setSelectedDeliveryPartner(partner);
                          setThirdPartyDeliveryStep('reference');
                          setDeliveryReference('');
                        }}
                        className={`flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-700 bg-neutral-800 ${partner.bgColor} transition-all`}
                      >
                        <div className={`w-14 h-14 rounded-full ${partner.color} flex items-center justify-center`}>
                          <partner.icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-white font-medium">{partner.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Reference Number Entry */}
              {thirdPartyDeliveryStep === 'reference' && selectedDeliveryPartner && (
                <div className="flex-1 flex flex-col">
                  {/* Partner Logo */}
                  <div className="flex justify-center py-6">
                    <div className={`w-16 h-16 rounded-full ${selectedDeliveryPartner.color} flex items-center justify-center`}>
                      <selectedDeliveryPartner.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Reference Number Label */}
                  <div className="px-4 mb-1">
                    <span className="text-neutral-400 text-xs">Reference number</span>
                  </div>

                  {/* Reference Number Input */}
                  <div className="px-4 mb-3">
                    <div className="bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-700">
                      <span className="text-white text-base font-medium">
                        {deliveryReference.replace(/(.{4})/g, '$1 ').trim() || 'Enter reference number'}
                      </span>
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="flex-1 px-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'C'].map(key => (
                        <button 
                          key={key} 
                          onClick={() => {
                            if (key === 'C') {
                              setDeliveryReference('');
                            } else {
                              setDeliveryReference(deliveryReference + key);
                            }
                          }} 
                          className={`h-12 rounded-xl text-lg font-medium transition-colors ${
                            key === 'C' 
                              ? 'bg-neutral-800 border border-neutral-700 text-red-500 hover:bg-neutral-700' 
                              : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 active:bg-neutral-600'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="p-4">
                    <button 
                      onClick={() => {
                        const paid = parseFloat(paymentAmount) || 0;
                        setPaidAmount(prev => prev + paid);
                        setThirdPartyDeliveryStep('complete');
                      }} 
                      disabled={!deliveryReference} 
                      className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${
                        deliveryReference 
                          ? `${selectedDeliveryPartner.color} hover:opacity-90 text-white` 
                          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      CONTINUE
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Complete Screen with Receipt Options */}
              {thirdPartyDeliveryStep === 'complete' && selectedDeliveryPartner && (
                <>
                  {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      {/* Success Icon */}
                      <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-4" />
                      
                      <p className="text-center mb-6">
                        <span className="text-green-500 font-bold text-lg">${paidAmount.toFixed(2)}</span>
                        <span className="text-neutral-400 text-sm"> has been successfully processed</span>
                      </p>
                      
                      <p className="text-neutral-400 text-sm mb-6">{selectedDeliveryPartner.name} Ref: {deliveryReference}</p>
                      
                      <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
                      
                      <div className="flex gap-4 mb-6">
                        <button 
                          onClick={() => {
                            const amount = parseFloat(paymentAmount) || 0;
                            finalizePayment('third-party-delivery', amount, selectedDeliveryPartner.name);
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <Printer className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Print</span>
                        </button>
                        <button 
                          onClick={() => {
                            setTextReceiptPhone('');
                            setTextReceiptNoMarketing(false);
                            setTextReceiptStep('phone-input');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <MessageSquare className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Text</span>
                        </button>
                        <button 
                          onClick={() => {
                            setEmailReceiptEmail('');
                            setEmailReceiptNoMarketing(false);
                            setEmailReceiptStep('email-input');
                          }} 
                          className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
                        >
                          <Mail className="w-6 h-6 text-neutral-300" />
                          <span className="text-neutral-300 text-xs">Email</span>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const amount = parseFloat(paymentAmount) || 0;
                          finalizePayment('third-party-delivery', amount, selectedDeliveryPartner.name);
                        }} 
                        className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        NO RECEIPT
                      </button>
                    </div>
                  ) : textReceiptStep === 'phone-input' ? (
                    <div className="flex flex-col flex-1">
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                      </div>
                      <div className="px-4 mb-2">
                        <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                            <span className="text-white text-xs font-medium">US +1</span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                          </div>
                          <input type="text" placeholder="(000) 000-0000" value={textReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                        </div>
                      </div>
                      <div className="px-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => setTextReceiptNoMarketing(!textReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${textReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                            {textReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                        </label>
                      </div>
                      <div className="px-4 mb-2 text-center">
                        <p className="text-neutral-500 text-[10px] leading-relaxed">Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                      </div>
                      <div className="px-4 mb-2">
                        <button onClick={() => { setTextReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('third-party-delivery', amount, selectedDeliveryPartner?.name || 'Delivery'); }} disabled={textReceiptPhone.replace(/\D/g, '').length < 10} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                      </div>
                      <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                            <button key={key} onClick={() => { if (key === 'delete') { const digits = textReceiptPhone.replace(/\D/g, ''); const newDigits = digits.slice(0, -1); if (newDigits.length === 0) { setTextReceiptPhone(''); } else if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } else if (key !== '') { const digits = textReceiptPhone.replace(/\D/g, ''); if (digits.length < 10) { const newDigits = digits + key; if (newDigits.length <= 3) { setTextReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setTextReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } } }} className={`h-12 rounded-lg text-lg font-medium transition-colors ${key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>{key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : emailReceiptStep === 'email-input' ? (
                    <div className="flex flex-col flex-1">
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                      </div>
                      <div className="px-4 mb-2">
                        <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div>
                          <input type="email" placeholder="email@example.com" value={emailReceiptEmail} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                        </div>
                      </div>
                      <div className="px-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => setEmailReceiptNoMarketing(!emailReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${emailReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                            {emailReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                        </label>
                      </div>
                      <div className="px-4 mb-2 text-center">
                        <p className="text-neutral-500 text-[10px] leading-relaxed">Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                      </div>
                      <div className="px-4 mb-2">
                        <button onClick={() => { setEmailReceiptStep('receipt'); const amount = parseFloat(paymentAmount) || 0; finalizePayment('third-party-delivery', amount, selectedDeliveryPartner?.name || 'Delivery'); }} disabled={!emailReceiptEmail.includes('@') || !emailReceiptEmail.includes('.')} className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">SEND</button>
                      </div>
                      {/* Email Keyboard */}
                      <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">
                        <div className="flex flex-1">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1">
                          {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1 px-2">
                          {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                        </div>
                        <div className="flex flex-1">
                          <div className="w-10"></div>
                          {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(key => <button key={key} onClick={() => setEmailReceiptEmail(emailReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail.slice(0, -1))} className="w-10 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><Delete className="w-5 h-5 text-neutral-400" /></button>
                        </div>
                        <div className="flex flex-1 gap-1 px-1">
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">@</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">.</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '_')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">_</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '-')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">-</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.com</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '.net')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.net</span></button>
                          <button onClick={() => setEmailReceiptEmail(emailReceiptEmail + '@gmail.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-xs font-medium">@gmail</span></button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </>
          ) : selectedPaymentMethod === 'voucher' ? (
            /* ============= VOUCHER REDEEM FLOW - REPLACES ENTIRE PANEL ============= */
            <>
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (isMobile) setMobilePaymentSelectionActive(true);
                      setSelectedPaymentMethod('cash');
                      setVoucherStep('enter-code');
                      setVoucherCode('');
                      setVoucherError('');
                      setVoucherValidated(null);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className="text-white text-lg font-medium">Redeem Voucher</span>
                </div>
                <span className="text-red-500 text-lg font-bold">${remainingDue > 0 ? remainingDue.toFixed(2) : total.toFixed(2)}</span>
              </div>
              {(voucherStep === 'enter-code' || voucherStep === 'validating' || voucherStep === 'error') && (
                <div className="flex-1 flex flex-col p-6">
                  <div className="mb-4">
                    <label className="text-neutral-400 text-xs mb-1.5 block">Voucher Code</label>
                    <Input
                      type="text"
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={e => {
                        setVoucherCode(e.target.value.toUpperCase());
                        if (voucherError) setVoucherError('');
                      }}
                      autoFocus
                      className="w-full py-3 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg text-center text-lg tracking-widest font-mono"
                    />
                    <p className="text-neutral-500 text-[10px] mt-1.5">Scan barcode/QR or enter code manually.</p>
                  </div>
                  {voucherError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-400 text-sm">{voucherError}</span>
                    </div>
                  )}
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => {
                        if (isMobile) setMobilePaymentSelectionActive(true);
                        setSelectedPaymentMethod('cash');
                        setVoucherStep('enter-code');
                        setVoucherCode('');
                        setVoucherError('');
                      }}
                      className="flex-1 py-3 rounded-lg text-sm font-medium bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (voucherCode.trim().length < 4) return;
                        setVoucherStep('validating');
                        setVoucherError('');
                        setTimeout(() => {
                          const code = voucherCode.trim();
                          if (code === 'EXPIRED') {
                            setVoucherError('This voucher has expired');
                            setVoucherStep('error');
                          } else if (code === 'USED') {
                            setVoucherError('This voucher has already been redeemed');
                            setVoucherStep('error');
                          } else if (code === 'INVALID') {
                            setVoucherError('Voucher code not recognised');
                            setVoucherStep('error');
                          } else {
                            const isPercentage = code.includes('PCT') || code.includes('%');
                            const mockValue = isPercentage ? 25 : 25;
                            const currentRemaining = remainingDue > 0 ? remainingDue : total;
                            let appliedAmount: number;
                            if (isPercentage) {
                              const discountAmount = subtotal * (mockValue / 100);
                              appliedAmount = Math.min(discountAmount, currentRemaining);
                            } else {
                              appliedAmount = Math.min(mockValue, currentRemaining);
                            }
                            setVoucherValidated({
                              code,
                              type: isPercentage ? 'percentage' : 'fixed',
                              value: mockValue,
                              expiryDate: '2026-06-30',
                            });
                            setVoucherAppliedAmount(appliedAmount);
                            setVoucherStep('summary');
                          }
                        }, 1000);
                      }}
                      disabled={voucherCode.trim().length < 4 || voucherStep === 'validating'}
                      className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                        voucherCode.trim().length >= 4 && voucherStep !== 'validating'
                          ? 'bg-white hover:bg-neutral-200 text-neutral-900'
                          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {voucherStep === 'validating' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        'Apply Voucher'
                      )}
                    </button>
                  </div>
                </div>
              )}
              {voucherStep === 'summary' && voucherValidated && (
                <div className="flex-1 flex flex-col p-6">
                  <div className="flex justify-center mb-4">
                    <img src={tickSuccessIcon} alt="Valid" className="w-14 h-14" />
                  </div>
                  <h3 className="text-white text-lg font-semibold text-center mb-4">Voucher Valid</h3>
                  <div className="bg-neutral-800 rounded-lg p-4 mb-6 space-y-3">
                    <div className="flex justify-between items-center py-1.5 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Voucher Code</span>
                      <span className="text-white text-sm font-mono font-medium">
                        {voucherValidated.code.length > 8
                          ? voucherValidated.code.slice(0, 4) + '••••' + voucherValidated.code.slice(-4)
                          : voucherValidated.code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-neutral-700">
                      <span className="text-neutral-400 text-sm">Voucher Value</span>
                      <span className="text-white text-sm font-medium">
                        {voucherValidated.type === 'percentage'
                          ? `${voucherValidated.value}%`
                          : `$${voucherValidated.value.toFixed(2)}`}
                      </span>
                    </div>
                    {voucherValidated.expiryDate && (
                      <div className="flex justify-between items-center py-1.5 border-b border-neutral-700">
                        <span className="text-neutral-400 text-sm">Expires</span>
                        <span className="text-white text-sm font-medium">
                          {new Date(voucherValidated.expiryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-neutral-400 text-sm">Applied Amount</span>
                      <span className="text-green-500 text-lg font-bold">${voucherAppliedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => {
                        setVoucherStep('enter-code');
                        setVoucherCode('');
                        setVoucherValidated(null);
                        setVoucherError('');
                      }}
                      className="flex-1 py-3 rounded-lg text-sm font-medium bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const label = voucherValidated.type === 'percentage'
                          ? `Voucher (${voucherValidated.value}%)`
                          : 'Voucher';
                        finalizePayment('voucher', voucherAppliedAmount, label);
                        setVoucherStep('enter-code');
                        setVoucherCode('');
                        setVoucherValidated(null);
                        setVoucherError('');
                      }}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold bg-white hover:bg-neutral-200 text-neutral-900 transition-colors"
                    >
                      APPLY ${voucherAppliedAmount.toFixed(2)}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : splitCheckPaymentStep === 'receipt' && activePayingCheck !== null ? (
            /* ============= SPLIT CHECK RECEIPT SCREEN - PER-TICKET RECEIPT ============= */
            <div className="flex flex-col h-full">
              {splitCheckReceiptStep === 'phone-input' ? (
                // Text Receipt Phone Input Screen for Split Check
                <div className="flex flex-col flex-1">
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSplitCheckReceiptStep('options')}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Text Receipt - {getTicketLabel(activePayingCheck)}</span>
                    </div>
                  </div>
                  
                  <div className="px-4 pt-4 pb-2 text-center">
                    <h2 className="text-white text-base font-semibold">Where should we text your receipt?</h2>
                  </div>
                  <div className="px-4 mb-2">
                    <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-1 px-2 py-2 border-r border-neutral-600">
                        <span className="text-white text-xs font-medium">US +1</span>
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                      </div>
                      <input type="text" placeholder="(000) 000-0000" value={splitCheckReceiptPhone} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                    </div>
                  </div>
                  <div className="px-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setSplitCheckReceiptNoMarketing(!splitCheckReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${splitCheckReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                        {splitCheckReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <span className="text-neutral-300 text-xs">Do not use my phone number for marketing</span>
                    </label>
                  </div>
                  <div className="px-4 mb-2 text-center">
                    <p className="text-neutral-500 text-[10px] leading-relaxed">Your phone number will be used only to send SMS receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                  </div>
                  <div className="px-4 mb-2">
                    <button 
                      onClick={handleSplitCheckReceiptComplete}
                      disabled={splitCheckReceiptPhone.replace(/\D/g, '').length < 10} 
                      className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      SEND
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-end px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                        <button key={key} onClick={() => { if (key === 'delete') { const digits = splitCheckReceiptPhone.replace(/\D/g, ''); const newDigits = digits.slice(0, -1); if (newDigits.length === 0) { setSplitCheckReceiptPhone(''); } else if (newDigits.length <= 3) { setSplitCheckReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setSplitCheckReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setSplitCheckReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } else if (key !== '') { const digits = splitCheckReceiptPhone.replace(/\D/g, ''); if (digits.length < 10) { const newDigits = digits + key; if (newDigits.length <= 3) { setSplitCheckReceiptPhone(`(${newDigits}`); } else if (newDigits.length <= 6) { setSplitCheckReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3)}`); } else { setSplitCheckReceiptPhone(`(${newDigits.slice(0, 3)}) ${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`); } } } }} className={`h-12 rounded-lg text-lg font-medium transition-colors ${key === '' ? 'invisible' : key === 'delete' ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>{key === 'delete' ? <Delete className="w-5 h-5 mx-auto" /> : key}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : splitCheckReceiptStep === 'email-input' ? (
                // Email Receipt Input Screen for Split Check
                <div className="flex flex-col flex-1">
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSplitCheckReceiptStep('options')}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Email Receipt - {getTicketLabel(activePayingCheck)}</span>
                    </div>
                  </div>
                  
                  <div className="px-4 pt-4 pb-2 text-center">
                    <h2 className="text-white text-base font-semibold">Where should we email your receipt?</h2>
                  </div>
                  <div className="px-4 mb-2">
                    <div className="flex items-center bg-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-1 px-3 py-2 border-r border-neutral-600"><Mail className="w-4 h-4 text-neutral-400" /></div>
                      <input type="email" placeholder="email@example.com" value={splitCheckReceiptEmail} readOnly className="flex-1 bg-transparent text-white px-2 py-2 text-sm placeholder:text-neutral-500 outline-none" />
                    </div>
                  </div>
                  <div className="px-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setSplitCheckReceiptNoMarketing(!splitCheckReceiptNoMarketing)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${splitCheckReceiptNoMarketing ? 'bg-white border-white' : 'border-neutral-500 bg-transparent'}`}>
                        {splitCheckReceiptNoMarketing && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                      <span className="text-neutral-300 text-xs">Do not use my email for marketing</span>
                    </label>
                  </div>
                  <div className="px-4 mb-2 text-center">
                    <p className="text-neutral-500 text-[10px] leading-relaxed">Your email will be used only to send receipts. <span className="text-purple-400">Terms</span> and <span className="text-purple-400">Privacy Policy</span> apply.</p>
                  </div>
                  <div className="px-4 mb-2">
                    <button 
                      onClick={handleSplitCheckReceiptComplete}
                      disabled={!splitCheckReceiptEmail.includes('@') || !splitCheckReceiptEmail.includes('.')} 
                      className="w-full py-2.5 bg-neutral-600 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      SEND
                    </button>
                  </div>
                  {/* Email Keyboard */}
                  <div className="bg-neutral-800 flex-1 rounded-t-xl overflow-hidden flex flex-col">
                    <div className="flex flex-1">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(key => <button key={key} onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    </div>
                    <div className="flex flex-1">
                      {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(key => <button key={key} onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    </div>
                    <div className="flex flex-1 px-2">
                      {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(key => <button key={key} onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                    </div>
                    <div className="flex flex-1">
                      <div className="w-10"></div>
                      {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(key => <button key={key} onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + key)} className="flex-1 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><span className="text-white text-lg font-medium">{key}</span></button>)}
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail.slice(0, -1))} className="w-10 flex items-center justify-center hover:bg-neutral-700 transition-colors active:bg-neutral-600"><Delete className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="flex flex-1 gap-1 px-1">
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '@')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">@</span></button>
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '.')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">.</span></button>
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '_')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">_</span></button>
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '-')} className="px-3 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-lg font-medium">-</span></button>
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.com</span></button>
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '.net')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-sm font-medium">.net</span></button>
                      <button onClick={() => setSplitCheckReceiptEmail(splitCheckReceiptEmail + '@gmail.com')} className="flex-1 flex items-center justify-center bg-neutral-700 rounded hover:bg-neutral-600 transition-colors active:bg-neutral-500"><span className="text-white text-xs font-medium">@gmail</span></button>
                    </div>
                  </div>
                </div>
              ) : (
                // Default Receipt Options Screen for Split Check
                <div className="flex-1 flex flex-col items-center py-8 px-6">
                  {/* Success Icon */}
                  <img src={tickSuccessIcon} alt="Success" className="w-14 h-14 mb-4" />
                  
                  <h2 className="text-white text-xl font-bold mb-2">{getTicketLabel(activePayingCheck)} Paid</h2>
                  <p className="text-neutral-300 text-sm mb-6">
                    <span className="text-green-500 font-medium">${splitCheckLastPaidAmount.toFixed(2)}</span> has been successfully processed
                  </p>

                  {/* Receipt Section */}
                  <div className="w-full max-w-xs">
                    <h3 className="text-white font-semibold text-center mb-4">Receipt</h3>
                    <div className="flex gap-4 justify-center mb-4">
                      <button 
                        onClick={handleSplitCheckReceiptComplete}
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <Printer className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Print</span>
                      </button>
                      <button 
                        onClick={() => setSplitCheckReceiptStep('phone-input')}
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <MessageSquare className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Text</span>
                      </button>
                      <button 
                        onClick={() => setSplitCheckReceiptStep('email-input')}
                        className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <Mail className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Email</span>
                      </button>
                    </div>
                    <button 
                      onClick={handleSplitCheckReceiptComplete}
                      className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      NO RECEIPT
                    </button>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-auto pt-8">
                    <p className="text-neutral-500 text-xs">Powered by eatOS</p>
                  </div>
                </div>
              )}
            </div>
          ) : selectedPaymentMethod === 'split-check' && activePayingCheck === null ? (
            /* ============= REDESIGNED SPLIT CHECK FLOW - CHECK CARDS LAYOUT ============= */
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-neutral-700`}>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (isMobile) {
                        setMobilePaymentSelectionActive(true);
                      }
                      setSelectedPaymentMethod('cash');
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-300" />
                  </button>
                  <span className={`text-white ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>Split Payment</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedPaymentMethod('cash');
                    setSplitMode('evenly');
                    setNumberOfChecks(2);
                    setCheckAssignments({});
                    setPaidChecks([]);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Tab Navigation + Check Counter */}
              <div className={`flex items-center justify-between ${isMobile ? 'px-2 py-2' : 'px-4 py-3'} border-b border-neutral-700`}>
                {/* Split Mode Tabs */}
                <div className={`flex gap-2 ${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}`}>
                  {[
                    ...(orderDetails.partySize ? [{ id: 'seat' as const, label: isMobile ? 'Seat' : 'Split by Seat' }] : []),
                    { id: 'evenly' as const, label: isMobile ? 'Evenly' : 'Split Evenly' },
                    { id: 'custom' as const, label: isMobile ? 'Custom' : 'Custom Split' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        const previousMode = splitMode;
                        setSplitMode(tab.id);
                        
                        if (tab.id === 'seat') {
                          // Save current count before switching to seat mode
                          if (previousMode !== 'seat') {
                            setSavedNonSeatChecks(numberOfChecks);
                          }
                          // Auto-set checks to party size
                          setNumberOfChecks(orderDetails.partySize || 4);
                        } else if (previousMode === 'seat') {
                          // Restore saved count when leaving seat mode
                          setNumberOfChecks(savedNonSeatChecks);
                        }
                      }}
                      className={`${isMobile ? 'px-2 py-1 text-[10px] whitespace-nowrap' : 'px-3 py-1.5 text-xs'} rounded-full font-medium transition-all ${
                        splitMode === tab.id
                          ? 'bg-green-500 text-white border-2 border-green-400'
                          : 'bg-neutral-800 text-neutral-300 border-2 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Check Counter - only show for evenly and custom modes */}
                {splitMode !== 'seat' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNumberOfChecks(prev => {
                          const newVal = Math.max(2, prev - 1);
                          setSavedNonSeatChecks(newVal);
                          return newVal;
                        });
                      }}
                      disabled={numberOfChecks <= 2}
                      className={`${isMobile ? 'w-6 h-6 text-sm' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    >
                      -
                    </button>
                    <span className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'} w-6 text-center`}>{numberOfChecks}</span>
                    <button
                      onClick={() => {
                        setNumberOfChecks(prev => {
                          const newVal = Math.min(10, prev + 1);
                          setSavedNonSeatChecks(newVal);
                          return newVal;
                        });
                      }}
                      disabled={numberOfChecks >= 10}
                      className={`${isMobile ? 'w-6 h-6 text-sm' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        onSaveSplit?.({
                          mode: splitMode,
                          numberOfChecks,
                          checkAssignments
                        });
                        onOpenChange(false);
                      }}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors ml-1`}
                    >
                      <Save className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                    <button
                      onClick={() => {
                        setNumberOfChecks(0);
                        setSavedNonSeatChecks(0);
                        setCheckAssignments({});
                        setPaidChecks([]);
                      }}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-red-500/40`}
                      title="Clear all checks"
                    >
                      <span className="text-red-500 font-bold text-xs">C</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Open discount dialog for split checks
                      }}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors`}
                      title="Apply discount"
                    >
                      <Percent className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                  </div>
                )}
                
                {/* Party Size Indicator + Save Button - show only in seat mode */}
                {splitMode === 'seat' && (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 text-neutral-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <Users className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>{orderDetails.partySize || numberOfChecks} Guests</span>
                    </div>
                    <button
                      onClick={() => {
                        onSaveSplit?.({
                          mode: splitMode,
                          numberOfChecks: orderDetails.partySize || numberOfChecks,
                          checkAssignments
                        });
                        onOpenChange(false);
                      }}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors ml-1`}
                    >
                      <Save className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                    <button
                      onClick={() => {
                        setNumberOfChecks(0);
                        setSavedNonSeatChecks(0);
                        setCheckAssignments({});
                        setPaidChecks([]);
                      }}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-red-500/40`}
                      title="Clear all checks"
                    >
                      <span className="text-red-500 font-bold text-xs">C</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Open discount dialog for split checks
                      }}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors`}
                      title="Apply discount"
                    >
                      <Percent className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Check Cards Grid - 3 per row (2 on mobile) with vertical scroll */}
              <div className="flex-1 overflow-hidden overflow-x-hidden p-2">
                <div 
                  className="overflow-y-auto overflow-x-hidden scrollbar-hide"
                  style={{ maxHeight: isMobile ? 'calc(100% - 10px)' : 'calc(2 * (180px + 8px))' }}
                >
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                    {Array.from({ length: numberOfChecks }, (_, i) => i + 1).map(checkNum => {
                      const checkItems = getItemsForCheck(checkNum);
                      const checkTotals = getCheckTotals(checkNum);
                      const isPaid = paidChecks.includes(checkNum);
                      
                      return (
                        <div 
                          key={checkNum}
                          onDragOver={(e) => {
                            if (splitMode === 'custom' && !isPaid) {
                              e.preventDefault();
                              setDragOverCheckNum(checkNum);
                            }
                          }}
                          onDragLeave={() => setDragOverCheckNum(null)}
                          onDrop={(e) => {
                            if (splitMode === 'custom' && !isPaid) {
                              e.preventDefault();
                              const itemId = parseInt(e.dataTransfer.getData('itemId'));
                              if (!isNaN(itemId)) {
                                setCheckAssignments(prev => ({ ...prev, [itemId]: checkNum }));
                              }
                              setDragOverCheckNum(null);
                              setDraggingItemId(null);
                            }
                          }}
                          className={`bg-neutral-800 border rounded-lg flex flex-col shadow-md relative overflow-hidden p-1.5 w-full min-w-0 transition-all ${
                            isPaid ? 'opacity-60' : ''
                          } ${
                            splitMode === 'custom' && dragOverCheckNum === checkNum
                              ? 'border-green-500 bg-green-500/10 scale-[1.02]'
                              : 'border-neutral-700'
                          }`}
                      >
                        {/* Drop indicator when dragging in custom mode */}
                        {splitMode === 'custom' && draggingItemId !== null && !isPaid && (
                          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity z-20 ${
                            dragOverCheckNum === checkNum ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <div className="bg-green-500/20 rounded-lg px-3 py-1.5">
                              <span className="text-green-400 text-xs font-medium">Drop here</span>
                            </div>
                          </div>
                        )}
                        {/* Paid Stamp */}
                        {isPaid && (
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/40 font-bold rotate-[-15deg] pointer-events-none z-10 text-base">
                            PAID
                          </span>
                        )}
                        
                        {/* Check Header */}
                        <div className="flex items-center justify-between border-b border-neutral-600 mb-1 pb-1">
                          <span className="text-white font-bold text-xs">
                            {splitMode === 'seat' ? `Seat ${checkNum}` : getCheckLabel(checkNum - 1)}
                          </span>
                          <span className="text-green-500 font-bold text-sm">
                            ${checkTotals.total.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Items List - Scrollable */}
                        <div className="flex-1 overflow-y-auto space-y-0.5 mb-1 max-h-16 scrollbar-hide">
                          {splitMode === 'evenly' ? (
                            // Evenly split shows summary
                            <div className="text-center py-0.5">
                              <span className="text-neutral-400 text-[11px] whitespace-nowrap">Split evenly</span>
                              <div className="text-neutral-200 text-xs">
                                ${checkTotals.total.toFixed(2)}
                              </div>
                            </div>
                          ) : splitMode === 'seat' ? (
                            // Seat-based split shows items with split indicators
                            checkItems.length > 0 ? (
                              checkItems.map(item => {
                                const isShared = item.isShared || (item.assignedSeats?.length === 0);
                                const seatsForItem = item.assignedSeats?.length || (orderDetails.partySize || numberOfChecks);
                                const itemPrice = isShared 
                                  ? item.price / (orderDetails.partySize || numberOfChecks)
                                  : item.price / seatsForItem;
                                
                                return (
                                  <div key={item.id} className="flex flex-col min-w-0">
                                    <div className="flex items-start justify-between min-w-0">
                                      <span className="text-neutral-200 font-medium truncate flex-1 text-[11px] min-w-0">
                                        {item.qty}x {item.name}
                                        {isShared && <span className="text-neutral-500 ml-1">(split)</span>}
                                      </span>
                                      <span className="text-neutral-300 font-medium ml-1 text-[11px] whitespace-nowrap">
                                        ${itemPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    {/* Seat indicator */}
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      <Users className="w-2.5 h-2.5 text-neutral-500" />
                                      {isShared ? (
                                        <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
                                          <Share2 className="w-2.5 h-2.5" />
                                        </span>
                                      ) : (
                                        item.assignedSeats?.map(seat => (
                                          <span 
                                            key={seat}
                                            className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center"
                                          >
                                            {seat}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-1">
                                <span className="text-neutral-500 text-[11px]">No items</span>
                              </div>
                            )
                          ) : checkItems.length > 0 ? (
                            checkItems.map(item => {
                              const isShared = item.isShared || (item.assignedSeats?.length === 0);
                              return (
                                <div key={item.id} className="flex flex-col min-w-0">
                                  <div className="flex items-start justify-between min-w-0">
                                    <span className="text-neutral-200 font-medium truncate flex-1 text-[11px] min-w-0">
                                      {item.qty}x {item.name}
                                    </span>
                                    <span className="text-neutral-300 font-medium ml-1 text-[11px] whitespace-nowrap">
                                      ${(item.price * item.qty).toFixed(2)}
                                    </span>
                                  </div>
                                  {/* Seat indicator */}
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    <Users className="w-2.5 h-2.5 text-neutral-500" />
                                    {isShared ? (
                                      <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
                                        <Share2 className="w-2.5 h-2.5" />
                                      </span>
                                    ) : (
                                      item.assignedSeats?.map(seat => (
                                        <span 
                                          key={seat}
                                          className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center"
                                        >
                                          {seat}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-neutral-500 text-[11px]">No items</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Subtotal & Tax */}
                        <div className="border-t border-neutral-600 space-y-0 pt-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Subtotal</span>
                            <span className="text-neutral-300">${checkTotals.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Tax</span>
                            <span className="text-neutral-300">${checkTotals.tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-0.5 border-t border-neutral-600">
                            <span className="text-white font-bold text-xs">Total</span>
                            <span className="text-green-500 font-bold text-xs">${checkTotals.total.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Pay Button */}
                        <button
                          onClick={() => handlePayCheck(checkNum)}
                          disabled={isPaid || (splitMode !== 'evenly' && checkItems.length === 0)}
                          className={`w-full rounded-md font-bold transition-colors mt-1.5 py-1 text-xs ${
                            isPaid
                              ? 'bg-green-900/50 text-green-500 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Pay'}
                        </button>
                      </div>
                    );
                    })}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <>
              {/* ============= STANDARD PAYMENT ENTRY VIEW ============= */}
              {/* Header Section */}
              <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-neutral-700`}>
                <div className="flex-1 flex items-center">
                  {/* Mobile: Back to payment selection */}
                  {isMobile && activePayingCheck === null && (
                    <button 
                      onClick={() => setMobilePaymentSelectionActive(true)}
                      className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors mr-2"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-300" />
                    </button>
                  )}
                  {/* Split check: Back to tickets */}
                  {activePayingCheck !== null && (
                    <button 
                      onClick={handleBackToSplitCheck}
                      className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors mr-2"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-300" />
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  {activePayingCheck !== null ? (
                    <>
                      <span className={`text-white ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>Pay {getTicketLabel(activePayingCheck)}</span>
                      <span className={`text-red-500 ${isMobile ? 'text-base' : 'text-lg'} font-bold ml-2`}>${paymentAmount}</span>
                    </>
                  ) : (
                    <>
                      <span className={`text-white ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>Total Due</span>
                      <span className={`text-red-500 ${isMobile ? 'text-base' : 'text-lg'} font-bold ml-2`}>${remainingDue > 0 ? remainingDue.toFixed(2) : total.toFixed(2)}</span>
                    </>
                  )}
                </div>
                <div className="flex-1 flex justify-end">
                  <button 
                    onClick={() => {
                      if (activePayingCheck !== null) {
                        handleBackToSplitCheck();
                      } else {
                        onOpenChange(false);
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Payment Methods - Row of icons - Hidden on mobile */}
              {!isMobile && (
              <div className={`${isMobile ? 'px-3 py-3' : 'px-6 py-4'} border-b border-neutral-700`}>
                <div className="relative">
                  <div className={`grid gap-2 ${
                    isMobile 
                      ? 'grid-cols-4' 
                      : activePayingCheck !== null ? 'grid-cols-6' : 'grid-cols-7'
                  }`}>
                    {visiblePaymentMethods.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <button 
                          key={method.id}
                          onClick={() => {
                            setSelectedPaymentMethod(method.id);
                            // Direct flow for each payment method (skip keypad except Cash)
                            if (method.id === 'loyalty') {
                              setLoyaltyStep('guest-list');
                              setLoyaltySelectedGuest(null);
                              setLoyaltyPointsToRedeem('');
                              setLoyaltyOtp(['', '', '', '']);
                            } else if (method.id === 'gift-card') {
                              setGiftCardStep('enter-card');
                              setGiftCardNumber('');
                            } else if (method.id === 'pay-link') {
                              setPayByLinkStep('select-guest');
                              setSelectedGuest(null);
                              setGuestSearchQuery('');
                            } else if (method.id === 'card') {
                              setManualCCStep('tap-card');
                            } else if (method.id === 'qr-code') {
                              setQrCodeStep('qr-display');
                              setQrPhoneNumber('');
                              setShowQrPhoneInput(false);
                            } else if (method.id === 'third-party-delivery') {
                              setThirdPartyDeliveryStep('select-partner');
                              setSelectedDeliveryPartner(null);
                              setDeliveryReference('');
                            }
                            // Cash stays on amount keypad (no action needed)
                          }}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedPaymentMethod === method.id 
                              ? 'bg-white border-white' 
                              : 'bg-neutral-700 border-neutral-600 hover:border-neutral-500'
                          }`}>
                            <IconComponent className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${
                              selectedPaymentMethod === method.id ? 'text-neutral-900' : 'text-neutral-300'
                            }`} />
                          </div>
                          <span className={`text-[10px] ${selectedPaymentMethod === method.id ? 'text-white' : 'text-neutral-400'}`}>
                            {method.name}
                          </span>
                        </button>
                      );
                    })}

                    {/* Split Check button - hidden when paying a split check ticket */}
                    {activePayingCheck === null && !isMobile && getCheckoutOptionsSettings()?.splitCheck !== false && (
                      <button 
                        onClick={() => setSelectedPaymentMethod('split-check')}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedPaymentMethod === 'split-check' 
                            ? 'bg-white border-white' 
                            : 'bg-neutral-700 border-neutral-600 hover:border-neutral-500'
                        }`}>
                          <img 
                            src={splitCheckIcon} 
                            alt="Split Check" 
                            className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${selectedPaymentMethod === 'split-check' ? 'invert' : ''}`}
                          />
                        </div>
                        <span className={`text-[10px] ${selectedPaymentMethod === 'split-check' ? 'text-white' : 'text-neutral-400'}`}>
                          Split Check
                        </span>
                      </button>
                    )}

                    {/* Other dropdown button */}
                    <button 
                      onClick={() => setShowOtherPayments(!showOtherPayments)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full border-2 flex items-center justify-center transition-all ${
                        showOtherPayments 
                          ? 'bg-white border-white' 
                          : 'bg-neutral-700 border-neutral-600 hover:border-neutral-500'
                      }`}>
                        <ChevronDown className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${showOtherPayments ? 'text-neutral-900' : 'text-neutral-300'}`} />
                      </div>
                      <span className={`text-[10px] ${showOtherPayments ? 'text-white' : 'text-neutral-400'}`}>Other</span>
                    </button>
                  </div>

                  {/* Dropdown for Other Payment Methods */}
                  {showOtherPayments && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowOtherPayments(false)} />
                      <div className="absolute left-0 right-0 top-full mt-3 z-20 bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white font-medium">Other Payment Methods</span>
                          <button onClick={() => setShowOtherPayments(false)} className="w-6 h-6 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors">
                            <X className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>
                        
                        <div className={`grid ${isMobile ? 'grid-cols-4' : 'grid-cols-6'} gap-3 mb-3`}>
                          {dropdownPaymentMethods.slice(0, isMobile ? 8 : 6).map(otherMethod => {
                            const OtherIcon = otherMethod.icon;
                            return (
                              <button 
                                key={otherMethod.id}
                                onClick={() => handleSelectFromDropdown(otherMethod)}
                                className="flex flex-col items-center gap-1"
                              >
                                <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-neutral-700 border border-neutral-600 hover:border-neutral-500 flex items-center justify-center transition-colors`}>
                                  <OtherIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neutral-300`} />
                                </div>
                                <span className="text-[10px] text-neutral-400 text-center leading-tight">{otherMethod.name}</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {dropdownPaymentMethods.length > (isMobile ? 8 : 6) && (
                          <div className="flex justify-center gap-3 flex-wrap">
                            {dropdownPaymentMethods.slice(isMobile ? 8 : 6).map(otherMethod => {
                              const OtherIcon = otherMethod.icon;
                              return (
                                <button 
                                  key={otherMethod.id}
                                  onClick={() => handleSelectFromDropdown(otherMethod)}
                                  className="flex flex-col items-center gap-1"
                                >
                                  <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-neutral-700 border border-neutral-600 hover:border-neutral-500 flex items-center justify-center transition-colors`}>
                                    <OtherIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neutral-300`} />
                                  </div>
                                  <span className="text-[10px] text-neutral-400 text-center leading-tight">{otherMethod.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              )}

              {/* Amount Display */}
              <div className={`${isMobile ? 'px-3 py-3' : 'px-6 py-4'} border-b border-neutral-700`}>
                <div className={`flex items-center justify-center gap-2 bg-neutral-800 rounded-lg px-4 ${isMobile ? 'py-3' : 'py-4'}`}>
                  <span className={`flex-1 text-green-500 ${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-center`}>${paymentAmount}</span>
                  {selectedPaymentMethod !== 'card' && selectedPaymentMethod !== 'gift-card' && selectedPaymentMethod !== 'pay-link' && selectedPaymentMethod !== 'qr-code' && selectedPaymentMethod !== 'manual-cc' && selectedPaymentMethod !== 'external-cc' && selectedPaymentMethod !== 'manual-card' && selectedPaymentMethod !== 'doordash' && selectedPaymentMethod !== 'blizzful' && selectedPaymentMethod !== 'ubereats' && selectedPaymentMethod !== 'grubhub' && (
                    <button 
                      onClick={() => setShowKeypad(!showKeypad)}
                      className={`${isMobile ? 'w-9 h-9' : 'w-10 h-10'} rounded-lg border flex items-center justify-center transition-colors ${showKeypad ? 'bg-white border-white' : 'bg-neutral-700 border-neutral-600 hover:bg-neutral-600'}`}
                    >
                      <Grid3X3 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${showKeypad ? 'text-neutral-900' : 'text-neutral-300'}`} />
                    </button>
                  )}
                </div>
              </div>
              {/* Quick Amounts OR Keypad */}
              <div className={`${isMobile ? 'p-2' : 'p-3'} space-y-1.5 flex-1`}>
                    {showKeypad || selectedPaymentMethod === 'card' || selectedPaymentMethod === 'gift-card' || selectedPaymentMethod === 'pay-link' || selectedPaymentMethod === 'qr-code' || selectedPaymentMethod === 'manual-cc' || selectedPaymentMethod === 'external-cc' || selectedPaymentMethod === 'manual-card' || selectedPaymentMethod === 'doordash' || selectedPaymentMethod === 'blizzful' || selectedPaymentMethod === 'ubereats' || selectedPaymentMethod === 'grubhub' ? (
                      // Numeric Keypad
                      <div className="flex flex-col gap-1.5">
                        {[['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']].map((row, rowIndex) => (
                          <div key={rowIndex} className="flex gap-1.5">
                            {row.map(key => (
                              <button 
                                key={key}
                                onClick={() => handleKeypadPress(key)}
                                className={`flex-1 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} rounded-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors`}
                              >
                                {key}
                              </button>
                            ))}
                          </div>
                        ))}
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleKeypadPress('.')}
                            className={`flex-1 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} rounded-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors`}
                          >
                            .
                          </button>
                          <button 
                            onClick={() => handleKeypadPress('0')}
                            className={`flex-1 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} rounded-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors`}
                          >
                            0
                          </button>
                          <button 
                            onClick={() => handleKeypadPress('backspace')}
                            className={`flex-1 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} rounded-lg font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors flex items-center justify-center`}
                          >
                            <Delete className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Quick Amount Buttons with quantity tracking - 3 column layout for mobile
                      <>
                        {/* Row 1: Total amount + first 2 quick amounts (mobile) or 3 quick amounts (desktop) */}
                        <div className={`flex ${isMobile ? 'gap-2 px-1' : 'gap-4 px-2'}`}>
                          <div className={`flex-1 relative ${isMobile ? 'py-1' : 'py-1'}`}>
                            <button 
                              onClick={() => {
                                setAmountQuantities({});
                                setPaymentAmount(total.toFixed(2));
                              }} 
                              className={`w-full ${isMobile ? 'py-4 text-base' : 'py-3 text-sm'} rounded-lg font-medium transition-colors ${
                                paymentAmount === total.toFixed(2) && Object.keys(amountQuantities).length === 0 
                                  ? 'bg-neutral-900 text-white border border-neutral-600' 
                                  : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                              }`}
                            >
                              ${total.toFixed(2)}
                            </button>
                          </div>
                          {quickAmounts.slice(0, isMobile ? 2 : 3).map(amount => {
                            const qty = amountQuantities[amount] || 0;
                            return (
                              <div key={amount} className={`flex-1 relative ${isMobile ? 'py-1' : 'py-1'}`}>
                                <button 
                                  onClick={() => handleAddAmount(amount)} 
                                  className={`w-full ${isMobile ? 'py-4 text-base' : 'py-3 text-sm'} rounded-lg font-medium transition-colors ${
                                    qty > 0 
                                      ? 'bg-neutral-900 text-white border border-neutral-600' 
                                      : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                                  }`}
                                >
                                  ${amount}
                                </button>
                                {qty > 0 && (
                                  <>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAmount(amount);
                                      }} 
                                      className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center leading-none text-xs hover:bg-red-600 transition-colors z-10"
                                    >
                                      ×
                                    </button>
                                    <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                      x{qty}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Row 2: Next 3 quick amounts for mobile, remaining 4 for desktop */}
                        <div className={`flex ${isMobile ? 'gap-2 px-1' : 'gap-4 px-2'}`}>
                          {quickAmounts.slice(isMobile ? 2 : 3, isMobile ? 5 : 7).map(amount => {
                            const qty = amountQuantities[amount] || 0;
                            return (
                              <div key={amount} className={`flex-1 relative ${isMobile ? 'py-1' : 'py-1'}`}>
                                <button 
                                  onClick={() => handleAddAmount(amount)} 
                                  className={`w-full ${isMobile ? 'py-4 text-base' : 'py-3 text-sm'} rounded-lg font-medium transition-colors ${
                                    qty > 0 
                                      ? 'bg-neutral-900 text-white border border-neutral-600' 
                                      : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                                  }`}
                                >
                                  ${amount}
                                </button>
                                {qty > 0 && (
                                  <>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAmount(amount);
                                      }} 
                                      className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                                    >
                                      ×
                                    </button>
                                    <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                      x{qty}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Row 3: Remaining quick amounts for mobile ($50, $100) */}
                        {isMobile && (
                          <div className="grid grid-cols-3 gap-2 px-1">
                            {quickAmounts.slice(5).map(amount => {
                              const qty = amountQuantities[amount] || 0;
                              return (
                                <div key={amount} className="flex-1 relative py-1">
                                  <button 
                                    onClick={() => handleAddAmount(amount)} 
                                    className={`w-full py-4 text-base rounded-lg font-medium transition-colors ${
                                      qty > 0 
                                        ? 'bg-neutral-900 text-white border border-neutral-600' 
                                        : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                                    }`}
                                  >
                                    ${amount}
                                  </button>
                                  {qty > 0 && (
                                    <>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveAmount(amount);
                                        }} 
                                        className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                                      >
                                        ×
                                      </button>
                                      <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                        x{qty}
                                      </span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Charge Button */}
                  <div className={`${isMobile ? 'p-2' : 'p-3'} pt-0`}>
                    <button 
                      onClick={handleChargePayment}
                      className={`w-full ${isMobile ? 'py-4' : 'py-3'} bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm`}
                    >
                      {activePayingCheck !== null 
                        ? `PAY ${getTicketLabel(activePayingCheck)} - $${paymentAmount}`
                        : `CHARGE $${paymentAmount}`
                      }
                    </button>
                  </div>
            </>
          )}
        </div>

        {/* Order Details Panel - Hidden on mobile */}
        {!isMobile && (
          <div 
            className={`${selectedPaymentMethod === 'split-check' ? 'w-[320px]' : 'w-[280px]'} border-l border-neutral-700 flex flex-col rounded-xl`}
            style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
          {/* Guest Info Header - Matching Order Panel Style */}
          <div 
            className="p-3 border-b border-neutral-600 rounded-t-xl" 
            style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
          >
            {/* Row 1: Name, Phone, Time */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{orderDetails.guest || "Guest"}</h3>
              {orderDetails.phone && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{orderDetails.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-neutral-300 text-xs">
                  {orderDetails.orderTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
            
            {/* Row 2: Table/Order Type, Order Number/Party Size, Server */}
            <div className="flex items-center justify-between mt-3">
              {/* For table orders: show TABLE badge */}
              {orderDetails.table && (
                <span 
                  className="text-white text-[10px] font-medium px-2 py-1 rounded" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  TABLE {orderDetails.table}
                </span>
              )}
              
              {/* For direct orders (no table): show ORDER TYPE badge */}
              {!orderDetails.table && orderDetails.orderType && (
                <span 
                  className="text-white text-[10px] font-medium px-2 py-1 rounded" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  {orderDetails.orderType}
                </span>
              )}
              
              {/* For table orders: show party size */}
              {orderDetails.partySize && (
                <div className="flex items-center gap-2 text-neutral-300">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">{orderDetails.partySize}</span>
                </div>
              )}
              
              {/* For direct orders: show order number */}
              {!orderDetails.partySize && orderDetails.orderNumber && (
                <span 
                  className="text-white text-[10px] font-medium px-2 py-1 rounded" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  ORDER #{orderDetails.orderNumber}
                </span>
              )}
              
              {/* Server name - use actual name if provided */}
              <div className="flex items-center gap-1.5 text-neutral-300">
                <User className="w-3 h-3" />
                <span className="text-xs">{orderDetails.serverName || "SERVER"}</span>
              </div>
            </div>
          </div>

          {/* Check Info with PAID/PARTIAL stamp when processed */}
          <div className="mx-3 mt-3 bg-neutral-800 rounded-lg p-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">Check {orderDetails.check || "1"}</span>
              <span className="text-white font-bold">${total.toFixed(2)}</span>
            </div>
            {isFullyPaid && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                PAID
              </span>
            )}
            {paymentHistory.length > 0 && !isFullyPaid && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                PARTIAL
              </span>
            )}
          </div>

          {/* Order Items */}
          <div 
            className="flex-1 overflow-y-auto p-3 space-y-2" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Drag instruction for custom split */}
            {selectedPaymentMethod === 'split-check' && splitMode === 'custom' && splitCheckPaymentStep === 'tickets' && (
              <div className="mb-2 p-2 bg-neutral-700/50 rounded-lg border border-dashed border-neutral-600">
                <p className="text-neutral-400 text-[10px] text-center flex items-center justify-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Drag items to assign to checks
                </p>
              </div>
            )}
            
            {orderDetails.items.map(item => {
              const itemSeats = item.assignedSeats || [];
              const isItemShared = item.isShared || itemSeats.length === 0;
              const isInCustomSplitMode = selectedPaymentMethod === 'split-check' && splitMode === 'custom' && splitCheckPaymentStep === 'tickets';
              const isAssigned = checkAssignments[item.id] !== undefined;
              const assignedCheckNum = checkAssignments[item.id];
              
              return (
                <div 
                  key={item.id} 
                  draggable={isInCustomSplitMode}
                  onDragStart={(e) => {
                    if (isInCustomSplitMode) {
                      e.dataTransfer.setData('itemId', item.id.toString());
                      setDraggingItemId(item.id);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggingItemId(null);
                    setDragOverCheckNum(null);
                  }}
                  className={`p-2 border rounded-lg transition-all ${
                    isInCustomSplitMode
                      ? 'cursor-grab active:cursor-grabbing hover:border-green-500/50'
                      : ''
                  } ${
                    draggingItemId === item.id ? 'opacity-50 border-green-500' : 'border-sidebar-border'
                  } ${
                    isAssigned && isInCustomSplitMode ? 'border-green-500/30 bg-green-500/5' : ''
                  }`}
                  style={{ background: draggingItemId === item.id ? undefined : 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                >
                  <div className="flex items-center gap-2">
                    {/* Drag handle for custom split mode */}
                    {isInCustomSplitMode && (
                      <GripVertical className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                    )}
                    <span className="w-5 h-5 rounded bg-neutral-700 border border-neutral-600 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                      {item.qty}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium truncate">{item.name}</span>
                        <span className="text-white text-xs font-medium ml-2">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      {/* Seat indicators - only for table orders */}
                      {orderDetails.partySize && (
                        <div className="flex items-center gap-0.5 mt-1">
                          <Users className="w-2.5 h-2.5 text-neutral-500" />
                          {isItemShared ? (
                            <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
                              <Share2 className="w-2.5 h-2.5" />
                            </span>
                          ) : (
                            itemSeats.map(seat => (
                              <span key={seat} className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center">
                                {seat}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                      
                      {/* Show assigned check badge in custom split mode */}
                      {isAssigned && isInCustomSplitMode && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-green-400 text-[10px]">
                            → {getCheckLabel(assignedCheckNum - 1)}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setCheckAssignments(prev => {
                                const newAssignments = { ...prev };
                                delete newAssignments[item.id];
                                return newAssignments;
                              });
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="px-3 pb-2">
              <span className="text-white/60 text-xs mb-2 block">Payments</span>
              {paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-green-400 text-sm">{payment.methodLabel}</span>
                  <span className="text-green-400 text-sm">${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="p-3 border-t border-neutral-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Subtotal</span>
              <span className="text-white text-sm">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Tax</span>
              <span className="text-white text-sm">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
              <span className="text-white font-medium">Total Due</span>
              <span className="text-red-500 font-bold">${remainingDue > 0 ? remainingDue.toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default PaymentDialog;
