import { useState } from "react";
import { ChevronDown, FileText, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import offerIcon from "@/assets/icons/offer.png";
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
interface InlineItemCustomizationProps {
  item: MenuItem;
  itemImage?: string;
  onAddToCart: (item: MenuItem, quantity: number, modifiers: string[], notes: string) => void;
  onCancel: () => void;
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
const addOnItems: ModifierOption[] = [{
  name: "Extra Cheese",
  price: 1.50
}, {
  name: "Bacon",
  price: 2.00
}, {
  name: "Avocado",
  price: 2.50
}, {
  name: "Fried Egg",
  price: 1.50
}, {
  name: "Mushrooms",
  price: 1.00
}, {
  name: "Onion Rings",
  price: 2.00
}, {
  name: "Jalapeños",
  price: 0.75
}, {
  name: "Extra Patty",
  price: 4.00
}];
export const InlineItemCustomization = ({
  item,
  itemImage,
  onAddToCart,
  onCancel,
  className
}: InlineItemCustomizationProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'item' | 'addons'>('item');
  const [activeModifierCategory, setActiveModifierCategory] = useState(itemModifiers[0]?.name || "");
  const [itemNotes, setItemNotes] = useState("");
  const toggleModifier = (modifier: string) => {
    setSelectedModifiers(prev => prev.includes(modifier) ? prev.filter(m => m !== modifier) : [...prev, modifier]);
  };
  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns(prev => prev.includes(addOn) ? prev.filter(a => a !== addOn) : [...prev, addOn]);
  };
  const handleAddToCart = () => {
    const allModifiers = [...selectedModifiers, ...selectedAddOns];
    onAddToCart(item, quantity, allModifiers, itemNotes);
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
  const totalPrice = (item.price + addOnTotal + modifierTotal) * quantity;
  return <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Item Header */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight">{item.name}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-neutral-700 px-2 py-1 rounded-lg">
              <span className="text-white font-bold text-sm">${item.price.toFixed(2)}</span>
            </div>
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
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1.5">
          <FileText className="w-3 h-3 text-neutral-400" />
          <input type="text" placeholder="Item notes" value={itemNotes} onChange={e => setItemNotes(e.target.value)} className="flex-1 bg-transparent text-white text-xs placeholder:text-neutral-500 outline-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 pb-2">
        <div className="flex bg-neutral-800 rounded-full p-1">
          <button onClick={() => setActiveTab('item')} className={`flex-1 py-1.5 px-4 rounded-full text-xs font-medium transition-colors ${activeTab === 'item' ? 'bg-white text-black' : 'bg-transparent text-neutral-400'}`}>
            Modifiers
          </button>
          <button onClick={() => setActiveTab('addons')} className={`flex-1 py-1.5 px-4 rounded-full text-xs font-medium transition-colors ${activeTab === 'addons' ? 'bg-white text-black' : 'bg-transparent text-neutral-400'}`}>
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
                  {activeCategory?.options.map(option => <button key={option.name} onClick={() => toggleModifier(option.name)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${selectedModifiers.includes(option.name) ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-300 border-neutral-600'}`}>
                      {option.name}
                      {option.price && <span className="ml-1">${option.price.toFixed(2)}</span>}
                    </button>)}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div> : <ScrollArea className="flex-1 min-h-0">
          <div className="px-3 pb-2">
            <div className="bg-neutral-800 rounded-lg p-2">
              <div className="flex flex-wrap gap-1.5">
                {addOnItems.map(addOn => <button key={addOn.name} onClick={() => toggleAddOn(addOn.name)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${selectedAddOns.includes(addOn.name) ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-300 border-neutral-600'}`}>
                    {addOn.name}
                    {addOn.price && <span className="ml-1">${addOn.price.toFixed(2)}</span>}
                  </button>)}
              </div>
            </div>
          </div>
        </ScrollArea>}

      {/* Action Buttons */}
      <div className="px-3 pt-3 pb-5 flex items-center gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 py-1 rounded-full text-white font-medium text-[10px] bg-transparent border border-neutral-500 hover:bg-neutral-800 h-7">
          CANCEL
        </Button>
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
          <img src={offerIcon} alt="Offer" className="w-full h-full object-cover" />
        </div>
        <Button onClick={handleAddToCart} className="flex-[2] py-1 rounded-full font-bold text-[10px] h-7" style={{
        background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)',
        color: 'black'
      }}>
          ADD ${totalPrice.toFixed(2)}
        </Button>
      </div>
    </div>;
};
export default InlineItemCustomization;