import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, Delete, Fingerprint, ScanFace, Share2, X, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, MapPin, BadgeDollarSign, Tag, Search, ArrowUpDown, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import offerIcon from "@/assets/icons/offer.png";
import { fetchProductCustomization, type DbModifierGroup, type DbAddOn, type DbProductInfo } from "@/services/productCustomizationService";

// Sort options for add-ons
type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'price-asc', label: 'Price Low-High' },
  { value: 'price-desc', label: 'Price High-Low' },
];

interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: string;
}

const discountTypes: DiscountType[] = [
  { id: 'employee', name: 'Employee Discount', description: '25% off for staff members', percentage: 25, icon: 'briefcase' },
  { id: 'senior', name: 'Senior Discount', description: '15% off for seniors 65+', percentage: 15, icon: 'heart' },
  { id: 'student', name: 'Student Discount', description: '10% off with valid student ID', percentage: 10, icon: 'graduation' },
  { id: 'military', name: 'Military Discount', description: '20% off for active & veterans', percentage: 20, icon: 'shield' },
  { id: 'loyalty', name: 'Loyalty Member', description: '5% off for loyalty members', percentage: 5, icon: 'star' },
  { id: 'happy-hour', name: 'Happy Hour', description: '$2 off during happy hour', fixedAmount: 2, icon: 'clock' },
  { id: 'birthday', name: 'Birthday Special', description: '30% off on your birthday', percentage: 30, icon: 'cake' },
  { id: 'local', name: 'Local Resident', description: '10% off for locals', percentage: 10, icon: 'mappin' },
  { id: 'first-time', name: 'First Time Customer', description: '$5 off first order', fixedAmount: 5, icon: 'dollar' },
  { id: 'promo', name: 'Promotional Offer', description: '15% promotional discount', percentage: 15, icon: 'tag' },
];
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
  isOpenPrice?: boolean;
}

interface ItemCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  itemImage?: string;
  onAddToCart: (item: MenuItem, quantity: number, modifiers: string[], notes: string, totalPrice: number, selectedSeats?: number[], discountInfo?: { name: string; amount: number }) => void;
  isManager?: boolean;
  isTableOrder?: boolean;
  guestCount?: number;
  onOpenPriceEdit?: () => void;
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

// Hardcoded fallback modifier data (used while DB loads)
const fallbackModifiers: ModifierCategory[] = [
  { name: "Size", required: true, options: [{ name: "Regular" }, { name: "Large", price: 2.00 }, { name: "Extra Large", price: 3.50 }] },
  { name: "Preparation", required: true, options: [{ name: "Standard" }, { name: "Extra Crispy" }, { name: "Lightly Done" }, { name: "Well Done" }] },
  { name: "Spice Level", required: true, options: [{ name: "Mild" }, { name: "Medium" }, { name: "Spicy" }, { name: "Extra Spicy", price: 0.50 }] },
  { name: "Extras", required: false, options: [{ name: "Extra Sauce", price: 0.50 }, { name: "Side Dressing", price: 0.75 }, { name: "Lemon Wedge" }, { name: "Extra Napkins" }, { name: "To-Go Container", price: 0.25 }] },
];

interface AddOnItem extends ModifierOption {
  isFavorite?: boolean;
}

const fallbackAddOns: AddOnItem[] = [
  { name: "Extra Cheese", price: 1.50, isFavorite: true },
  { name: "Bacon", price: 2.00, isFavorite: true },
  { name: "Avocado", price: 2.50, isFavorite: true },
  { name: "Fried Egg", price: 1.50 },
  { name: "Mushrooms", price: 1.00 },
];

