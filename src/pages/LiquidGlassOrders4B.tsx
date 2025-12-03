import { useState } from "react";
import { Plus, Save, Flame, Receipt, FileText } from "lucide-react";
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
  "Food": ["Appetizers", "Mains", "Sides", "Salads", "Soups", "Sandwiches"],
  "Desserts": ["Cakes", "Ice Cream", "Pies", "Cookies", "Brownies", "Cheesecake"],
  "Drinks": ["Iced Tea", "Soda", "Lemonade", "Sparkling", "Coffee", "Juice"],
  "Starters": ["Soup", "Salad", "Bruschetta", "Carpaccio", "Tartare", "Oysters"],
  "Mains": ["Steak", "Chicken", "Fish", "Pasta", "Risotto", "Lamb"],
  "Sides": ["Fries", "Rice", "Vegetables", "Mashed Potatoes", "Coleslaw", "Mac & Cheese"],
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

const LiquidGlassOrders4B = () => {
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [activeSubcategory, setActiveSubcategory] = useState("Soup");
  const [selectedMenu, setSelectedMenu] = useState("Holiday Menu");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

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
  const activeIndex = categories.indexOf(activeCategory);

  return (
    <div className="flex gap-4 overflow-hidden bg-neutral-950 gradient-mesh p-4" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
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
          <span className="text-white/40 text-sm">Liquid Glass 4B: 3D Card Stack</span>
        </div>

        {/* 3D Stacked Category Cards with Perspective */}
        <div className="flex-shrink-0 py-8">
          <div className="flex justify-center items-center gap-4 perspective-1000">
            {categories.map((cat, index) => {
              const offset = index - activeIndex;
              const isActive = cat === activeCategory;
              
              return (
                <div
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                  }}
                  className={`cursor-pointer transition-all duration-500 ease-out ${
                    isActive ? 'z-30' : offset < 0 ? 'z-10' : 'z-20'
                  }`}
                  style={{
                    transform: isActive 
                      ? 'scale(1.1) translateZ(50px) rotateY(0deg)' 
                      : `scale(${1 - Math.abs(offset) * 0.1}) translateX(${offset * 20}px) translateZ(${-Math.abs(offset) * 30}px) rotateY(${offset * 5}deg)`,
                    opacity: isActive ? 1 : 1 - Math.abs(offset) * 0.2,
                  }}
                >
                  <div className={`w-32 h-40 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
                    isActive 
                      ? "glass-glow shadow-2xl shadow-orange-500/30" 
                      : "glass-vibrant"
                  }`}>
                    <div className={`w-full h-16 rounded-xl bg-gradient-to-br ${
                      isActive ? 'from-orange-500 to-amber-400' : 'from-white/20 to-white/10'
                    } flex items-center justify-center`}>
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{cat}</h3>
                      <p className="text-xs text-white/50">{categorySubcategories[cat]?.length || 0} items</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subcategories Orbit (simplified as pills) */}
        <div className="flex-shrink-0 flex justify-center">
          <div className="glass-vibrant rounded-2xl p-3 flex gap-2 flex-wrap justify-center max-w-xl">
            {(categorySubcategories[activeCategory] || []).map((sub, index) => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 animate-scale-in ${
                  activeSubcategory === sub 
                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg" 
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items - Larger Glass Cards */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 gap-4">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="glass-vibrant rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <span className="text-4xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-300">🍽️</span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-400">$15.00</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Floating Glass Panel with Depth Shadow */}
      <div className="w-80 flex flex-col glass-dark rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl shadow-black/50">
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

export default LiquidGlassOrders4B;