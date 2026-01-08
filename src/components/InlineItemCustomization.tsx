import { useState, useEffect } from "react";
import { ChevronDown, X, Search, Mic, ArrowUpDown, Delete, Fingerprint, ScanFace, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, MapPin, BadgeDollarSign, Tag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import offerIcon from "@/assets/icons/offer.png";

// Discount types for item-level discounts
interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: 'briefcase' | 'heart' | 'graduation' | 'shield' | 'star' | 'clock' | 'cake' | 'mappin' | 'dollar' | 'tag';
}

const discountTypes: DiscountType[] = [
  { id: 'employee', name: 'Employee Discount', description: '20% off', percentage: 20, icon: 'briefcase' },
  { id: 'senior', name: 'Senior Citizen', description: '15% off', percentage: 15, icon: 'heart' },
  { id: 'student', name: 'Student Discount', description: '10% off', percentage: 10, icon: 'graduation' },
  { id: 'military', name: 'Military Discount', description: '15% off', percentage: 15, icon: 'shield' },
  { id: 'loyalty', name: 'Loyalty Member', description: '5% off', percentage: 5, icon: 'star' },
  { id: 'happy', name: 'Happy Hour', description: '25% off', percentage: 25, icon: 'clock' },
  { id: 'birthday', name: 'Birthday Special', description: '30% off', percentage: 30, icon: 'cake' },
  { id: 'first', name: 'First Visit', description: '10% off', percentage: 10, icon: 'mappin' },
  { id: 'comp5', name: 'Manager Comp $5', description: '$5.00 off', fixedAmount: 5, icon: 'dollar' },
  { id: 'comp10', name: 'Manager Comp $10', description: '$10.00 off', fixedAmount: 10, icon: 'dollar' },
  { id: 'comp15', name: 'Manager Comp $15', description: '$15.00 off', fixedAmount: 15, icon: 'dollar' },
  { id: 'promo', name: 'Promo Code Discount', description: '20% off', percentage: 20, icon: 'tag' },
];

interface ModifierOption {
  name: string;
  price?: number;
  category?: string;
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
interface InlineItemCustomizationProps {
  item: MenuItem;
  itemImage?: string;
  onAddToCart: (item: MenuItem, quantity: number, modifiers: string[], notes: string, totalPrice: number) => void;
  onCancel: () => void;
  onViewChange?: (view: 'customization' | 'mpin' | 'priceOverride' | 'productInfo') => void;
  className?: string;
}

// Mock modifier data
const itemModifiers: ModifierCategory[] = [{
  name: "Bread",
  required: true,
  options: [{
    name: "Brioche Bun"
  }, {
    name: "Sesame Seed Bun",
    price: 0.50
  }, {
    name: "Gluten-Free Bun",
    price: 1.50
  }, {
    name: "Lettuce Wrap"
  }]
}, {
  name: "Temperature",
  required: true,
  options: [{
    name: "Rare"
  }, {
    name: "Medium Rare"
  }, {
    name: "Medium"
  }, {
    name: "Medium Well"
  }, {
    name: "Well Done"
  }]
}, {
  name: "Cheese",
  required: true,
  options: [{
    name: "Cheddar"
  }, {
    name: "Swiss"
  }, {
    name: "Havarti"
  }, {
    name: "American"
  }, {
    name: "Pepper Jack"
  }, {
    name: "No Cheese"
  }]
}, {
  name: "Sauces",
  required: false,
  options: [{
    name: "Mayonnaise"
  }, {
    name: "Ketchup"
  }, {
    name: "Mustard"
  }, {
    name: "BBQ Sauce",
    price: 0.50
  }, {
    name: "Ranch",
    price: 0.50
  }, {
    name: "Hot Sauce"
  }]
}];

// Add-on categories
const addOnCategories = ["House Favorites", "All"];
const addOnSubcategories = ["Beverages", "Desserts", "Side Options", "Proteins", "Extras"];

const addOnItems: ModifierOption[] = [{
  name: "Dew Mojito",
  price: 2.00,
  category: "Beverages"
}, {
  name: "Masala Pepsi",
  price: 3.00,
  category: "Beverages"
}, {
  name: "Virgin Mojito",
  price: 4.00,
  category: "Beverages"
}, {
  name: "Chocolate Cake",
  price: 5.00,
  category: "Desserts"
}, {
  name: "Ice Cream",
  price: 3.50,
  category: "Desserts"
}, {
  name: "French Fries",
  price: 3.00,
  category: "Side Options"
}, {
  name: "Onion Rings",
  price: 4.00,
  category: "Side Options"
}, {
  name: "Grilled Chicken",
  price: 6.00,
  category: "Proteins"
}, {
  name: "Extra Cheese",
  price: 1.50,
  category: "Extras"
}, {
  name: "Bacon",
  price: 2.00,
  category: "Extras"
}];

// Price override reasons
const overrideReasons = [
  "Manager Discount",
  "Price Match",
  "Customer Complaint",
  "Damaged Item",
  "Employee Discount",
  "VIP Customer",
  "Promotion",
  "Other"
];

export const InlineItemCustomization = ({
  item,
  itemImage,
  onAddToCart,
  onCancel,
  onViewChange,
  className
}: InlineItemCustomizationProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'item' | 'addons'>('item');
  const [activeModifierCategory, setActiveModifierCategory] = useState(itemModifiers[0]?.name || "");
  const [itemNotes, setItemNotes] = useState("");
  const [addOnSearchQuery, setAddOnSearchQuery] = useState("");
  const [activeAddOnCategory, setActiveAddOnCategory] = useState("House Favorites");
  const [activeAddOnSubcategory, setActiveAddOnSubcategory] = useState("Beverages");
  const [overriddenPrice, setOverriddenPrice] = useState<number | null>(null);
  
  // View state: 'customization' | 'mpin' | 'priceOverride' | 'productInfo'
  const [currentView, setCurrentView] = useState<'customization' | 'mpin' | 'priceOverride' | 'productInfo'>('customization');
  
  // MPIN state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  
  // Price Override state
  const [selectedReason, setSelectedReason] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [isPriceEdited, setIsPriceEdited] = useState(false);
  
  // Discount state
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);