// Default modifiers based on item name keywords
const getDefaultModifiersForItem = (itemId: number, itemName?: string): string[] => {
  const name = (itemName || '').toLowerCase();
  
  // Bread items
  if (name.includes('sourdough') || name.includes('wheat') || name.includes('french') || name.includes('rye') || name.includes('italian') || name.includes('bread') || name.includes('loaf') || name.includes('baguette')) {
    return ['Sliced', 'Butter', 'Warm'];
  }
  // Croissants
  if (name.includes('croissant')) {
    return ['Butter', 'Warm', 'Extra Flaky'];
  }
  // Danish & Pastries
  if (name.includes('danish') || name.includes('pastry') || name.includes('éclair') || name.includes('palmier')) {
    return ['Extra Glaze', 'Warm', 'Whipped Cream'];
  }
  // Cakes
  if (name.includes('cake')) {
    return ['Extra Frosting', 'Candles', 'Gift Box'];
  }
  // Cookies
  if (name.includes('cookie')) {
    return ['Warm', 'Extra Crispy', 'Milk on Side'];
  }
  // Muffins
  if (name.includes('muffin')) {
    return ['Warm', 'Butter', 'Extra Large'];
  }
  // Donuts
  if (name.includes('donut') || name.includes('doughnut')) {
    return ['Extra Glaze', 'Sprinkles', 'Fresh'];
  }
  // Pies
  if (name.includes('pie')) {
    return ['À la Mode', 'Whipped Cream', 'Warm'];
  }
  // Pizza
  if (name.includes('pizza')) {
    return ['Extra Cheese', 'Crispy Crust', 'Basil'];
  }
  // Pasta
  if (name.includes('pasta') || name.includes('spaghetti') || name.includes('fettuccine') || name.includes('carbonara') || name.includes('ravioli') || name.includes('gnocchi') || name.includes('rigatoni')) {
    return ['Extra Parmesan', 'Garlic Bread', 'Al Dente'];
  }
  // Burgers
  if (name.includes('burger')) {
    return ['Lettuce', 'Tomato', 'Onions', 'Pickles'];
  }
  // Salads
  if (name.includes('salad')) {
    return ['Croutons', 'Extra Dressing', 'Grilled Chicken'];
  }
  // Salmon & Fish
  if (name.includes('salmon') || name.includes('fish') || name.includes('tuna') || name.includes('shrimp') || name.includes('seafood')) {
    return ['Lemon Wedge', 'Tartar Sauce', 'Grilled Vegetables'];
  }
  // Chicken
  if (name.includes('chicken')) {
    return ['Gravy', 'Mashed Potatoes', 'Coleslaw'];
  }
  // Steak & Ribs
  if (name.includes('steak') || name.includes('ribs')) {
    return ['A1 Sauce', 'Grilled Onions', 'Baked Potato'];
  }
  // Sandwich & Panini
  if (name.includes('sandwich') || name.includes('panini')) {
    return ['Mayo', 'Mustard', 'Lettuce', 'Tomato'];
  }
  // Soup
  if (name.includes('soup')) {
    return ['Crackers', 'Extra Bread', 'Sour Cream'];
  }
  // Drinks & Cocktails
  if (name.includes('mojito') || name.includes('martini') || name.includes('cocktail') || name.includes('margarita')) {
    return ['Extra Ice', 'Sugar Rim', 'Double Shot'];
  }
  // Coffee & Espresso
  if (name.includes('coffee') || name.includes('espresso') || name.includes('latte') || name.includes('cappuccino')) {
    return ['Extra Shot', 'Oat Milk', 'Whipped Cream'];
  }
  // Desserts
  if (name.includes('tiramisu') || name.includes('dessert') || name.includes('chocolate') || name.includes('vanilla')) {
    return ['Extra Cream', 'Chocolate Sauce', 'Fresh Berries'];
  }
  // Pancakes & Waffles
  if (name.includes('pancake') || name.includes('waffle')) {
    return ['Maple Syrup', 'Whipped Cream', 'Fresh Berries'];
  }
  // Turkey
  if (name.includes('turkey')) {
    return ['Gravy', 'Cranberry Sauce', 'Stuffing'];
  }
  
  // Default fallback for any other items
  return ['No Modifications', 'Extra Napkins', 'To-Go Box'];
};

