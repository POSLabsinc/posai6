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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Checkout Options</h1>
        </div>
      )}

      <div className="pt-0 px-4 md:px-6 pb-28">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configure the checkout flow and customer-facing options.
          </p>
        </div>

        {/* Order Settings */}
        <h2 className="text-base text-neutral-500 font-medium px-1 mb-0.5">Order Settings</h2>
        
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Split Check</span>
            <Switch 
              checked={settings.splitCheck} 
              onCheckedChange={(value) => updateSetting('splitCheck', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Allow orders to be split into multiple checks for separate payments by guests at the same table.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Require Order Type</span>
            <Switch 
              checked={settings.requireOrderType} 
              onCheckedChange={(value) => updateSetting('requireOrderType', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Require staff to select an order type (Dine In, Take Out, Delivery, etc.) before firing or charging an order.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Require Guest Name</span>
            <Switch 
              checked={settings.requireGuestName} 
              onCheckedChange={(value) => updateSetting('requireGuestName', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Require a guest name to be entered before an order can be fired or charged.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Guest Notes Enabled</span>
            <Switch 
              checked={settings.guestNotesEnabled} 
              onCheckedChange={(value) => updateSetting('guestNotesEnabled', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Enable the order notes field for staff to add special instructions, allergies, or preferences to an order.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Show Save Button</span>
            <Switch 
              checked={settings.showSaveButton} 
              onCheckedChange={(value) => updateSetting('showSaveButton', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Display the Save button on the order screen, allowing staff to save an order without firing it to the kitchen.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Auto-close Ticket</span>
            <Switch 
              checked={settings.autoCloseTicket} 
              onCheckedChange={(value) => updateSetting('autoCloseTicket', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Automatically close the ticket and return to the dashboard after a payment is completed.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">QR Bill / Payment</span>
            <Switch 
              checked={settings.qrBillPayment} 
              onCheckedChange={(value) => updateSetting('qrBillPayment', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Enable QR code-based billing or payment options for customers to scan and pay directly from their device.
        </p>

        {/* Signature & Receipt */}
        <h2 className="text-base text-neutral-500 font-medium px-1 mb-0.5">Signature & Receipt</h2>
        
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Print Receipt</span>
            <Switch 
              checked={settings.printReceipt} 
              onCheckedChange={(value) => updateSetting('printReceipt', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Automatically print a receipt after each completed transaction.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Email Receipt</span>
            <Switch 
              checked={settings.emailReceipt} 
              onCheckedChange={(value) => updateSetting('emailReceipt', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Offer the option to send a digital receipt via email after payment.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">SMS Receipt</span>
            <Switch 
              checked={settings.smsReceipt} 
              onCheckedChange={(value) => updateSetting('smsReceipt', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Offer the option to send a digital receipt via SMS after payment.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Skip Tip Screen</span>
            <Switch 
              checked={settings.skipTipScreen} 
              onCheckedChange={(value) => updateSetting('skipTipScreen', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Skip the tip selection screen during checkout and proceed directly to payment confirmation.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Skip Signature</span>
            <Switch 
              checked={settings.skipSignature} 
              onCheckedChange={(value) => updateSetting('skipSignature', value)} 
            />
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-4">
          Skip the signature capture screen for transactions below the signature threshold.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <button className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-lg font-medium">Signature Threshold</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">${settings.signatureThreshold.toFixed(2)}</span>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Set the minimum transaction amount that requires a customer signature for verification.
        </p>

        {/* Payment Sounds */}
        <h2 className="text-base text-neutral-500 font-medium px-1 mb-0.5">Payment Sounds</h2>
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
        <h2 className="text-base text-neutral-500 font-medium px-1 mb-0.5">Customer Display</h2>
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
