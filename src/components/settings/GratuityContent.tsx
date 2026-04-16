import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Delete } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useSettingsSync } from "@/hooks/useSettingsSync";
import gratuityIcon from "@/assets/icons/gratuity.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import AppleAlertDialog from "@/components/AppleAlertDialog";

interface GratuityContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "gratuity-settings";

const defaultSettings = {
  enableTip: true,
  showOnReceipt: true,
  allowCustom: true,
  disableTipOnCFD: false,
  presetType: "amount" as "amount" | "percentage",
  autoClosePaymentMethods: [] as string[],
  tipPresets: ["5", "10", "15", "20"] as string[],
  selectedTipPresets: ["15", "20"] as string[],
};

const paymentMethods = [
  "Cash",
  "Card",
  "External CC",
  "Manual CC",
  "Gift Card",
  "Account",
  "Pay by Link",
];

const GratuityContent = ({ showHeader = true, onBack, onAIClick }: GratuityContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getIconBgColor } = useAppearance();
  
  // Use the settings sync hook to listen for AI-driven updates
  const [settings, setSettings] = useSettingsSync(
    'gratuity',
    STORAGE_KEY,
    defaultSettings
  );

  // Ensure tipPresets migration (for backwards compatibility)
  useEffect(() => {
    if (!Array.isArray(settings.tipPresets)) {
      setSettings(prev => ({
        ...prev,
        tipPresets: defaultSettings.tipPresets,
        selectedTipPresets: defaultSettings.selectedTipPresets,
      }));
    }
  }, [settings.tipPresets, setSettings]);

  const [showRestrictedAlert, setShowRestrictedAlert] = useState(false);
  const [showPaymentMethodsDialog, setShowPaymentMethodsDialog] = useState(false);
  const [showPresetsDialog, setShowPresetsDialog] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [keypadValue, setKeypadValue] = useState("");

  const handleRestricted = () => {
    setShowRestrictedAlert(true);
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePaymentMethod = (method: string) => {
    setSettings(prev => ({
      ...prev,
      autoClosePaymentMethods: prev.autoClosePaymentMethods.includes(method)
        ? prev.autoClosePaymentMethods.filter(m => m !== method)
        : [...prev.autoClosePaymentMethods, method],
    }));
  };

  const openKeypad = (index: number) => {
    setEditingPresetIndex(index);
    setKeypadValue(settings.tipPresets[index]);
    setShowKeypad(true);
  };

  const handleKeypadPress = (key: string) => {
    if (key === "backspace") {
      setKeypadValue(prev => prev.slice(0, -1));
    } else if (key === "clear") {
      setKeypadValue("");
    } else {
      // Limit based on preset type: 2 digits for percentage, 3 for amount
      const maxLength = settings.presetType === "percentage" ? 2 : 3;
      if (keypadValue.length < maxLength) {
        setKeypadValue(prev => prev + key);
      }
    }
  };

  const saveKeypadValue = () => {
    if (editingPresetIndex !== null && keypadValue) {
      const newPresets = [...settings.tipPresets];
      const oldValue = newPresets[editingPresetIndex];
      newPresets[editingPresetIndex] = keypadValue;
      
      // Update selectedTipPresets if the old value was selected
      let newSelectedPresets = [...settings.selectedTipPresets];
      if (newSelectedPresets.includes(oldValue)) {
        newSelectedPresets = newSelectedPresets.map(p => p === oldValue ? keypadValue : p);
      }
      
      setSettings(prev => ({
        ...prev,
        tipPresets: newPresets,
        selectedTipPresets: newSelectedPresets,
      }));
    }
    setShowKeypad(false);
    setEditingPresetIndex(null);
    setKeypadValue("");
  };

  const getSelectedPaymentMethodsText = () => {
    if (settings.autoClosePaymentMethods.length === 0) return "Select";
    if (settings.autoClosePaymentMethods.length === 1) return settings.autoClosePaymentMethods[0];
    return `${settings.autoClosePaymentMethods.length} selected`;
  };

  const toggleTipPresetSelection = (preset: string) => {
    setSettings(prev => ({
      ...prev,
      selectedTipPresets: prev.selectedTipPresets.includes(preset)
        ? prev.selectedTipPresets.filter(p => p !== preset)
        : [...prev.selectedTipPresets, preset],
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
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Gratuity</h1>
        </div>
      )}
      <div className="px-6 pb-28 pt-0">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Set up tip options and automatic gratuity rules for your transactions.
          </p>
        </div>

        {/* Enable Tip - Single Row */}
         <div className="bg-neutral-800/60 rounded-full mb-1">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base font-medium">Enable Tip</span>
             <Switch 
              checked={settings.enableTip}
              onCheckedChange={handleRestricted}
            />
          </div>
        </div>
         <p className="text-neutral-500 text-sm px-1 mb-6">
           Show tip selection screen during checkout. When disabled, customers won't be prompted to add gratuity.
         </p>

        {/* Display Options Section */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">Display Options</h2>
         <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-base font-medium">Show Gratuity On Receipt</span>
             <Switch 
              checked={settings.showOnReceipt}
              onCheckedChange={handleRestricted}
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-base font-medium">Allow Custom Gratuity</span>
             <Switch 
              checked={settings.allowCustom}
              onCheckedChange={handleRestricted}
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-base font-medium">Disable Tip On Customer Facing Display</span>
             <Switch 
              checked={settings.disableTipOnCFD}
              onCheckedChange={handleRestricted}
            />
          </div>
        </div>

        {/* Gratuity Presets */}
        <div 
            className="bg-neutral-800/60 rounded-full mb-6 cursor-pointer active:opacity-70"
          onClick={handleRestricted}
        >
           <div className="flex items-center justify-between py-3.5 px-4">
             <span className="text-foreground text-base font-medium">Gratuity Presets</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-base">
                {settings.presetType === "amount" ? "Amount" : "Percentage"}
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Suggested Tip Amount */}
        <h2 className="text-sm text-neutral-500 font-medium px-1 mb-3">
          Suggested Tip {settings.presetType === "amount" ? "Amount" : "Percentage"}
        </h2>
        <div className="flex gap-3 mb-3">
          {settings.tipPresets.map((preset, index) => (
            <button
              key={index}
              onClick={handleRestricted}
              className={`flex-1 py-5 rounded-2xl text-xl font-semibold transition-colors ${
                settings.selectedTipPresets.includes(preset)
                  ? "bg-neutral-600 text-foreground"
                  : "bg-neutral-800/60 text-neutral-400"
              }`}
            >
              {settings.presetType === "amount" ? `$${preset}` : `${preset}%`}
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-500 leading-relaxed px-1">
          {settings.presetType === "amount" 
            ? "Set fixed dollar amounts for tip suggestions shown to customers."
            : "Set tip percentages that will be automatically calculated based on the order subtotal."
          }
        </p>
      </div>

      {/* Payment Methods Selection Dialog */}
      {showPaymentMethodsDialog && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPaymentMethodsDialog(false)}
        >
          <div 
            className="bg-neutral-900 rounded-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-800">
              <h3 className="text-lg font-semibold text-foreground text-center">Select Payment Methods</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {paymentMethods.map((method, index) => (
                <div key={method}>
                  <div 
                    className="flex items-center justify-between py-3.5 px-5 cursor-pointer active:bg-neutral-800/50"
                    onClick={() => togglePaymentMethod(method)}
                  >
                    <span className="text-foreground text-base">{method}</span>
                    <Checkbox 
                      checked={settings.autoClosePaymentMethods.includes(method)}
                      onCheckedChange={() => togglePaymentMethod(method)}
                      className="w-5 h-5 rounded border-neutral-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  {index < paymentMethods.length - 1 && <div className="h-px bg-neutral-800 mx-5" />}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-800">
              <button 
                className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium"
                onClick={() => setShowPaymentMethodsDialog(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gratuity Presets Selection Dropdown */}
      {showPresetsDialog && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => setShowPresetsDialog(false)}
        >
          <div 
            className="absolute right-8 bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px]"
            style={{ top: "calc(50% + 60px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                settings.presetType === "amount" 
                  ? "text-foreground bg-neutral-700/50" 
                  : "text-neutral-400 active:bg-neutral-700/30"
              }`}
              onClick={() => {
                updateSetting("presetType", "amount");
                setShowPresetsDialog(false);
              }}
            >
              Amount
            </button>
            <div className="h-px bg-neutral-700/60 mx-3" />
            <button 
              className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                settings.presetType === "percentage" 
                  ? "text-foreground bg-neutral-700/50" 
                  : "text-neutral-400 active:bg-neutral-700/30"
              }`}
              onClick={() => {
                updateSetting("presetType", "percentage");
                setShowPresetsDialog(false);
              }}
            >
              Percentage
            </button>
          </div>
        </div>
      )}

      {/* Number Keypad Dialog */}
      {showKeypad && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => {
            setShowKeypad(false);
            setEditingPresetIndex(null);
            setKeypadValue("");
          }}
        >
          <div 
            className="bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden sm:shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Display */}
            <div className="p-6 border-b border-neutral-800">
              <p className="text-sm text-neutral-500 text-center mb-2">
                Edit Tip {settings.presetType === "amount" ? "Amount" : "Percentage"}
              </p>
              <div className="flex items-center justify-center">
                {settings.presetType === "amount" && (
                  <span className="text-3xl font-bold text-neutral-500 mr-1">$</span>
                )}
                <span className="text-5xl font-bold text-foreground">
                  {keypadValue || "0"}
                </span>
                {settings.presetType === "percentage" && (
                  <span className="text-3xl font-bold text-neutral-500 ml-1">%</span>
                )}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="p-4 grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="h-16 rounded-2xl bg-neutral-800 text-foreground text-2xl font-semibold active:bg-neutral-700 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress("clear")}
                className="h-16 rounded-2xl bg-neutral-800 text-neutral-400 text-lg font-medium active:bg-neutral-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeypadPress("0")}
                className="h-16 rounded-2xl bg-neutral-800 text-foreground text-2xl font-semibold active:bg-neutral-700 transition-colors"
              >
                0
              </button>
              <button
                onClick={() => handleKeypadPress("backspace")}
                className="h-16 rounded-2xl bg-neutral-800 text-foreground flex items-center justify-center active:bg-neutral-700 transition-colors"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex gap-3">
              <button 
                className="flex-1 py-4 bg-neutral-800 text-foreground rounded-full font-medium active:bg-neutral-700 transition-colors"
                onClick={() => {
                  setShowKeypad(false);
                  setEditingPresetIndex(null);
                  setKeypadValue("");
                }}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-full font-medium active:opacity-80 transition-opacity"
                onClick={saveKeypadValue}
                disabled={!keypadValue}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Restriction Alert */}
      <AppleAlertDialog
        open={showRestrictedAlert}
        onOpenChange={setShowRestrictedAlert}
        onConfirm={() => setShowRestrictedAlert(false)}
        title="Access Restricted"
        description="Gratuity settings can only be modified by the Manager from the Dashboard."
        confirmText="OK"
        cancelText=""
      />
    </div>
  );
};

export default GratuityContent;
