import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import paymentMethodsIcon from "@/assets/icons/payment-methods.png";

// Import payment method icons
import cashIcon from "@/assets/icons/payment-cash.png";
import cardIcon from "@/assets/icons/payment-card.png";
import externalCcIcon from "@/assets/icons/payment-external-cc.png";
import manualCcIcon from "@/assets/icons/payment-manual-cc.png";
import manualCardIcon from "@/assets/icons/payment-manual-card.png";
import grubhubIcon from "@/assets/icons/payment-grubhub.png";
import giftCardIcon from "@/assets/icons/payment-gift-card.png";
import uberEatsIcon from "@/assets/icons/payment-ubereats.png";
import accountIcon from "@/assets/icons/payment-account.png";
import doordashIcon from "@/assets/icons/payment-doordash.png";
import blizzfulIcon from "@/assets/icons/payment-blizzful.png";
import loyaltyIcon from "@/assets/icons/payment-loyalty.png";
import payByLinkIcon from "@/assets/icons/payment-pay-by-link.png";

interface PaymentMethodsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

interface PaymentMethodConfig {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
}

const paymentMethodConfigs: PaymentMethodConfig[] = [
  { id: "cash", name: "Cash", icon: cashIcon, bgColor: "#CF0064" },
  { id: "card", name: "Card", icon: cardIcon, bgColor: "#9463FF" },
  { id: "external-cc", name: "External CC", icon: externalCcIcon, bgColor: "#5AB0EE" },
  { id: "manual-cc", name: "Manual CC", icon: manualCcIcon, bgColor: "#FFBD00" },
  { id: "manual-card", name: "Manual Card", icon: manualCardIcon, bgColor: "#FF6381" },
  { id: "grubhub", name: "Grubhub", icon: grubhubIcon, bgColor: "#FFFFFF" },
  { id: "gift-card", name: "Gift Card", icon: giftCardIcon, bgColor: "#CF0064" },
  { id: "uber-eats", name: "UberEats", icon: uberEatsIcon, bgColor: "#FFFFFF" },
  { id: "account", name: "Account", icon: accountIcon, bgColor: "#5AB0EE" },
  { id: "doordash", name: "Doordash", icon: doordashIcon, bgColor: "#FFFFFF" },
  { id: "blizzful", name: "Blizzful", icon: blizzfulIcon, bgColor: "#FFFFFF" },
  { id: "loyalty", name: "Loyalty", icon: loyaltyIcon, bgColor: "#000000" },
  { id: "pay-by-link", name: "Pay By Link", icon: payByLinkIcon, bgColor: "#5AB0EE" },
];

const STORAGE_KEY = "payment-methods-state";

// Default state: all methods enabled
const getDefaultState = (): Record<string, boolean> => {
  return paymentMethodConfigs.reduce((acc, method) => {
    acc[method.id] = true;
    return acc;
  }, {} as Record<string, boolean>);
};

const PaymentMethodsContent = ({ showHeader = true, onBack, onAIClick }: PaymentMethodsContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [methodStates, setMethodStates] = useState<Record<string, boolean>>(() => {
    // Initialize from localStorage or defaults
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load payment methods state:", e);
    }
    return getDefaultState();
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(methodStates));
    } catch (e) {
      console.error("Failed to save payment methods state:", e);
    }
  }, [methodStates]);

  const handleToggle = (methodId: string, checked: boolean) => {
    setMethodStates(prev => ({
      ...prev,
      [methodId]: checked,
    }));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && onBack && !isMobile && (
        <div className="px-6 pt-5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#5F5F5F" }}
          >
            <img src={paymentMethodsIcon} alt="Payment Methods" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Payment Methods</h1>
          <p className="text-base text-neutral-400 leading-relaxed">
            Configure which payment methods are accepted at your point of sale.
          </p>
        </div>

        {/* AI Assistant Icon */}
        <div className="flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Payment Methods List */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {paymentMethodConfigs.map((method, index) => (
            <div key={method.id}>
              <div className="flex items-center justify-between py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: method.bgColor }}
                  >
                    <img 
                      src={method.icon} 
                      alt={method.name} 
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <span className="text-foreground text-base font-medium">{method.name}</span>
                </div>
                <Switch 
                  checked={methodStates[method.id] ?? true}
                  onCheckedChange={(checked) => handleToggle(method.id, checked)}
                />
              </div>
              {index < paymentMethodConfigs.length - 1 && (
                <div className="h-px bg-neutral-700/50 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsContent;
