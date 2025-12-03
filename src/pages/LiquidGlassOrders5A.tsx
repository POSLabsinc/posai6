import { useState } from "react";
import { Plus, Save, Flame, Receipt, FileText, ChevronUp, ChevronDown } from "lucide-react";
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

const LiquidGlassOrders5A = () => {
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [activeSubcategory, setActiveSubcategory] = useState("Soup");
  const [selectedMenu, setSelectedMenu] = useState("Holiday Menu");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

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
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-0 min-w-0 overflow-hidden glass-dark rounded-2xl">
        {/* Header with Glass Container */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Select value={selectedMenu} onValueChange={setSelectedMenu}>
              <SelectTrigger className="w-[180px] rounded-full glass border-white/20 text-white h-10">
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
            <span className="text-white/40 text-sm">Liquid Glass 5A: Glass Pill Drawer</span>
          </div>

          {/* Category Pills with Floating Badges in Glass Container */}
          <div className="glass-vibrant rounded-2xl p-3">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const itemCount = categorySubcategories[cat]?.length || 0;
                return (
                  <div key={cat} className="relative">
                    <button
                      onClick={() => {
                        setActiveCategory(cat);
                        setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                        setIsDrawerOpen(true);
                      }}
                      className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        activeCategory === cat 
                          ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30" 
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      {cat}
                    </button>
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold flex items-center justify-center px-1">
                      {itemCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subcategory Drawer - Smooth Glass Reveal Animation */}
        <div 
          className={`flex-shrink-0 border-b border-white/10 overflow-hidden transition-all duration-500 ease-out ${
            isDrawerOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 glass">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">{activeCategory} Options</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="h-7 px-2 text-white/50 hover:text-white glass rounded-full"
              >
                <ChevronUp className="w-4 h-4" />
                Close
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(categorySubcategories[activeCategory] || []).map((sub, index) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 animate-scale-in ${
                    activeSubcategory === sub 
                      ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30" 
                      : "glass text-white/80 hover:bg-white/15"
                  }`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Toggle (when closed) */}
        {!isDrawerOpen && (
          <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors glass rounded-full px-4 py-2"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Show {activeCategory} subcategories</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-xs font-medium">{activeSubcategory}</span>
            </button>
          </div>
        )}

        {/* Menu Items Grid with Glass Cards and Gradient Plus Buttons */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-3 gap-3">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/90 leading-tight uppercase">
                    {item.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100 transition-all group-hover:scale-110"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order */}
      <div className="w-80 flex flex-col glass-dark rounded-2xl overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>GUEST NAME</span>
            <span>🕐 10:20 PM</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" className="text-xs rounded-full glass h-8 px-3 text-white/70 hover:text-white hover:bg-white/10">
              <span className="mr-1">%</span> Discount
            </Button>
            <Button variant="ghost" size="sm" className="text-xs rounded-full glass h-8 px-3 text-white/70 hover:text-white hover:bg-white/10">
              <Receipt className="w-3 h-3 mr-1" /> Receipt
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">DINE IN</span>
            <span className="glass px-3 py-1 rounded-lg text-base font-bold text-white">20</span>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <FileText className="w-3 h-3" />
            <span>Order notes</span>
          </div>
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
            <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl glass text-white/70 hover:text-white hover:bg-white/10">
              <Save className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl glass text-orange-400 hover:bg-white/10">
              <Flame className="w-5 h-5" />
            </Button>
            <Button className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white font-bold shadow-lg shadow-orange-500/30">
              CHARGE $ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassOrders5A;