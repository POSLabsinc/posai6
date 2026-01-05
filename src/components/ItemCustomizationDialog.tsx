import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MPINDialog from "@/components/MPINDialog";
import PriceOverrideDialog from "@/components/PriceOverrideDialog";

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
}

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
  onAddToCart
}: ItemCustomizationDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'item' | 'addons'>('item');
  const [activeModifierCategory, setActiveModifierCategory] = useState(itemModifiers[0]?.name || "");
  const [itemNotes, setItemNotes] = useState("");
  const [overriddenPrice, setOverriddenPrice] = useState<number | null>(null);
  const [showMPINDialog, setShowMPINDialog] = useState(false);
  const [showPriceOverrideDialog, setShowPriceOverrideDialog] = useState(false);

  const handlePriceClick = () => {
    setShowMPINDialog(true);
  };

  const handleMPINSuccess = () => {
    setShowPriceOverrideDialog(true);
  };

  const handlePriceOverrideApply = (newPrice: number, reason: string, notes: string) => {
    setOverriddenPrice(newPrice);
    setShowPriceOverrideDialog(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 p-0 max-w-md w-[95vw] md:w-full max-h-[90vh] overflow-hidden rounded-2xl flex flex-col">
        {/* Grabber Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-neutral-600 rounded-full" />
        </div>

        {/* Item Header */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            {itemImage && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base leading-tight">{item.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={handlePriceClick}
                className="bg-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-600 transition-colors cursor-pointer"
              >
                {overriddenPrice !== null ? (
                  <div className="flex flex-col items-center">
                    <span className="text-white font-bold">${overriddenPrice.toFixed(2)}</span>
                    <span className="text-neutral-400 text-[10px] line-through">${item.price.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-white font-bold">${item.price.toFixed(2)}</span>
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
      </DialogContent>

      {/* MPIN Dialog */}
      <MPINDialog
        open={showMPINDialog}
        onOpenChange={setShowMPINDialog}
        onSuccess={handleMPINSuccess}
      />

      {/* Price Override Dialog */}
      {item && (
        <PriceOverrideDialog
          open={showPriceOverrideDialog}
          onOpenChange={setShowPriceOverrideDialog}
          itemName={item.name}
          originalPrice={item.price}
          onApply={handlePriceOverrideApply}
        />
      )}
    </Dialog>
  );
};

export default ItemCustomizationDialog;
