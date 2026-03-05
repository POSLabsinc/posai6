import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import { usePreference } from "@/hooks/usePreference";

interface PrinterAdvancedContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const PrinterAdvancedContent = ({ showHeader = true, onBack, onAIClick }: PrinterAdvancedContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();

  // All settings persisted via usePreference
  const { value: autoPrintBills, update: setAutoPrintBills } = usePreference("printer_auto_print_bills", "true");
  const { value: showSingleItems, update: setShowSingleItems } = usePreference("printer_show_single_items", "false");
  const { value: showFreeItems, update: setShowFreeItems } = usePreference("printer_show_free_items", "false");
  const { value: showFreeModifiers, update: setShowFreeModifiers } = usePreference("printer_show_free_modifiers", "false");
  const { value: autoPrintReceipt, update: setAutoPrintReceipt } = usePreference("printer_auto_print_receipt", "true");
  const { value: autoPrintRefund, update: setAutoPrintRefund } = usePreference("printer_auto_print_refund", "false");
  const { value: itemizedReceipt, update: setItemizedReceipt } = usePreference("printer_itemized_receipt", "true");
  const { value: printCustomerCopy, update: setPrintCustomerCopy } = usePreference("printer_print_customer_copy", "false");
  const { value: showSuggestedTip, update: setShowSuggestedTip } = usePreference("printer_show_suggested_tip", "true");
  const { value: printTimeClockReport, update: setPrintTimeClockReport } = usePreference("printer_print_time_clock_report", "false");
  const { value: largeItemText, update: setLargeItemText } = usePreference("printer_large_item_text", "false");
  const { value: largeOrderNumber, update: setLargeOrderNumber } = usePreference("printer_large_order_number", "true");
  const { value: printItemsSeparately, update: setPrintItemsSeparately } = usePreference("printer_print_items_separately", "false");
  const { value: reverseTextStyle, update: setReverseTextStyle } = usePreference("printer_reverse_text_style", "false");
  const { value: signatureTipLine, update: setSignatureTipLine } = usePreference("printer_signature_tip_line", "true");
  const { value: requireForSalesOver, update: setRequireForSalesOver } = usePreference("printer_require_for_sales_over", "false");
  const { value: salesOverAmount, update: setSalesOverAmount } = usePreference("printer_sales_over_amount", "0.00");
  const { value: modifierTextSize, update: setModifierTextSize } = usePreference("printer_modifier_text_size", "Tall");
  const { value: selectedOrderTypesStr, update: setSelectedOrderTypesStr } = usePreference("printer_kitchen_order_types", "");

  const selectedOrderTypes = selectedOrderTypesStr ? selectedOrderTypesStr.split(",") : [];

  const toBool = (v: string) => v === "true";

  const [isOrderTypeSheetOpen, setIsOrderTypeSheetOpen] = useState(false);
  const [isTextSizeDropdownOpen, setIsTextSizeDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const orderTypeOptions = ["Dine In", "Takeout", "Delivery", "Drive Thru", "Curbside", "Catering"];

  // Local state for the sales amount input (only persists on blur)
  const [localSalesAmount, setLocalSalesAmount] = useState(salesOverAmount);
  useEffect(() => { setLocalSalesAmount(salesOverAmount); }, [salesOverAmount]);

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

  const SettingOption = ({ label, description, children }: { label: string; description: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between py-3.5 px-4">
          <span className="text-foreground text-base font-medium">{label}</span>
          {children}
        </div>
      </div>
      <p className="text-neutral-500 text-xs mt-1.5 px-1 leading-relaxed">{description}</p>
    </div>
  );

  const ToggleOption = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <SettingOption label={label} description={description}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </SettingOption>
  );

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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Advanced Settings</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="px-6 pb-28">
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configure advanced printing preferences for bills, receipts, kitchen tickets, and more.
          </p>
        </div>

        {/* Bills */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Bills</p>
        <ToggleOption label="Auto-Print Bills" description="Automatically print bills when an order is completed." checked={toBool(autoPrintBills)} onChange={(v) => setAutoPrintBills(String(v))} />
        <ToggleOption label="Show Single Products" description="Display individual products on printed bills." checked={toBool(showSingleItems)} onChange={(v) => setShowSingleItems(String(v))} />
        <ToggleOption label="Show Free Products" description="Include complimentary products on the bill." checked={toBool(showFreeItems)} onChange={(v) => setShowFreeItems(String(v))} />
        <ToggleOption label="Show Free Modifiers" description="Include free modifiers on the bill for each product." checked={toBool(showFreeModifiers)} onChange={(v) => setShowFreeModifiers(String(v))} />

        {/* Receipts */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3 mt-2">Receipts</p>
        <ToggleOption label="Auto-Print Receipt" description="Automatically print a receipt after every sale." checked={toBool(autoPrintReceipt)} onChange={(v) => setAutoPrintReceipt(String(v))} />
        <ToggleOption label="Auto-Print Refund" description="Automatically print a receipt when a refund is processed." checked={toBool(autoPrintRefund)} onChange={(v) => setAutoPrintRefund(String(v))} />
        <ToggleOption label="Itemized Receipt" description="Show a detailed breakdown of each product on the receipt." checked={toBool(itemizedReceipt)} onChange={(v) => setItemizedReceipt(String(v))} />
        <ToggleOption label="Print Customer Copy" description="Print an additional copy of the receipt for the customer." checked={toBool(printCustomerCopy)} onChange={(v) => setPrintCustomerCopy(String(v))} />
        <ToggleOption label="Show Suggested Tip" description="Display suggested tip amounts on the printed receipt." checked={toBool(showSuggestedTip)} onChange={(v) => setShowSuggestedTip(String(v))} />
        <ToggleOption label="Print Time Clock Report" description="Allow printing of employee time clock reports." checked={toBool(printTimeClockReport)} onChange={(v) => setPrintTimeClockReport(String(v))} />

        {/* Kitchen Tickets */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3 mt-2">Kitchen Tickets</p>
        <ToggleOption label="Large Product Text" description="Increase the font size for product names on kitchen tickets." checked={toBool(largeItemText)} onChange={(v) => setLargeItemText(String(v))} />
        <ToggleOption label="Large Order Number" description="Enlarge the order number for quick identification." checked={toBool(largeOrderNumber)} onChange={(v) => setLargeOrderNumber(String(v))} />
        <ToggleOption label="Print Products Separately" description="Print each product on its own individual ticket." checked={toBool(printItemsSeparately)} onChange={(v) => setPrintItemsSeparately(String(v))} />
        <ToggleOption label="Reverse Text Style" description="Swap text and background colours for improved readability." checked={toBool(reverseTextStyle)} onChange={(v) => setReverseTextStyle(String(v))} />

        {/* Modifiers */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3 mt-2">Modifiers</p>
        <SettingOption label="Modifier Text Size" description="Set the text size for modifiers on kitchen tickets.">
          <button
            ref={triggerRef}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setDropdownPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
              setIsTextSizeDropdownOpen(!isTextSizeDropdownOpen);
            }}
            className="flex items-center gap-2"
          >
            <span className="text-neutral-500 text-sm">{modifierTextSize}</span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </button>
        </SettingOption>
        <SettingOption label="Kitchen Order Ticket Print with" description="Choose which order types trigger kitchen ticket printing.">
          <button
            onClick={() => setIsOrderTypeSheetOpen(true)}
            className="flex items-center gap-2"
          >
            <span className="text-neutral-500 text-sm">
              {selectedOrderTypes.length > 0 ? selectedOrderTypes.join(", ") : "Select"}
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </button>
        </SettingOption>

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
            setSelectedOrderTypesStr(items.join(","));
            setIsOrderTypeSheetOpen(false);
          }}
          initialSelected={selectedOrderTypes}
          options={orderTypeOptions}
          title="Select Order Types"
        />

        {/* Signatures & Tips */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3 mt-2">Signatures & Tips</p>
        <ToggleOption label="Signature & Tip Line" description="Include a signature and tip line on printed receipts." checked={toBool(signatureTipLine)} onChange={(v) => setSignatureTipLine(String(v))} />
        <ToggleOption label="Require for Sales Over" description="Require a signature for transactions above a set amount." checked={toBool(requireForSalesOver)} onChange={(v) => setRequireForSalesOver(String(v))} />
        {toBool(requireForSalesOver) && (
          <SettingOption label="For Sales Over" description="Set the minimum sale amount that requires a signature.">
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-sm">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={localSalesAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(val)) {
                    setLocalSalesAmount(val);
                  }
                }}
                onBlur={() => {
                  const num = parseFloat(localSalesAmount);
                  const formatted = isNaN(num) ? "0.00" : num.toFixed(2);
                  setLocalSalesAmount(formatted);
                  setSalesOverAmount(formatted);
                }}
                className="bg-transparent text-neutral-500 text-sm text-right w-20 outline-none focus:text-foreground"
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </SettingOption>
        )}
      </div>
    </div>
  );
};

export default PrinterAdvancedContent;
