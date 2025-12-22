import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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

const LiquidGlassOrders1A = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get("table");
  
  const [activeCategory, setActiveCategory] = useState("Food");
  const [activeSubcategory, setActiveSubcategory] = useState("Appetizers");
  const [selectedMenu, setSelectedMenu] = useState("BAR MENU");
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

  return (
    <div className="flex gap-4 overflow-hidden bg-neutral-950 gradient-mesh p-4" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {/* Menu Selector - Glass Pill */}
        <div className="glass-vibrant rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Select value={selectedMenu} onValueChange={setSelectedMenu}>
              <SelectTrigger className="w-[200px] rounded-full bg-white/10 border-white/20 text-white h-12 backdrop-blur-sm">
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
            <span className="text-white/60 text-sm">Liquid Glass 1A: Floating Panels</span>
          </div>
        </div>

        {/* Categories - Glass Dark Panel */}
        <div className="glass-dark rounded-2xl p-4">
          <div className="flex flex-wrap gap-2">
            {menuCategories[selectedMenu]?.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                }}
                className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeCategory === cat 
                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/40" 
                    : "glass text-white/80 hover:bg-white/15 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories - Translucent Pills */}
        <div className="flex flex-wrap gap-2">
          {(categorySubcategories[activeCategory] || []).map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(sub)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeSubcategory === sub 
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30" 
                  : "glass text-white/70 hover:bg-white/15 hover:text-white"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 gap-3">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="glass-vibrant rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/90 leading-tight">
                    {item.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity shadow-lg shadow-orange-500/30"
                  >
                    <Plus className="w-5 h-5" />
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
            <span className="glass px-3 py-1 rounded-lg text-base font-bold text-white">{tableId || "20"}</span>
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
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl glass text-white/70 hover:text-white hover:bg-white/10">
              <Save className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl glass text-orange-400 hover:bg-white/10">
              <Flame className="w-5 h-5" />
            </Button>
            <Button className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white font-bold shadow-lg shadow-orange-500/30">
              CHARGE $ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassOrders1A;