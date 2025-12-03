import { useState } from "react";
import { Plus, Save, Flame, Receipt, FileText, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuList = ["BAKERY MENU", "BAR MENU", "HAPPY HOUR M/W", "Holiday Menu", "LE BRUNCH MENU", "LE DINER MENU"];

const menuCategories: Record<string, string[]> = {
  "BAKERY MENU": ["Breads", "Pastries", "Cakes", "Cookies", "Croissants", "Muffins"],
  "BAR MENU": ["Food", "Desserts", "Drinks", "Beer", "Wine", "Cocktails"],
  "HAPPY HOUR M/W": ["Appetizers", "Wings", "Sliders", "Nachos", "Beer", "Wine"],
  "Holiday Menu": ["Starters", "Mains", "Sides", "Desserts", "Drinks", "Specials"],
  "LE BRUNCH MENU": ["Eggs", "Pancakes", "Waffles", "Omelettes", "Juice", "Coffee"],
  "LE DINER MENU": ["Appetizers", "Soups", "Salads", "Entrees", "Steaks", "Seafood"],
};

const categorySubcategories: Record<string, string[]> = {
  "Food": ["Appetizers", "Mains", "Sides", "Salads"],
  "Desserts": ["Cakes", "Ice Cream", "Pies", "Cookies"],
  "Drinks": ["Iced Tea", "Soda", "Lemonade", "Sparkling"],
  "Starters": ["Soup", "Salad", "Bruschetta", "Carpaccio"],
  "Mains": ["Steak", "Chicken", "Fish", "Pasta"],
  "Sides": ["Fries", "Rice", "Vegetables", "Mashed Potatoes"],
};

const menuItems = [
  { id: 1, name: "Almond Crusted Salmon" },
  { id: 2, name: "Hand Cut Fettuccini Alfredo" },
  { id: 3, name: "Four Cheese Ravioli" },
  { id: 4, name: "Grilled Organic Chicken Panini" },
  { id: 5, name: "Grilled Asparagus" },
  { id: 6, name: "Jidori Chicken Parmesan" },
  { id: 7, name: "Prime London Sirloin" },
  { id: 8, name: "Pan Roasted Salmon Sandwich" },
  { id: 9, name: "Oven Roasted Free Range Chicken" },
  { id: 10, name: "Crispy Calamari" },
  { id: 11, name: "Spinach & Artichoke Dip" },
  { id: 12, name: "Loaded Potato Skins" },
];

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
}

type ViewState = 'categories' | 'subcategories' | 'items';

const LiquidGlassOrders5B = () => {
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [activeSubcategory, setActiveSubcategory] = useState("Soup");
  const [selectedMenu, setSelectedMenu] = useState("Holiday Menu");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [viewState, setViewState] = useState<ViewState>('items');
  const [expandedSections, setExpandedSections] = useState({ order: true });

  const addToCart = (item: { id: number; name: string }) => {
    setOrderItems(prev => {
      const existing = prev.find(o => o.name === item.name);
      if (existing) {
        return prev.map(o => o.name === item.name ? { ...o, qty: o.qty + 1 } : o);
      }
      return [...prev, { id: Date.now(), qty: 1, name: item.name, price: 15.00 }];
    });
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.02;
  const total = subtotal + tax;

  const categories = menuCategories[selectedMenu] || [];

  return (
    <div className="flex gap-4 overflow-hidden bg-neutral-950 gradient-mesh p-4" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Left Panel - Single Morphing Glass Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden glass-dark rounded-3xl">
        {/* Header - Always Visible */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                <SelectTrigger className="w-[160px] rounded-full glass border-white/20 text-white h-10">
                  <SelectValue placeholder="Select Menu" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900/95 backdrop-blur-xl border-white/20">
                  {menuList.map((menu) => (
                    <SelectItem key={menu} value={menu} className="text-white hover:bg-white/10">
                      {menu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1 text-sm">
                <button 
                  onClick={() => setViewState('categories')}
                  className={`px-3 py-1 rounded-full transition-all ${viewState === 'categories' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Categories
                </button>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <button 
                  onClick={() => setViewState('subcategories')}
                  className={`px-3 py-1 rounded-full transition-all ${viewState === 'subcategories' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  {activeCategory}
                </button>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className="text-amber-400 font-medium">{activeSubcategory}</span>
              </div>
            </div>
            <span className="text-white/30 text-xs">Liquid Glass 5B: Morphing Panel</span>
          </div>
        </div>

        {/* Content Area - Morphs Between States */}
        <div className="flex-1 overflow-hidden p-4">
          {viewState === 'categories' && (
            <div className="h-full animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-4">Select Category</h2>
              <div className="grid grid-cols-3 gap-4">
                {categories.map((cat, index) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                      setViewState('subcategories');
                    }}
                    className="glass-vibrant rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-300 group animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-400/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{cat}</h3>
                    <p className="text-sm text-white/50">{categorySubcategories[cat]?.length || 0} options</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewState === 'subcategories' && (
            <div className="h-full animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{activeCategory} Options</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewState('categories')}
                  className="text-white/50 hover:text-white glass rounded-full"
                >
                  Back to Categories
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {(categorySubcategories[activeCategory] || []).map((sub, index) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setActiveSubcategory(sub);
                      setViewState('items');
                    }}
                    className="glass-vibrant rounded-xl p-4 text-center hover:scale-[1.02] transition-all duration-300 animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-white font-medium">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewState === 'items' && (
            <div className="h-full flex flex-col animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewState('subcategories')}
                    className="text-white/50 hover:text-white glass rounded-full"
                  >
                    ← Back
                  </Button>
                  <h2 className="text-lg font-bold text-white">{activeSubcategory} Items</h2>
                </div>
                <span className="text-white/50 text-sm">{menuItems.length} items</span>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-3 gap-3">
                  {menuItems.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/90 leading-tight uppercase">
                          {item.name}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Order with Collapsible Glass Sections */}
      <div className="w-80 flex flex-col glass-dark rounded-3xl overflow-hidden flex-shrink-0">
        {/* Header Section - Collapsible */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Current Order</h2>
            <span className="text-xs text-white/50">🕐 10:20 PM</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs rounded-full glass h-8 px-3 text-white/70 hover:text-white">
              <span className="mr-1">%</span> Discount
            </Button>
            <Button variant="ghost" size="sm" className="text-xs rounded-full glass h-8 px-3 text-white/70 hover:text-white">
              <Receipt className="w-3 h-3 mr-1" /> Receipt
            </Button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <FileText className="w-3 h-3" />
            <span>Order notes</span>
          </div>
          <span className="glass px-2 py-1 rounded text-xs font-bold text-white">Table 20</span>
        </div>

        {/* Order Items Section */}
        <ScrollArea className="flex-1 min-h-0 px-4">
          <div className="py-2 space-y-2">
            {orderItems.map((item, index) => (
              <div 
                key={item.id} 
                className="glass rounded-xl p-3 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs flex items-center justify-center font-bold">
                      {item.qty}
                    </span>
                    <span className="text-sm font-medium text-white/90">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">$ {item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Total Section - Always Visible */}
        <div className="p-4 border-t border-white/10 glass">
          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between text-white/60">
              <span>Sub Total</span>
              <span>$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Tax 2%</span>
              <span>$ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl glass text-white/70 hover:text-white">
              <Save className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl glass text-orange-400">
              <Flame className="w-5 h-5" />
            </Button>
            <Button className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold shadow-lg shadow-orange-500/30">
              CHARGE $ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassOrders5B;