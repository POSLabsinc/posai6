import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useCallback } from "react";
import { SettingsManager, OrdersSettings } from "@/lib/settingsManager";
import ordersIcon from "@/assets/icons/settings-orders.png";

interface OrdersSettingsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const OrdersSettingsContent = ({
  showHeader = true,
  onBack
}: OrdersSettingsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Load initial state from SettingsManager
  const [settings, setSettings] = useState<OrdersSettings>(() => 
    SettingsManager.getOrdersSettings()
  );

  // Sync settings when a settings-updated event is received
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      if (type === 'orders' && data) {
        setSettings(data as OrdersSettings);
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, []);

  // Handler to update a setting
  const updateSetting = useCallback((key: keyof OrdersSettings, value: boolean) => {
    const updated = SettingsManager.updateOrdersSettings({ [key]: value });
    setSettings(updated);
  }, []);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && onBack && !isMobile}

      <div className={`${showHeader ? 'pt-2' : 'pt-0'} px-6 pb-8`}>
        {/* AI Icon row */}
        <div className="flex justify-end mb-2 overflow-visible">
          <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
        </div>
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
            backgroundColor: "#FF9500"
          }}>
            <img src={ordersIcon} alt="Orders" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Orders</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            Configure order creation, flow, and notification settings.
          </p>
        </div>

        {/* Order Options */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-2">
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-lg font-medium">Order Creation Rules</span>
            <Switch 
              checked={settings.orderCreationRules} 
              onCheckedChange={(value) => updateSetting('orderCreationRules', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-lg font-medium">Order Flow</span>
            <Switch 
              checked={settings.orderFlow} 
              onCheckedChange={(value) => updateSetting('orderFlow', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-lg font-medium">Hold & Recall</span>
            <Switch 
              checked={settings.holdAndRecall} 
              onCheckedChange={(value) => updateSetting('holdAndRecall', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-lg font-medium">Order Sync</span>
            <Switch 
              checked={settings.orderSync} 
              onCheckedChange={(value) => updateSetting('orderSync', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-lg font-medium">Order Notifications</span>
            <Switch 
              checked={settings.orderNotifications} 
              onCheckedChange={(value) => updateSetting('orderNotifications', value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersSettingsContent;
