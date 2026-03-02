import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrderTypeSheet } from "@/components/ui/order-type-sheet";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { getAllProductNames } from "@/lib/productStore";

interface Tax {
  id: string;
  name: string;
  amount: number;
  type: "Exclusive" | "Inclusive";
  archived: boolean;
  applicableTo?: string;
  applicableProducts?: string[];
}

interface EditTaxContentProps {
  tax: Tax;
  onBack: () => void;
  onSave: (tax: Tax) => void;
}

interface DropdownPosition {
  top: number;
  right: number;
}

const EditTaxContent = ({ tax, onBack, onSave }: EditTaxContentProps) => {
  const [name, setName] = useState(tax?.name ?? '');
  const [amount, setAmount] = useState(tax?.amount?.toString() ?? '0');
  const [type, setType] = useState<"Exclusive" | "Inclusive">(tax?.type ?? "Exclusive");
  const [applicableProducts, setApplicableProducts] = useState<string[]>(tax?.applicableProducts || []);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showApplicableToSheet, setShowApplicableToSheet] = useState(false);
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<string[]>(
    tax?.applicableTo ? tax.applicableTo.split(", ").filter(Boolean) : []
  );
  const [showProductsSheet, setShowProductsSheet] = useState(false);

  const [typePosition, setTypePosition] = useState<DropdownPosition>({ top: 0, right: 0 });

  const typeRef = useRef<HTMLButtonElement>(null);

  const typeOptions = ["Exclusive", "Inclusive"];

  // Product list sourced from the unified product store (menu + custom products)
  const allProducts = getAllProductNames();

  const handleBack = () => {
    if (name && amount && type) {
      onSave({
        ...tax,
        name,
        amount: parseFloat(amount),
        type,
        applicableTo: selectedOrderTypes.join(", "),
        applicableProducts,
      });
    }
    onBack();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-center py-4 px-4 relative">
        <button
          onClick={handleBack}
          className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Edit Tax</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Main Fields Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
          {/* Name Field */}
          <div className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-base font-medium">Name</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Required"
                  className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-32"
                />
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </div>
            </div>
          </div>
          
          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Amount Field */}
          <div className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-base font-medium">Amount</span>
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = val.split('.');
                      const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                      setAmount(sanitized);
                    }}
                    placeholder="Required"
                    className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-20"
                  />
                  {amount && <span className="text-foreground text-base">%</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Type Field */}
          <button 
            ref={typeRef}
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => {
              if (typeRef.current) {
                const rect = typeRef.current.getBoundingClientRect();
                setTypePosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
              }
              setShowTypeDropdown(true);
            }}
          >
            <span className="text-foreground text-base font-medium">Type</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{type || "Choose"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>

          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Applicable To Field */}
          <button 
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowApplicableToSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Applicable to</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">
                {selectedOrderTypes.length > 0 ? selectedOrderTypes.join(", ") : "Choose"}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mb-6">
          Choose where the tax will apply — such as Dine-In, Takeaway, Delivery, the entire order, or selected categories — giving you full control over when the tax is charged.
        </p>

        {/* Applicable Products Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button 
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowProductsSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Applicable Products</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">
                {applicableProducts.length > 0 ? `${applicableProducts.length} selected` : "Choose"}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mb-6">
          Select specific products or categories where the tax should apply. For example, alcohol may have a different tax than food.
        </p>
      </div>

      {/* Type Dropdown Overlay */}
      {showTypeDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowTypeDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
            style={{ top: typePosition.top, right: typePosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {typeOptions.map((option) => (
              <button
                key={option}
                className={`w-full text-left px-4 py-3 text-base transition-colors ${
                  type === option 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setType(option as "Exclusive" | "Inclusive");
                  setShowTypeDropdown(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Applicable To - Order Type Sheet */}
      <OrderTypeSheet
        isOpen={showApplicableToSheet}
        onClose={(selected) => {
          setSelectedOrderTypes(selected);
          setShowApplicableToSheet(false);
        }}
        initialSelected={selectedOrderTypes}
      />

      {/* Applicable Products - Multi Select Sheet */}
      <MultiSelectSheet
        isOpen={showProductsSheet}
        onClose={(selected) => {
          setApplicableProducts(selected);
          setShowProductsSheet(false);
        }}
        initialSelected={applicableProducts}
        options={allProducts}
        title="Select Products"
      />
    </div>
  );
};

export default EditTaxContent;
