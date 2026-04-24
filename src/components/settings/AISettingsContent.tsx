import { useState, useRef, useEffect, useCallback } from "react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useNavigate } from "react-router-dom";
import { Send, Check, X, RotateCcw, Clock, Tag, Percent, CreditCard, Eye, ExternalLink, Mic, MicOff, ImagePlus, Settings, ChevronDown, Sparkles, Bot, Zap, Printer, ShoppingCart, UtensilsCrossed, Users, FileText, Trash2, StickyNote, ArrowLeft, Plus, Minus, Palette, Image, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsManager } from "@/lib/settingsManager";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseMenus } from "@/hooks/useSupabaseMenus";
import { createProduct, updateProduct } from "@/services/productService";
import { deleteCustomProduct, getCustomProducts, saveCustomProduct, setArchivedId } from "@/lib/productStore";
import { useAppearance } from "@/contexts/AppearanceContext";

// AI Provider definitions for in-chat model switching
interface AIProviderModel {
  id: string;
  name: string;
  description: string;
}

interface AIProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  models: AIProviderModel[];
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "platform",
    name: "POS AI",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-violet-400",
    models: [
      { id: "gemini-3-flash", name: "Fast", description: "Quick responses" },
      { id: "gemini-2.5-pro", name: "Pro", description: "Complex reasoning" },
    ],
  },
  {
    id: "openai",
    name: "ChatGPT",
    icon: <Bot className="w-4 h-4" />,
    color: "text-emerald-400",
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & efficient" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5", description: "Legacy model" },
    ],
  },
  {
    id: "anthropic",
    name: "Claude",
    icon: <Zap className="w-4 h-4" />,
    color: "text-amber-400",
    models: [
      { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Balanced" },
      { id: "claude-3-opus", name: "Claude 3 Opus", description: "Most powerful" },
      { id: "claude-3-haiku", name: "Claude 3 Haiku", description: "Fastest" },
    ],
  },
  {
    id: "google",
    name: "Gemini",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-blue-400",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Top tier" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fast" },
    ],
  },
  {
    id: "maya",
    name: "Maya AI",
    icon: <Bot className="w-4 h-4" />,
    color: "text-pink-400",
    models: [
      { id: "maya-1", name: "Maya 1", description: "Standard" },
      { id: "maya-1-mini", name: "Maya 1 Mini", description: "Lightweight" },
      { id: "maya-1-turbo", name: "Maya 1 Turbo", description: "High speed" },
    ],
  },
];
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  pendingChange?: PendingChange;
  appliedChange?: AppliedChange;
  navigateTo?: string;
  isStreaming?: boolean;
  quickReplies?: string[];
  multiSelect?: boolean;
  imageUrl?: string;
  reportData?: ReportData;
  inlineAction?: "theme-color-picker" | "brand-logo-upload" | "derived-color-picker";
  derivedColorTarget?: string;
}

interface ReportData {
  orderSummary: {
    numberOfOrders: number;
    numberOfRefunds: number;
    refundAmount: number;
    netSales: number;
    discounts: number;
    tips: number;
    tax: number;
    total: number;
  };
  paymentTypes: { type: string; transactions: number; amount: number }[];
  categories: { name: string; products: number; sales: number }[];
  dateRange: string;
}


interface PendingChange {
  id: string;
  setting: string;
  path: string;
  currentValue: string;
  newValue: string;
  status: "pending" | "applied" | "dismissed";
  settingType?: string;
  operation?: string;
  data?: any;
}

interface AppliedChange {
  setting: string;
  path: string;
  value: string;
  settingType?: string;
  data?: any;
}

interface AISettingsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  context?: string;
}

