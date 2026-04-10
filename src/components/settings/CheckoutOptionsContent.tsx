import { ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsManager, CheckoutOptionsSettings } from "@/lib/settingsManager";

interface CheckoutOptionsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const CheckoutOptionsContent = ({ showHeader = true, onBack, onAIClick }: CheckoutOptionsContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  
  // Load initial state from SettingsManager
  const [settings, setSettings] = useState<CheckoutOptionsSettings>(() => 
    SettingsManager.getCheckoutOptionsSettings()
  );

  // Sync settings when a settings-updated event is received
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      if (type === 'checkoutOptions' && data) {
        setSettings(data as CheckoutOptionsSettings);
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, []);

  // Handler to update a setting
  const updateSetting = useCallback((key: keyof CheckoutOptionsSettings, value: any) => {
    const updated = SettingsManager.updateCheckoutOptionsSettings({ [key]: value });
    setSettings(updated);
  }, []);

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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Checkout Options</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Display tax details separately for each item on the customer screen. Turn this off to show tax as a single total amount instead of a breakdown.
        </p>
      </div>
    </div>
  );
};

export default CheckoutOptionsContent;
