import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Check, X, RotateCcw, Clock, Tag, Percent, CreditCard, Eye, ExternalLink, Mic, MicOff, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsManager } from "@/lib/settingsManager";
import { useTheme } from "next-themes";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { supabase } from "@/integrations/supabase/client";
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
  type: "view" | "update_setting" | "navigate" | "info";
  category?: string;
  path?: string;
  setting?: string;
  currentValue?: string;
  newValue?: string;
  settingType?: string;
  operation?: string;
  data?: any;
  autoApply?: boolean;
}

const defaultSuggestionChips: SuggestionChip[] = [
  { label: "Upload menu", icon: <ImagePlus className="w-3.5 h-3.5" />, prompt: "__UPLOAD_IMAGE__" },
  { label: "Show my discounts", icon: <Tag className="w-3.5 h-3.5" />, prompt: "Show me all active discounts" },
  { label: "View taxes", icon: <Percent className="w-3.5 h-3.5" />, prompt: "What taxes do I have configured?" },
  { label: "View menus", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show me my menus" },
  { label: "Service charges", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Show my service charges" },
];

const menuSuggestionChips: SuggestionChip[] = [
  { label: "View menus", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show me all my menus" },
  { label: "Upload menu", icon: <ImagePlus className="w-3.5 h-3.5" />, prompt: "__UPLOAD_IMAGE__" },
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
  { label: "End of day setup", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Show me end of day settings" },
  { label: "Auto close", icon: <CreditCard className="w-3.5 h-3.5" />, prompt: "Configure automatic day closing" },
  { label: "Reports config", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show end of day report settings" },
  { label: "Cash reconciliation", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show cash reconciliation settings" },
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
  { label: "Sales reports", icon: <Eye className="w-3.5 h-3.5" />, prompt: "Show sales report settings" },
  { label: "Report schedule", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Configure report scheduling" },
  { label: "Export data", icon: <ExternalLink className="w-3.5 h-3.5" />, prompt: "How do I export report data?" },
  { label: "Analytics", icon: <Percent className="w-3.5 h-3.5" />, prompt: "Show analytics settings" },
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
};

const AISettingsContent = ({ showHeader = true, onBack, context }: AISettingsContentProps) => {
  const suggestionChips = (context && contextChipsMap[context]) || defaultSuggestionChips;
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { profile, getInitials } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [appliedChanges, setAppliedChanges] = useState<AppliedChange[]>([]);
  const [multiSelectState, setMultiSelectState] = useState<Record<string, string[]>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Get current settings context for AI
  const getSettingsContext = useCallback(() => {
    return SettingsManager.getAllSettingsSummary();
  }, []);

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

  // Execute the pending action based on type and data
  const executeAction = useCallback(async (pendingChange: PendingChange): Promise<boolean> => {
    const { settingType, operation, data } = pendingChange;
    
    if (!settingType || !data) return false;

    try {
      // Database-backed types (menus, products, categories, modifiers, add-ons)
      const dbTypes = ["menu", "product", "category", "modifierGroup", "modifier", "addOn"];
      
      if (dbTypes.includes(settingType)) {
        return await executeDbAction(settingType, operation || "add", data);
      }

      // localStorage-backed types (settings)
      switch (settingType) {
        case "gratuity":
          SettingsManager.updateGratuitySettings(data);
          break;
        case "discount":
          if (operation === "add") {
            SettingsManager.addDiscount({ name: data.name, amount: data.amount, type: data.type || "Percentage", archived: false, applicableTo: data.applicableTo || "All Products", requiresManagerPin: data.requiresManagerPin || false });
          } else if (operation === "update") {
            const discount = SettingsManager.findDiscountByName(data.name);
            if (!discount) { toast({ title: "Not found", description: `Discount "${data.name}" not found.`, variant: "destructive" }); return false; }
            SettingsManager.updateDiscount(discount.id, data);
          } else if (operation === "archive") {
            const discount = SettingsManager.findDiscountByName(data.name);
            if (!discount) { toast({ title: "Not found", description: `Discount "${data.name}" not found.`, variant: "destructive" }); return false; }
            SettingsManager.archiveDiscount(discount.id);
          }
          break;
        case "tax":
          if (operation === "add") {
            SettingsManager.addTax({ name: data.name, amount: data.amount, type: data.type || "Exclusive", archived: false });
          } else if (operation === "update") {
            const tax = SettingsManager.findTaxByName(data.name);
            if (!tax) { toast({ title: "Not found", description: `Tax "${data.name}" not found.`, variant: "destructive" }); return false; }
            SettingsManager.updateTax(tax.id, data);
          } else if (operation === "archive") {
            const tax = SettingsManager.findTaxByName(data.name);
            if (!tax) { toast({ title: "Not found", description: `Tax "${data.name}" not found.`, variant: "destructive" }); return false; }
            SettingsManager.archiveTax(tax.id);
          }
          break;
        case "serviceCharge":
          if (operation === "add") {
            SettingsManager.addServiceCharge({ name: data.name, amount: data.amount, type: data.type || "Fixed", archived: false, orderType: data.orderType || "All Orders", automaticApply: data.automaticApply || false, minSeats: data.minSeats, taxApplicable: data.taxApplicable || "Taxable" });
          } else if (operation === "update") {
            const charge = SettingsManager.findServiceChargeByName(data.name);
            if (!charge) { toast({ title: "Not found", description: `Service charge "${data.name}" not found.`, variant: "destructive" }); return false; }
            SettingsManager.updateServiceCharge(charge.id, data);
          } else if (operation === "archive") {
            const charge = SettingsManager.findServiceChargeByName(data.name);
            if (!charge) { toast({ title: "Not found", description: `Service charge "${data.name}" not found.`, variant: "destructive" }); return false; }
            SettingsManager.archiveServiceCharge(charge.id);
          }
          break;
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
        default:
          console.warn("Unknown setting type:", settingType);
          return false;
      }
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
            // If categoryName provided but no categoryId, look it up
            let categoryId = data.categoryId;
            if (!categoryId && data.categoryName) {
              const { data: cats } = await (supabase as any).from("categories").select("id").ilike("name", data.categoryName).limit(1);
              if (cats && cats.length > 0) categoryId = cats[0].id;
            }
            if (!categoryId) {
              toast({ title: "Category required", description: "Please specify a valid category for this product.", variant: "destructive" });
              return false;
            }
            const { error } = await (supabase as any).from("products").insert({
              name: data.name,
              price: data.price || 0,
              category_id: categoryId,
              description: data.description || "",
            });
            if (error) throw error;
          } else if (operation === "update") {
            const updates: any = {};
            if (data.name) updates.name = data.name;
            if (data.price !== undefined) updates.price = data.price;
            if (data.description !== undefined) updates.description = data.description;
            if (data.active !== undefined) updates.active = data.active;
            const { error } = await (supabase as any).from("products").update(updates).eq("id", data.id);
            if (error) throw error;
          } else if (operation === "archive") {
            const { error } = await (supabase as any).from("products").update({ archived: true }).eq("id", data.id);
            if (error) throw error;
          } else if (operation === "enable" || operation === "disable") {
            const active = operation === "enable" || data.active === true;
            const { error } = await (supabase as any).from("products").update({ active }).eq("id", data.id);
            if (error) throw error;
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
            const { error } = await (supabase as any).from("categories").update(updates).eq("id", data.id);
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
            const updates: any = {};
            if (data.name) updates.name = data.name;
            if (data.price !== undefined) updates.price = data.price;
            const { error } = await (supabase as any).from("add_ons").update(updates).eq("id", data.id);
            if (error) throw error;
          }
          break;
        }
        default:
          return false;
      }
      toast({ title: "Success", description: `${data.name || "Record"} has been ${operation === "add" ? "created" : operation + "d"} successfully.` });
      return true;
    } catch (error: any) {
      console.error("DB action error:", error);
      toast({ title: "Database Error", description: error.message || "Failed to execute the change.", variant: "destructive" });
      return false;
    }
  };

  const handleSendMessage = async (content: string, imageDataUrl?: string | null) => {
    if (!content.trim() && !imageDataUrl) return;

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
      // Call the AI edge function
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

      // Process the AI action
      const action = data.action as AIAction;
      
      if (action?.type === "update_setting") {
        const change: PendingChange = {
          id: Date.now().toString(),
          setting: action.setting || "Setting",
          path: action.path || "Settings",
          currentValue: action.currentValue || "Current",
          newValue: action.newValue || "New",
          status: "pending",
          settingType: action.settingType,
          operation: action.operation,
          data: action.data,
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
      } else if (action?.type === "navigate" && action.path) {
        navigateTo = action.path;
      }

      // Sanitize message: strip any JSON/code that leaked into the message
      let messageText = data.message || "I'm not sure how to help with that. Could you rephrase?";
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
      };

      // Clear quickReplies from previous assistant messages
      setMessages((prev) => [
        ...prev.map((msg) => msg.role === "assistant" ? { ...msg, quickReplies: undefined, multiSelect: undefined } : msg),
        assistantMessage,
      ]);
      setConversationHistory((prev) => [...prev, { role: "assistant", content: data.message }]);
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
      fileInputRef.current?.click();
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
            <span className="text-neutral-400 line-through">{change.currentValue}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-14">New:</span>
            <span className="text-green-400 font-medium">{change.newValue}</span>
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      {showHeader && onBack && (
        <div className="flex-shrink-0 p-4 flex justify-end">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="mb-4 overflow-visible">
              <AnimatedAIIcon size={56} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              How can I help you today?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              I can view, update, and manage all your settings. Just tell me what you need!
            </p>
            
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
              <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
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
                      <p className="text-xs text-muted-foreground">{message.appliedChange.setting} → {message.appliedChange.value}</p>
                    </div>
                  )}
                  
                  {/* Pending Change Card */}
                  {message.pendingChange && renderPendingChange(message.id, message.pendingChange)}
                  
                  {/* Navigate Button */}
                  {message.navigateTo && renderNavigateButton(message.navigateTo)}

                  {/* Quick Reply Buttons */}
                  {message.quickReplies && message.quickReplies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.multiSelect ? (
                        <>
                          {message.quickReplies.filter(r => r !== "Done" && r !== "Skip").map((reply) => {
                            const selected = (multiSelectState[message.id] || []).includes(reply);
                            return (
                              <button
                                key={reply}
                                onClick={() => {
                                  setMultiSelectState(prev => {
                                    const current = prev[message.id] || [];
                                    if (reply === "All" || reply === "All Devices") {
                                      const allOptions = message.quickReplies!.filter(r => r !== "Done" && r !== "Skip" && r !== "All" && r !== "All Devices");
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
                          {message.quickReplies.includes("Skip") && (
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
                        message.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => handleSendMessage(reply)}
                            disabled={isTyping}
                            className="px-4 py-2.5 rounded-full bg-neutral-800/80 text-sm text-foreground border border-neutral-600/50 active:opacity-70 active:scale-95 transition-all hover:bg-neutral-700/80 disabled:opacity-40 font-medium"
                          >
                            {reply}
                          </button>
                        ))
                      )}
                    </div>
                  )}
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
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-neutral-800">
        {/* Image preview */}
        {uploadedImage && (
          <div className="mb-3 flex items-start gap-2">
            <div className="relative">
              <img src={uploadedImage} alt="Upload preview" className="w-20 h-20 rounded-xl object-cover border border-neutral-700" />
              <button
                onClick={clearUploadedImage}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground mt-1">Menu image attached</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
            className="w-12 h-12 rounded-full bg-neutral-800/60 text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
            title="Upload menu image"
          >
            <ImagePlus className="w-5 h-5" />
          </button>

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
    </div>
  );
};

export default AISettingsContent;