  // Reset overriddenPrice when item changes
  useEffect(() => {
    setOverriddenPrice(null);
    setQuantity(1);
    setSelectedModifiers([]);
    setSelectedAddOns([]);
    setItemNotes("");
    setActiveTab('item');
    setAddOnSearchQuery("");
    setCurrentView('customization');
    setPin("");
    setPinError(false);
    setSelectedReason("");
    setNewPrice("");
    setOverrideNotes("");
    setSelectedDiscountId(null);
  }, [item.id]);

  // Handle PIN verification - any 4-digit PIN works
  useEffect(() => {
    if (pin.length === 4) {
      setTimeout(() => {
        setCurrentView('priceOverride');
        setPin("");
        setNewPrice(item.price.toFixed(2));
        setIsPriceEdited(false);
      }, 200);
    }
  }, [pin, item.price]);

  const handlePriceClick = () => {
    setCurrentView('mpin');
  };

  const handleProductInfoClick = () => {
    setCurrentView('productInfo');
    onViewChange?.('productInfo');
  };

  // MPIN handlers
  const handlePinNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setPinError(false);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinClear = () => {
    setPin("");
    setPinError(false);
  };

  // Price Override handlers - standard input style
  const handlePriceNumberClick = (num: string) => {
    // On first keypress, clear the initial price and start fresh
    if (!isPriceEdited) {
      setIsPriceEdited(true);
      if (num === '.') {
        setNewPrice("0.");
      } else {
        setNewPrice(num);
      }
      return;
    }
    
    // Prevent multiple decimals
    if (num === '.' && newPrice.includes('.')) return;
    
    // Limit decimal places to 2
    if (newPrice.includes('.') && newPrice.split('.')[1]?.length >= 2) return;
    
    // Limit total length
    if (newPrice.length >= 8) return;
    
    setNewPrice(prev => prev + num);
  };

  const handlePriceBackspace = () => {
    setNewPrice(prev => {
      const newVal = prev.slice(0, -1);
      if (newVal === '' || newVal === '0') {
        setIsPriceEdited(false);
        return item.price.toFixed(2);
      }
      return newVal;
    });
  };

