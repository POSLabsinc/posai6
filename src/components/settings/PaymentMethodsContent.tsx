import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import paymentMethodsIcon from "@/assets/icons/payment-methods.png";
import { useAppearance } from "@/contexts/AppearanceContext";

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
import voucherIcon from "@/assets/icons/voucher.svg";
import qrCodeIcon from "@/assets/icons/payment-qr-code.png";
import thirdPartyIcon from "@/assets/icons/payment-3rd-party.png";
import splitCheckIcon from "@/assets/icons/split-check.svg";

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
  { id: "account", name: "Account", icon: accountIcon, bgColor: "#5AB0EE" },
  { id: "blizzful", name: "Blizzful", icon: blizzfulIcon, bgColor: "#FFFFFF" },
  { id: "card", name: "Card", icon: cardIcon, bgColor: "#9463FF" },
  { id: "cash", name: "Cash", icon: cashIcon, bgColor: "#CF0064" },
  { id: "doordash", name: "Doordash", icon: doordashIcon, bgColor: "#FFFFFF" },
  { id: "external-cc", name: "External CC", icon: externalCcIcon, bgColor: "#5AB0EE" },
  { id: "gift-card", name: "Gift Card", icon: giftCardIcon, bgColor: "#CF0064" },
  { id: "grubhub", name: "Grubhub", icon: grubhubIcon, bgColor: "#FFFFFF" },
  { id: "loyalty", name: "Loyalty", icon: loyaltyIcon, bgColor: "#000000" },
  { id: "manual-card", name: "Manual Card", icon: manualCardIcon, bgColor: "#FF6381" },
  { id: "manual-cc", name: "Manual CC", icon: manualCcIcon, bgColor: "#FFBD00" },
  { id: "pay-by-link", name: "Pay By Link", icon: payByLinkIcon, bgColor: "#5AB0EE" },
  { id: "qr-code", name: "QR Code", icon: qrCodeIcon, bgColor: "#9463FF" },
  { id: "split-check", name: "Split Check", icon: splitCheckIcon, bgColor: "#5AB0EE" },
  { id: "third-party-delivery", name: "3rd Party Delivery", icon: thirdPartyIcon, bgColor: "#FF6381" },
  { id: "uber-eats", name: "UberEats", icon: uberEatsIcon, bgColor: "#FFFFFF" },
  { id: "voucher", name: "Voucher", icon: voucherIcon, bgColor: "#FF9500" },
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
  const { getIconBgColor } = useAppearance();
  const [methodStates, setMethodStates] = useState<Record<string, boolean>>(() => {
    // Initialize from localStorage (hydrated from DB via SettingsManager)
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

  // Listen for external updates (e.g. AI assistant) and sync local state.
  // Use a ref guard so we don't re-broadcast updates we just received.
  const skipNextPersist = useRef(false);
  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.type === 'paymentMethods' && detail?.data) {
        skipNextPersist.current = true;
        setMethodStates({ ...getDefaultState(), ...detail.data });
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          skipNextPersist.current = true;
          setMethodStates({ ...getDefaultState(), ...JSON.parse(event.newValue) });
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Persist to localStorage and DB whenever state changes locally.
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      // Still mirror to localStorage so other tabs stay in sync.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(methodStates)); } catch { /* ignore */ }
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(methodStates));
      // Sync to dedicated payment_methods table
      import('@/lib/settingsManager').then(({ SettingsManager }) => {
        SettingsManager.setAllPaymentMethodStates(methodStates);
      });
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
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <h1 className="text-xl font-semibold text-foreground">Payment Methods</h1>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 pb-28 pt-0">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Control which payment methods are available at checkout. Toggle a method <span className="text-foreground font-medium">ON</span> to allow customers to use it, or <span className="text-foreground font-medium">OFF</span> to hide it from the payment screen.
          </p>
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
