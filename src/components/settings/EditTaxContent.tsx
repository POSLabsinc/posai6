import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [applicableTo, setApplicableTo] = useState(tax?.applicableTo || "");
  const [applicableProducts, setApplicableProducts] = useState<string[]>(tax?.applicableProducts || []);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showApplicableToDropdown, setShowApplicableToDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);

  const [typePosition, setTypePosition] = useState<DropdownPosition>({ top: 0, right: 0 });
  const [applicableToPosition, setApplicableToPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
  const [productsPosition, setProductsPosition] = useState<DropdownPosition>({ top: 0, right: 0 });

  const typeRef = useRef<HTMLButtonElement>(null);
  const applicableToRef = useRef<HTMLButtonElement>(null);
  const productsRef = useRef<HTMLButtonElement>(null);

  const typeOptions = ["Exclusive", "Inclusive"];
  const applicableToOptions = ["All Items", "Food Only", "Beverages Only", "Alcohol Only"];
  const productOptions = ["Appetizers", "Main Course", "Desserts", "Drinks", "Alcohol"];

  const handleBack = () => {
    // Auto-save if we have the required fields
    if (name && amount && type) {
      onSave({
        ...tax,
        name,
        amount: parseFloat(amount),
        type,
        applicableTo,
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
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Required"
                  className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-24"
                />
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
            ref={applicableToRef}
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => {
              if (applicableToRef.current) {
                const rect = applicableToRef.current.getBoundingClientRect();
                setApplicableToPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
              }
              setShowApplicableToDropdown(true);
            }}
          >
            <span className="text-foreground text-base font-medium">Applicable to</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{applicableTo || "Choose"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Applicable Products Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <button 
            ref={productsRef}
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => {
              if (productsRef.current) {
                const rect = productsRef.current.getBoundingClientRect();
                setProductsPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
              }
              setShowProductsDropdown(true);
            }}
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

      {/* Applicable To Dropdown Overlay */}
      {showApplicableToDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowApplicableToDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
            style={{ top: applicableToPosition.top, right: applicableToPosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {applicableToOptions.map((option) => (
              <button
                key={option}
                className={`w-full text-left px-4 py-3 text-base transition-colors ${
                  applicableTo === option 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setApplicableTo(option);
                  setShowApplicableToDropdown(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Applicable Products Dropdown Overlay */}
      {showProductsDropdown && (
        <div 
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          onClick={() => setShowProductsDropdown(false)}
        >
          <div 
            className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[140px] animate-in zoom-in-95 duration-200"
            style={{ top: productsPosition.top, right: productsPosition.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {productOptions.map((option) => (
              <button
                key={option}
                className={`w-full text-left px-4 py-3 text-base transition-colors flex items-center justify-between ${
                  applicableProducts.includes(option) 
                    ? "text-foreground bg-neutral-700/50" 
                    : "text-neutral-400 hover:bg-neutral-700/30"
                }`}
                onClick={() => {
                  setApplicableProducts(prev => 
                    prev.includes(option) 
                      ? prev.filter(p => p !== option)
                      : [...prev, option]
                  );
                }}
              >
                {option}
                {applicableProducts.includes(option) && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTaxContent;
