import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, FileText, ChevronLeft, ChevronDown, Delete, Fingerprint, ScanFace } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModifierOption {
  name: string;
  price?: number;
}

interface ModifierCategory {
  name: string;
  required?: boolean;
  options: ModifierOption[];
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface ItemCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  itemImage?: string;
  onAddToCart: (item: MenuItem, quantity: number, modifiers: string[], notes: string, totalPrice: number) => void;
  isManager?: boolean;
}

const overrideReasons = [
  "Manager Discount",
  "Customer Complaint",
  "Price Match",
  "Promotional Offer",
  "Employee Discount",
  "Loyalty Reward",
  "Other"
];

// Mock modifier data
const itemModifiers: ModifierCategory[] = [
  {
    name: "Bread",
    required: true,
    options: [
      { name: "Brioche Bun" },
      { name: "Sesame Seed Bun", price: 0.50 },
      { name: "Gluten-Free Bun", price: 1.50 },
      { name: "Lettuce Wrap" },
    ]
  },
  {
    name: "Temperature",
    required: true,
    options: [
      { name: "Rare" },
      { name: "Medium Rare" },
      { name: "Medium" },
      { name: "Medium Well" },
      { name: "Well Done" },
    ]
  },
  {
    name: "Cheese",
    required: true,
    options: [
      { name: "Cheddar" },
      { name: "Swiss" },
      { name: "Havarti" },
      { name: "American" },
      { name: "Pepper Jack" },
      { name: "No Cheese" },
    ]
  },
  {
    name: "Sauces",
    required: false,
    options: [
      { name: "Mayonnaise" },
      { name: "Ketchup" },
      { name: "Mustard" },
      { name: "BBQ Sauce", price: 0.50 },
      { name: "Ranch", price: 0.50 },
      { name: "Hot Sauce" },
    ]
  },
];

const addOnItems: ModifierOption[] = [
  { name: "Extra Cheese", price: 1.50 },
  { name: "Bacon", price: 2.00 },
  { name: "Avocado", price: 2.50 },
  { name: "Fried Egg", price: 1.50 },
  { name: "Mushrooms", price: 1.00 },
  { name: "Onion Rings", price: 2.00 },
  { name: "Jalapeños", price: 0.75 },
  { name: "Extra Patty", price: 4.00 },
];