interface SuggestionChip {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

interface AIAction {
  type: "view" | "update_setting" | "navigate" | "info" | "ai_rules_updated" | "generate_report";
  category?: string;
  path?: string;
  setting?: string;
  currentValue?: string;
  newValue?: string;
  settingType?: string;
  operation?: string;
  data?: any;
  autoApply?: boolean;
  ruleType?: string;
  value?: any;
  success?: boolean;
  error?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

const defaultSuggestionChips: SuggestionChip[] = [
  { label: "Show my discounts", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show me all active discounts" },
  { label: "View taxes", icon: <Percent className="w-3.5 h-3.5" />, prompt: "What taxes do I have configured?" },
  { label: "View menus", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show me my menus" },
  { label: "Service charges", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show my service charges" },
];

const menuSuggestionChips: SuggestionChip[] = [
  { label: "View menus", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all my menus" },
  { label: "Add new menu", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "I want to add a new menu" },
  { label: "View categories", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show me all menu categories" },
  { label: "View products", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all products" },
  { label: "View modifiers", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show me all modifiers" },
];

const systemSuggestionChips: SuggestionChip[] = [
  { label: "Appearance", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me appearance settings" },
  { label: "Control center", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show me control center settings" },
  { label: "Change theme", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Change the app theme" },
  { label: "Font settings", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show me font settings" },
];

const paymentsSuggestionChips: SuggestionChip[] = [
  { label: "Payment methods", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show me payment methods" },
  { label: "View taxes", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show me all configured taxes" },
  { label: "View discounts", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show me all active discounts" },
  { label: "Service charges", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show my service charges" },
  { label: "Gratuity settings", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show me gratuity settings" },
  { label: "Checkout options", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show checkout options" },
];

const endOfDaySuggestionChips: SuggestionChip[] = [
  { label: "Start End of Day", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Start End of Day now" },
  { label: "Run End of Day", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Run End of Day automation now" },
  { label: "Print EOD report", icon: <Printer className="w-3.5 h-3.5" />, prompt: "Print the End of Day report" },
  { label: "Clock out employees", icon: <Users className="w-3.5 h-3.5" />, prompt: "Clock out all employees" },
  { label: "Close cash drawer", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Close the cash drawer" },
  { label: "Close paid orders", icon: <Check className="w-3.5 h-3.5" />, prompt: "Close all paid orders" },
  { label: "Cancel unpaid tickets", icon: <X className="w-3.5 h-3.5" />, prompt: "Cancel all unpaid tickets" },
  { label: "EOD reminder", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Set up End of Day reminder" },
  { label: "Send daily reports", icon: <FileText className="w-3.5 h-3.5" />, prompt: "Configure daily report recipients" },
  { label: "Include employee data", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Toggle Include Employee Data on the EOD report" },
];

const guestBookSuggestionChips: SuggestionChip[] = [
  { label: "View guests", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all guests" },
  { label: "Add guest", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Add a new guest" },
  { label: "Guest preferences", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show guest preferences settings" },
  { label: "Guest history", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show guest visit history" },
];

const supportSuggestionChips: SuggestionChip[] = [
  { label: "Contact support", icon: <ExternalLink className="w-3.5 h-3.5" />, prompt: "How do I contact support?" },
  { label: "Send feedback", icon: <Tag className="w-3.5 h-3.5" />, prompt: "I want to send feedback" },
  { label: "About app", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show app version and info" },
  { label: "Help articles", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show me help articles" },
];

const networkSuggestionChips: SuggestionChip[] = [
  { label: "Server status", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show server connection status" },
  { label: "Network config", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show network configuration" },
  { label: "Connection test", icon: <ExternalLink className="w-3.5 h-3.5" />, prompt: "Test my network connection" },
  { label: "Server settings", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show server connection settings" },
];

const hardwareSuggestionChips: SuggestionChip[] = [
  { label: "View devices", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me connected hardware devices" },
  { label: "Printer setup", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show printer settings" },
  { label: "Card reader", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show card reader settings" },
  { label: "Cash register", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show cash register settings" },
];

const notificationsSuggestionChips: SuggestionChip[] = [
  { label: "Alert settings", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me notification settings" },
  { label: "Push notifications", icon: <ExternalLink className="w-3.5 h-3.5" />, prompt: "Configure push notifications" },
  { label: "Sound settings", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show notification sound settings" },
  { label: "Order alerts", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Configure order notification alerts" },
];

const reportsSuggestionChips: SuggestionChip[] = [
  { label: "Today's sales", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me today's sales report" },
  { label: "Yesterday's report", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Generate yesterday's sales report" },
  { label: "This week", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show me this week's sales report" },
  { label: "This month", icon: <ExternalLink className="w-3.5 h-3.5" />, prompt: "Generate this month's sales report" },
];

const workforceSuggestionChips: SuggestionChip[] = [
  { label: "View employees", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all employees" },
  { label: "Manage shifts", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show me shift schedules" },
  { label: "Roles and permissions", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Show me employee roles and permissions" },
  { label: "Time tracking", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show time tracking settings" },
];

const accountSuggestionChips: SuggestionChip[] = [
  { label: "Restaurant info", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me restaurant information" },
  { label: "Security settings", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Show me security settings" },
  { label: "Business hours", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show me business hours configuration" },
  { label: "Profile settings", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show my profile settings" },
];

// Sub-route suggestion chips for System sub-pages
const systemAppearanceChips: SuggestionChip[] = [
  { label: "Change theme color", icon: <Palette className="w-3.5 h-3.5" />, prompt: "Change theme color" },
  { label: "Update brand logo", icon: <Image className="w-3.5 h-3.5" />, prompt: "Update brand logo" },
  { label: "Adjust text size", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Adjust text size settings" },
  { label: "Toggle bold text", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Toggle bold text on or off" },
  { label: "Change splash color", icon: <Sparkles className="w-3.5 h-3.5" />, prompt: "Change splash screen color" },
  { label: "Reset theme", icon: <RotateCcw className="w-3.5 h-3.5" />, prompt: "Reset all theme colors to defaults" },
];

const systemControlCenterChips: SuggestionChip[] = [
  { label: "Toggle KDS", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Toggle KDS display settings" },
  { label: "Set auto-lock", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Configure auto-lock timer" },
  { label: "Force clock-in", icon: <Check className="w-3.5 h-3.5" />, prompt: "Enable or disable force clock-in" },
  { label: "Debug mode", icon: <Zap className="w-3.5 h-3.5" />, prompt: "Toggle debug mode" },
];

// Sub-route suggestion chips for Payments sub-pages
const paymentsTaxesChips: SuggestionChip[] = [
  { label: "Add new tax", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new tax rate" },
  { label: "View active taxes", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all active taxes" },
  { label: "Change tax type", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Change a tax type setting" },
  { label: "Tax exemptions", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Configure tax exemptions" },
];

const paymentsGratuityChips: SuggestionChip[] = [
  { label: "Set tip presets", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Configure tip preset amounts" },
  { label: "Auto-gratuity rules", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Set auto-gratuity rules for large parties" },
  { label: "Enable/disable tips", icon: <Check className="w-3.5 h-3.5" />, prompt: "Enable or disable tips" },
  { label: "Tip on receipt", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show or hide tips on receipt" },
];

const paymentsDiscountsChips: SuggestionChip[] = [
  { label: "Add discount", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new discount" },
  { label: "View active discounts", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all active discounts" },
  { label: "Set PIN requirement", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Require manager PIN for discounts" },
  { label: "Discount schedule", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Configure discount schedules" },
];

const paymentsServiceChargeChips: SuggestionChip[] = [
  { label: "Add service charge", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new service charge" },
  { label: "View charges", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all service charges" },
  { label: "Auto-apply rules", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Configure auto-apply rules for service charges" },
];

const paymentsCheckoutChips: SuggestionChip[] = [
  { label: "Toggle quick amounts", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Toggle quick amount buttons at checkout" },
  { label: "Split check", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Enable or disable split check" },
  { label: "Signature settings", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Configure signature requirements" },
  { label: "Receipt options", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Configure receipt options" },
];

const paymentsMethodsChips: SuggestionChip[] = [
  { label: "Enable/disable methods", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Enable or disable payment methods" },
  { label: "View active methods", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all active payment methods" },
  { label: "Reorder methods", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Change the order of payment methods" },
];

const paymentsCashMgmtChips: SuggestionChip[] = [
  { label: "Cash drawer setup", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Configure cash drawer settings" },
  { label: "Pay in/out", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Manage pay-ins and pay-outs" },
  { label: "Reconciliation", icon: <Eye className="w-3.5 h-3.5" />, prompt: "View cash reconciliation settings" },
];

// Menu sub-route chips
const menuProductsChips: SuggestionChip[] = [
  { label: "Add product", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new product" },
  { label: "View all products", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all products" },
  { label: "Archive a product", icon: <Trash2 className="w-3.5 h-3.5" />, prompt: "Archive a product" },
  { label: "Search products", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Search for a product" },
];

const menuCategoriesChips: SuggestionChip[] = [
  { label: "Add category", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new category" },
  { label: "View categories", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all categories" },
  { label: "Reorder categories", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Reorder categories" },
  { label: "Assign products", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Assign products to a category" },
];

const menuModifiersChips: SuggestionChip[] = [
  { label: "Add modifier", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new modifier" },
  { label: "View modifiers", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all modifiers" },
  { label: "Edit modifier groups", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Edit modifier groups" },
  { label: "Set required modifiers", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Set required modifiers" },
];

const menuAddOnsChips: SuggestionChip[] = [
  { label: "Add add-on", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new add-on" },
  { label: "View add-ons", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all add-ons" },
  { label: "Set pricing", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Set add-on pricing" },
  { label: "Assign to products", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Assign add-ons to products" },
];

const menuDefaultModifiersChips: SuggestionChip[] = [
  { label: "View defaults", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show default modifiers" },
  { label: "Set default modifiers", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Set default modifiers" },
  { label: "Reset defaults", icon: <RotateCcw className="w-3.5 h-3.5" />, prompt: "Reset default modifiers" },
];

const menuGroupsChips: SuggestionChip[] = [
  { label: "Add group", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new group" },
  { label: "View groups", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all groups" },
  { label: "Assign products to group", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Assign products to a group" },
];

const menuMenusChips: SuggestionChip[] = [
  { label: "Add menu", icon: <Plus className="w-3.5 h-3.5" />, prompt: "Add a new menu" },
  { label: "View menus", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show all menus" },
  { label: "Enable/disable menu", icon: <Settings className="w-3.5 h-3.5" />, prompt: "Enable or disable a menu" },
  { label: "Assign categories", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Assign categories to a menu" },
];

const contextChipsMap: Record<string, SuggestionChip[]> = {
  menu: menuSuggestionChips,
  system: systemSuggestionChips,
  payments: paymentsSuggestionChips,
  'end-of-day': endOfDaySuggestionChips,
  'guest-book': guestBookSuggestionChips,
  support: supportSuggestionChips,
  network: networkSuggestionChips,
  hardware: hardwareSuggestionChips,
  notifications: notificationsSuggestionChips,
  reports: reportsSuggestionChips,
  workforce: workforceSuggestionChips,
  account: accountSuggestionChips,
  // System sub-routes
  'system-appearance': systemAppearanceChips,
  'system-control-center': systemControlCenterChips,
  // Payments sub-routes
  'payments-taxes': paymentsTaxesChips,
  'payments-gratuity': paymentsGratuityChips,
  'payments-discounts': paymentsDiscountsChips,
  'payments-service-charge': paymentsServiceChargeChips,
  'payments-checkout-options': paymentsCheckoutChips,
  'payments-payment-methods': paymentsMethodsChips,
  'payments-cash-management': paymentsCashMgmtChips,
  // Menu sub-routes
  'menu-products': menuProductsChips,
  'menu-categories': menuCategoriesChips,
  'menu-modifiers': menuModifiersChips,
  'menu-add-ons': menuAddOnsChips,
  'menu-default-modifiers': menuDefaultModifiersChips,
  'menu-groups': menuGroupsChips,
  'menu-menus': menuMenusChips,
};

const AISettingsContent = ({ showHeader = true, onBack, context }: AISettingsContentProps) => {
  const suggestionChips = (context && contextChipsMap[context]) || defaultSuggestionChips;
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { profile, getInitials } = useAuth();
  const {
    themeColor, setThemeColor, applyThemeColor,
    selectionColor, setSelectionColor,
    hoverColor, setHoverColor,
    splashBgColor, setSplashBgColor,
    topBarColor, setTopBarColor,
    settingsIconColor, setSettingsIconColor,
    partnerLogoUrl, setPartnerLogoUrl,
    resetAdvancedCustomization,
  } = useAppearance();
  const isAppearanceContext = context === 'system-appearance' || context === 'system-theme-color';
  const [activeTab, setActiveTab] = useState<'chat' | 'more'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [appliedChanges, setAppliedChanges] = useState<AppliedChange[]>([]);
  const [multiSelectState, setMultiSelectState] = useState<Record<string, string[]>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);

  // ── Order mode state ──
  // NOTE: Settings AI must NEVER enter POS order mode. "Add product" inside Settings
  // means "create a new product in the catalog", not "add a product to an order".
  // We keep the variables for legacy code paths but the intent list is intentionally empty
  // so the order-chat overlay (Browse Menu, Order Type, View Summary, Go to Orders, Summary, Clear) never appears here.
  const ORDER_INTENT_KEYWORDS: string[] = [];
  const [orderMode, setOrderMode] = useState(false);
  const [orderBrowseActive, setOrderBrowseActive] = useState(false);
  const [orderBrowseStep, setOrderBrowseStep] = useState<"menu" | "category" | "products">("menu");
  const [orderSelectedMenu, setOrderSelectedMenu] = useState("");
  const [orderSelectedCategory, setOrderSelectedCategory] = useState("");
  const [orderItems, setOrderItems] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [orderType, setOrderType] = useState("DINE IN");
  const [showOrderTypes, setShowOrderTypes] = useState(false);
  const orderConversationRef = useRef<{ role: string; content: string }[]>([]);
  const { menuList, menuCategories, loading: menusLoading } = useSupabaseMenus();
  const [availableProducts, setAvailableProducts] = useState<{ id: string; name: string; price: number; category_name?: string }[]>([]);

  // Fetch products for order browse
  useEffect(() => {
    if (!orderMode) return;
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("id, name, price, category_id, categories(name)").eq("active", true).eq("archived", false).order("sort_order");
      if (data) {
        setAvailableProducts(data.map((p: any) => ({ id: p.id, name: p.name, price: p.price, category_name: p.categories?.name })));
      }
    };
    fetchProducts();
  }, [orderMode]);

  // Context-to-welcome mapping for auto-welcome messages
  const contextWelcomeMap: Record<string, { title: string; description: string; children?: string[] }> = {
    system: { title: "System", description: "Here you can configure system-level settings. Choose a section:", children: ["Appearance", "Control Center", "AI Integration"] },
    payments: { title: "Payments", description: "Manage all payment configurations. Choose a section:", children: ["Taxes", "Gratuity", "Discounts", "Service Charge", "Payment Methods", "Cash Management", "Checkout Options"] },
    menu: { title: "Menu", description: "Manage your product catalog, categories, modifiers, and menus. Choose a section:", children: ["Products", "Categories", "Modifiers", "Add-ons", "Default Modifiers", "Groups", "Menus"] },
    'system-appearance': { title: "Appearance", description: "Customize the look and feel of your Point of Sale:" },
    'system-control-center': { title: "Control Center", description: "Manage operational controls and system behavior:" },
    'payments-taxes': { title: "Taxes", description: "Manage tax rates, exemptions, and pricing modes:" },
    'payments-gratuity': { title: "Gratuity", description: "Configure tip presets, auto-gratuity, and distribution:" },
    'payments-discounts': { title: "Discounts", description: "Create and manage discounts, eligibility, and tracking:" },
    'payments-service-charge': { title: "Service Charge", description: "Configure automatic service charges and surcharges:" },
    'payments-checkout-options': { title: "Checkout Options", description: "Customize checkout flow, receipts, and signatures:" },
    'payments-payment-methods': { title: "Payment Methods", description: "Configure accepted payment types and visibility:" },
    'payments-cash-management': { title: "Cash Management", description: "Track cash drawers, pay-ins/outs, and reconciliation:" },
    'menu-products': { title: "Products", description: "Add, edit, archive, and search your products:" },
    'menu-categories': { title: "Categories", description: "Organize products into categories and control ordering:" },
    'menu-modifiers': { title: "Modifiers", description: "Manage modifier groups and product customization options:" },
    'menu-add-ons': { title: "Add-ons", description: "Configure extra options and assign them to products:" },
    'menu-default-modifiers': { title: "Default Modifiers", description: "Set and manage default modifier presets:" },
    'menu-groups': { title: "Groups", description: "Create groups to organize and manage products:" },
    'menu-menus': { title: "Menus", description: "Create menus, assign categories, and manage schedules:" },
    'end-of-day': { title: "End of Day", description: "I can run your full end-of-day flow: start EOD, run automation, print reports, clock out employees, close the cash drawer, close paid orders, cancel unpaid tickets, and configure reminders. What would you like to do?" },
  };

  const prevContextRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!context || context === prevContextRef.current) return;
    prevContextRef.current = context;
    const welcomeInfo = contextWelcomeMap[context];
    if (!welcomeInfo) return;

    const chips = contextChipsMap[context];
    const quickReplies = welcomeInfo.children
      ? welcomeInfo.children
      : chips?.map(c => c.label) || [];

    const welcomeMsg: Message = {
      id: `welcome-${context}-${Date.now()}`,
      role: "assistant",
      content: `You're in **${welcomeInfo.title}** settings. ${welcomeInfo.description}`,
      timestamp: new Date(),
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
    };

    setMessages(prev => {
      const filtered = prev.filter(m => !m.id.startsWith('welcome-'));
      return [...filtered, welcomeMsg];
    });
  }, [context]);

  const ORDER_TYPES = ["DINE IN", "TAKE OUT", "DELIVERY", "BANQUET", "DRIVE THRU", "CURB SIDE"];

  const isOrderIntent = (text: string) => {
    const lower = text.toLowerCase();
    return ORDER_INTENT_KEYWORDS.some(kw => lower.includes(kw));
  };

  const ORDER_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-ai-chat`;

  const ORDER_QUICK_ACTIONS = ["Browse Menu", "Order Type", "View Summary", "Go to Orders"];

  // Hierarchical settings navigation map
  const SETTINGS_HIERARCHY: Record<string, { path?: string; children?: string[] }> = {
    "Menu": { path: "/settings/menu", children: ["Products", "Categories", "Modifiers", "Add-ons", "Default Modifiers", "Groups", "Menus"] },
    "Payments": { path: "/settings/payments", children: ["Discounts", "Taxes", "Gratuity", "Service Charge", "Checkout Options", "Payment Methods", "Cash Management"] },
    "System": { path: "/settings/system", children: ["Appearance", "Control Center"] },
    "Workforce": { path: "/settings/workforce", children: ["Employee", "Shift", "Schedule Information"] },
    "Hardware": { path: "/settings/hardware", children: ["Printer", "Card Reader", "Cash Register"] },
    "Network": { path: "/settings/network", children: ["Servers", "AI Integration"] },
    "Support": { path: "/settings/support", children: ["Feedback", "Contact", "About"] },
    "Notifications": { path: "/settings/notifications" },
  };

  // Leaf node navigation paths
  const SETTINGS_LEAF_NAV: Record<string, string> = {
    "Products": "/settings/menu/products",
    "Categories": "/settings/menu/categories",
    "Modifiers": "/settings/menu/modifiers",
    "Add-ons": "/settings/menu/add-ons",
    "Default Modifiers": "/settings/menu/default-modifiers",
    "Groups": "/settings/menu/groups",
    "Menus": "/settings/menu/menus",
    "Discounts": "/settings/payments/discounts",
    "Taxes": "/settings/payments/taxes",
    "Gratuity": "/settings/payments/gratuity",
    "Service Charge": "/settings/payments/service-charge",
    "Checkout Options": "/settings/payments/checkout-options",
    "Payment Methods": "/settings/payments/payment-methods",
    "Cash Management": "/settings/payments/cash-management",
    "Appearance": "/settings/system/appearance",
    "Control Center": "/settings/system/control-center",
    "Employee": "/settings/workforce/employee",
    "Shift": "/settings/workforce/shift",
    "Schedule Information": "/settings/workforce/schedule",
    "Printer": "/settings/hardware/printer",
    "Card Reader": "/settings/hardware/card-reader",
    "Cash Register": "/settings/hardware/cash-register",
    "Servers": "/settings/network/servers",
    "AI Integration": "/settings/network/ai-integration",
    "Feedback": "/settings/support/feedback",
    "Contact": "/settings/support/contact",
    "About": "/settings/support/about",
    "Notifications": "/settings/notifications",
  };

  const SETTINGS_QUICK_ACTIONS = Object.keys(SETTINGS_HIERARCHY);

  // Helper to find parent of a child label
  const findSettingsParent = (childLabel: string): string | null => {
    for (const [parent, config] of Object.entries(SETTINGS_HIERARCHY)) {
      if (config.children?.includes(childLabel)) return parent;
    }
    return null;
  };

  // Handle settings quick-reply clicks. AI must NOT change the background screen,
  // so leaf-node navigation and "Go to X" shortcuts are intentionally disabled.
  const handleSettingsQuickReply = (reply: string) => {
    const hierarchy = SETTINGS_HIERARCHY[reply];
    if (hierarchy?.children) {
      // Has children - show sub-options inline (no "Go to" shortcut)
      const subOptions = [...hierarchy.children, "← Back"];
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `You selected **${reply}**. Choose a section:`,
        timestamp: new Date(),
        quickReplies: subOptions,
      };
      setMessages((prev) => [
        ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined } : msg),
        assistantMessage,
      ]);
      return true;
    }
    // Swallow any legacy "Go to X" replies without navigating
    if (/^Go to /i.test(reply)) {
      return true;
    }
    // Check "Back" button
    if (reply === "← Back") {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are the available settings modules. Tap any to explore:",
        timestamp: new Date(),
        quickReplies: SETTINGS_QUICK_ACTIONS,
      };
      setMessages((prev) => [
        ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined } : msg),
        assistantMessage,
      ]);
      return true;
    }
    // Leaf nodes: do NOT navigate the background screen. Treat as conversation.
    if (SETTINGS_LEAF_NAV[reply]) {
      return false;
    }
    return false;
  };

  const SETTINGS_INTENT_KEYWORDS = ["settings", "go to settings", "show settings", "open settings", "setting", "show me settings", "navigate to settings", "modules"];

  const isSettingsIntent = (text: string) => {
    const lower = text.toLowerCase().trim();
    // Only match if it's a settings navigation request, not a specific settings action
    return SETTINGS_INTENT_KEYWORDS.some(kw => lower.includes(kw)) && !isOrderIntent(lower);
  };

  const handleOrderMessage = async (content: string) => {
    const isFirstEntry = !orderMode;
    if (!orderMode) setOrderMode(true);

    const userMsg = { role: "user" as const, content };
    orderConversationRef.current = [...orderConversationRef.current, userMsg];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const orderContext = {
        orderType,
        guestName: "",
        orderItems,
        orderNotes: "",
        availableProducts,
      };

      const resp = await fetch(ORDER_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: orderConversationRef.current, orderContext }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "", assistantContent = "";
      let toolCallMap: Record<number, { id: string; function: { name: string; arguments: string } }> = {};
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;
            if (delta.content) {
              assistantContent += delta.content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id !== "welcome")
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                return [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() }];
              });
            }
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallMap[idx]) toolCallMap[idx] = { id: tc.id || "", function: { name: tc.function?.name || "", arguments: "" } };
                if (tc.function?.name) toolCallMap[idx].function.name = tc.function.name;
                if (tc.function?.arguments) toolCallMap[idx].function.arguments += tc.function.arguments;
              }
            }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }

      // Process tool calls locally
      const toolCalls = Object.values(toolCallMap);
      if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
          try {
            const args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            const fn = tc.function.name;
            if (fn === "add_product" || fn === "add_product_with_modifiers") {
              setOrderItems(prev => [...prev, { name: args.product_name, price: args.price || 0, qty: args.quantity || 1 }]);
            } else if (fn === "remove_product") {
              setOrderItems(prev => prev.filter(i => i.name.toLowerCase() !== args.product_name.toLowerCase()));
            } else if (fn === "set_order_type") {
              setOrderType(args.order_type);
            } else if (fn === "clear_order") {
              setOrderItems([]);
            }
          } catch (e) { console.error("Tool call error:", e); }
        }
        if (!assistantContent) {
          const actionNames = toolCalls.map(tc => tc.function.name.replace(/_/g, " ")).join(", ");
          assistantContent = `Done! Executed: ${actionNames}`;
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() }]);
        }
      }
      // Attach quick-reply buttons to the last assistant message
      setMessages(prev => prev.map((m, i) => 
        i === prev.length - 1 && m.role === "assistant" ? { ...m, quickReplies: ORDER_QUICK_ACTIONS } : m
      ));
      if (assistantContent) orderConversationRef.current = [...orderConversationRef.current, { role: "assistant", content: assistantContent }];
    } catch (e) {
      console.error("Order chat error:", e);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Order browse helpers
  const startOrderBrowse = () => {
    setOrderBrowseActive(true); setOrderBrowseStep("menu"); setOrderSelectedMenu(""); setOrderSelectedCategory("");
    setShowOrderTypes(false);
  };

  const selectOrderMenu = (menu: string) => {
    setOrderSelectedMenu(menu);
    const cats = menuCategories[menu] || [];
    if (cats.length === 1) { setOrderSelectedCategory(cats[0]); setOrderBrowseStep("products"); }
    else if (cats.length > 0) setOrderBrowseStep("category");
    else { setOrderSelectedCategory(""); setOrderBrowseStep("products"); }
  };

  const selectOrderCategory = (cat: string) => { setOrderSelectedCategory(cat); setOrderBrowseStep("products"); };

  const getOrderBrowseProducts = () => {
    if (orderSelectedCategory) return availableProducts.filter(p => p.category_name?.toLowerCase() === orderSelectedCategory.toLowerCase());
    const cats = menuCategories[orderSelectedMenu] || [];
    if (cats.length > 0) return availableProducts.filter(p => cats.some(c => c.toLowerCase() === (p.category_name || "").toLowerCase()));
    return availableProducts;
  };

  const handleOrderQuickAdd = (product: { id: string; name: string; price: number }) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.name === product.name);
      if (existing) return prev.map(i => i.name === product.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name: product.name, price: product.price, qty: 1 }];
    });
    toast({ title: "Added", description: `${product.name} added to order` });
  };

  const orderBrowseBack = () => {
    if (orderBrowseStep === "products") {
      const cats = menuCategories[orderSelectedMenu] || [];
      if (cats.length > 1) { setOrderBrowseStep("category"); setOrderSelectedCategory(""); }
      else { setOrderBrowseStep("menu"); setOrderSelectedMenu(""); }
    } else if (orderBrowseStep === "category") { setOrderBrowseStep("menu"); setOrderSelectedMenu(""); }
    else { setOrderBrowseActive(false); }
  };

  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

  const goToOrdersWithData = () => {
    const params = new URLSearchParams();
    if (orderItems.length > 0) params.set("orderItems", JSON.stringify(orderItems));
    if (orderType) params.set("orderType", orderType);
    navigate(`/orders${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const activeProvider = AI_PROVIDERS.find(p => p.id === selectedProvider) || AI_PROVIDERS[0];
  const activeModel = activeProvider.models.find(m => m.id === selectedModel) || activeProvider.models[0];

  // Voice recognition hook - show transcript in real-time
  const { isListening, isSupported: isVoiceSupported, transcript, toggleListening, stopListening } = useVoiceRecognition({
    onTranscript: (text) => {
      // When final transcript received, auto-send the message
      if (text.trim()) {
        handleSendMessage(text);
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Update input value with live transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript);
    }
  }, [isListening, transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for theme change events from settings manager
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      setTheme(e.detail.theme);
    };
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    return () => window.removeEventListener('theme-change', handleThemeChange as EventListener);
  }, [setTheme]);

  // Close provider dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(e.target as Node)) {
        setShowProviderDropdown(false);
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current settings context for AI
  const getSettingsContext = useCallback(() => {
    const session = (() => {
      try {
        return JSON.parse(localStorage.getItem("pos_session") || "null");
      } catch {
        return null;
      }
    })();
    const controlCenter = SettingsManager.getControlCenterSettings();
    const appearance = SettingsManager.getAppearanceSettings();
    const safeProfile = profile as any;

    switch (context) {
      case "account-personal-information":
        return [
          "## Personal Information",
          `- Name: ${session?.employeeName || safeProfile?.full_name || "John Smith"}`,
          `- Email: ${safeProfile?.email || "jimhopper@eatos.com"}`,
          `- Phone: ${safeProfile?.phone || "(123) 456 - 7890"}`,
          "- Language: English",
        ].join("\n");
      case "account-restaurant-information":
        return [
          "## Restaurant Information",
          "- Name: Bollywood Bites",
          "- Type: Fine Dining",
          "- Email: info@bollywoodbites.co.uk",
          "- Phone: +44 20 7946 0958",
          "- Address: 42 Kings Road, Chelsea, London SW3 4ND, UK",
          `- Revenue Center: ${session?.revenueCenter || "Not Set"}`,
          `- Business Hours: ${controlCenter.businessHoursStart} – ${controlCenter.businessHoursEnd}`,
          "- Language: English",
          "- Currency: GBP £",
        ].join("\n");
      case "account-security":
        return [
          "## Security Settings",
          "- Password Management: Restricted to Manager Dashboard",
          "- Two Factor Authentication: Available in this section",
          "- Change PIN: Available and functional via Change PIN flow",
          `- Auto Lock Timer: ${controlCenter.autoLockTimer === "never" ? "Never" : `${controlCenter.autoLockTimer} minutes`}`,
        ].join("\n");
      case "system-appearance":
        return [
          "## Appearance Settings",
          `- Theme: ${appearance.theme}`,
          `- Theme Color: ${themeColor || "Default"}`,
          `- Icon Style: ${appearance.iconStyle}`,
          `- Icon Size: ${appearance.iconSize}`,
          `- Text Size: ${appearance.textSize}px`,
          `- Bold Text: ${appearance.boldText ? "Enabled" : "Disabled"}`,
          `- Brightness: ${appearance.brightness}%`,
        ].join("\n");
      case "system-control-center":
        return [
          "## Control Center Settings",
          `- Debug Mode: ${controlCenter.debugMode ? "Enabled" : "Disabled"}`,
          `- Force Clock-In: ${controlCenter.forceClockIn ? "Enabled" : "Disabled"}`,
          `- Auto Lock Timer: ${controlCenter.autoLockTimer === "never" ? "Never" : `${controlCenter.autoLockTimer} minutes`}`,
          `- Switch To KDS: ${controlCenter.switchToKDS ? "Enabled" : "Disabled"}`,
        ].join("\n");
      case "payments-taxes":
        return [
          "## Taxes",
          ...SettingsManager.getActiveTaxes().map((tax) => `- ${tax.name}: ${tax.amount}% (${tax.type})`),
        ].join("\n");
      case "payments-discounts":
        return [
          "## Discounts",
          ...SettingsManager.getActiveDiscounts().map((discount) => `- ${discount.name}: ${discount.type === "Percentage" ? `${discount.amount}%` : `$${discount.amount}`}`),
        ].join("\n");
      case "payments-service-charge":
        return [
          "## Service Charges",
          ...SettingsManager.getActiveServiceCharges().map((charge) => `- ${charge.name}: ${charge.type === "Percentage" ? `${charge.amount}%` : `$${charge.amount}`}`),
        ].join("\n");
      case "payments-gratuity": {
        const gratuity = SettingsManager.getGratuitySettings();
        return [
          "## Gratuity",
          `- Tips: ${gratuity.enableTip ? "Enabled" : "Disabled"}`,
          `- Show on Receipt: ${gratuity.showOnReceipt ? "Yes" : "No"}`,
          `- Preset Type: ${gratuity.presetType}`,
          `- Active Presets: ${gratuity.selectedTipPresets.join(", ")}`,
        ].join("\n");
      }
      case "payments-checkout-options": {
        const checkout = SettingsManager.getCheckoutOptionsSettings();
        return [
          "## Checkout Options",
          `- Split Check: ${checkout.splitCheck ? "Enabled" : "Disabled"}`,
          `- Quick Amounts: ${checkout.enableQuickAmounts ? "Enabled" : "Disabled"}`,
          `- Signature Threshold: $${checkout.signatureThreshold}`,
          `- Tip Screen: ${checkout.skipTipScreen ? "Skipped" : "Shown"}`,
        ].join("\n");
      }
      case "end-of-day": {
        // Read EOD preferences directly from localStorage cache (synchronous) — keys mirror usePreference keys
        const get = (k: string, d: string) => {
          // best-effort: AI also reads live state via DB context in the edge function
          return d;
        };
        return [
          "## End of Day",
          "Available actions the AI can perform:",
          "- start_eod (open the End of Day summary)",
          "- run_eod_now (execute the full End of Day automation immediately)",
          "- print_eod_report (print today's End of Day report)",
          "- clock_out_employees (clock out all currently clocked-in employees)",
          "- close_cash_drawer (close the open cash drawer session)",
          "- close_paid_orders (close all paid orders)",
          "- cancel_unpaid_tickets (cancel all unpaid tickets)",
          "",
          "Configurable EOD toggles (settingType:\"endOfDay\"):",
          "- endOfDayReminder (boolean)",
          "- autoEndOfDayTime (e.g. \"11:00 PM\")",
          "- runEndOfDay (boolean) — auto-run EOD",
          "- autoRunTime (e.g. \"11:00 PM\")",
          "- clockOutEmployees (boolean) — auto clock out at EOD",
          "- closeCashDrawer (boolean)",
          "- closePaidOrders (boolean)",
          "- cancelUnpaidTickets (boolean)",
          "- printReport (boolean) — print EOD report on close",
          "- includeEmployeeData (boolean) — include employee details on the report",
          "- printSummaryOnClockOut (boolean)",
          "- selectedDevice (e.g. \"POS 1.2\")",
          "- selectedEmployees (array of employee names — daily report recipients)",
        ].join("\n");
      }
      default:
        if (context?.startsWith("menu")) return "## Menu Module\nUse only the live menu, category, product, modifier, and add-on data for this section.";
        if (context?.startsWith("payments")) return "## Payments Module\nUse only payments settings relevant to the active payments section.";
        if (context?.startsWith("system")) return "## System Module\nUse only system settings relevant to the active system section.";
        return "## Active Settings Context\nUse only data relevant to the current section.";
    }
  }, [context, profile, themeColor]);

  // Image upload handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 10MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setUploadedImageFile(file);
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageFile(null);
  };

  // Map AI's human-readable setting label to the actual SettingsManager key
  const SETTING_KEY_MAP: Record<string, { type: string; key: string }> = {
    // Appearance
    "bold text": { type: "appearance", key: "boldText" },
    "theme": { type: "appearance", key: "theme" },
    "dark mode": { type: "appearance", key: "theme" },
    "light mode": { type: "appearance", key: "theme" },
    "text size": { type: "appearance", key: "textSize" },
    "icon size": { type: "appearance", key: "iconSize" },
    "icon style": { type: "appearance", key: "iconStyle" },
    "brightness": { type: "appearance", key: "brightness" },
    "theme color": { type: "appearance", key: "themeColor" },
    // Control Center
    "debug mode": { type: "controlCenter", key: "debugMode" },
    "force clock-in": { type: "controlCenter", key: "forceClockIn" },
    "force clock in": { type: "controlCenter", key: "forceClockIn" },
    "auto-lock timer": { type: "controlCenter", key: "autoLockTimer" },
    "auto lock timer": { type: "controlCenter", key: "autoLockTimer" },
    "restart app": { type: "controlCenter", key: "restartApp" },
    "switch to kds": { type: "controlCenter", key: "switchToKDS" },
    "kds notification": { type: "controlCenter", key: "kdsNotification" },
    "lock after failed": { type: "controlCenter", key: "lockAfterFailed" },
    "open register without pin": { type: "controlCenter", key: "openRegisterWithoutPIN" },
    "built-in display": { type: "controlCenter", key: "builtInDisplay" },
    "hide performance summary": { type: "controlCenter", key: "hidePerformanceSummary" },
    "hide break button": { type: "controlCenter", key: "hideBreakButton" },
    "hide employee feedback": { type: "controlCenter", key: "hideEmployeeFeedback" },
    "hide seat selector": { type: "controlCenter", key: "hideSeatSelector" },
    "reset tables daily": { type: "controlCenter", key: "resetTablesDaily" },
    "enable write-off": { type: "controlCenter", key: "enableWriteOff" },
    // Checkout
    "split check": { type: "checkoutOptions", key: "splitCheck" },
    "skip tip screen": { type: "checkoutOptions", key: "skipTipScreen" },
    "skip signature": { type: "checkoutOptions", key: "skipSignature" },
    "signature threshold": { type: "checkoutOptions", key: "signatureThreshold" },
    "print receipt": { type: "checkoutOptions", key: "printReceipt" },
    "email receipt": { type: "checkoutOptions", key: "emailReceipt" },
    "sms receipt": { type: "checkoutOptions", key: "smsReceipt" },
    "qr bill payment": { type: "checkoutOptions", key: "qrBillPayment" },
    "show order summary": { type: "checkoutOptions", key: "showOrderSummary" },
    "show itemized tax": { type: "checkoutOptions", key: "showItemizedTax" },
    "enable tips": { type: "checkoutOptions", key: "enableTips" },
    "enable hold and fire": { type: "checkoutOptions", key: "enableHoldFire" },
    "enable payment sounds": { type: "checkoutOptions", key: "enablePaymentSounds" },
    "guest notes": { type: "checkoutOptions", key: "guestNotesEnabled" },
    "require guest name": { type: "checkoutOptions", key: "requireGuestName" },
    "require order type": { type: "checkoutOptions", key: "requireOrderType" },
    "auto close ticket": { type: "checkoutOptions", key: "autoCloseTicket" },
    // Gratuity
    "enable tip": { type: "gratuity", key: "enableTip" },
    "tip on cfd": { type: "gratuity", key: "disableTipOnCFD" },
    "show tip on receipt": { type: "gratuity", key: "showOnReceipt" },
    "allow custom tip": { type: "gratuity", key: "allowCustom" },
    // End of Day toggles
    "end of day reminder": { type: "endOfDay", key: "endOfDayReminder" },
    "eod reminder": { type: "endOfDay", key: "endOfDayReminder" },
    "auto end of day time": { type: "endOfDay", key: "autoEndOfDayTime" },
    "run end of day": { type: "endOfDay", key: "runEndOfDay" },
    "auto run end of day": { type: "endOfDay", key: "runEndOfDay" },
    "auto run time": { type: "endOfDay", key: "autoRunTime" },
    "clock out employees": { type: "endOfDay", key: "clockOutEmployees" },
    "close cash drawer": { type: "endOfDay", key: "closeCashDrawer" },
    "close paid orders": { type: "endOfDay", key: "closePaidOrders" },
    "cancel unpaid tickets": { type: "endOfDay", key: "cancelUnpaidTickets" },
    "print end of day report": { type: "endOfDay", key: "printReport" },
    "print eod report": { type: "endOfDay", key: "printReport" },
    "include employee data": { type: "endOfDay", key: "includeEmployeeData" },
    "print summary on clock-out": { type: "endOfDay", key: "printSummaryOnClockOut" },
    "print summary on clock out": { type: "endOfDay", key: "printSummaryOnClockOut" },
    "end of day device": { type: "endOfDay", key: "selectedDevice" },
    "send daily reports": { type: "endOfDay", key: "selectedEmployees" },
  };

  // Coerce AI's free-form value into the right shape for the target key
  const coerceValue = (rawValue: any, targetKey: string): any => {
    const normalizedKey = String(targetKey || "").trim();

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return rawValue;
    }

    if (normalizedKey === "theme") {
      const v = String(rawValue ?? "").toLowerCase();
      if (v.includes("light")) return "light";
      if (v.includes("dark")) return "dark";
      return rawValue;
    }

    const floatKeys = new Set([
      "amount", "price", "timedPrice", "adjustment", "signatureThreshold",
    ]);
    const intKeys = new Set([
      "textSize", "brightness", "autoLockTimer", "stockCount", "maxSelections", "minSeats", "sortOrder",
    ]);

    if (floatKeys.has(normalizedKey)) {
      const n = Number(String(rawValue).replace(/[^0-9.-]/g, ""));
      return Number.isNaN(n) ? rawValue : n;
    }

    if (intKeys.has(normalizedKey)) {
      const n = parseInt(String(rawValue).replace(/[^0-9.-]/g, ""), 10);
      return Number.isNaN(n) ? rawValue : n;
    }

    if (typeof rawValue === "boolean") return rawValue;
    const v = String(rawValue).trim().toLowerCase();
    if (["true", "yes", "on", "enable", "enabled", "active", "1"].includes(v)) return true;
    if (["false", "no", "off", "disable", "disabled", "inactive", "0"].includes(v)) return false;

    return rawValue;
  };

  // Execute the pending action based on type and data
  const executeAction = useCallback(async (pendingChange: PendingChange): Promise<boolean> => {
    let { settingType, operation } = pendingChange;
    // Fallback: if data is missing, try parsing newValue (AI sometimes puts menu object there)
    let data = pendingChange.data;
    if (!data && pendingChange.newValue) {
      if (typeof pendingChange.newValue === 'object') {
        data = pendingChange.newValue;
      } else if (typeof pendingChange.newValue === 'string') {
        try { data = JSON.parse(pendingChange.newValue); } catch { /* not JSON */ }
      }
    }

    // Smart fallback: derive data from `setting` label + newValue when AI omits proper data shape
    if ((!data || typeof data !== "object" || Object.keys(data).length === 0) && pendingChange.setting) {
      const label = pendingChange.setting.toLowerCase().trim();
      const mapping = SETTING_KEY_MAP[label];
      if (mapping) {
        if (!settingType) settingType = mapping.type;
        const coerced = coerceValue(pendingChange.newValue, mapping.key);
        data = { [mapping.key]: coerced };
      }
    }

    // If data exists but values are wrong type (e.g., "Enabled" instead of true), coerce them
    if (data && typeof data === "object" && settingType) {
      const coercedData: Record<string, any> = {};
      Object.entries(data).forEach(([k, v]) => {
        coercedData[k] = coerceValue(v, k);
      });
      data = coercedData;
    }

    if (!settingType || !data) return false;

      try {
        if (settingType === "securityPin") {
          navigate('/settings/account/security');
          window.dispatchEvent(new CustomEvent('open-security-change-pin'));
          return true;
        }

      // Database-backed types (menus, products, categories, modifiers, add-ons,
      // default modifiers, groups, timed pricing rules, inventory adjustments)
      const dbTypes = [
        "menu", "product", "category", "modifierGroup", "modifier", "addOn",
        "defaultModifier", "group", "timedPricing", "inventory",
      ];
      
      if (dbTypes.includes(settingType)) {
        return await executeDbAction(settingType, operation || "add", data);
      }

      // localStorage-backed types (settings)
      switch (settingType) {
        case "gratuity":
          SettingsManager.updateGratuitySettings(data);
          break;
        case "discount": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("discounts").insert({
              device_id: "shared",
              name: data.name,
              amount: data.amount,
              type: data.type || "Percentage",
              applicable_to: data.applicableTo || "All Products",
              applicable_products: data.applicableProducts || [],
              requires_manager_pin: !!data.requiresManagerPin,
              schedule_enabled: !!data.scheduleEnabled,
              archived: false,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("discounts", data);
            if (!target) return notFoundToast("Discount", data.name);
            const updates: any = {};
            if (data.newName) updates.name = data.newName;
            if (data.amount !== undefined) updates.amount = data.amount;
            if (data.type) updates.type = data.type;
            if (data.applicableTo) updates.applicable_to = data.applicableTo;
            if (data.applicableProducts !== undefined) updates.applicable_products = data.applicableProducts;
            if (data.requiresManagerPin !== undefined) updates.requires_manager_pin = data.requiresManagerPin;
            if (data.scheduleEnabled !== undefined) updates.schedule_enabled = data.scheduleEnabled;
            const { error } = await (supabase as any).from("discounts").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("discounts", data);
            if (!target) return notFoundToast("Discount", data.name);
            const { error } = await (supabase as any).from("discounts").update({ archived: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("discounts", data);
            if (!target) return notFoundToast("Discount", data.name);
            const { error } = await (supabase as any).from("discounts").update({ archived: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("discounts", data);
            if (!target) return notFoundToast("Discount", data.name);
            const { error } = await (supabase as any).from("discounts").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "tax": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("taxes").insert({
              device_id: "shared",
              name: data.name,
              amount: data.amount,
              type: data.type || "Exclusive",
              applicable_to: data.applicableTo || "All Products",
              applicable_products: data.applicableProducts || [],
              archived: false,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("taxes", data);
            if (!target) return notFoundToast("Tax", data.name);
            const updates: any = {};
            if (data.newName) updates.name = data.newName;
            if (data.amount !== undefined) updates.amount = data.amount;
            if (data.type) updates.type = data.type;
            if (data.applicableTo) updates.applicable_to = data.applicableTo;
            if (data.applicableProducts !== undefined) updates.applicable_products = data.applicableProducts;
            const { error } = await (supabase as any).from("taxes").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("taxes", data);
            if (!target) return notFoundToast("Tax", data.name);
            const { error } = await (supabase as any).from("taxes").update({ archived: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("taxes", data);
            if (!target) return notFoundToast("Tax", data.name);
            const { error } = await (supabase as any).from("taxes").update({ archived: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("taxes", data);
            if (!target) return notFoundToast("Tax", data.name);
            const { error } = await (supabase as any).from("taxes").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "serviceCharge": {
          if (operation === "add") {
            const orderType = Array.isArray(data.orderType) ? data.orderType.join(", ") : (data.orderType || "All Orders");
            const { error } = await (supabase as any).from("service_charges").insert({
              device_id: "shared",
              name: data.name,
              amount: data.amount,
              type: data.type || "Fixed",
              tax_applicable: data.taxApplicable || "Taxable",
              order_type: orderType,
              applied_as: data.appliedAs || "Per Check",
              automatic_apply: !!data.automaticApply,
              min_seats: data.minSeats || 0,
              requires_manager_pin: !!data.requiresManagerPin,
              archived: false,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("service_charges", data);
            if (!target) return notFoundToast("Service charge", data.name);
            const updates: any = {};
            if (data.newName) updates.name = data.newName;
            if (data.amount !== undefined) updates.amount = data.amount;
            if (data.type) updates.type = data.type;
            if (data.taxApplicable) updates.tax_applicable = data.taxApplicable;
            if (data.orderType) updates.order_type = Array.isArray(data.orderType) ? data.orderType.join(", ") : data.orderType;
            if (data.automaticApply !== undefined) updates.automatic_apply = data.automaticApply;
            if (data.minSeats !== undefined) updates.min_seats = data.minSeats;
            if (data.requiresManagerPin !== undefined) updates.requires_manager_pin = data.requiresManagerPin;
            const { error } = await (supabase as any).from("service_charges").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("service_charges", data);
            if (!target) return notFoundToast("Service charge", data.name);
            const { error } = await (supabase as any).from("service_charges").update({ archived: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("service_charges", data);
            if (!target) return notFoundToast("Service charge", data.name);
            const { error } = await (supabase as any).from("service_charges").update({ archived: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("service_charges", data);
            if (!target) return notFoundToast("Service charge", data.name);
            const { error } = await (supabase as any).from("service_charges").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "appearance":
          SettingsManager.updateAppearanceSettings(data);
          break;
        case "controlCenter":
          SettingsManager.updateControlCenterSettings(data);
          break;
        case "checkoutOptions":
          SettingsManager.updateCheckoutOptionsSettings(data);
          break;
        case "orders":
          SettingsManager.updateOrdersSettings(data);
          break;
        case "endOfDay": {
          // Map AI camelCase keys -> usePreference keys used by EndOfDayContent
          const EOD_KEY_MAP: Record<string, string> = {
            endOfDayReminder: "eod_reminder",
            autoEndOfDayTime: "eod_reminder_time",
            runEndOfDay: "eod_auto_run",
            autoRunTime: "eod_auto_run_time",
            clockOutEmployees: "eod_clock_out",
            closeCashDrawer: "eod_close_cash",
            closePaidOrders: "eod_close_paid",
            cancelUnpaidTickets: "eod_cancel_unpaid",
            printReport: "eod_print_report",
            includeEmployeeData: "eod_include_employee",
            printSummaryOnClockOut: "eod_print_clock_out",
            selectedDevice: "eod_device",
            selectedEmployees: "eod_report_recipients",
            sendDailyReports: "eod_send_daily_reports",
          };
          // Action triggers (immediate side-effects)
          if (data.action) {
            const action = String(data.action);
            if (action === "start_eod") {
              navigate("/settings/end-of-day");
              window.dispatchEvent(new CustomEvent("eod-start"));
              toast({ title: "End of Day", description: "Opening End of Day summary." });
            } else if (action === "run_eod_now") {
              window.dispatchEvent(new CustomEvent("eod-run-now"));
              toast({ title: "End of Day", description: "Running End of Day automation." });
            } else if (action === "print_eod_report") {
              try {
                const { printEndOfDayReport } = await import("@/utils/eodReportPrinter");
                const { data: prefRow } = await (supabase as any)
                  .from("user_preferences").select("preference_value")
                  .eq("device_id", "shared").eq("preference_key", "eod_include_employee").maybeSingle();
                const includeEmp = prefRow?.preference_value === "true";
                await printEndOfDayReport([], includeEmp);
                toast({ title: "End of Day Report", description: "Print dialog opened." });
              } catch (err) { console.error("Print EOD report failed:", err); }
            } else if (action === "clock_out_employees") {
              window.dispatchEvent(new CustomEvent("eod-clock-out-all"));
              toast({ title: "Clock Out", description: "Clocking out all employees." });
            } else if (action === "close_cash_drawer") {
              window.dispatchEvent(new CustomEvent("eod-close-cash-drawer"));
              toast({ title: "Cash Drawer", description: "Closing cash drawer." });
            } else if (action === "close_paid_orders") {
              window.dispatchEvent(new CustomEvent("eod-close-paid-orders"));
              toast({ title: "Paid Orders", description: "Closing all paid orders." });
            } else if (action === "cancel_unpaid_tickets") {
              window.dispatchEvent(new CustomEvent("eod-cancel-unpaid"));
              toast({ title: "Unpaid Tickets", description: "Cancelling all unpaid tickets." });
            }
            break;
          }
          // Toggle / value updates: persist directly to user_preferences
          for (const [aiKey, val] of Object.entries(data)) {
            const prefKey = EOD_KEY_MAP[aiKey];
            if (!prefKey) continue;
            let prefValue: string;
            if (Array.isArray(val)) prefValue = JSON.stringify(val);
            else if (typeof val === "boolean") prefValue = val ? "true" : "false";
            else prefValue = String(val);
            await (supabase as any).from("user_preferences").upsert(
              { device_id: "shared", preference_key: prefKey, preference_value: prefValue },
              { onConflict: "device_id,preference_key" }
            );
            window.dispatchEvent(new CustomEvent("preference-updated", { detail: { preferenceKey: prefKey } }));
          }
          break;
        }
        default:
          console.warn("Unknown setting type:", settingType);
          return false;
      }
      // Broadcast settings change for any listening UI components
      window.dispatchEvent(new CustomEvent("pos-data-changed", { detail: { settingType, operation } }));
      window.dispatchEvent(new CustomEvent("settings-updated", { detail: { type: settingType, operation } }));
      toast({ title: "Success", description: data?.name ? `${data.name} ${operation === "add" ? "created" : operation + "d"}.` : "Settings updated." });
      return true;
    } catch (error) {
      console.error("Error executing action:", error);
      return false;
    }
  }, []);

  // Execute database-backed actions via Supabase
  const executeDbAction = async (settingType: string, operation: string, data: any): Promise<boolean> => {
    try {
      switch (settingType) {
        case "menu": {
          if (operation === "add") {
            // Build channel_schedules from channels object and channelSchedules
            const channelSchedules: Record<string, any> = {};
            if (data.channelSchedules) {
              // Use detailed scheduling data from AI
              Object.entries(data.channelSchedules).forEach(([key, val]: [string, any]) => {
                channelSchedules[key] = {
                  active: val.active !== false,
                  days: val.days || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                  startTime: val.startTime || "All Day",
                  endTime: val.endTime || "",
                };
              });
            } else if (data.channels) {
              if (data.channels.dineIn) channelSchedules["dine-in"] = { active: true };
              if (data.channels.takeaway) channelSchedules["takeaway"] = { active: true };
              if (data.channels.delivery) channelSchedules["delivery"] = { active: true };
            }

            // Build device_schedules if provided
            const deviceSchedules: Record<string, any> = {};
            if (data.deviceSchedules) {
              Object.entries(data.deviceSchedules).forEach(([device, val]: [string, any]) => {
                deviceSchedules[device] = {
                  days: val.days || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                  startTime: val.startTime || "All Day",
                  endTime: val.endTime || "",
                };
              });
            }

            // Merge device schedules into channel_schedules for storage
            const fullSchedules: Record<string, any> = {
              ...channelSchedules,
              ...(Object.keys(deviceSchedules).length > 0 ? { _devices: deviceSchedules } : {}),
            };

            const { data: menuRow, error } = await (supabase as any).from("menus").insert({
              name: data.name,
              description: data.description || "",
              enabled: true,
              revenue_centers: data.revenueCenters || [],
              channel_schedules: Object.keys(fullSchedules).length > 0 ? fullSchedules : {},
            }).select("id").single();
            if (error) throw error;

            // Link categories if provided
            if (menuRow?.id && data.categoryNames && data.categoryNames.length > 0) {
              // Resolve category names to IDs
              const { data: allCats } = await (supabase as any).from("categories").select("id, name");
              const catMap: Record<string, string> = {};
              (allCats || []).forEach((c: any) => { catMap[c.name.toLowerCase()] = c.id; });

              const linksToInsert: any[] = [];
              let sortIdx = 0;
              for (const catName of data.categoryNames) {
                let catId = catMap[catName.toLowerCase()];
                // If category doesn't exist, create it
                if (!catId) {
                  const { data: newCat } = await (supabase as any).from("categories").insert({ name: catName }).select("id").single();
                  if (newCat) catId = newCat.id;
                }
                if (catId) {
                  linksToInsert.push({ menu_id: menuRow.id, category_id: catId, sort_order: sortIdx++ });
                }
              }
              if (linksToInsert.length > 0) {
                await (supabase as any).from("menu_categories").insert(linksToInsert);
              }
            }
          } else if (operation === "enable" || operation === "disable") {
            const enabled = operation === "enable" || data.enabled === true;
            const { error } = await (supabase as any).from("menus").update({ enabled }).eq("id", data.id);
            if (error) throw error;
          } else if (operation === "update") {
            const updates: any = {};
            if (data.name) updates.name = data.name;
            if (data.enabled !== undefined) updates.enabled = data.enabled;
            const { error } = await (supabase as any).from("menus").update(updates).eq("id", data.id);
            if (error) throw error;
          } else if (operation === "archive") {
            const { error } = await (supabase as any).from("menus").update({ archived: true }).eq("id", data.id);
            if (error) throw error;
          }
          break;
        }
        case "product": {
          if (operation === "add") {
            const categoryName = data.category || data.categoryName;
            if (!data.name || !categoryName) {
              toast({ title: "Missing product details", description: "Product name and category are required.", variant: "destructive" });
              return false;
            }
            await createProduct({
              name: data.name,
              description: data.description || "",
              category: categoryName,
              price: Number(data.price) || 0,
              priceType: data.priceType || "fixed",
              sku: data.sku || "",
              imageUrl: data.imageUrl,
              active: data.active !== false,
              dineIn: data.dineIn !== false,
              takeaway: data.takeaway !== false,
              delivery: !!data.delivery,
              addToMenu: data.addToMenu !== false,
              outOfStock: !!data.outOfStock,
              inventoryTracking: !!data.inventoryTracking,
              negativeInventory: !!data.negativeInventory,
              modifiers: data.modifiers || [],
              addOns: data.addOns || [],
              taxes: data.taxes || [],
              discounts: data.discounts || [],
              isCustom: true,
            }, Array.isArray(data.variants) ? data.variants : []);
          } else if (operation === "update") {
            const target = data.id ? { id: data.id } : await resolveByName("products", data);
            if (!target) return notFoundToast("Product", data.name);
            const existing = getCustomProducts().find((p) => p.id === target.id);
            await updateProduct(target.id, {
              name: data.newName || data.name || existing?.name,
              description: data.description ?? existing?.description ?? "",
              category: data.category || data.categoryName || existing?.category,
              price: data.price !== undefined ? Number(data.price) : existing?.price,
              priceType: data.priceType || existing?.priceType || "fixed",
              sku: data.sku ?? existing?.sku ?? "",
              imageUrl: data.imageUrl ?? existing?.imageUrl,
              active: data.active ?? existing?.active ?? true,
              dineIn: data.dineIn ?? existing?.dineIn ?? true,
              takeaway: data.takeaway ?? existing?.takeaway ?? true,
              delivery: data.delivery ?? existing?.delivery ?? false,
              addToMenu: data.addToMenu ?? existing?.addToMenu ?? true,
              outOfStock: data.outOfStock ?? existing?.outOfStock ?? false,
              inventoryTracking: data.inventoryTracking ?? existing?.inventoryTracking ?? false,
              negativeInventory: data.negativeInventory ?? existing?.negativeInventory ?? false,
              modifiers: data.modifiers ?? existing?.modifiers ?? [],
              addOns: data.addOns ?? existing?.addOns ?? [],
              taxes: data.taxes ?? existing?.taxes ?? [],
              discounts: data.discounts ?? existing?.discounts ?? [],
              isCustom: true,
            }, Array.isArray(data.variants) ? data.variants : existing?.variants || []);
          } else if (operation === "archive") {
            const target = data.id ? { id: data.id } : await resolveByName("products", data);
            if (!target) return notFoundToast("Product", data.name);
            const { error } = await (supabase as any).from("products").update({ archived: true }).eq("id", target.id);
            if (error) throw error;
            setArchivedId(target.id, true);
          } else if (operation === "enable" || operation === "disable") {
            const target = data.id ? { id: data.id } : await resolveByName("products", data);
            if (!target) return notFoundToast("Product", data.name);
            const active = operation === "enable" || data.active === true;
            const { error } = await (supabase as any).from("products").update({ active }).eq("id", target.id);
            if (error) throw error;
            const existing = getCustomProducts().find((p) => p.id === target.id);
            if (existing) saveCustomProduct({ ...existing, active, updatedAt: new Date().toISOString() });
          } else if (operation === "remove" || operation === "delete") {
            const target = data.id ? { id: data.id } : await resolveByName("products", data);
            if (!target) return notFoundToast("Product", data.name);
            const { error } = await (supabase as any).from("products").delete().eq("id", target.id);
            if (error) throw error;
            deleteCustomProduct(target.id);
          }
          break;
        }
        case "category": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("categories").insert({ name: data.name });
            if (error) throw error;
          } else if (operation === "update") {
            const updates: any = {};
            if (data.name) updates.name = data.name;
            if (data.icon !== undefined) updates.icon = data.icon;
            if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
            const target = await resolveByName("categories", data);
            if (!target) return notFoundToast("Category", data.name);
            const { error } = await (supabase as any).from("categories").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("categories", data);
            if (!target) return notFoundToast("Category", data.name);
            const { error } = await (supabase as any).from("categories").update({ active: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("categories", data);
            if (!target) return notFoundToast("Category", data.name);
            const { error } = await (supabase as any).from("categories").update({ active: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("categories", data);
            if (!target) return notFoundToast("Category", data.name);
            const { error } = await (supabase as any).from("categories").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "modifierGroup": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("modifier_groups").insert({
              name: data.name,
              required: data.required || false,
              multi_select: data.multiSelect || false,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("modifier_groups", data);
            if (!target) return notFoundToast("Modifier group", data.name);
            const updates: any = {};
            if (data.newName || data.name) updates.name = data.newName || data.name;
            if (data.required !== undefined) updates.required = data.required;
            if (data.multiSelect !== undefined) updates.multi_select = data.multiSelect;
            const { error } = await (supabase as any).from("modifier_groups").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("modifier_groups", data);
            if (!target) return notFoundToast("Modifier group", data.name);
            const { error } = await (supabase as any).from("modifier_groups").update({ active: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("modifier_groups", data);
            if (!target) return notFoundToast("Modifier group", data.name);
            const { error } = await (supabase as any).from("modifier_groups").update({ active: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("modifier_groups", data);
            if (!target) return notFoundToast("Modifier group", data.name);
            const { error } = await (supabase as any).from("modifier_groups").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "modifier": {
          if (operation === "add") {
            let modifierGroupId = data.modifierGroupId;
            if (!modifierGroupId && data.modifierGroupName) {
              const { data: groups } = await (supabase as any).from("modifier_groups").select("id").ilike("name", data.modifierGroupName).limit(1);
              if (groups && groups.length > 0) modifierGroupId = groups[0].id;
            }
            if (!modifierGroupId) {
              toast({ title: "Modifier group required", description: "Please specify which modifier group this modifier belongs to.", variant: "destructive" });
              return false;
            }
            const { error } = await (supabase as any).from("modifiers").insert({
              name: data.name,
              price: data.price || 0,
              modifier_group_id: modifierGroupId,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("modifiers", data);
            if (!target) return notFoundToast("Modifier", data.name);
            const updates: any = {};
            if (data.newName || data.name) updates.name = data.newName || data.name;
            if (data.price !== undefined) updates.price = data.price;
            const { error } = await (supabase as any).from("modifiers").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("modifiers", data);
            if (!target) return notFoundToast("Modifier", data.name);
            const { error } = await (supabase as any).from("modifiers").update({ active: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("modifiers", data);
            if (!target) return notFoundToast("Modifier", data.name);
            const { error } = await (supabase as any).from("modifiers").update({ active: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("modifiers", data);
            if (!target) return notFoundToast("Modifier", data.name);
            const { error } = await (supabase as any).from("modifiers").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "addOn": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("add_ons").insert({
              name: data.name,
              price: data.price || 0,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = data.id ? { id: data.id } : await resolveByName("add_ons", data);
            if (!target) return notFoundToast("Add-on", data.name);
            const updates: any = {};
            if (data.newName || data.name) updates.name = data.newName || data.name;
            if (data.price !== undefined) updates.price = data.price;
            const { error } = await (supabase as any).from("add_ons").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("add_ons", data);
            if (!target) return notFoundToast("Add-on", data.name);
            const { error } = await (supabase as any).from("add_ons").update({ active: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("add_ons", data);
            if (!target) return notFoundToast("Add-on", data.name);
            const { error } = await (supabase as any).from("add_ons").update({ active: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("add_ons", data);
            if (!target) return notFoundToast("Add-on", data.name);
            const { error } = await (supabase as any).from("add_ons").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "defaultModifier": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("default_modifiers").insert({
              name: data.name,
              type: data.type || "Normal",
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("default_modifiers", data);
            if (!target) return notFoundToast("Default modifier", data.name);
            const updates: any = {};
            if (data.newName || data.name) updates.name = data.newName || data.name;
            if (data.type) updates.type = data.type;
            const { error } = await (supabase as any).from("default_modifiers").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("default_modifiers", data);
            if (!target) return notFoundToast("Default modifier", data.name);
            const { error } = await (supabase as any).from("default_modifiers").update({ archived: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("default_modifiers", data);
            if (!target) return notFoundToast("Default modifier", data.name);
            const { error } = await (supabase as any).from("default_modifiers").update({ archived: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("default_modifiers", data);
            if (!target) return notFoundToast("Default modifier", data.name);
            const { error } = await (supabase as any).from("default_modifiers").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "group": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("groups").insert({
              name: data.name,
              type: data.type || "Add-On",
              display_name: data.displayName || "",
              has_max_selections: !!data.hasMaxSelections,
              max_selections: data.maxSelections || 1,
              selected_modifiers: data.selectedModifiers || [],
              selected_add_ons: data.selectedAddOns || [],
              selected_default_modifiers: data.selectedDefaultModifiers || [],
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("groups", data);
            if (!target) return notFoundToast("Group", data.name);
            const updates: any = {};
            if (data.newName || data.name) updates.name = data.newName || data.name;
            if (data.type) updates.type = data.type;
            if (data.displayName !== undefined) updates.display_name = data.displayName;
            if (data.hasMaxSelections !== undefined) updates.has_max_selections = data.hasMaxSelections;
            if (data.maxSelections !== undefined) updates.max_selections = data.maxSelections;
            const { error } = await (supabase as any).from("groups").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "archive" || operation === "disable") {
            const target = await resolveByName("groups", data);
            if (!target) return notFoundToast("Group", data.name);
            const { error } = await (supabase as any).from("groups").update({ archived: true }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable") {
            const target = await resolveByName("groups", data);
            if (!target) return notFoundToast("Group", data.name);
            const { error } = await (supabase as any).from("groups").update({ archived: false }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete") {
            const target = await resolveByName("groups", data);
            if (!target) return notFoundToast("Group", data.name);
            const { error } = await (supabase as any).from("groups").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "timedPricing": {
          if (operation === "add") {
            const { error } = await (supabase as any).from("timed_pricing_rules").insert({
              name: data.name,
              type: data.type || "happy_hour",
              start_time: data.startTime || "4:00 PM",
              end_time: data.endTime || "6:00 PM",
              adjustment: data.adjustment ?? 0,
              days: Array.isArray(data.days) ? data.days : [],
              enabled: data.enabled !== false,
            });
            if (error) throw error;
          } else if (operation === "update") {
            const target = await resolveByName("timed_pricing_rules", data);
            if (!target) return notFoundToast("Timed pricing rule", data.name);
            const updates: any = {};
            if (data.newName || data.name) updates.name = data.newName || data.name;
            if (data.type) updates.type = data.type;
            if (data.startTime) updates.start_time = data.startTime;
            if (data.endTime) updates.end_time = data.endTime;
            if (data.adjustment !== undefined) updates.adjustment = data.adjustment;
            if (Array.isArray(data.days)) updates.days = data.days;
            if (data.enabled !== undefined) updates.enabled = data.enabled;
            const { error } = await (supabase as any).from("timed_pricing_rules").update(updates).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "enable" || operation === "disable") {
            const target = await resolveByName("timed_pricing_rules", data);
            if (!target) return notFoundToast("Timed pricing rule", data.name);
            const { error } = await (supabase as any).from("timed_pricing_rules").update({ enabled: operation === "enable" }).eq("id", target.id);
            if (error) throw error;
          } else if (operation === "remove" || operation === "delete" || operation === "archive") {
            const target = await resolveByName("timed_pricing_rules", data);
            if (!target) return notFoundToast("Timed pricing rule", data.name);
            const { error } = await (supabase as any).from("timed_pricing_rules").delete().eq("id", target.id);
            if (error) throw error;
          }
          break;
        }
        case "inventory": {
          // Inventory updates: set stock_count, toggle inventory_tracking, mark out_of_stock
          const target = data.id ? { id: data.id } : await resolveByName("products", data);
          if (!target) return notFoundToast("Product", data.name);
          const updates: any = {};
          if (data.stockCount !== undefined) updates.stock_count = data.stockCount;
          if (data.outOfStock !== undefined) updates.out_of_stock = data.outOfStock;
          if (data.inventoryTracking !== undefined) updates.inventory_tracking = data.inventoryTracking;
          if (data.negativeInventory !== undefined) updates.negative_inventory = data.negativeInventory;
          if (Object.keys(updates).length === 0) {
            toast({ title: "Nothing to update", description: "No inventory fields specified.", variant: "destructive" });
            return false;
          }
          const { error } = await (supabase as any).from("products").update(updates).eq("id", target.id);
          if (error) throw error;
          break;
        }
        default:
          return false;
      }
      // Broadcast global change so all listening module pages refresh
      window.dispatchEvent(new CustomEvent("pos-data-changed", { detail: { settingType, operation } }));
      window.dispatchEvent(new CustomEvent("products-updated"));
      window.dispatchEvent(new CustomEvent("menus-updated"));
      window.dispatchEvent(new CustomEvent("settings-updated", { detail: { type: settingType, operation } }));
      toast({ title: "Success", description: `${data.name || "Record"} has been ${operation === "add" ? "created" : operation + "d"} successfully.` });
      return true;
    } catch (error: any) {
      console.error("DB action error:", error);
      toast({ title: "Database Error", description: error.message || "Failed to execute the change.", variant: "destructive" });
      return false;
    }
  };

  // ── Helpers used by executeDbAction ─────────────────────────────────────
  const resolveByName = async (table: string, data: any): Promise<{ id: string } | null> => {
    if (data?.id) return { id: data.id };
    if (!data?.name) return null;
    const { data: rows } = await (supabase as any)
      .from(table)
      .select("id")
      .ilike("name", data.name)
      .limit(1);
    return rows && rows.length > 0 ? rows[0] : null;
  };

  const notFoundToast = (label: string, name?: string): false => {
    toast({ title: `${label} not found`, description: name ? `Could not find "${name}".` : "Item not found.", variant: "destructive" });
    return false;
  };

  // Preset colors for inline theme picker
  const THEME_PRESETS = [
    '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#7C3AED', '#9333EA', '#C026D3', '#64748B',
  ];

  // Color name mapping for natural language
  const COLOR_NAME_MAP: Record<string, string> = {
    red: '#EF4444', blue: '#3B82F6', green: '#10B981', purple: '#8B5CF6',
    orange: '#F97316', yellow: '#F59E0B', pink: '#EC4899', teal: '#14B8A6',
    cyan: '#06B6D4', indigo: '#6366F1', violet: '#7C3AED', amber: '#F59E0B',
    emerald: '#10B981', rose: '#F43F5E', sky: '#0EA5E9', lime: '#84CC16',
    fuchsia: '#C026D3', slate: '#64748B', gray: '#6B7280', white: '#FFFFFF',
    black: '#000000', navy: '#1E3A5F', maroon: '#800000', gold: '#FFD700',
    coral: '#FF6B6B', turquoise: '#40E0D0', magenta: '#FF00FF', lavender: '#E6E6FA',
    'dark purple': '#5B21B6', 'dark blue': '#1E40AF', 'dark green': '#166534',
    'light blue': '#93C5FD', 'light green': '#86EFAC', 'warm orange': '#EA580C',
  };

  // Derived color labels mapping
  const DERIVED_COLOR_MAP: Record<string, { setter: (v: string) => void; getter: string }> = {
    selection: { setter: setSelectionColor, getter: selectionColor },
    'selection color': { setter: setSelectionColor, getter: selectionColor },
    hover: { setter: setHoverColor, getter: hoverColor },
    'hover color': { setter: setHoverColor, getter: hoverColor },
    'top bar': { setter: setTopBarColor, getter: topBarColor },
    'top bar background': { setter: setTopBarColor, getter: topBarColor },
    'splash screen': { setter: setSplashBgColor, getter: splashBgColor },
    'splash': { setter: setSplashBgColor, getter: splashBgColor },
    'splash screen background': { setter: setSplashBgColor, getter: splashBgColor },
    'splash background': { setter: setSplashBgColor, getter: splashBgColor },
    'settings icon': { setter: setSettingsIconColor, getter: settingsIconColor },
    'settings icon color': { setter: setSettingsIconColor, getter: settingsIconColor },
  };

  // Detect and handle appearance-related intents locally
  const handleAppearanceIntent = (text: string): boolean => {
    const lower = text.toLowerCase().trim();

    // Theme color picker request
    if (lower.includes('change theme color') || lower.includes('change the theme color') || lower === 'change theme' || lower.includes('pick a theme') || lower.includes('select theme color') || lower.includes('choose theme')) {
      // Check if there's a specific color mentioned
      const colorMatch = findColorInText(lower);
      if (colorMatch) {
        applyThemeColor(colorMatch);
        addUserAndAssistantMessages(text, `Done! Theme color has been updated to **${colorMatch}**. The new color is now applied across the entire app.`);
        return true;
      }
      // Show inline color picker
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: "Choose a preset color below, or tap the color picker for a custom color:",
        timestamp: new Date(),
        inlineAction: "theme-color-picker",
      };
      setMessages(prev => [...prev.map(m => m.role === "assistant" ? { ...m, quickReplies: undefined } : m), userMsg, assistantMsg]);
      setInputValue("");
      return true;
    }

    // Brand logo upload request
    if (lower.includes('update brand logo') || lower.includes('change brand logo') || lower.includes('upload brand logo') || lower.includes('update logo') || lower.includes('change logo') || lower.includes('upload logo') || lower.includes('brand logo')) {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: partnerLogoUrl
          ? "Your current brand logo is shown below. You can replace it or remove it:"
          : "Upload a brand logo image (PNG, JPG, WebP, or SVG, max 2MB). It will appear in the sidebar and splash screen:",
        timestamp: new Date(),
        inlineAction: "brand-logo-upload",
      };
      setMessages(prev => [...prev.map(m => m.role === "assistant" ? { ...m, quickReplies: undefined } : m), userMsg, assistantMsg]);
      setInputValue("");
      return true;
    }

    // Derived color change via prompt (e.g. "change selection color to red")
    for (const [key, config] of Object.entries(DERIVED_COLOR_MAP)) {
      if (lower.includes(key)) {
        const colorMatch = findColorInText(lower);
        if (colorMatch) {
          config.setter(colorMatch);
          const label = key.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
          addUserAndAssistantMessages(text, `Done! **${label}** has been updated to **${colorMatch}**. The change is now active.`);
          return true;
        }
        // If they mention the element but no color, show picker
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
        const label = key.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(), role: "assistant",
          content: `Choose a color for **${label}**:`,
          timestamp: new Date(),
          inlineAction: "derived-color-picker",
          derivedColorTarget: key,
        };
        setMessages(prev => [...prev.map(m => m.role === "assistant" ? { ...m, quickReplies: undefined } : m), userMsg, assistantMsg]);
        setInputValue("");
        return true;
      }
    }

    // Generic "theme to <color>" or "make it <color>"
    if ((lower.includes('theme') || lower.includes('make it') || lower.includes('set color')) && !lower.includes('reset')) {
      const colorMatch = findColorInText(lower);
      if (colorMatch) {
        applyThemeColor(colorMatch);
        addUserAndAssistantMessages(text, `Done! Theme color has been updated to **${colorMatch}**. All derived colors have been adjusted automatically.`);
        return true;
      }
    }

    // Reset theme
    if (lower.includes('reset theme') || lower.includes('default theme') || lower.includes('reset all theme') || lower.includes('reset colors')) {
      resetAdvancedCustomization();
      addUserAndAssistantMessages(text, "Done! All theme colors have been reset to their defaults.");
      toast({ title: "Reset complete", description: "All theme colors reset to defaults." });
      return true;
    }

    return false;
  };

  const findColorInText = (text: string): string | null => {
    // Check for hex code
    const hexMatch = text.match(/#[0-9a-fA-F]{6}/);
    if (hexMatch) return hexMatch[0];
    // Check for color names (longest match first)
    const sortedNames = Object.keys(COLOR_NAME_MAP).sort((a, b) => b.length - a.length);
    for (const name of sortedNames) {
      if (text.includes(name)) return COLOR_NAME_MAP[name];
    }
    return null;
  };

  const addUserAndAssistantMessages = (userText: string, assistantText: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText, timestamp: new Date() };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: assistantText, timestamp: new Date() };
    setMessages(prev => [...prev.map(m => m.role === "assistant" ? { ...m, quickReplies: undefined } : m), userMsg, assistantMsg]);
    setInputValue("");
  };

  const handleSendMessage = async (content: string, imageDataUrl?: string | null) => {
    if (!content.trim() && !imageDataUrl) return;

    // Handle appearance intents locally when in appearance context
    if (!imageDataUrl && isAppearanceContext && handleAppearanceIntent(content.trim())) {
      return;
    }

    // Detect settings intent and show module buttons
    if (!imageDataUrl && isSettingsIntent(content.trim())) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Here are the available settings modules. Tap any to explore:",
        timestamp: new Date(),
        quickReplies: SETTINGS_QUICK_ACTIONS,
      };
      setMessages((prev) => [
        ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined, multiSelect: undefined } : msg),
        userMessage,
        assistantMessage,
      ]);
      setInputValue("");
      return;
    }

    // Detect order intent and route to order chat
    if (!imageDataUrl && isOrderIntent(content.trim())) {
      handleOrderMessage(content.trim());
      return;
    }
    // If already in order mode, continue routing to order chat
    if (orderMode && !imageDataUrl) {
      handleOrderMessage(content.trim());
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim() || "📷 Uploaded a menu image for analysis",
      timestamp: new Date(),
      imageUrl: imageDataUrl || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    clearUploadedImage();
    setIsTyping(true);

    // Build conversation history entry - for image messages, use multimodal content
    const userHistoryEntry: any = imageDataUrl
      ? {
          role: "user",
          content: [
            { type: "text", text: content.trim() || "I've uploaded a menu image. Please analyze it and extract all the menu items, categories, and prices. Then help me create a menu from this image." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        }
      : { role: "user", content: content.trim() };

    const newHistory = [...conversationHistory, userHistoryEntry];
    setConversationHistory(newHistory);

    try {
      // Get device ID for API key lookup
      const deviceId = localStorage.getItem("pos_device_id") || "";
      
      // Call the AI edge function with provider/model info
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-settings-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newHistory,
            settingsContext: getSettingsContext(),
            provider: selectedProvider,
            model: selectedModel,
            deviceId,
            context, // current settings module (e.g. "menu-products", "system-appearance", "account")
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Add fallback message to chat so conversation continues smoothly
        const fallbackContent = response.status === 429
          ? "I'm receiving too many requests right now. Please wait a moment and try again."
          : response.status === 402
          ? "I'm temporarily unavailable. Please try again shortly."
          : errorData.error || "Something went wrong. Please try again.";

        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallbackContent,
          timestamp: new Date(),
          quickReplies: ["Try Again"],
        };

        setMessages((prev) => [
          ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined, multiSelect: undefined } : msg),
          fallbackMessage,
        ]);
        setConversationHistory((prev) => [...prev, { role: "assistant", content: fallbackContent }]);
        setIsTyping(false);
        return;
      }

      const data = await response.json();
      
      let pendingChange: PendingChange | undefined;
      let navigateTo: string | undefined;
      let appliedChange: AppliedChange | undefined;
      let reportData: ReportData | undefined;

      // Process the AI action
      const action = data.action as AIAction;
      
      if (action?.type === "update_setting") {
        const change: PendingChange = {
          id: Date.now().toString(),
          setting: action.setting || "Setting",
          path: action.path || "Settings",
          currentValue: typeof action.currentValue === 'object' ? JSON.stringify(action.currentValue) : (action.currentValue || "Current"),
          newValue: typeof action.newValue === 'object' ? JSON.stringify(action.newValue) : (action.newValue || "New"),
          status: "pending",
          settingType: action.settingType,
          operation: action.operation,
          data: action.data || (typeof action.newValue === 'object' ? action.newValue : undefined),
        };

        // Auto-apply if marked as autoApply (for simple toggle/enable/disable changes)
        if (action.autoApply === true) {
          const success = await executeAction(change);
          if (success) {
            change.status = "applied";
            appliedChange = {
              setting: change.setting,
              path: change.path,
              value: change.newValue,
              settingType: change.settingType,
              data: change.data,
            };
            // Track for undo
            setAppliedChanges((prev) => [...prev, appliedChange!]);
          } else {
            // If auto-apply failed, show as pending for manual retry
            pendingChange = change;
          }
        } else {
          // Show confirmation UI for non-auto-apply changes
          pendingChange = change;
        }
      } else if (action?.type === "ai_rules_updated") {
        // AI rules were updated server-side, show toast
        const ruleLabels: Record<string, string> = { dos: "Do's", donts: "Don'ts", custom_instructions: "Custom Instructions", restaurant_type: "Restaurant Type", knowledge_base: "Knowledge Base" };
        const label = ruleLabels[action.ruleType || ""] || action.ruleType;
        if (action.success) {
          toast({ title: "AI Rules Updated", description: `${label} ${action.operation === "add" ? "rule added" : action.operation === "remove" ? "rule removed" : "updated"} successfully.` });
          appliedChange = { setting: `AI Rules - ${label}`, path: "AI Instructions", value: typeof action.value === "string" ? action.value : JSON.stringify(action.value), settingType: "ai_rules" };
        } else {
          toast({ title: "Update Failed", description: action.error || `Failed to update ${label}.`, variant: "destructive" });
        }
      } else if (action?.type === "generate_report") {
        // Fetch report data from database
        try {
          const startDate = action.startDate || new Date().toISOString().split("T")[0];
          const endDate = action.endDate || new Date().toISOString().split("T")[0];
          const startTime = action.startTime || "00:00";
          const endTime = action.endTime || "23:59";
          
          const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
          const endISO = new Date(`${endDate}T${endTime}:59.999`).toISOString();
          
          const [ordersRes, itemsRes] = await Promise.all([
            (supabase as any).from("orders").select("*").gte("created_at", startISO).lte("created_at", endISO).order("created_at", { ascending: false }),
            (supabase as any).from("order_items").select("*, orders!inner(created_at)").gte("orders.created_at", startISO).lte("orders.created_at", endISO),
          ]);

          const orders = ordersRes.data || [];
          const orderItems = itemsRes.data || [];
          const completed = orders.filter((o: any) => o.status === "completed");
          const refunded = orders.filter((o: any) => o.status === "refunded");
          
          const orderSummary = {
            numberOfOrders: completed.length,
            numberOfRefunds: refunded.length,
            refundAmount: refunded.reduce((s: number, o: any) => s + Number(o.refund_amount), 0),
            netSales: completed.reduce((s: number, o: any) => s + Number(o.subtotal) - Number(o.discount_amount), 0),
            discounts: orders.reduce((s: number, o: any) => s + Number(o.discount_amount), 0),
            tips: orders.reduce((s: number, o: any) => s + Number(o.tip_amount), 0),
            tax: completed.reduce((s: number, o: any) => s + Number(o.tax_amount), 0),
            total: completed.reduce((s: number, o: any) => s + Number(o.total), 0),
          };

          const paymentMap = new Map<string, { transactions: number; amount: number }>();
          completed.forEach((o: any) => {
            const existing = paymentMap.get(o.payment_type) || { transactions: 0, amount: 0 };
            paymentMap.set(o.payment_type, { transactions: existing.transactions + 1, amount: existing.amount + Number(o.total) });
          });
          const paymentTypes = Array.from(paymentMap.entries()).map(([type, d]) => ({ type, ...d }));

          const completedIds = new Set(completed.map((o: any) => o.id));
          const catMap = new Map<string, { products: number; sales: number }>();
          orderItems.filter((i: any) => completedIds.has(i.order_id)).forEach((i: any) => {
            const existing = catMap.get(i.category) || { products: 0, sales: 0 };
            catMap.set(i.category, { products: existing.products + Number(i.quantity), sales: existing.sales + Number(i.total_price) });
          });
          const categories = Array.from(catMap.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.sales - a.sales);

          const formatDate = (d: string) => { const dt = new Date(d + "T00:00:00"); return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); };
          const dateRange = startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} – ${formatDate(endDate)}`;

          reportData = { orderSummary, paymentTypes, categories, dateRange };
        } catch (e) {
          console.error("Report generation error:", e);
        }
      } else if (action?.type === "navigate" && action.path) {
        navigateTo = action.path;
      }

      // Sanitize message: strip any JSON/code that leaked into the message
      let messageText: string = typeof data.message === 'string' ? data.message : (data.message ? JSON.stringify(data.message) : "I'm not sure how to help with that. Could you rephrase?");
      // If the entire message looks like JSON, extract just the "message" field
      if (messageText.trim().startsWith("{") || messageText.trim().startsWith("```")) {
        try {
          let clean = messageText.trim();
          if (clean.startsWith("```json")) clean = clean.slice(7);
          if (clean.startsWith("```")) clean = clean.slice(3);
          if (clean.endsWith("```")) clean = clean.slice(0, -3);
          const parsed = JSON.parse(clean.trim());
          if (parsed.message) messageText = parsed.message;
        } catch {
          // Strip code blocks if present
          messageText = messageText.replace(/```[\s\S]*?```/g, "").trim();
          // Strip JSON-like content
          messageText = messageText.replace(/\{[\s\S]*\}/g, "").trim();
          if (!messageText) messageText = "Got it! What would you like to do next?";
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: messageText,
        timestamp: new Date(),
        pendingChange,
        appliedChange,
        navigateTo,
        quickReplies: data.quickReplies || undefined,
        multiSelect: data.multiSelect === true,
        reportData,
      };

      // Clear quickReplies from previous assistant messages
      setMessages((prev) => [
        ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined, multiSelect: undefined } : msg),
        assistantMessage,
      ]);
      setConversationHistory((prev) => [...prev, { role: "assistant", content: typeof messageText === 'string' ? messageText : JSON.stringify(messageText) }]);
      setIsTyping(false);

    } catch (error) {
      console.error("Error calling AI:", error);
      const errorFallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I couldn't connect right now. Please check your connection and try again.",
        timestamp: new Date(),
        quickReplies: ["Try Again"],
      };
      setMessages((prev) => [
        ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined, multiSelect: undefined } : msg),
        errorFallback,
      ]);
      setConversationHistory((prev) => [...prev, { role: "assistant", content: errorFallback.content }]);
      setIsTyping(false);
    }
  };

  const handleApplyChange = async (messageId: string, change: PendingChange) => {
    const success = await executeAction(change);
    
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to apply the change. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Update the message to show applied state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              pendingChange: { ...change, status: "applied" },
              appliedChange: {
                setting: change.setting,
                path: change.path,
                value: change.newValue,
                settingType: change.settingType,
                data: change.data,
              },
            }
          : msg
      )
    );

    // Track applied changes for undo
    setAppliedChanges((prev) => [
      ...prev,
      { setting: change.setting, path: change.path, value: change.newValue, settingType: change.settingType, data: change.data },
    ]);

    // Add confirmation message
    setTimeout(() => {
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✓ Done! ${change.setting} has been updated successfully.\n\nThe change is now active. Is there anything else you'd like to adjust?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }, 400);
  };

  const handleDismissChange = (messageId: string, change: PendingChange) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, pendingChange: { ...change, status: "dismissed" } }
          : msg
      )
    );

    setTimeout(() => {
      const dismissMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "No problem, I've canceled that change. What else can I help you with?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, dismissMessage]);
    }, 300);
  };

  const handleUndoChange = (change: AppliedChange) => {
    setAppliedChanges((prev) =>
      prev.filter((c) => c.setting !== change.setting)
    );

    // Note: Full undo would require storing previous values
    const undoMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `↩ "${change.setting}" has been marked for undo. To fully revert, please visit ${change.path} and adjust manually.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, undoMessage]);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue, uploadedImage);
  };

  const handleChipClick = (chip: SuggestionChip) => {
    if (chip.prompt === "__UPLOAD_IMAGE__") {
      // Image upload removed
      return;
    }
    handleSendMessage(chip.prompt);
  };

  const renderPendingChange = (messageId: string, change: PendingChange) => {
    if (change.status === "applied") {
      return (
        <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Change Applied</span>
          </div>
          <p className="text-xs text-muted-foreground">{change.path}</p>
        </div>
      );
    }

    if (change.status === "dismissed") {
      return (
        <div className="mt-3 bg-neutral-700/30 border border-neutral-600/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Change Canceled</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 bg-neutral-700/40 rounded-xl p-3 border border-neutral-600/30">
        {/* Change Preview */}
        <div className="flex items-start gap-2 mb-3">
          <Eye className="w-4 h-4 text-violet-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{change.setting}</p>
            <p className="text-xs text-muted-foreground">{change.path}</p>
          </div>
        </div>

        {/* Before/After */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-14">Current:</span>
            <span className="text-neutral-400 line-through">{typeof change.currentValue === 'object' ? JSON.stringify(change.currentValue) : change.currentValue}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-14">New:</span>
            <span className="text-green-400 font-medium">{typeof change.newValue === 'object' ? JSON.stringify(change.newValue) : change.newValue}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleApplyChange(messageId, change)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 px-3 text-sm font-medium active:opacity-70 transition-opacity"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
          <button
            onClick={() => handleDismissChange(messageId, change)}
            className="flex items-center justify-center gap-2 bg-neutral-700/60 text-foreground rounded-lg py-2 px-3 text-sm font-medium active:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderNavigateButton = (path: string) => (
    <button
      onClick={() => handleNavigate(path)}
      className="mt-3 w-full flex items-center justify-center gap-2 bg-neutral-700/40 hover:bg-neutral-700/60 text-foreground rounded-xl py-3 px-4 text-sm font-medium active:opacity-70 transition-all border border-neutral-600/30"
    >
      <ExternalLink className="w-4 h-4" />
      Go to Settings
    </button>
  );

  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      const trimmed = line.trim();
      
      // Horizontal rule
      if (/^[━─—-]{3,}$/.test(trimmed)) {
        return <hr key={lineIndex} className="border-neutral-700/50 my-2" />;
      }
      
      // Bullet point lines (•, -, *)
      const bulletMatch = trimmed.match(/^([•\-\*])\s+(.*)$/);
      if (bulletMatch) {
        return (
          <div key={lineIndex} className="flex gap-2 pl-1 py-0.5">
            <span className="text-muted-foreground flex-shrink-0">•</span>
            <span>{renderInlineFormatting(bulletMatch[2])}</span>
          </div>
        );
      }

      // Numbered list lines
      const numberedMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
      if (numberedMatch) {
        return (
          <div key={lineIndex} className="flex gap-2 pl-1 py-0.5">
            <span className="text-muted-foreground flex-shrink-0 min-w-[1.2em]">{numberedMatch[1]}</span>
            <span>{renderInlineFormatting(numberedMatch[2])}</span>
          </div>
        );
      }
      
      // Empty line = spacing
      if (trimmed === '') {
        return <div key={lineIndex} className="h-2" />;
      }

      // Normal line with inline formatting
      return (
        <span key={lineIndex}>
          {renderInlineFormatting(line)}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Split on bold (**), italic (*), and keep text
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#131316]">
      {/* Header with Provider Selector */}
      {showHeader && onBack && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
          {/* Provider/Model Selector */}
          <div className="relative" ref={providerDropdownRef}>
            <button
              onClick={() => { setShowProviderDropdown(!showProviderDropdown); setShowModelDropdown(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800/60 hover:bg-neutral-700/60 active:opacity-70 transition-all border border-neutral-700/40"
            >
              <span className={activeProvider.color}>{activeProvider.icon}</span>
              <span className="text-sm font-medium text-foreground">{activeProvider.name}</span>
              <span className="text-xs text-muted-foreground">· {activeModel.name}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", showProviderDropdown && "rotate-180")} />
            </button>

            {/* Provider Dropdown */}
            {showProviderDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-900 border border-neutral-700/60 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5">AI Provider</p>
                  {AI_PROVIDERS.map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => {
                        if (prov.id !== selectedProvider) {
                          setSelectedProvider(prov.id);
                          setSelectedModel(prov.models[0].id);
                        }
                        setShowProviderDropdown(false);
                        setShowModelDropdown(true);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                        selectedProvider === prov.id ? "bg-neutral-800" : "hover:bg-neutral-800/60"
                      )}
                    >
                      <span className={prov.color}>{prov.icon}</span>
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-foreground">{prov.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{prov.models.length} models</span>
                      </div>
                      {selectedProvider === prov.id && (
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-neutral-800 p-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5">Model</p>
                  {activeProvider.models.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setSelectedModel(mod.id);
                        setShowProviderDropdown(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                        selectedModel === mod.id ? "bg-neutral-800" : "hover:bg-neutral-800/60"
                      )}
                    >
                      <div className="flex-1 text-left">
                        <span className="text-sm text-foreground">{mod.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{mod.description}</span>
                      </div>
                      {selectedModel === mod.id && (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <button
              onClick={() => navigate("/settings/network/ai-integration")}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity hover:bg-neutral-700/60"
              title="AI Settings"
            >
              <Settings className="w-4.5 h-4.5 text-muted-foreground" />
            </button>
            {/* Close Button */}
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Applied Changes Bar */}
      {appliedChanges.length > 0 && (
        <div className="flex-shrink-0 bg-green-500/10 border-b border-green-500/20 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">
                {appliedChanges.length} change{appliedChanges.length > 1 ? "s" : ""} applied
              </span>
            </div>
            <button
              onClick={() => appliedChanges.length > 0 && handleUndoChange(appliedChanges[appliedChanges.length - 1])}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:opacity-70 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo last
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar for Appearance context */}
      {isAppearanceContext && (
        <div className="flex-shrink-0 px-4 pt-2 pb-1 border-b border-neutral-800/50">
          <div className="flex gap-1 bg-neutral-800/60 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'chat'
                  ? "bg-neutral-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('more')}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'more'
                  ? "bg-neutral-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              More
            </button>
          </div>
        </div>
      )}

      {/* More Tab Content */}
      {isAppearanceContext && activeTab === 'more' ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-5">
          {/* Theme Color */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 px-1 uppercase tracking-wider">Theme Color</p>
            <div className="bg-neutral-800/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-700/50 flex-shrink-0">
                  <Palette className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Primary Theme</p>
                  <p className="text-xs text-muted-foreground">Main color for the entire app</p>
                </div>
                <label className="relative cursor-pointer">
                  <div
                    className="w-8 h-8 rounded-lg border border-neutral-600 cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: themeColor }}
                  />
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => applyThemeColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#A855F7'].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => applyThemeColor(hex)}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all hover:scale-110",
                      themeColor === hex && "ring-2 ring-white ring-offset-1 ring-offset-neutral-900"
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Derived Colors */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 px-1 uppercase tracking-wider">Customize Colors</p>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              {[
                { label: "Selection Color", value: selectionColor, onChange: setSelectionColor },
                { label: "Hover Color", value: hoverColor, onChange: setHoverColor },
                { label: "Top Bar Background", value: topBarColor, onChange: setTopBarColor },
                { label: "Splash Screen", value: splashBgColor, onChange: setSplashBgColor },
                { label: "Settings Icon Color", value: settingsIconColor, onChange: setSettingsIconColor },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between py-3 px-4">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <label className="relative cursor-pointer">
                      <div
                        className="w-7 h-7 rounded-lg border border-neutral-600 cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: item.value }}
                      />
                      <input
                        type="color"
                        value={item.value}
                        onChange={(e) => item.onChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Brand Logo */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 px-1 uppercase tracking-wider">Brand Logo</p>
            <div className="bg-neutral-800/60 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-700/50 flex-shrink-0">
                  <Image className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Brand Logo</p>
                  <p className="text-xs text-muted-foreground">Shown in sidebar and splash screen</p>
                </div>
                {partnerLogoUrl ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center overflow-hidden border border-neutral-600">
                      <img src={partnerLogoUrl} alt="Logo" className="w-7 h-7 object-contain" />
                    </div>
                    <button
                      onClick={() => { setPartnerLogoUrl(''); toast({ title: "Logo removed" }); }}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-neutral-700/50"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => brandLogoInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-foreground px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                )}
              </div>
              <input
                ref={brandLogoInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast({ title: "File too large", description: "Max 2MB.", variant: "destructive" });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPartnerLogoUrl(reader.result as string);
                    toast({ title: "Logo updated" });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>

          {/* Quick AI Actions */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 px-1 uppercase tracking-wider">Quick AI Actions</p>
            <div className="space-y-1.5">
              {[
                { label: "Change theme to blue", prompt: "Change the theme color to blue" },
                { label: "Make it dark purple", prompt: "Set theme color to dark purple" },
                { label: "Use warm orange tones", prompt: "Change the theme to warm orange" },
                { label: "Reset to defaults", prompt: "Reset all theme colors to defaults" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => { setActiveTab('chat'); handleSendMessage(action.prompt); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-700/60 text-sm text-foreground transition-all text-left"
                >
                  <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Use Default Theme Button */}
          <button
            onClick={() => {
              resetAdvancedCustomization();
              toast({ title: "Reset complete", description: "All theme colors reset to defaults." });
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Use Default Theme
          </button>
        </div>
      ) : (
      /* Messages Area */
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="mb-4 overflow-visible">
              <AnimatedAIIcon size={56} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              How can I help you today?
            </h2>
            <p className="text-muted-foreground text-sm mb-2 max-w-sm">
              I can view, update, and manage all your settings. Just tell me what you need!
            </p>
            
            {/* Active Provider Badge */}
            <div className="flex items-center gap-1.5 mb-6 px-3 py-1.5 rounded-full bg-neutral-800/60 border border-neutral-700/40">
              <span className={activeProvider.color}>{activeProvider.icon}</span>
              <span className="text-xs text-muted-foreground">Powered by</span>
              <span className="text-xs font-medium text-foreground">{activeProvider.name} · {activeModel.name}</span>
            </div>
            
            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-800/60 text-sm text-foreground hover:bg-neutral-700/60 active:opacity-70 transition-all border border-neutral-700/50"
                >
                  <span className="text-violet-400">{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>
            
            {/* Example commands hint */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground mb-1">Try asking:</p>
              <div className="space-y-1.5 text-xs text-neutral-500">
                <p>"Update Sales Tax to 9%"</p>
                <p>"Add a 15% student discount"</p>
                <p>"Set delivery fee to $6"</p>
                <p>"Activate the Weekend Brunch menu"</p>
                <p>"Enable online ordering for Lunch Menu"</p>
                <p>"Set 20% auto gratuity for parties of 8+"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 -ml-1">
                    <AnimatedAIIcon size={24} />
                  </div>
                )}
                <div className="max-w-[85%]">
                  {/* Image preview in message */}
                  {message.imageUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-w-[200px]">
                      <img src={message.imageUrl} alt="Uploaded menu" className="w-full h-auto rounded-xl" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-neutral-800/60 text-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
                  </div>
                  
                  {/* Auto-Applied Change Indicator */}
                  {message.appliedChange && !message.pendingChange && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-green-400 mb-1">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Change Applied</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{message.appliedChange.setting} → {typeof message.appliedChange.value === 'object' ? JSON.stringify(message.appliedChange.value) : message.appliedChange.value}</p>
                    </div>
                  )}
                  
                  {/* Pending Change Card */}
                  {message.pendingChange && renderPendingChange(message.id, message.pendingChange)}
                  
                  {/* Navigate Button */}
                  {/* Background-screen navigation suppressed: AI must not redirect the user. */}
                  {/* {message.navigateTo && renderNavigateButton(message.navigateTo)} */}

                  {/* Inline Theme Color Picker */}
                  {message.inlineAction === "theme-color-picker" && (
                    <div className="mt-3 bg-neutral-800/60 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preset Colors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {THEME_PRESETS.map((hex) => (
                          <button
                            key={hex}
                            onClick={() => {
                              applyThemeColor(hex);
                              const confirmMsg: Message = {
                                id: Date.now().toString(), role: "assistant",
                                content: `Theme color updated to **${hex}**! All derived colors have been adjusted automatically.`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, confirmMsg]);
                              toast({ title: "Theme updated", description: `Theme color set to ${hex}` });
                            }}
                            className={cn(
                              "w-8 h-8 rounded-lg transition-all hover:scale-110",
                              themeColor === hex && "ring-2 ring-white ring-offset-1 ring-offset-neutral-900"
                            )}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="relative cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors text-sm text-neutral-300">
                          <Palette className="w-4 h-4" />
                          Custom Color
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => {
                              applyThemeColor(e.target.value);
                              const confirmMsg: Message = {
                                id: Date.now().toString(), role: "assistant",
                                content: `Theme color updated to **${e.target.value}**!`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, confirmMsg]);
                              toast({ title: "Theme updated" });
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </label>
                        <div className="w-6 h-6 rounded-md border border-neutral-600" style={{ backgroundColor: themeColor }} />
                      </div>
                    </div>
                  )}

                  {/* Inline Brand Logo Upload */}
                  {message.inlineAction === "brand-logo-upload" && (
                    <div className="mt-3 bg-neutral-800/60 rounded-xl p-4 space-y-3">
                      {partnerLogoUrl && (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-neutral-700/50 flex items-center justify-center overflow-hidden border border-neutral-600">
                            <img src={partnerLogoUrl} alt="Brand Logo" className="w-14 h-14 object-contain" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => brandLogoInputRef.current?.click()}
                              className="text-xs text-neutral-300 hover:text-foreground px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors"
                            >
                              Replace
                            </button>
                            <button
                              onClick={() => {
                                setPartnerLogoUrl('');
                                toast({ title: "Logo removed" });
                                const confirmMsg: Message = { id: Date.now().toString(), role: "assistant", content: "Brand logo has been removed. The default logo will be used.", timestamp: new Date() };
                                setMessages(prev => [...prev, confirmMsg]);
                              }}
                              className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {!partnerLogoUrl && (
                        <button
                          onClick={() => brandLogoInputRef.current?.click()}
                          className="flex items-center gap-2 text-sm text-neutral-300 hover:text-foreground px-4 py-2.5 rounded-xl bg-neutral-700/50 hover:bg-neutral-600/50 border border-dashed border-neutral-600 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </button>
                      )}
                      <input
                        ref={brandLogoInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            toast({ title: "File too large", description: "Max 2MB.", variant: "destructive" });
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            setPartnerLogoUrl(reader.result as string);
                            toast({ title: "Logo updated" });
                            const confirmMsg: Message = { id: Date.now().toString(), role: "assistant", content: "Brand logo has been updated successfully! It will now appear in the sidebar and splash screen.", timestamp: new Date() };
                            setMessages(prev => [...prev, confirmMsg]);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  )}

                  {/* Inline Derived Color Picker */}
                  {message.inlineAction === "derived-color-picker" && message.derivedColorTarget && (
                    <div className="mt-3 bg-neutral-800/60 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {THEME_PRESETS.map((hex) => (
                          <button
                            key={hex}
                            onClick={() => {
                              const target = DERIVED_COLOR_MAP[message.derivedColorTarget!];
                              if (target) {
                                target.setter(hex);
                                const label = message.derivedColorTarget!.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                                const confirmMsg: Message = { id: Date.now().toString(), role: "assistant", content: `**${label}** updated to **${hex}**.`, timestamp: new Date() };
                                setMessages(prev => [...prev, confirmMsg]);
                                toast({ title: `${label} updated` });
                              }
                            }}
                            className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <label className="relative cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors text-sm text-neutral-300 w-fit">
                        <Palette className="w-4 h-4" />
                        Custom Color
                        <input
                          type="color"
                          value={DERIVED_COLOR_MAP[message.derivedColorTarget]?.getter || themeColor}
                          onChange={(e) => {
                            const target = DERIVED_COLOR_MAP[message.derivedColorTarget!];
                            if (target) {
                              target.setter(e.target.value);
                              const label = message.derivedColorTarget!.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                              const confirmMsg: Message = { id: Date.now().toString(), role: "assistant", content: `**${label}** updated to **${e.target.value}**.`, timestamp: new Date() };
                              setMessages(prev => [...prev, confirmMsg]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  )}

                  {/* Sales Report Data */}
                  {message.reportData && (
                    <div className="mt-3 space-y-3">
                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-3 py-2 border-b border-border">
                          <span className="text-xs font-semibold text-foreground">Order Summary</span>
                          <span className="text-xs text-muted-foreground ml-2">({message.reportData.dateRange})</span>
                        </div>
                        {[
                          { label: "Orders", value: String(message.reportData.orderSummary.numberOfOrders) },
                          { label: "Refunds", value: String(message.reportData.orderSummary.numberOfRefunds) },
                          { label: "Refund Amount", value: `£${message.reportData.orderSummary.refundAmount.toFixed(2)}` },
                          { label: "Net Sales", value: `£${message.reportData.orderSummary.netSales.toFixed(2)}` },
                          { label: "Discounts", value: `£${message.reportData.orderSummary.discounts.toFixed(2)}` },
                          { label: "Tips", value: `£${message.reportData.orderSummary.tips.toFixed(2)}` },
                          { label: "Tax", value: `£${message.reportData.orderSummary.tax.toFixed(2)}` },
                          { label: "Total", value: `£${message.reportData.orderSummary.total.toFixed(2)}`, bold: true },
                        ].map((row, i) => (
                          <div key={row.label}>
                            {i > 0 && <div className="h-px bg-border mx-3" />}
                            <div className="flex items-center justify-between py-2 px-3">
                              <span className="text-xs text-muted-foreground">{row.label}</span>
                              <span className={cn("text-xs", (row as any).bold ? "font-semibold text-foreground" : "text-muted-foreground")}>{row.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {message.reportData.paymentTypes.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-border">
                            <span className="text-xs font-semibold text-foreground">By Payment Type</span>
                          </div>
                          {message.reportData.paymentTypes.map((pt, i) => (
                            <div key={pt.type}>
                              {i > 0 && <div className="h-px bg-border mx-3" />}
                              <div className="flex items-center justify-between py-2 px-3">
                                <span className="text-xs text-muted-foreground">{pt.type}</span>
                                <span className="text-xs text-muted-foreground">{pt.transactions} txn · £{pt.amount.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.reportData.categories.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-border">
                            <span className="text-xs font-semibold text-foreground">By Category</span>
                          </div>
                          {message.reportData.categories.map((cat, i) => (
                            <div key={cat.name}>
                              {i > 0 && <div className="h-px bg-border mx-3" />}
                              <div className="flex items-center justify-between py-2 px-3">
                                <span className="text-xs text-muted-foreground">{cat.name}</span>
                                <span className="text-xs text-muted-foreground">{cat.products} products · £{cat.sales.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Print Report Button */}
                      <button
                        onClick={() => {
                          const rd = message.reportData!;
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return;
                          printWindow.document.write(`
                            <html><head><title>Sales Report - ${rd.dateRange}</title>
                            <style>
                              body { font-family: 'Montserrat', Arial, sans-serif; padding: 32px; color: #1a1a1a; }
                              h1 { font-size: 20px; margin-bottom: 4px; }
                              h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
                              .sub { color: #666; font-size: 12px; margin-bottom: 20px; }
                              table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
                              td { padding: 6px 0; border-bottom: 1px solid #eee; }
                              td:last-child { text-align: right; }
                              .bold td { font-weight: 600; border-top: 2px solid #333; }
                              @media print { body { padding: 16px; } }
                            </style></head><body>
                            <h1>Sales Report</h1>
                            <p class="sub">${rd.dateRange} | Generated ${new Date().toLocaleString()}</p>
                            <h2>Order Summary</h2>
                            <table>
                              <tr><td>Orders</td><td>${rd.orderSummary.numberOfOrders}</td></tr>
                              <tr><td>Refunds</td><td>${rd.orderSummary.numberOfRefunds}</td></tr>
                              <tr><td>Refund Amount</td><td>£${rd.orderSummary.refundAmount.toFixed(2)}</td></tr>
                              <tr><td>Net Sales</td><td>£${rd.orderSummary.netSales.toFixed(2)}</td></tr>
                              <tr><td>Discounts</td><td>£${rd.orderSummary.discounts.toFixed(2)}</td></tr>
                              <tr><td>Tips</td><td>£${rd.orderSummary.tips.toFixed(2)}</td></tr>
                              <tr><td>Tax</td><td>£${rd.orderSummary.tax.toFixed(2)}</td></tr>
                              <tr class="bold"><td>Total</td><td>£${rd.orderSummary.total.toFixed(2)}</td></tr>
                            </table>
                            ${rd.paymentTypes.length > 0 ? `<h2>By Payment Type</h2><table>${rd.paymentTypes.map(pt => `<tr><td>${pt.type}</td><td>${pt.transactions} txn - £${pt.amount.toFixed(2)}</td></tr>`).join('')}</table>` : ''}
                            ${rd.categories.length > 0 ? `<h2>By Category</h2><table>${rd.categories.map(cat => `<tr><td>${cat.name}</td><td>${cat.products} products - £${cat.sales.toFixed(2)}</td></tr>`).join('')}</table>` : ''}
                            </body></html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-800/60 text-sm text-foreground hover:bg-neutral-700/60 active:opacity-70 transition-all border border-neutral-700/50"
                      >
                        <Printer className="w-4 h-4" />
                        Print Report
                      </button>
                    </div>
                  )}

                  {/* Quick Reply Buttons (banned navigation labels filtered out) */}
                  {message.quickReplies && message.quickReplies.length > 0 && (() => {
                    const BANNED_REPLIES = new Set([
                      "view menu", "view menus", "view product", "view products",
                      "view discount", "view discounts", "go to setting", "go to settings",
                    ]);
                    const replies = message.quickReplies.filter(
                      (r) => typeof r === "string" && !BANNED_REPLIES.has(r.trim().toLowerCase())
                    );
                    if (replies.length === 0) return null;
                    return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.multiSelect ? (
                        <>
                          {replies.filter(r => r !== "Done" && r !== "Skip").map((reply) => {
                            const selected = (multiSelectState[message.id] || []).includes(reply);
                            return (
                              <button
                                key={reply}
                                onClick={() => {
                                  setMultiSelectState(prev => {
                                    const current = prev[message.id] || [];
                                    if (reply === "All" || reply === "All Devices") {
                                      const allOptions = replies.filter(r => r !== "Done" && r !== "Skip" && r !== "All" && r !== "All Devices");
                                      return { ...prev, [message.id]: allOptions };
                                    }
                                    return {
                                      ...prev,
                                      [message.id]: current.includes(reply)
                                        ? current.filter(r => r !== reply)
                                        : [...current, reply]
                                    };
                                  });
                                }}
                                disabled={isTyping}
                                className={cn(
                                  "px-4 py-2.5 rounded-full text-sm border active:scale-95 transition-all font-medium",
                                  selected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-neutral-800/80 text-foreground border-neutral-600/50 hover:bg-neutral-700/80"
                                )}
                              >
                                {selected && <span className="mr-1.5">✓</span>}
                                {reply}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => {
                              const selected = multiSelectState[message.id] || [];
                              if (selected.length > 0) {
                                handleSendMessage(selected.join(", "));
                                setMultiSelectState(prev => { const n = {...prev}; delete n[message.id]; return n; });
                              }
                            }}
                            disabled={isTyping || !(multiSelectState[message.id]?.length)}
                            className={cn(
                              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95",
                              (multiSelectState[message.id]?.length)
                                ? "bg-green-500 text-white border border-green-400"
                                : "bg-neutral-700/40 text-neutral-500 border border-neutral-700/50"
                            )}
                          >
                            ✓ Done
                          </button>
                          {replies.includes("Skip") && (
                            <button
                              onClick={() => handleSendMessage("Skip")}
                              disabled={isTyping}
                              className="px-4 py-2.5 rounded-full text-sm text-neutral-400 border border-neutral-700/50 bg-neutral-800/40 hover:bg-neutral-700/60 transition-all active:scale-95 font-medium"
                            >
                              Skip
                            </button>
                          )}
                        </>
                      ) : (
                        replies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => {
                              // Map settings module labels to hierarchical navigation
                              if (handleSettingsQuickReply(reply)) return;
                              // Settings AI does NOT support order-mode quick actions.
                              // Ignore any legacy "Browse Menu / Order Type / View Summary / Go to Orders / Summary / Clear" replies.
                              if (["Browse Menu", "Order Type", "View Summary", "Go to Orders", "Summary", "Clear"].includes(reply)) return;
                              handleSendMessage(reply);
                            }}
                            disabled={isTyping}
                            className="px-4 py-2.5 rounded-full bg-neutral-800/80 text-sm text-foreground border border-neutral-600/50 active:opacity-70 active:scale-95 transition-all hover:bg-neutral-700/80 disabled:opacity-40 font-medium"
                          >
                            {reply}
                          </button>
                        ))
                      )}
                    </div>
                    );
                  })()}
                </div>
                {message.role === "user" && (
                  <Avatar className="w-8 h-8 rounded-lg flex-shrink-0">
                    <AvatarImage 
                      src={profile?.avatar_url || undefined} 
                      alt={profile?.full_name || "User"} 
                      className="rounded-lg object-cover" 
                    />
                    <AvatarFallback className="rounded-lg bg-neutral-700 text-foreground text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 -ml-1">
                  <AnimatedAIIcon size={24} />
                </div>
                <div className="bg-neutral-800/60 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{activeProvider.name}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      )}

      {/* Order Browse Mode Overlay */}
      {orderMode && orderBrowseActive && (
        <div className="flex-shrink-0 border-t border-neutral-800 max-h-[40%] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 flex-shrink-0">
            <button onClick={orderBrowseBack} className="p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4 text-neutral-400" />
            </button>
            <span className="text-xs font-medium text-neutral-300">
              {orderBrowseStep === "menu" && "Select Menu"}
              {orderBrowseStep === "category" && orderSelectedMenu}
              {orderBrowseStep === "products" && (orderSelectedCategory || orderSelectedMenu)}
            </span>
            <button onClick={() => setOrderBrowseActive(false)} className="ml-auto p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-1.5">
            {orderBrowseStep === "menu" && menuList.map(menu => (
              <button key={menu} onClick={() => selectOrderMenu(menu)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-sm text-neutral-200 transition-colors">
                <span>{menu}</span>
                <span className="text-xs text-neutral-500">{menuCategories[menu]?.length || 0} categories</span>
              </button>
            ))}
            {orderBrowseStep === "category" && menuCategories[orderSelectedMenu]?.map(cat => (
              <button key={cat} onClick={() => selectOrderCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-sm text-neutral-200 transition-colors">
                <span>{cat}</span>
              </button>
            ))}
            {orderBrowseStep === "products" && (
              getOrderBrowseProducts().length > 0 ? (
                getOrderBrowseProducts().map(product => (
                  <div key={product.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] transition-colors">
                    <div>
                      <p className="text-sm text-neutral-200">{product.name}</p>
                      <p className="text-xs text-neutral-500">${product.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => handleOrderQuickAdd(product)}
                      className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-400 flex items-center justify-center transition-colors flex-shrink-0">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 text-center py-4">No products in this category</p>
              )
            )}
          </div>
        </div>
      )}

      {/* Order Type Selector */}
      {orderMode && showOrderTypes && !orderBrowseActive && (
        <div className="px-4 pt-2 flex-shrink-0 border-t border-neutral-800">
          <p className="text-xs text-neutral-400 mb-1.5">Select order type:</p>
          <div className="flex flex-wrap gap-1.5 pb-2">
            {ORDER_TYPES.map(type => (
              <button key={type} onClick={() => { setShowOrderTypes(false); setOrderType(type); handleOrderMessage(`Change order type to ${type}`); }}
                disabled={isTyping}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40 ${
                  orderType === type ? "bg-primary text-primary-foreground" : "bg-[#252525] hover:bg-[#303030] text-neutral-300"
                }`}>{type}</button>
            ))}
          </div>
        </div>
      )}

      {/* Order Quick Actions */}
      {orderMode && !orderBrowseActive && (
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="flex gap-1.5 pb-2 overflow-x-auto scrollbar-hide">
            {[
              { icon: ShoppingCart, label: "Browse Menu", action: () => startOrderBrowse() },
              { icon: UtensilsCrossed, label: "Order Type", action: () => setShowOrderTypes(prev => !prev) },
              { icon: FileText, label: "Summary", action: () => handleOrderMessage("Show me the current order summary") },
              { icon: Trash2, label: "Clear", action: () => { setOrderItems([]); handleOrderMessage("Clear the entire order"); } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} disabled={isTyping}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40">
                <btn.icon className="w-3 h-3" /> {btn.label}
              </button>
            ))}
          </div>
          {/* Mini order summary */}
          {orderItems.length > 0 && (
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-neutral-400">{orderItems.reduce((s, i) => s + i.qty, 0)} products, ${orderTotal.toFixed(2)}</span>
              <button onClick={goToOrdersWithData}
                className="text-xs font-medium text-primary hover:underline">
                Go to Orders →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Area - hidden when More tab is active */}
      {!(isAppearanceContext && activeTab === 'more') && (
      <div className="flex-shrink-0 p-4 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">

          {/* Microphone Button */}
          {isVoiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isTyping}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-neutral-800/60 text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground"
              )}
              title={isListening ? "Stop listening" : "Start voice command"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening..." : uploadedImage ? "Describe or send to analyze..." : "Ask me to change any setting..."}
              className={cn(
                "w-full bg-neutral-800/60 rounded-full px-5 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                isListening && "ring-2 ring-red-500/50"
              )}
              readOnly={isListening}
            />
          </div>
          
          <button
            type="submit"
            disabled={(!inputValue.trim() && !uploadedImage) || isTyping || isListening}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              (inputValue.trim() || uploadedImage) && !isTyping && !isListening
                ? "bg-primary text-primary-foreground active:opacity-70"
                : "bg-neutral-800/60 text-muted-foreground"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        {/* Voice listening indicator */}
        {isListening && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-400">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Listening... Speak your command
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default AISettingsContent;
