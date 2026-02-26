import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import { useAppearance } from "@/contexts/AppearanceContext";

interface PrinterAdvancedContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const PrinterAdvancedContent = ({ showHeader = true, onBack }: PrinterAdvancedContentProps) => {
  const isMobile = useIsMobile();
  const { getIconBgColor } = useAppearance();
  const [settings, setSettings] = useState({
    autoPrintBills: true,
    showSingleItems: false,
    showFreeItems: false,
    showFreeModifiers: false,
    autoPrintReceipt: true,
    autoPrintRefund: false,
    itemizedReceipt: true,
    printCustomerCopy: false,
    showSuggestedTip: true,
    printTimeClockReport: false,
    largeItemText: false,
    largeOrderNumber: true,
    printItemsSeparately: false,
    reverseTextStyle: false,
    signatureTipLine: true,
    requireForSalesOver: false,
  });

  const [salesOverAmount, setSalesOverAmount] = useState("0.00");

  const [modifierTextSize, setModifierTextSize] = useState<string>("Tall");

  const orderTypeOptions = ["Dine In", "Takeout", "Delivery", "Drive Thru", "Curbside", "Catering"];
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<string[]>([]);
  const [isOrderTypeSheetOpen, setIsOrderTypeSheetOpen] = useState(false);
  const [isTextSizeDropdownOpen, setIsTextSizeDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsTextSizeDropdownOpen(false);
      }
    };
    if (isTextSizeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTextSizeDropdownOpen]);

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleRow = ({ label, settingKey, isLast = false }: { label: string; settingKey: keyof typeof settings; isLast?: boolean }) => (
    <>
      <div className="flex items-center justify-between py-3.5 px-4">
        <span className="text-foreground text-base font-medium">{label}</span>
        <Switch checked={settings[settingKey] as boolean} onCheckedChange={() => toggle(settingKey)} />
      </div>
      {!isLast && <div className="h-px bg-neutral-700/50 mx-4" />}
    </>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Advanced Settings</h1>
          <div className="w-8 h-8" />
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-6 flex flex-col items-start mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: getIconBgColor("#5E4DD8") }}
          >
            <img src={hardwarePrinterIcon} alt="Advanced Settings" className="w-7 h-7 object-contain" />
          </div>
          <h2 className="text-foreground text-lg font-semibold mb-1">Advanced Settings</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">Configure advanced printing preferences for bills, receipts, kitchen tickets, and more.</p>
        </div>

        {/* Bills */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Bills</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Auto-Print Bills" settingKey="autoPrintBills" />
          <ToggleRow label="Show Single Items" settingKey="showSingleItems" />
          <ToggleRow label="Show Free Items" settingKey="showFreeItems" />
          <ToggleRow label="Show Free Modifiers" settingKey="showFreeModifiers" isLast />
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings let you customise how customer bills are printed, including automatic printing and whether individual items, complimentary items, and free modifiers appear on the receipt. This helps you control the level of detail shown to customers.
        </p>

        {/* Receipts */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Receipts</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Auto-Print Receipt" settingKey="autoPrintReceipt" />
          <ToggleRow label="Auto-Print Refund" settingKey="autoPrintRefund" />
          <ToggleRow label="Itemized Receipt" settingKey="itemizedReceipt" />
          <ToggleRow label="Print Customer Copy" settingKey="printCustomerCopy" />
          <ToggleRow label="Show Suggested Tip" settingKey="showSuggestedTip" />
          <ToggleRow label="Print Time Clock Report" settingKey="printTimeClockReport" isLast />
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings allow you to control how receipts are printed, including automatic printing for sales and refunds, whether receipts are itemised, if a customer copy is printed, whether suggested tips are shown, and if time clock reports can be printed. This helps you manage the level of detail and automation for receipt printing in your restaurant.
        </p>

        {/* Kitchen Tickets */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Kitchen Tickets</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Large Item Text" settingKey="largeItemText" />
          <ToggleRow label="Large Order Number" settingKey="largeOrderNumber" />
          <ToggleRow label="Print Items Separately" settingKey="printItemsSeparately" />
          <ToggleRow label="Reverse Text Style" settingKey="reverseTextStyle" isLast />
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings control how kitchen tickets are printed, including adjusting text size for better visibility, enlarging the order number, printing items separately, and reversing the text style for clearer readability in the kitchen. This helps improve speed, accuracy, and visibility for kitchen staff during busy service hours.
        </p>

        {/* Modifiers */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Modifiers</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <div>
            <button
              ref={triggerRef}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setDropdownPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
                setIsTextSizeDropdownOpen(!isTextSizeDropdownOpen);
              }}
              className="flex items-center justify-between w-full py-3.5 px-4"
            >
              <span className="text-foreground text-base font-medium">Modifier Text Size</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 text-sm">{modifierTextSize}</span>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </div>
            </button>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <button
            onClick={() => setIsOrderTypeSheetOpen(true)}
            className="flex items-center justify-between w-full py-3.5 px-4"
          >
            <span className="text-foreground text-base font-medium">Kitchen Order Ticket Print with</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">
                {selectedOrderTypes.length > 0 ? selectedOrderTypes.join(", ") : "Select"}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          Control how modifiers appear on kitchen tickets, including text size and print format, to ensure clear visibility for the kitchen staff.
        </p>

        {isTextSizeDropdownOpen && (
          <div
            className="fixed z-[9999] w-44 rounded-xl bg-neutral-800 shadow-lg border border-neutral-700/50 overflow-hidden"
            style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
            ref={dropdownRef}
          >
            {["Tall", "Wide", "Bold"].map((option) => (
              <button
                key={option}
                onClick={() => {
                  setModifierTextSize(option);
                  setIsTextSizeDropdownOpen(false);
                }}
                className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-foreground hover:bg-neutral-700/50 transition-colors"
              >
                {option}
                {modifierTextSize === option && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        )}

        <MultiSelectSheet
          isOpen={isOrderTypeSheetOpen}
          onClose={(items) => {
            setSelectedOrderTypes(items);
            setIsOrderTypeSheetOpen(false);
          }}
          initialSelected={selectedOrderTypes}
          options={orderTypeOptions}
          title="Select Order Types"
        />

        {/* Signatures & Tips */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Signatures & Tips</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Signature & Tip Line" settingKey="signatureTipLine" />
          <div className="h-px bg-neutral-700/50 mx-4" />
          <ToggleRow label="Require for Sales Over" settingKey="requireForSalesOver" />
          {settings.requireForSalesOver && (
            <>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">For Sales Over</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500 text-sm">£</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={salesOverAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(val)) {
                        setSalesOverAmount(val);
                      }
                    }}
                    onBlur={() => {
                      const num = parseFloat(salesOverAmount);
                      setSalesOverAmount(isNaN(num) ? "0.00" : num.toFixed(2));
                    }}
                    className="bg-transparent text-neutral-500 text-sm text-right w-20 outline-none focus:text-foreground"
                  />
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
            </>
          )}
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings manage signature and tip options on printed receipts, including whether a signature and tip line is included and if signatures are required for transactions over a specified amount. This helps ensure compliance and streamline the payment process.
        </p>
      </div>
    </div>
  );
};

export default PrinterAdvancedContent;
