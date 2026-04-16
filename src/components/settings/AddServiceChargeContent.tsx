import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus, X, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderTypeSheet } from "@/components/ui/order-type-sheet";

interface AddServiceChargeContentProps {
  onBack: () => void;
  onSave: (serviceCharge: {
    name: string;
    amount: number;
    type: "Percentage" | "Fixed";
    taxApplicable: string;
    orderType: string[];
    appliedAs: string;
    automaticApply: boolean;
    minSeats: number;
    requiresManagerPin: boolean;
  }) => void;
}

interface DropdownPosition {
  top: number;
  right: number;
}

const AddServiceChargeContent = ({ onBack, onSave }: AddServiceChargeContentProps) => {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"Percentage" | "Fixed">("Percentage");
  const [taxApplicable, setTaxApplicable] = useState("");
  const [orderTypes, setOrderTypes] = useState<string[]>([]);
  const [appliedAs, setAppliedAs] = useState("Basic");
  const [automaticApply, setAutomaticApply] = useState(false);
  const [minSeats, setMinSeats] = useState(0);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showTaxDropdown, setShowTaxDropdown] = useState(false);
  const [showOrderTypeSheet, setShowOrderTypeSheet] = useState(false);
  const [showAppliedAsDropdown, setShowAppliedAsDropdown] = useState(false);

  const [typePosition, setTypePosition] = useState<DropdownPosition>({ top: 0, right: 0 });
  const [taxPosition, setTaxPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
  const [appliedAsPosition, setAppliedAsPosition] = useState<DropdownPosition>({ top: 0, right: 0 });

  const typeRef = useRef<HTMLButtonElement>(null);
  const taxRef = useRef<HTMLButtonElement>(null);
  const appliedAsRef = useRef<HTMLButtonElement>(null);

  const typeOptions = ["Percentage", "Amount"];
  const taxOptions = ["Taxable", "Non-Taxable"];
  const appliedAsOptions = ["Basic", "Large Table", "Private Event", "Premium Service"];

  const handleBack = () => {
    if (name && amount) {
      onSave({
        name,
        amount: parseFloat(amount) || 0,
        type,
        taxApplicable,
        orderType: orderTypes,
        appliedAs,
        automaticApply,
        minSeats,
        requiresManagerPin: false,
      });
    }
    onBack();
  };

  const getOrderTypeDisplayValue = () => {
    if (orderTypes.length === 0) return "Choose";
    if (orderTypes.length === 1) return orderTypes[0];
    return `${orderTypes.length} Selected`;
  };

  const incrementSeats = () => {
    setMinSeats(prev => prev + 1);
  };

  const decrementSeats = () => {
    setMinSeats(prev => Math.max(0, prev - 1));
  };

  const openDropdown = (
    ref: React.RefObject<HTMLButtonElement>,
    setPosition: React.Dispatch<React.SetStateAction<DropdownPosition>>,
    setShow: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
    }
    setShow(true);
  };

  const getTypeDisplayValue = () => {
    return type === "Fixed" ? "Amount" : "Percentage";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-center py-4 px-4 relative">
        <button
          onClick={handleBack}
          className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Add Service Charge</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Name and Amount Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mt-2">
          {/* Name Field */}
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-32"
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
          
          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Amount Field with Type Toggle */}
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">Amount</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-16"
              />
              <button
                ref={typeRef}
                onClick={() => openDropdown(typeRef, setTypePosition, setShowTypeDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-700/50 active:opacity-70 transition-opacity"
              >
                <span className="text-neutral-400 text-sm">{getTypeDisplayValue()}</span>
                <X className="w-3 h-3 text-neutral-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tax Applicable Card */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mt-4">
          <button 
            ref={taxRef}
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => openDropdown(taxRef, setTaxPosition, setShowTaxDropdown)}
          >
            <span className="text-foreground text-base font-medium">Tax Applicable</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{taxApplicable || "Choose"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Order Type Card */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mt-4">
          <button 
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowOrderTypeSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Order Type</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{getOrderTypeDisplayValue()}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Applied As Card */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mt-4">
          <button 
            ref={appliedAsRef}
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => openDropdown(appliedAsRef, setAppliedAsPosition, setShowAppliedAsDropdown)}
          >
            <span className="text-foreground text-base font-medium">Applied as</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{appliedAs}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm mt-2 px-1">
          Choose this as a 'large table' service charge
        </p>

        {/* Automatic Apply Toggle */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mt-6">
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">Automatically apply this service charge?</span>
            <Switch
              checked={automaticApply}
              onCheckedChange={setAutomaticApply}
            />
          </div>

          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Min Seats Field */}
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">Apply to table with seats at least</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-base w-6 text-center">{minSeats}</span>
              <button
                onClick={decrementSeats}
                className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={incrementSeats}
                className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-neutral-500 text-sm mt-2 px-1">
          Table size must be greater than 0
        </p>
      </div>

      {/* Type Dropdown Overlay */}
      {showTypeDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowTypeDropdown(false)}
        >
          <div 
            className="fixed bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
            style={{ top: typePosition.top, right: typePosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {typeOptions.map((option) => {
              const isSelected = (type === "Percentage" && option === "Percentage") || (type === "Fixed" && option === "Amount");
              return (
                <button
                  key={option}
                  className={`w-full flex items-center justify-between px-4 py-3 text-base transition-colors ${
                    isSelected 
                      ? "text-foreground bg-neutral-100 dark:bg-neutral-700/50" 
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                  }`}
                  onClick={() => {
                    setType(option === "Amount" ? "Fixed" : "Percentage");
                    setShowTypeDropdown(false);
                  }}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tax Applicable Dropdown Overlay */}
      {showTaxDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowTaxDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
            style={{ top: taxPosition.top, right: taxPosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {taxOptions.map((option) => (
              <button
                key={option}
                className={`w-full text-left px-4 py-3 text-base transition-colors ${
                  taxApplicable === option 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setTaxApplicable(option);
                  setShowTaxDropdown(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Type Sheet */}
      <OrderTypeSheet
        isOpen={showOrderTypeSheet}
        onClose={(selectedTypes) => {
          setOrderTypes(selectedTypes);
          setShowOrderTypeSheet(false);
        }}
        initialSelected={orderTypes}
      />

      {/* Applied As Dropdown Overlay */}
      {showAppliedAsDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowAppliedAsDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
            style={{ top: appliedAsPosition.top, right: appliedAsPosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {appliedAsOptions.map((option) => (
              <button
                key={option}
                className={`w-full text-left px-4 py-3 text-base transition-colors ${
                  appliedAs === option 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setAppliedAs(option);
                  setShowAppliedAsDropdown(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddServiceChargeContent;
