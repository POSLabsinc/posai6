import { useState } from "react";
import { Plus, Save, Flame, Receipt, FileText, ChevronRight, Menu } from "lucide-react";
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

const LiquidGlassOrders2B = () => {
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [selectedMenu, setSelectedMenu] = useState("Holiday Menu");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

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

  const categoryIcons: Record<string, string> = {
    "Starters": "🥗", "Mains": "🍖", "Sides": "🍟", "Desserts": "🍰", 
    "Drinks": "🥤", "Specials": "⭐", "Food": "🍔", "Beer": "🍺", 
    "Wine": "🍷", "Cocktails": "🍹"
  };

  return (
    <div className="flex gap-0 overflow-hidden bg-neutral-950 gradient-mesh" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Sidebar Overlay - Collapsible */}
      <div 
        className={`flex flex-col glass-dark border-r border-white/10 transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="p-4 border-b border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <Menu className="w-6 h-6 text-white/70" />
        </button>

        {/* Menu Selector */}
        {sidebarExpanded && (
          <div className="p-4 border-b border-white/10">
            <Select value={selectedMenu} onValueChange={setSelectedMenu}>
              <SelectTrigger className="w-full rounded-xl glass border-white/20 text-white h-10 text-sm">
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
          </div>
        )}

        {/* Vertical Glass Tabs */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {menuCategories[selectedMenu]?.map((cat) => (
              <div key={cat} className="relative">
                <button
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                  }}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeCategory === cat 
                      ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30" 
                      : "glass text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl">{categoryIcons[cat] || "📋"}</span>
                  {sidebarExpanded && (
                    <>
                      <span className="flex-1 text-left font-medium">{cat}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </>
                  )}
                </button>

                {/* Floating Tooltip-style Glass Panel for Subcategories */}
                {hoveredCategory === cat && sidebarExpanded && categorySubcategories[cat] && (
                  <div className="absolute left-full top-0 ml-2 z-50 glass-glow rounded-xl p-3 min-w-[180px] animate-scale-in">
                    <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">{cat} Options</p>
                    <div className="space-y-1">
                      {categorySubcategories[cat].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setActiveSubcategory(sub)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            activeSubcategory === sub 
                              ? "bg-amber-400 text-black font-medium" 
                              : "text-white/80 hover:bg-white/10"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {sidebarExpanded && (
          <div className="p-3 border-t border-white/10">
            <p className="text-xs text-white/40 text-center">Liquid Glass 2B</p>
          </div>
        )}
      </div>

      {/* Main Content - Items Grid */}
      <div className="flex-1 flex flex-col p-4 min-w-0 overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{activeCategory}</h2>
            {activeSubcategory && (
              <p className="text-amber-400 font-medium">{activeSubcategory}</p>
            )}
          </div>
          <span className="glass px-4 py-2 rounded-full text-sm text-white/70">
            {menuItems.length} items
          </span>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-4 gap-3">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="glass-vibrant rounded-2xl overflow-hidden hover:scale-[1.03] transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <span className="text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">🍽️</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white/90 line-clamp-2 mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-400 font-bold">$15.00</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Frosted Bottom Sheet Style */}
      <div className="w-80 flex flex-col glass-dark border-l border-white/10 flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Order</h2>
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

        <ScrollArea className="flex-1 min-h-0 px-4">
          <div className="py-2 space-y-2">
            {orderItems.map((item) => (
              <div key={item.id} className="glass rounded-xl p-3">
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
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span>$ {total.toFixed(2)}</span>
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

export default LiquidGlassOrders2B;