  const handlePriceClear = () => {
    setNewPrice(item.price.toFixed(2));
    setIsPriceEdited(false);
  };

  const handlePriceOverrideApply = () => {
    const parsedPrice = parseFloat(newPrice);
    if (!isNaN(parsedPrice) && selectedReason) {
      setOverriddenPrice(parsedPrice);
      setCurrentView('customization');
      setSelectedReason("");
      setNewPrice("");
      setOverrideNotes("");
    }
  };

  const toggleModifier = (modifier: string) => {
    setSelectedModifiers(prev => prev.includes(modifier) ? prev.filter(m => m !== modifier) : [...prev, modifier]);
  };
  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns(prev => prev.includes(addOn) ? prev.filter(a => a !== addOn) : [...prev, addOn]);
  };
  const handleAddToCart = () => {
    const allModifiers = [...selectedModifiers, ...selectedAddOns];
    onAddToCart(item, quantity, allModifiers, itemNotes, totalPrice);
  };
  const activeCategory = itemModifiers.find(cat => cat.name === activeModifierCategory);

  // Calculate add-on prices
  const addOnTotal = selectedAddOns.reduce((total, addOnName) => {
    const addOn = addOnItems.find(a => a.name === addOnName);
    return total + (addOn?.price || 0);
  }, 0);
  const modifierTotal = selectedModifiers.reduce((total, modName) => {
    for (const category of itemModifiers) {
      const option = category.options.find(o => o.name === modName);
      if (option?.price) {
        return total + option.price;
      }
    }
    return total;
  }, 0);
  const basePrice = overriddenPrice !== null ? overriddenPrice : item.price;
  const priceBeforeDiscount = (basePrice + addOnTotal + modifierTotal) * quantity;
  
  // Calculate discount
  const selectedDiscount = discountTypes.find(d => d.id === selectedDiscountId);
  const discountAmount = selectedDiscount 
    ? (selectedDiscount.fixedAmount || (priceBeforeDiscount * ((selectedDiscount.percentage || 0) / 100)))
    : 0;
  const totalPrice = priceBeforeDiscount - discountAmount;

  // Render MPIN View (Desktop style)
  const renderMPINView = () => (
    <div className="flex flex-col bg-neutral-900 p-4 h-full">
      {/* Header - Center aligned */}
      <div className="text-center mb-4">
        <h3 className="text-foreground font-bold text-lg mb-1">Access Restricted</h3>
        <p className="text-muted-foreground text-xs">Enter Manager PIN to Adjust Price.</p>
      </div>

      {/* PIN Display with asterisks */}
      <div className={`flex justify-center gap-2 mb-4 ${pinError ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
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
      <div className="grid grid-cols-3 gap-2 px-4 w-full flex-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePinNumberClick(num.toString())}
            className="h-11 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            {num}
          </button>
        ))}
        {/* Backspace button (left) */}
        <button
          onClick={handlePinBackspace}
          className="h-11 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
        >
          <Delete className="w-4 h-4" />
        </button>
        {/* Zero button (center) */}
        <button
          onClick={() => handlePinNumberClick("0")}
          className="h-11 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          0
        </button>
        {/* Clear button (right) - red C */}
        <button
          onClick={handlePinClear}
          className="h-11 rounded-xl bg-neutral-800 border border-neutral-700 text-xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          C
        </button>
      </div>

      {/* Biometric Options - Below keypad */}
      <div className="flex justify-center gap-2 mt-3 px-4 w-full">
        <button className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
          <Fingerprint className="w-5 h-5" />
        </button>
        <button className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
          <ScanFace className="w-5 h-5" />
        </button>
      </div>

      {/* Cancel button */}
      <div className="mt-4 px-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('customization')} 
          className="w-full py-2 rounded-full text-white font-medium text-xs bg-transparent border border-neutral-500 hover:bg-neutral-800 h-8"
        >
          CANCEL
        </Button>
      </div>
    </div>
  );

  // Render Price Override View (Desktop style)
  const renderPriceOverrideView = () => (
    <div className="flex flex-col bg-neutral-900 p-3 h-full">
      {/* Item Header */}
      <div className="flex items-center gap-3 mb-3">
        {itemImage && (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-tight truncate">{item.name}</h3>
        </div>
      </div>

      {/* Reason Dropdown */}
      <div className="mb-3">
        <label className="text-neutral-400 text-[10px] uppercase mb-1 block">Reason *</label>
        <div className="relative">
          <button
            onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-left text-white text-xs flex items-center justify-between"
          >
            <span className={selectedReason ? "text-white" : "text-neutral-500"}>
              {selectedReason || "Select reason"}
            </span>
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isReasonDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden z-50 max-h-32 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {overrideReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => {
                    setSelectedReason(reason);
                    setIsReasonDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-neutral-700 transition-colors ${
                    selectedReason === reason ? 'bg-neutral-700 text-white' : 'text-neutral-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Other Reason Notes */}
      {selectedReason === "Other" && (
        <div className="mb-3">
          <label className="text-neutral-400 text-[10px] uppercase mb-1 block">Notes *</label>
          <input
            type="text"
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            placeholder="Enter reason..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs placeholder:text-neutral-500 outline-none"
          />
        </div>
      )}

      {/* Price Display - Original and New */}
      <div className="mb-3 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2">
        {/* Original Price Row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-green-500 text-xs font-medium">Price</span>
          <span className="text-green-500 text-xs font-bold">${item.price.toFixed(2)}</span>
        </div>
        {/* New Price Row */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-xs font-medium">New Price</span>
          <span className="text-red-500 text-sm font-bold">${newPrice || "0.00"}</span>
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePriceNumberClick(num.toString())}
            className="h-9 rounded-lg bg-neutral-800 border border-neutral-700 text-foreground text-base font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handlePriceNumberClick(".")}
          className="h-9 rounded-lg bg-neutral-800 border border-neutral-700 text-foreground text-base font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          .
        </button>
        <button
          onClick={() => handlePriceNumberClick("0")}
          className="h-9 rounded-lg bg-neutral-800 border border-neutral-700 text-foreground text-base font-semibold hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
        >
          0
        </button>
        <button
          onClick={handlePriceBackspace}
          className="h-9 rounded-lg bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setCurrentView('customization');
            setSelectedReason("");
            setNewPrice("");
            setOverrideNotes("");
          }} 
          className="flex-1 py-1.5 rounded-full text-white font-medium text-[10px] bg-transparent border border-neutral-500 hover:bg-neutral-800 h-8"
        >
          CANCEL
        </Button>
        <Button 
          onClick={handlePriceOverrideApply}
          disabled={!selectedReason || !newPrice || (selectedReason === "Other" && !overrideNotes)}
          className="flex-1 py-1.5 rounded-full font-bold text-[10px] h-8 disabled:opacity-50" 
          style={{
            background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)',
            color: 'black'
          }}
        >
          APPLY
        </Button>
      </div>
    </div>
  );

  // Render Customization View (Original)
  const renderCustomizationView = () => (
    <>
      {/* Item Header */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <button onClick={handleProductInfoClick} className="text-left">
              <h3 className="text-white font-bold text-base leading-tight hover:text-neutral-300 transition-colors">{item.name}</h3>
            </button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={handlePriceClick}
              className="bg-neutral-700 px-2 py-1 rounded-lg hover:bg-neutral-600 transition-colors cursor-pointer"
            >
              {selectedDiscountId ? (
                <div className="flex flex-col items-center">
                  <span className="text-green-400 font-bold text-sm">${(totalPrice / quantity).toFixed(2)}</span>
                  <span className="text-neutral-400 text-[8px] line-through">${(overriddenPrice !== null ? overriddenPrice : item.price).toFixed(2)}</span>
                </div>
              ) : overriddenPrice !== null ? (
                <div className="flex flex-col items-center">
                  <span className="text-white font-bold text-sm">${overriddenPrice.toFixed(2)}</span>
                  <span className="text-neutral-400 text-[8px] line-through">${item.price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-white font-bold text-sm">${item.price.toFixed(2)}</span>
              )}
            </button>
            <Select value={quantity.toString()} onValueChange={val => setQuantity(parseInt(val))}>
              <SelectTrigger className="w-auto bg-neutral-700 border-none text-white font-medium text-sm h-auto px-2 py-1 gap-1 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-600">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <SelectItem key={num} value={num.toString()} className="text-white hover:bg-neutral-700">
                    {num}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selected Modifiers Pills */}
      {selectedModifiers.length > 0 && <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {selectedModifiers.map(modifier => <span key={modifier} className="px-2 py-0.5 bg-neutral-700 text-white text-[10px] rounded-full">
                {modifier}
              </span>)}
          </div>
        </div>}

      {/* Item Notes */}
      <div className="px-3 pb-2">
        <OrderNotesAutocomplete
          value={itemNotes}
          onChange={setItemNotes}
          placeholder="Item notes"
          storageKey="item-notes-history"
        />
      </div>

      {/* Tabs */}
      <div className="px-3 pb-2">
        <div className="flex bg-neutral-800 rounded-full p-1 md:p-1.5">
          <button onClick={() => setActiveTab('item')} className={`flex-1 py-1.5 md:py-2.5 lg:py-3 px-4 rounded-full text-xs md:text-sm font-medium transition-colors ${activeTab === 'item' ? 'bg-white text-black' : 'bg-transparent text-neutral-400'}`}>
            Modifiers
          </button>
          <button onClick={() => setActiveTab('addons')} className={`flex-1 py-1.5 md:py-2.5 lg:py-3 px-4 rounded-full text-xs md:text-sm font-medium transition-colors ${activeTab === 'addons' ? 'bg-white text-black' : 'bg-transparent text-neutral-400'}`}>
            Add-Ons
          </button>
        </div>
      </div>

      {activeTab === 'item' ? <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Required Modifiers Label */}
          <div className="px-3 pb-1">
            <span className="text-white text-xs font-medium">Required </span>
            <span className="text-red-500 ml-0.5">*</span>
          </div>

          {/* Modifier Categories */}
          <div className="px-3 pb-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {itemModifiers.map(category => <button key={category.name} onClick={() => setActiveModifierCategory(category.name)} className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors border ${activeModifierCategory === category.name ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-400 border-neutral-600'}`}>
                  {category.name}
                </button>)}
            </div>
          </div>

          {/* Modifier Options */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-3 pb-2">
              <div className="bg-neutral-800 rounded-lg p-2">
                <div className="flex flex-wrap gap-1.5">
                  {activeCategory?.options.map(option => <button key={option.name} onClick={() => toggleModifier(option.name)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${selectedModifiers.includes(option.name) ? 'bg-white text-black border-white' : 'bg-neutral-900 text-white border-neutral-600'}`}>
                      {option.name}
                      {option.price && <span className="ml-1">${option.price.toFixed(2)}</span>}
                    </button>)}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div> : <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search Bar */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 bg-neutral-700 rounded-full px-3 py-1.5">
              <Search className="w-3 h-3 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search for Add-Ons" 
                value={addOnSearchQuery} 
                onChange={e => setAddOnSearchQuery(e.target.value)} 
                className="flex-1 bg-transparent text-white text-xs placeholder:text-neutral-400 outline-none" 
              />
              <Mic className="w-3 h-3 text-neutral-400" />
              <ArrowUpDown className="w-3 h-3 text-neutral-400" />
            </div>
          </div>

          {/* Category Filters (House Favorites, All) */}
          <div className="px-3 pb-1.5">
            <div className="flex gap-1.5">
              {addOnCategories.map(category => (
                <button 
                  key={category} 
                  onClick={() => setActiveAddOnCategory(category)} 
                  className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                    activeAddOnCategory === category 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Filters (Beverages, Desserts, etc.) */}
          <div className="px-3 pb-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {addOnSubcategories.map(subcategory => (
                <button 
                  key={subcategory} 
                  onClick={() => setActiveAddOnSubcategory(subcategory)} 
                  className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors border ${
                    activeAddOnSubcategory === subcategory 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-neutral-400 border-neutral-600'
                  }`}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          </div>

          {/* Add-On Items */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {addOnItems
                  .filter(addOn => {
                    const matchesSearch = addOnSearchQuery === "" || addOn.name.toLowerCase().includes(addOnSearchQuery.toLowerCase());
                    const matchesSubcategory = activeAddOnCategory === "All" || addOn.category === activeAddOnSubcategory;
                    return matchesSearch && matchesSubcategory;
                  })
                  .map(addOn => (
                    <button 
                      key={addOn.name} 
                      onClick={() => toggleAddOn(addOn.name)} 
                      className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        selectedAddOns.includes(addOn.name) 
                          ? 'bg-white text-black' 
                          : 'bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {addOn.name} <span className="text-neutral-400">${addOn.price?.toFixed(2)}</span>
                    </button>
                  ))}
              </div>
            </div>
          </ScrollArea>
        </div>}

      {/* Action Buttons */}
      <div className="px-3 pt-3 pb-5 flex items-center gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 py-1 rounded-full text-white font-medium text-[10px] bg-transparent border border-neutral-500 hover:bg-neutral-800 h-7">
          CANCEL
        </Button>
        <button 
          onClick={() => setShowDiscountDialog(true)}
          className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 transition-all ${
            selectedDiscountId ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-neutral-900' : ''
          }`}
        >
          <img src={offerIcon} alt="Offer" className="w-full h-full object-cover" />
        </button>
        <Button onClick={handleAddToCart} className="flex-[2] py-1 rounded-full font-bold text-[10px] h-7" style={{
        background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)',
        color: 'black'
      }}>
          ADD ${totalPrice.toFixed(2)}
        </Button>
      </div>
    </>
  );

  // Render Product Info View
  const renderProductInfoView = () => {
    const productDescription = "A juicy chicken patty topped with fresh lettuce, tomato, and our special sauce on a toasted brioche bun. Our chicken burgers are made from premium quality chicken that's seasoned to perfection.";
    const ingredients = ["Chicken Patty (Seasoned)", "Brioche Bun", "Lettuce", "Tomato", "Special Sauce", "Pickles", "Red Onions"];
    
    // Allergen colors - vibrant and visible
    const allergenColors: Record<string, string> = {
      'Almonds': '#D64D7A',
      'Corn': '#E8A0B0',
      'Eggs': '#F5C89A',
      'Fish': '#E8C89A',
      'Gelatin': '#C9A988',
      'Gluten': '#C98A5A',
      'Meat': '#D4D470',
      'Milk': '#8BC98B',
      'Soy': '#D64D7A',
      'Peanuts': '#C9A078',
      'Shellfish': '#C96A38',
      'Sesame': '#9B6DD6',
      'Tree Nuts': '#7D5040',
      'Wheat': '#E85050'
    };
    
    // Different allergens based on item category - would come from database in production
    const getItemAllergens = (itemName: string): string[] => {
      const name = itemName?.toLowerCase() || '';
      if (name.includes('burger') || name.includes('sandwich')) {
        return ['Gluten', 'Eggs', 'Milk', 'Sesame'];
      } else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('fettuccine') || name.includes('ravioli') || name.includes('gnocchi') || name.includes('rigatoni')) {
        return ['Gluten', 'Eggs', 'Milk'];
      } else if (name.includes('salmon') || name.includes('shrimp') || name.includes('calamari') || name.includes('tuna') || name.includes('seafood')) {
        return ['Fish', 'Shellfish', 'Soy'];
      } else if (name.includes('chicken')) {
        return ['Eggs', 'Gluten'];
      } else if (name.includes('steak') || name.includes('ribs') || name.includes('meatball')) {
        return ['Meat', 'Soy', 'Gluten'];
      } else if (name.includes('salad')) {
        return ['Tree Nuts', 'Sesame'];
      } else if (name.includes('pancake') || name.includes('mac') || name.includes('cheese')) {
        return ['Gluten', 'Milk', 'Eggs'];
      } else {
        return ['Gluten', 'Milk'];
      }
    };
    
    const allergens = getItemAllergens(item?.name || '');
    
    const nutritionalInfo = {
      calories: 520,
      protein: "28g",
      carbs: "42g",
      fat: "24g"
    };

    return (
      <ScrollArea className="flex-1 overflow-auto scrollbar-hide [&>div>div]:!block" style={{ maxHeight: '85vh' }}>
        <div className="flex flex-col bg-neutral-900 p-4 pb-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="text-foreground font-bold text-xl">Product Information</h3>
          </div>

          {/* Item Name and Price */}
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-foreground font-medium text-sm">{item?.name}</span>
            <span className="text-foreground font-medium text-sm">${item?.price.toFixed(2)}</span>
          </div>

          {/* Product Image */}
          <div className="border border-neutral-700 rounded-xl p-3 mb-4">
            {itemImage ? (
              <img 
                src={itemImage} 
                alt={item?.name} 
                className="w-full h-40 object-contain rounded-lg"
              />
            ) : (
              <div className="w-full h-40 bg-neutral-800 rounded-lg flex items-center justify-center">
                <span className="text-neutral-500">No image</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <h4 className="text-foreground font-bold text-base mb-2">Description</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">{productDescription}</p>
          </div>

          {/* Allergens */}
          <div className="mb-4">
            <h4 className="text-foreground font-bold text-base mb-2">Allergens</h4>
            <div className="flex flex-wrap gap-2">
              {allergens.map((allergen, index) => (
                <span 
                  key={index}
                  className="px-4 py-1.5 text-white text-xs font-semibold rounded-full"
                  style={{ backgroundColor: allergenColors[allergen] || '#6b7280' }}
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="text-foreground font-bold text-base mb-2">Ingredients</h4>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-foreground text-xs rounded-full"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="mb-4">
            <h4 className="text-foreground font-bold text-base mb-3">Nutritional Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-center">
                <span className="text-muted-foreground text-xs block mb-1">Calories</span>
                <span className="text-foreground font-bold text-lg">{nutritionalInfo.calories}</span>
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-center">
                <span className="text-muted-foreground text-xs block mb-1">Protein</span>
                <span className="text-foreground font-bold text-lg">{nutritionalInfo.protein}</span>
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-center">
                <span className="text-muted-foreground text-xs block mb-1">Carbs</span>
                <span className="text-foreground font-bold text-lg">{nutritionalInfo.carbs}</span>
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-center">
                <span className="text-muted-foreground text-xs block mb-1">Fat</span>
                <span className="text-foreground font-bold text-lg">{nutritionalInfo.fat}</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <Button 
            onClick={() => {
              setCurrentView('customization');
              onViewChange?.('customization');
            }} 
            className="w-full py-3 rounded-full font-bold text-sm"
            style={{
              background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)',
              color: 'black'
            }}
          >
            Back to Order
          </Button>
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {currentView === 'customization' && renderCustomizationView()}
      {currentView === 'mpin' && renderMPINView()}
      {currentView === 'priceOverride' && renderPriceOverrideView()}
      {currentView === 'productInfo' && renderProductInfoView()}
      
      {/* Discount Dialog */}
      {showDiscountDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <h2 className="text-white text-lg font-semibold">Select Discounts</h2>
              <button 
                onClick={() => setShowDiscountDialog(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Discount Options */}
            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-none space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {discountTypes.map((discountType) => {
                const discountValue = discountType.fixedAmount || (priceBeforeDiscount * ((discountType.percentage || 0) / 100));
                const isSelected = selectedDiscountId === discountType.id;
                
                const IconComponent = {
                  briefcase: Briefcase,
                  heart: Heart,
                  graduation: GraduationCap,
                  shield: Shield,
                  star: Star,
                  clock: Clock,
                  cake: Cake,
                  mappin: MapPin,
                  dollar: BadgeDollarSign,
                  tag: Tag
                }[discountType.icon];
                
                return (
                  <button
                    key={discountType.id}
                    onClick={() => setSelectedDiscountId(isSelected ? null : discountType.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-orange-500/20 border border-orange-500' 
                        : 'bg-neutral-800 border border-transparent hover:bg-neutral-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-orange-500/30' : 'bg-neutral-700'
                    }`}>
                      <IconComponent className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm font-medium">{discountType.name}</div>
                      <div className="text-neutral-400 text-xs">{discountType.description}</div>
                    </div>
                    <div className="text-red-400 text-sm font-medium">
                      -${discountValue.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Apply Button */}
            <div className="p-3 border-t border-neutral-700">
              <button
                onClick={() => setShowDiscountDialog(false)}
                className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InlineItemCustomization;