// Keep specific overrides for items that need custom defaults
const defaultModifiersByItemId: Record<number, string[]> = {
  1: ['Lettuce', 'Tomato', 'Onions', 'Pickles'],
  2: ['Mayo', 'Mustard', 'Lettuce', 'Tomato'],
  3: ['Cheese', 'Onions', 'Mushrooms'],
  4: ['Croutons', 'Parmesan', 'Caesar Dressing'],
};

export const ItemCustomizationDialog = ({
  open,
  onOpenChange,
  item,
  itemImage,
  onAddToCart,
  isManager = false,
  isTableOrder = false,
  guestCount = 0,
  onOpenPriceEdit
}: ItemCustomizationDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'item' | 'addons'>('item');
  const [itemNotes, setItemNotes] = useState("");
  const [overriddenPrice, setOverriddenPrice] = useState<number | null>(null);
  
  // Database-driven customization data
  const [itemModifiers, setItemModifiers] = useState<ModifierCategory[]>(fallbackModifiers);
  const [currentItemAddOns, setCurrentItemAddOns] = useState<AddOnItem[]>(fallbackAddOns);
  const [dbProductInfo, setDbProductInfo] = useState<DbProductInfo | null>(null);
  
  const [activeModifierCategory, setActiveModifierCategory] = useState(fallbackModifiers[0]?.name || "");
  
  // View state: 'customization' | 'mpin' | 'priceOverride' | 'productInfo'
  const [currentView, setCurrentView] = useState<'customization' | 'mpin' | 'priceOverride' | 'productInfo'>('customization');
  
  // MPIN state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const correctPin = "1234";
  
  // Price Override state
  const [newPriceInput, setNewPriceInput] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Seat selection state for table orders
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  
  // Default modifiers - tracks which ones are deselected (excluded from item)
  const [deselectedDefaults, setDeselectedDefaults] = useState<string[]>([]);

  // Discount state
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [discountDialogView, setDiscountDialogView] = useState<'mpin' | 'discounts'>('mpin');
  
  // Add-on filter state
  const [addOnFilterGroup, setAddOnFilterGroup] = useState<'favorites' | 'all'>('favorites');
  const [addOnSearchQuery, setAddOnSearchQuery] = useState("");
  const [addOnSortBy, setAddOnSortBy] = useState<SortOption>('name-asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Fetch customization data from database when item changes
  useEffect(() => {
    if (!open || !item) return;
    const itemId = String(item.id);
    // Only fetch for UUID-formatted IDs (database products)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
    if (!isUuid) {
      setItemModifiers(fallbackModifiers);
      setCurrentItemAddOns(fallbackAddOns);
      setDbProductInfo(null);
      setActiveModifierCategory(fallbackModifiers[0]?.name || "");
      return;
    }

    fetchProductCustomization(itemId).then((data) => {
      if (!data) return;
      // Map DB modifier groups → ModifierCategory format
      if (data.modifierGroups.length > 0) {
        const mapped: ModifierCategory[] = data.modifierGroups.map((g) => ({
          name: g.name,
          required: g.required,
          options: g.options.map((o) => ({
            name: o.name,
            price: o.price > 0 ? o.price : undefined,
          })),
        }));
        setItemModifiers(mapped);
        setActiveModifierCategory(mapped[0]?.name || "");
      }
      // Map DB add-ons
      if (data.addOns.length > 0) {
        const mapped: AddOnItem[] = data.addOns.map((a, i) => ({
          name: a.name,
          price: a.price > 0 ? a.price : undefined,
          isFavorite: i < 3, // First 3 as favorites
        }));
        setCurrentItemAddOns(mapped);
      }
      setDbProductInfo(data.productInfo);
    });
  }, [open, item?.id]);
  
  // Filter and sort add-ons
  const filteredAddOnItems = useMemo(() => {
    let items = currentItemAddOns.filter(addOn => {
      const matchesFavorite = addOnFilterGroup === 'all' || addOn.isFavorite;
      const matchesSearch = addOnSearchQuery === "" || addOn.name.toLowerCase().includes(addOnSearchQuery.toLowerCase());
      return matchesFavorite && matchesSearch;
    });

    // Sort items
    items.sort((a, b) => {
      switch (addOnSortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return items;
  }, [currentItemAddOns, addOnFilterGroup, addOnSearchQuery, addOnSortBy]);
  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => 
      prev.includes(seat) 
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  const toggleAllSeats = () => {
    if (selectedSeats.length === guestCount) {
      setSelectedSeats([]);
    } else {
      setSelectedSeats(Array.from({ length: guestCount }, (_, i) => i + 1));
    }
  };

  // Reset all state when dialog opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      setOverriddenPrice(null);
      setQuantity(1);
      setSelectedAddOns([]);
      setItemNotes("");
      setActiveTab('item');
      setCurrentView('customization');
      setPin("");
      setPinError(false);
      setNewPriceInput("");
      setSelectedReason("");
      setOverrideNotes("");
      setSelectedSeats([]);
      setDeselectedDefaults([]);
      setSelectedDiscountId(null);
      setShowDiscountDialog(false);
      setDiscountDialogView('mpin');
      setAddOnSearchQuery("");
      setAddOnSortBy('name-asc');
      setShowSortDropdown(false);
      
      // Pre-select first option from each required modifier group
      const defaultModifiers: string[] = [];
      itemModifiers.forEach(category => {
        if (category.required && category.options.length > 0) {
          defaultModifiers.push(category.options[0].name);
        }
      });
      setSelectedModifiers(defaultModifiers);
    }
  }, [open, item?.id]);

  // PIN verification is now handled directly in the MPIN view numpad handlers
  // to distinguish between price override and discount flows

  const handlePriceClick = () => {
    if (item?.isOpenPrice) {
      onOpenPriceEdit?.();
      return;
    }
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
      const newPin = pin + num;
      setPin(newPin);
      // When 4 digits entered, navigate to price override (for MPIN view only)
      if (newPin.length === 4) {
        setTimeout(() => {
          setCurrentView('priceOverride');
          setPin("");
        }, 200);
      }
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

  const handleProductInfoClick = () => {
    setCurrentView('productInfo');
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

  const toggleModifier = (modifier: string, categoryName: string) => {
    const category = itemModifiers.find(c => c.name === categoryName);
    
    if (category?.required) {
      // Radio behavior: replace any existing selection from this category
      const otherCategoryModifiers = selectedModifiers.filter(m => 
        !category.options.some(opt => opt.name === m)
      );
      setSelectedModifiers([...otherCategoryModifiers, modifier]);
    } else {
      // Toggle behavior for optional categories
      setSelectedModifiers(prev => 
        prev.includes(modifier) 
          ? prev.filter(m => m !== modifier)
          : [...prev, modifier]
      );
    }
  };

  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOn) 
        ? prev.filter(a => a !== addOn)
        : [...prev, addOn]
    );
  };

  const toggleDefaultModifier = (modifier: string) => {
    setDeselectedDefaults(prev => 
      prev.includes(modifier) 
        ? prev.filter(m => m !== modifier)  // Re-select
        : [...prev, modifier]                // Deselect
    );
  };

  const handleAddToCart = () => {
    // Get default modifiers (first option of each required category)
    const defaultModifiers: string[] = [];
    itemModifiers.forEach(category => {
      if (category.required && category.options.length > 0) {
        defaultModifiers.push(category.options[0].name);
      }
    });
    
    // Filter out modifiers that are still at default values (only show changed ones)
    const changedModifiers = selectedModifiers.filter(mod => !defaultModifiers.includes(mod));
    
    // Include changed modifiers, deselected defaults with "No " prefix, and Add-Ons with "Add:" prefix
    const allModifiers = [
      ...changedModifiers, 
      ...deselectedDefaults.map(mod => `No ${mod}`),
      ...selectedAddOns.map(addOn => {
        const addOnItem = currentItemAddOns.find(a => a.name === addOn);
        return addOnItem?.price ? `Add: ${addOn} +$${addOnItem.price.toFixed(2)}` : `Add: ${addOn}`;
      })
    ];
    
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
      const addOn = currentItemAddOns.find(a => a.name === addOnName);
      return total + (addOn?.price || 0);
    }, 0);
    
    const basePrice = overriddenPrice !== null ? overriddenPrice : item.price;
    const priceBeforeDiscount = (basePrice + modifierTotal + addOnTotal) * quantity;
    
    // Apply discount
    const selectedDiscount = discountTypes.find(d => d.id === selectedDiscountId);
    let discountAmount = 0;
    if (selectedDiscount) {
      if (selectedDiscount.fixedAmount) {
        discountAmount = selectedDiscount.fixedAmount;
      } else if (selectedDiscount.percentage) {
        discountAmount = priceBeforeDiscount * (selectedDiscount.percentage / 100);
      }
    }
    const totalPrice = Math.max(0, priceBeforeDiscount - discountAmount);
    
    // Pass selectedSeats only for table orders
    // If no seats are selected, pass empty array to indicate "share on table" (all seats)
    const discountInfo = selectedDiscount ? { name: selectedDiscount.name, amount: discountAmount } : undefined;
    onAddToCart(item, quantity, allModifiers, itemNotes, totalPrice, isTableOrder ? (selectedSeats.length > 0 ? selectedSeats : []) : undefined, discountInfo);
    // Reset state
    setQuantity(1);
    setSelectedModifiers([]);
    setSelectedAddOns([]);
    setItemNotes("");
    setActiveTab('item');
    setSelectedSeats([]);
    setSelectedDiscountId(null);
    onOpenChange(false);
  };

  // Calculate display price with discount
  const getDisplayPrice = () => {
    const modifierTotal = selectedModifiers.reduce((total, modName) => {
      for (const category of itemModifiers) {
        const option = category.options.find(o => o.name === modName);
        if (option?.price) {
          return total + option.price;
        }
      }
      return total;
    }, 0);
    
    const addOnTotal = selectedAddOns.reduce((total, addOnName) => {
      const addOn = currentItemAddOns.find(a => a.name === addOnName);
      return total + (addOn?.price || 0);
    }, 0);
    
    const basePrice = overriddenPrice !== null ? overriddenPrice : item.price;
    const priceBeforeDiscount = (basePrice + modifierTotal + addOnTotal) * quantity;
    
    const selectedDiscount = discountTypes.find(d => d.id === selectedDiscountId);
    let discountAmount = 0;
    if (selectedDiscount) {
      if (selectedDiscount.fixedAmount) {
        discountAmount = selectedDiscount.fixedAmount;
      } else if (selectedDiscount.percentage) {
        discountAmount = priceBeforeDiscount * (selectedDiscount.percentage / 100);
      }
    }
    
    return {
      priceBeforeDiscount,
      discountAmount,
      finalPrice: Math.max(0, priceBeforeDiscount - discountAmount)
    };
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
    <ScrollArea className="scrollbar-hide [&>div>div]:!block [&_[data-radix-scroll-area-viewport]]:!overflow-y-auto [&_[data-radix-scroll-area-viewport]]:max-h-[85vh] [&_[data-radix-scroll-area-viewport]]:!h-auto">
      <div className="flex flex-col bg-neutral-900 p-4 pb-4">
        {/* Header with item info */}
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-700 mb-3">
          {itemImage && (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 border border-neutral-600">
              <img src={itemImage} alt={item?.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-foreground font-semibold">Price Override</span>
            <span className="text-muted-foreground text-sm">{item?.name}</span>
          </div>
        </div>

        {/* Reason Dropdown */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowReasonDropdown(!showReasonDropdown)}
            className="w-full flex items-center justify-between px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-left"
          >
            <span className={selectedReason ? "text-foreground" : "text-muted-foreground"}>
              {selectedReason || "Select reason for override"}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showReasonDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showReasonDropdown && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 rounded-xl overflow-hidden z-10 border border-neutral-700 max-h-36 overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {overrideReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => {
                    setSelectedReason(reason);
                    setShowReasonDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-neutral-700 transition-colors ${
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
          <div className="mb-2 space-y-2">
            <label className="text-xs text-muted-foreground">Please specify the reason for override</label>
            <textarea
              placeholder="Enter reason..."
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground outline-none resize-none h-16"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{overrideNotes.length}/200</p>
          </div>
        )}

        {/* Price Display */}
        <div className="rounded-xl p-3 space-y-2 mb-3" style={{ background: 'rgba(117, 117, 117, 0.3)' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="text-sm font-medium text-foreground">${item?.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">New Price</span>
            <span className="text-lg font-semibold text-green-500">${formatPriceDisplay(newPriceInput)}</span>
          </div>
        </div>

        {/* Numpad - Row based like desktop */}
        <div className="flex flex-col gap-2 mb-3">
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handlePriceNumberClick(btn)}
                  className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-lg font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
          {/* Last row: decimal, 0 and backspace */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                if (!newPriceInput.includes('.')) {
                  setNewPriceInput(prev => prev + '.');
                }
              }}
              className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-lg font-bold text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              .
            </button>
            <button
              onClick={() => handlePriceNumberClick('0')}
              className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-lg font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              0
            </button>
            <button
              onClick={handlePriceBackspace}
              className="h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              <Delete className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleBackToCustomization}
            variant="outline"
            className="flex-1 h-10 rounded-xl bg-transparent border-neutral-600 text-foreground hover:bg-neutral-800"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleApplyPriceOverride}
            disabled={!newPriceInput || !selectedReason}
            className="flex-1 h-10 rounded-xl text-white font-bold disabled:opacity-40 disabled:bg-neutral-600"
            style={{ background: !newPriceInput || !selectedReason ? undefined : 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
          >
            APPLY
          </Button>
        </div>
      </div>
    </ScrollArea>
  );

  // Product Information Screen
  const renderProductInfoView = () => {
    // Mock product data - in real app this would come from props or API
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
            onClick={handleBackToCustomization}
            className="w-full h-12 rounded-xl text-white font-bold"
            style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
          >
            Back to Order
          </Button>
        </div>
      </ScrollArea>
    );
  };

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
            <button 
              onClick={handleProductInfoClick}
              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer border-2 border-white"
            >
              <img src={itemImage} alt={item?.name} className="w-full h-full object-cover" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <button 
              onClick={handleProductInfoClick}
              className="text-white font-bold text-base leading-tight text-left hover:text-orange-400 transition-colors cursor-pointer"
            >
              {item?.name}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item?.isOpenPrice && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 select-none pointer-events-none">
                Open Price
              </span>
            )}
            <button
              onClick={handlePriceClick}
              className={`bg-neutral-700 px-2.5 py-1 rounded-md transition-colors ${item?.isOpenPrice ? 'cursor-default' : 'hover:bg-neutral-600 cursor-pointer'}`}
            >
              {selectedDiscountId ? (
                <div className="flex flex-col items-center">
                  <span className="text-green-400 font-bold text-sm">${(getDisplayPrice().finalPrice / quantity).toFixed(2)}</span>
                  <span className="text-neutral-400 text-[8px] line-through">${(overriddenPrice !== null ? overriddenPrice : item?.price || 0).toFixed(2)}</span>
                </div>
              ) : overriddenPrice !== null ? (
                <div className="flex flex-col items-center">
                  <span className="text-white font-bold text-sm">${overriddenPrice.toFixed(2)}</span>
                  <span className="text-neutral-400 text-[8px] line-through">${item?.price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-white font-medium text-sm">${item?.price.toFixed(2)}</span>
              )}
            </button>
            <Select value={quantity.toString()} onValueChange={(val) => setQuantity(parseInt(val))}>
              <SelectTrigger className="w-12 h-7 bg-neutral-700 border-none text-white font-medium text-sm rounded-md px-2 gap-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-600 z-[9999] min-w-[3rem]">
                {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => (
                  <SelectItem 
                    key={num} 
                    value={num.toString()}
                    className="text-white text-sm hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white py-1"
                  >
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Seat Selection Row - Only shown for table orders */}
      {isTableOrder && guestCount > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-700 rounded">
              <img src={chairWhiteIcon} alt="Chair" className="w-4 h-4" />
            </div>
            <button 
              onClick={toggleAllSeats}
              className={`p-1.5 rounded transition-colors ${
                selectedSeats.length === guestCount 
                  ? 'bg-white' 
                  : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              <Share2 className={`w-4 h-4 ${selectedSeats.length === guestCount ? 'text-black' : 'text-white'}`} />
            </button>
            {Array.from({ length: guestCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => toggleSeat(i + 1)}
                className={`w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                  selectedSeats.includes(i + 1) 
                    ? 'bg-white text-black' 
                    : 'bg-neutral-600 text-white hover:bg-neutral-500'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <OrderNotesAutocomplete
          value={itemNotes}
          onChange={setItemNotes}
          placeholder="Product notes"
          storageKey="item-notes-history"
        />
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
            Product
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
          {/* NOTE: our ScrollArea viewport is h-full, so the root must have an explicit height */}
          <ScrollArea className="max-h-[140px]">
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {activeCategory?.options.map(option => (
                  <button
                    key={option.name}
                    onClick={() => toggleModifier(option.name, activeCategory.name)}
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

          {/* Default Modifiers Section - Show for all items */}
          {item && (
            <>
              <div className="px-4 py-2">
                <span className="text-white text-sm font-medium">Default Modifiers</span>
              </div>
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {(defaultModifiersByItemId[item.id] || getDefaultModifiersForItem(item.id, item.name)).map(modifier => (
                    <button
                      key={modifier}
                      onClick={() => toggleDefaultModifier(modifier)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !deselectedDefaults.includes(modifier)
                          ? 'bg-white text-black'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {modifier}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search Bar with Sort */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              {/* Search input - dark rounded pill */}
              <div className="flex-1 flex items-center gap-2 bg-neutral-800 border border-neutral-600 rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search for Add-Ons" 
                  value={addOnSearchQuery} 
                  onChange={e => setAddOnSearchQuery(e.target.value)} 
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-400 outline-none min-w-0" 
                />
                {addOnSearchQuery ? (
                  <button 
                    onClick={() => setAddOnSearchQuery("")}
                    className="p-0.5 hover:bg-neutral-700 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                ) : (
                  <Mic className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                )}
              </div>
              
              {/* Sort button - separate dark rounded pill */}
              <div className="relative">
                <button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center justify-center bg-neutral-800 border border-neutral-600 rounded-full p-2 hover:bg-neutral-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 3V13M4.5 13L2 10.5M4.5 13L7 10.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.5 13V3M11.5 3L9 5.5M11.5 3L14 5.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setAddOnSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                          addOnSortBy === option.value 
                            ? 'bg-white text-black' 
                            : 'text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* House Favorites / All Toggle */}
          <div className="px-4 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setAddOnFilterGroup('favorites')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  addOnFilterGroup === 'favorites'
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-neutral-400 border-neutral-600'
                }`}
              >
                House Favorites
              </button>
              <button
                onClick={() => setAddOnFilterGroup('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  addOnFilterGroup === 'all'
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-neutral-400 border-neutral-600'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Add-On Items - Scrollable */}
          {/* NOTE: our ScrollArea viewport is h-full, so the root must have an explicit height */}
          <ScrollArea className="max-h-[180px]">
            <div className="px-4 py-2">
              <div className="flex flex-wrap gap-2">
                {filteredAddOnItems.length > 0 ? (
                  filteredAddOnItems.map(addOn => (
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
                  ))
                ) : (
                  <div className="w-full text-center py-4 text-neutral-400 text-sm">
                    No add-ons found
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-neutral-700 mt-auto flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)} 
          className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-transparent border border-neutral-500 hover:bg-neutral-800 h-10"
        >
          CANCEL
        </Button>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isManager) {
              setDiscountDialogView('discounts');
            } else {
              setDiscountDialogView('mpin');
            }
            setShowDiscountDialog(true);
          }}
          className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-all ${
            selectedDiscountId ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-neutral-900' : ''
          }`}
        >
          <img src={offerIcon} alt="Offer" className="w-full h-full object-cover" />
        </button>
        <Button 
          onClick={handleAddToCart} 
          className="flex-[2] py-2 rounded-full font-bold text-sm h-10" 
          style={{
            background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)',
            color: 'black'
          }}
        >
          {selectedDiscountId ? (
            <>
              ADD <span className="line-through text-neutral-500 mx-1">${getDisplayPrice().priceBeforeDiscount.toFixed(2)}</span>
              <span className="text-green-600">${getDisplayPrice().finalPrice.toFixed(2)}</span>
            </>
          ) : (
            `ADD $${getDisplayPrice().finalPrice.toFixed(2)}`
          )}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={`bg-neutral-900 border-neutral-700 p-0 max-w-md w-[95vw] md:w-full overflow-hidden rounded-2xl flex flex-col ${
            currentView === 'mpin' ? 'h-auto' : 'max-h-[90vh]'
          }`}
        >
          {currentView === 'customization' && renderCustomizationView()}
          {currentView === 'mpin' && renderMPINView()}
          {currentView === 'priceOverride' && renderPriceOverrideView()}
          {currentView === 'productInfo' && renderProductInfoView()}
        </DialogContent>
      </Dialog>

      {/* Discount Dialog with integrated MPIN - Using AlertDialog for proper portal layering */}
      <AlertDialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700 p-0 max-w-md w-[90vw] overflow-hidden rounded-xl">
          {discountDialogView === 'mpin' ? (
            /* MPIN View */
            <div className="w-full max-w-[280px] flex flex-col items-center mx-auto py-6 px-4">
              {/* Manager Profile */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-primary/30">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                    alt="Manager"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-semibold text-foreground">Mia Jones</h3>
                <p className="text-xs text-muted-foreground">Manager</p>
              </div>

              {/* PIN Dots */}
              <div className="flex items-center justify-center gap-2.5 mb-4">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                      index < pin.length ? "bg-primary" : "bg-neutral-600"
                    }`}
                  />
                ))}
              </div>

              {/* Title */}
              <p className="text-center text-muted-foreground text-xs mb-4">Enter Manager PIN</p>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pin.length < 4) {
                        const newPin = pin + num.toString();
                        setPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            setDiscountDialogView('discounts');
                            setPin("");
                          }, 200);
                        }
                      }
                    }}
                    className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pin.length < 4) {
                      const newPin = pin + "0";
                      setPin(newPin);
                      if (newPin.length === 4) {
                        setTimeout(() => {
                          setDiscountDialogView('discounts');
                          setPin("");
                        }, 200);
                      }
                    }
                  }}
                  className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinClear}
                  className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                >
                  C
                </button>
              </div>

              {/* Biometric Options */}
              <div className="flex justify-center gap-3 mt-4">
                <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
                  <Fingerprint className="w-4 h-4" />
                  <span className="text-xs">Touch ID</span>
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
                  <ScanFace className="w-4 h-4" />
                  <span className="text-xs">Face ID</span>
                </button>
              </div>

              {/* Cancel button */}
              <button
                type="button"
                onClick={() => {
                  setShowDiscountDialog(false);
                  setPin("");
                }}
                className="mt-4 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Discount Selection View */
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <h2 className="text-white text-lg font-semibold">Select Discounts</h2>
                <button 
                  type="button"
                  onClick={() => setShowDiscountDialog(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Discount Options */}
              <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide space-y-1">
                {discountTypes.map((discountType) => {
                  const discountValue = discountType.fixedAmount || (getDisplayPrice().priceBeforeDiscount * ((discountType.percentage || 0) / 100));
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
                      type="button"
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
                        {IconComponent && <IconComponent className="w-4 h-4 text-neutral-400" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white text-sm font-medium">{discountType.name}</div>
                        <div className="text-neutral-400 text-xs">{discountType.description}</div>
                      </div>
                      <div className="text-white text-sm font-medium">
                        -${discountValue.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Apply Button */}
              <div className="p-3 border-t border-neutral-700">
                <button
                  type="button"
                  onClick={() => setShowDiscountDialog(false)}
                  className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ItemCustomizationDialog;