export const ItemCustomizationDialog = ({
  open,
  onOpenChange,
  item,
  itemImage,
  onAddToCart,
  isManager = false
}: ItemCustomizationDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'item' | 'addons'>('item');
  const [activeModifierCategory, setActiveModifierCategory] = useState(itemModifiers[0]?.name || "");
  const [itemNotes, setItemNotes] = useState("");
  const [overriddenPrice, setOverriddenPrice] = useState<number | null>(null);
  
  // View state: 'customization' | 'mpin' | 'priceOverride'
  const [currentView, setCurrentView] = useState<'customization' | 'mpin' | 'priceOverride'>('customization');
  
  // MPIN state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const correctPin = "1234";
  
  // Price Override state
  const [newPriceInput, setNewPriceInput] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Reset all state when dialog opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      setOverriddenPrice(null);
      setQuantity(1);
      setSelectedModifiers([]);
      setSelectedAddOns([]);
      setItemNotes("");
      setActiveTab('item');
      setCurrentView('customization');
      setPin("");
      setPinError(false);
      setNewPriceInput("");
      setSelectedReason("");
      setOverrideNotes("");
    }
  }, [open, item?.id]);

  // Handle PIN verification - any 4-digit PIN works
  useEffect(() => {
    if (pin.length === 4) {
      setTimeout(() => {
        setCurrentView('priceOverride');
        setPin("");
      }, 200);
    }
  }, [pin]);

  const handlePriceClick = () => {
    if (isManager) {
      setCurrentView('priceOverride');
    } else {
      setCurrentView('mpin');
    }
  };

  const handleBackToCustomization = () => {
    setCurrentView('customization');
    setPin("");
    setPinError(false);
    setNewPriceInput("");
    setSelectedReason("");
    setOverrideNotes("");
  };

  const handlePinNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin("");
  };

  const handlePriceNumberClick = (num: string) => {
    if (newPriceInput.length < 8) {
      setNewPriceInput(prev => prev + num);
    }
  };

  const handlePriceBackspace = () => {
    setNewPriceInput(prev => prev.slice(0, -1));
  };

  const handlePriceClear = () => {
    setNewPriceInput("");
  };

  const handleApplyPriceOverride = () => {
    const newPrice = parseFloat(newPriceInput);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setOverriddenPrice(newPrice);
      setCurrentView('customization');
      setNewPriceInput("");
      setSelectedReason("");
      setOverrideNotes("");
    }
  };

  const formatPriceDisplay = (input: string) => {
    if (!input) return "0.00";
    // If input contains decimal, format it properly
    if (input.includes('.')) {
      const parts = input.split('.');
      const dollars = parts[0] || "0";
      const cents = (parts[1] || "").padEnd(2, "0").slice(0, 2);
      return `${dollars}.${cents}`;
    }
    return `${input}.00`;
  };

  const renderPinDots = () => (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            pinError 
              ? 'bg-red-500 animate-shake' 
              : index < pin.length 
                ? 'bg-white' 
                : 'bg-neutral-600'
          }`}
        />
      ))}
    </div>
  );

  if (!item) return null;

  const toggleModifier = (modifier: string) => {
    setSelectedModifiers(prev => 
      prev.includes(modifier) 
        ? prev.filter(m => m !== modifier)
        : [...prev, modifier]
    );
  };

  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOn) 
        ? prev.filter(a => a !== addOn)
        : [...prev, addOn]
    );
  };

  const handleAddToCart = () => {
    const allModifiers = [...selectedModifiers, ...selectedAddOns];
    
    // Calculate modifier prices
    const modifierTotal = selectedModifiers.reduce((total, modName) => {
      for (const category of itemModifiers) {
        const option = category.options.find(o => o.name === modName);
        if (option?.price) {
          return total + option.price;
        }
      }
      return total;
    }, 0);
    
    // Calculate add-on prices
    const addOnTotal = selectedAddOns.reduce((total, addOnName) => {
      const addOn = addOnItems.find(a => a.name === addOnName);
      return total + (addOn?.price || 0);
    }, 0);
    
    const basePrice = overriddenPrice !== null ? overriddenPrice : item.price;
    const totalPrice = (basePrice + modifierTotal + addOnTotal) * quantity;
    
    onAddToCart(item, quantity, allModifiers, itemNotes, totalPrice);
    // Reset state
    setQuantity(1);
    setSelectedModifiers([]);
    setSelectedAddOns([]);
    setItemNotes("");
    setActiveTab('item');
    onOpenChange(false);
  };

  const activeCategory = itemModifiers.find(cat => cat.name === activeModifierCategory);

  // MPIN Screen
  const renderMPINView = () => (
    <div className="flex flex-col bg-neutral-900 p-6 pb-8">
      {/* Header - Center aligned */}
      <div className="text-center mb-6">
        <h3 className="text-foreground font-bold text-xl mb-1">Access Restricted</h3>
        <p className="text-muted-foreground text-sm">Enter Manager PIN to Adjust Price.</p>
      </div>

      {/* PIN Display with asterisks */}
      <div className={`flex justify-center gap-3 mb-6 ${pinError ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all ${
              index < pin.length
                ? pinError
                  ? "border-red-500 bg-red-500/10"
                  : "border-neutral-600 bg-neutral-800"
                : "border-neutral-600 bg-neutral-800"
            }`}
          >
            {index < pin.length ? <span className="text-foreground">✱</span> : ""}
          </div>
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePinNumberClick(num.toString())}
            className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-2xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            {num}
          </button>
        ))}
        {/* Backspace button (left) */}
        <button
          onClick={handlePinBackspace}
          className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
        {/* Zero button (center) */}
        <button
          onClick={() => handlePinNumberClick("0")}
          className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-2xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          0
        </button>
        {/* Clear button (right) - red C */}
        <button
          onClick={handlePinClear}
          className="h-14 rounded-xl bg-neutral-800 border border-neutral-700 text-2xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          C
        </button>
      </div>

      {/* Biometric Options - Below keypad */}
      <div className="flex justify-center gap-3 mt-4 max-w-[280px] mx-auto w-full">
        <button className="flex-1 flex items-center justify-center py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
          <Fingerprint className="w-6 h-6" />
        </button>
        <button className="flex-1 flex items-center justify-center py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
          <ScanFace className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  // Price Override Screen
  const renderPriceOverrideView = () => (
    <ScrollArea className="max-h-[80vh]">
      <div className="flex flex-col bg-neutral-900 p-4 pb-4">
        {/* Header - Center aligned */}
        <div className="text-center mb-2">
          <h3 className="text-foreground font-bold text-base">Price Override</h3>
        </div>

        {/* Item row with image and name */}
        <div className="flex items-center gap-2 mb-2">
          {itemImage && (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <img src={itemImage} alt={item?.name} className="w-full h-full object-cover" />
            </div>
          )}
          <span className="text-foreground font-semibold text-sm">{item?.name}</span>
        </div>

        {/* Reason Dropdown */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowReasonDropdown(!showReasonDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-left text-sm"
          >
            <span className={selectedReason ? "text-foreground" : "text-muted-foreground"}>
              {selectedReason || "Select reason for override"}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showReasonDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showReasonDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 rounded-xl overflow-hidden z-10 border border-neutral-700 max-h-36 overflow-y-auto">
              {overrideReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => {
                    setSelectedReason(reason);
                    setShowReasonDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-700 transition-colors ${
                    selectedReason === reason ? 'text-orange-500' : 'text-foreground'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes field for "Other" reason */}
        {selectedReason === "Other" && (
          <input
            type="text"
            placeholder="Enter reason..."
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground outline-none mb-2 text-sm"
          />
        )}

        {/* Price Display Rows */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl mb-2 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
            <span className="text-destructive font-medium text-sm">Price</span>
            <span className="text-destructive font-semibold text-sm">${item?.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-foreground font-medium text-sm">New Price</span>
            <span className="text-green-500 font-semibold text-sm">${formatPriceDisplay(newPriceInput)}</span>
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-1.5 w-full mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handlePriceNumberClick(num.toString())}
              className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              {num}
            </button>
          ))}
          {/* Decimal point (left) */}
          <button
            onClick={() => {
              if (!newPriceInput.includes('.')) {
                setNewPriceInput(prev => prev + '.');
              }
            }}
            className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-bold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            .
          </button>
          {/* Zero button (center) */}
          <button
            onClick={() => handlePriceNumberClick("0")}
            className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            0
          </button>
          {/* Backspace button (right) */}
          <button
            onClick={handlePriceBackspace}
            className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleBackToCustomization}
            variant="outline"
            className="flex-1 h-10 rounded-xl bg-neutral-800 border-neutral-700 text-foreground hover:bg-neutral-700 text-sm"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleApplyPriceOverride}
            disabled={!newPriceInput || !selectedReason}
            className="flex-1 h-10 rounded-xl text-white font-bold disabled:opacity-40 disabled:bg-neutral-600 text-sm"
            style={{ background: !newPriceInput || !selectedReason ? undefined : 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
          >
            APPLY
          </Button>
        </div>
      </div>
    </ScrollArea>
  );

  // Customization Screen
  const renderCustomizationView = () => (
    <>
      {/* Grabber Handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-12 h-1 bg-neutral-600 rounded-full" />
      </div>

      {/* Item Header */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3">
          {itemImage && (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={itemImage} alt={item?.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base leading-tight">{item?.name}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={handlePriceClick}
              className="bg-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-600 transition-colors cursor-pointer"
            >
              {overriddenPrice !== null ? (
                <div className="flex flex-col items-center">
                  <span className="text-white font-bold">${overriddenPrice.toFixed(2)}</span>
                  <span className="text-neutral-400 text-[10px] line-through">${item?.price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-white font-bold">${item?.price.toFixed(2)}</span>
              )}
            </button>
            <div className="flex items-center gap-1 bg-neutral-700 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center text-white hover:bg-neutral-600 rounded-l-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-white font-medium text-base">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
                className="w-9 h-9 flex items-center justify-center text-white hover:bg-neutral-600 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Modifiers Pills */}
      {selectedModifiers.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {selectedModifiers.map(modifier => (
              <span 
                key={modifier}
                className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full"
              >
                {modifier}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Item Notes */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
          <FileText className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Item notes"
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('item')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'item' 
                ? 'bg-neutral-700 text-white' 
                : 'bg-transparent text-neutral-400'
            }`}
          >
            Item
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'addons' 
                ? 'bg-neutral-700 text-white' 
                : 'bg-transparent text-neutral-400'
            }`}
          >
            Add-Ons
          </button>
        </div>
      </div>

      {activeTab === 'item' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Required Modifiers Label */}
          <div className="px-4 pb-2">
            <span className="text-white text-sm font-medium">Required Modifiers</span>
            <span className="text-red-500 ml-0.5">*</span>
          </div>

          {/* Modifier Categories */}
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {itemModifiers.map(category => (
                <button
                  key={category.name}
                  onClick={() => setActiveModifierCategory(category.name)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                    activeModifierCategory === category.name
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-neutral-400 border-neutral-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Modifier Options */}
          <ScrollArea className="flex-1 min-h-0 max-h-[180px]">
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {activeCategory?.options.map(option => (
                  <button
                    key={option.name}
                    onClick={() => toggleModifier(option.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedModifiers.includes(option.name)
                        ? 'bg-white text-black'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {option.name}
                    {option.price && <span className="ml-1 text-neutral-500">${option.price.toFixed(2)}</span>}
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 max-h-[250px]">
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {addOnItems.map(addOn => (
                <button
                  key={addOn.name}
                  onClick={() => toggleAddOn(addOn.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedAddOns.includes(addOn.name)
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {addOn.name}
                  {addOn.price && <span className="ml-1 text-neutral-500">${addOn.price.toFixed(2)}</span>}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Add to Cart Button */}
      <div className="p-4 pt-2 border-t border-neutral-700 mt-auto">
        <Button
          onClick={handleAddToCart}
          className="w-full py-3 rounded-xl text-white font-bold text-base"
          style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
        >
          Add to Order
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`bg-neutral-900 border-neutral-700 p-0 max-w-md w-[95vw] md:w-full overflow-hidden rounded-2xl flex flex-col ${
          currentView === 'mpin' ? 'h-auto' : 'max-h-[90vh]'
        }`}
      >
        {currentView === 'customization' && renderCustomizationView()}
        {currentView === 'mpin' && renderMPINView()}
        {currentView === 'priceOverride' && renderPriceOverrideView()}
      </DialogContent>
    </Dialog>
  );
};

export default ItemCustomizationDialog;
