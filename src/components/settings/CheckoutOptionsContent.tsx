import { ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
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
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="pt-0 px-6 pb-28">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configure the checkout flow and customer-facing options.
          </p>
        </div>

        {/* Order Settings */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Order Settings</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Split Check</span>
            <Switch 
              checked={settings.splitCheck} 
              onCheckedChange={(value) => updateSetting('splitCheck', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Require Order Type</span>
            <Switch 
              checked={settings.requireOrderType} 
              onCheckedChange={(value) => updateSetting('requireOrderType', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Require Guest Name</span>
            <Switch 
              checked={settings.requireGuestName} 
              onCheckedChange={(value) => updateSetting('requireGuestName', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Guest Notes Enabled</span>
            <Switch 
              checked={settings.guestNotesEnabled} 
              onCheckedChange={(value) => updateSetting('guestNotesEnabled', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Show Save Button</span>
            <Switch 
              checked={settings.showSaveButton} 
              onCheckedChange={(value) => updateSetting('showSaveButton', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Auto-close Ticket</span>
            <Switch 
              checked={settings.autoCloseTicket} 
              onCheckedChange={(value) => updateSetting('autoCloseTicket', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">QR Bill / Payment</span>
            <Switch 
              checked={settings.qrBillPayment} 
              onCheckedChange={(value) => updateSetting('qrBillPayment', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Manage checkout and order behavior by controlling split payments, required order details, guest information, ticket handling, and QR-based billing or payment options.
        </p>

        {/* Signature & Receipt */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Signature & Receipt</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Print Receipt</span>
            <Switch 
              checked={settings.printReceipt} 
              onCheckedChange={(value) => updateSetting('printReceipt', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Email Receipt</span>
            <Switch 
              checked={settings.emailReceipt} 
              onCheckedChange={(value) => updateSetting('emailReceipt', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">SMS Receipt</span>
            <Switch 
              checked={settings.smsReceipt} 
              onCheckedChange={(value) => updateSetting('smsReceipt', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Skip Tip Screen</span>
            <Switch 
              checked={settings.skipTipScreen} 
              onCheckedChange={(value) => updateSetting('skipTipScreen', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Skip Signature</span>
            <Switch 
              checked={settings.skipSignature} 
              onCheckedChange={(value) => updateSetting('skipSignature', value)} 
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <button className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity">
             <span className="text-foreground text-lg font-medium">Signature Threshold</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">${settings.signatureThreshold.toFixed(2)}</span>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          These settings allow you to control what appears on the Point of Sale screen during checkout. You can choose which receipt options, tip screens, and signature requirements are shown to staff and customers.
        </p>

        {/* Payment Sounds */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Payment Sounds</h2>
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Enable Payment Sounds</span>
            <Switch 
              checked={settings.enablePaymentSounds} 
              onCheckedChange={(value) => updateSetting('enablePaymentSounds', value)} 
            />
          </div>
        </div>

        {/* Customer Display */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Customer Display</h2>
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Show Order Summary</span>
            <Switch 
              checked={settings.showOrderSummary} 
              onCheckedChange={(value) => updateSetting('showOrderSummary', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Display a full summary of the order on the customer screen, including items and totals. Turn this off if you prefer to show limited information.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-lg font-medium">Show Itemized Tax</span>
            <Switch 
              checked={settings.showItemizedTax} 
              onCheckedChange={(value) => updateSetting('showItemizedTax', value)} 
            />
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
