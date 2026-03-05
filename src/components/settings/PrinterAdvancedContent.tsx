import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import { usePreference } from "@/hooks/usePreference";

interface PrinterAdvancedContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const PrinterAdvancedContent = ({ showHeader = true, onBack }: PrinterAdvancedContentProps) => {
  const isMobile = useIsMobile();
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

  const ToggleRow = ({ label, checked, onChange, isLast = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; isLast?: boolean }) => (
    <>
      <div className="flex items-center justify-between py-3.5 px-4">
        <span className="text-foreground text-base font-medium">{label}</span>
        <Switch checked={checked} onCheckedChange={onChange} />
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

      <div className="px-6 pb-28">
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
          <ToggleRow label="Auto-Print Bills" checked={toBool(autoPrintBills)} onChange={(v) => setAutoPrintBills(String(v))} />
          <ToggleRow label="Show Single Products" checked={toBool(showSingleItems)} onChange={(v) => setShowSingleItems(String(v))} />
          <ToggleRow label="Show Free Products" checked={toBool(showFreeItems)} onChange={(v) => setShowFreeItems(String(v))} />
          <ToggleRow label="Show Free Modifiers" checked={toBool(showFreeModifiers)} onChange={(v) => setShowFreeModifiers(String(v))} isLast />
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings let you customise how customer bills are printed, including automatic printing and whether individual products, complimentary products, and free modifiers appear on the receipt. This helps you control the level of detail shown to customers.
        </p>

        {/* Receipts */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Receipts</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Auto-Print Receipt" checked={toBool(autoPrintReceipt)} onChange={(v) => setAutoPrintReceipt(String(v))} />
          <ToggleRow label="Auto-Print Refund" checked={toBool(autoPrintRefund)} onChange={(v) => setAutoPrintRefund(String(v))} />
          <ToggleRow label="Itemized Receipt" checked={toBool(itemizedReceipt)} onChange={(v) => setItemizedReceipt(String(v))} />
          <ToggleRow label="Print Customer Copy" checked={toBool(printCustomerCopy)} onChange={(v) => setPrintCustomerCopy(String(v))} />
          <ToggleRow label="Show Suggested Tip" checked={toBool(showSuggestedTip)} onChange={(v) => setShowSuggestedTip(String(v))} />
          <ToggleRow label="Print Time Clock Report" checked={toBool(printTimeClockReport)} onChange={(v) => setPrintTimeClockReport(String(v))} isLast />
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings allow you to control how receipts are printed, including automatic printing for sales and refunds, whether receipts are itemised, if a customer copy is printed, whether suggested tips are shown, and if time clock reports can be printed. This helps you manage the level of detail and automation for receipt printing in your restaurant.
        </p>

        {/* Kitchen Tickets */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Kitchen Tickets</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Large Product Text" checked={toBool(largeItemText)} onChange={(v) => setLargeItemText(String(v))} />
          <ToggleRow label="Large Order Number" checked={toBool(largeOrderNumber)} onChange={(v) => setLargeOrderNumber(String(v))} />
          <ToggleRow label="Print Products Separately" checked={toBool(printItemsSeparately)} onChange={(v) => setPrintItemsSeparately(String(v))} />
          <ToggleRow label="Reverse Text Style" checked={toBool(reverseTextStyle)} onChange={(v) => setReverseTextStyle(String(v))} isLast />
        </div>
        <p className="text-neutral-500 text-xs px-4 mt-1.5 mb-6">
          These settings control how kitchen tickets are printed, including adjusting text size for better visibility, enlarging the order number, printing products separately, and reversing the text style for clearer readability in the kitchen. This helps improve speed, accuracy, and visibility for kitchen staff during busy service hours.
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
            setSelectedOrderTypesStr(items.join(","));
            setIsOrderTypeSheetOpen(false);
          }}
          initialSelected={selectedOrderTypes}
          options={orderTypeOptions}
          title="Select Order Types"
        />

        {/* Signatures & Tips */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Signatures & Tips</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <ToggleRow label="Signature & Tip Line" checked={toBool(signatureTipLine)} onChange={(v) => setSignatureTipLine(String(v))} />
          <div className="h-px bg-neutral-700/50 mx-4" />
          <ToggleRow label="Require for Sales Over" checked={toBool(requireForSalesOver)} onChange={(v) => setRequireForSalesOver(String(v))} />
          {toBool(requireForSalesOver) && (
            <>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">For Sales Over</span>
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
