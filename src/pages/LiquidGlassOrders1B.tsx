import { useState } from "react";
import { Plus, Save, Flame, Receipt, FileText, Sparkles } from "lucide-react";
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

const LiquidGlassOrders1B = () => {
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
    <div className="flex gap-4 overflow-hidden relative" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-neutral-950 to-orange-900/30" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative flex gap-4 w-full p-4">
        {/* Left Panel - Menu */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Liquid Glass 1B</h1>
                <p className="text-xs text-white/50">Immersive Gradient</p>
              </div>
            </div>
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
          </div>

          {/* Categories - Floating Glass Chips */}
          <div className="flex flex-wrap gap-3">
            {menuCategories[selectedMenu]?.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                }}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-500 ${
                  activeCategory === cat 
                    ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-xl shadow-purple-500/30 scale-105" 
                    : "glass-glow text-white/80 hover:scale-105"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Subcategories with morphing animation */}
          <div className="glass-vibrant rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              {(categorySubcategories[activeCategory] || []).map((sub, index) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 animate-scale-in ${
                    activeSubcategory === sub 
                      ? "bg-white text-neutral-900 shadow-lg" 
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items - Large Glass Tiles */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-3 gap-4">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="glass-glow rounded-2xl p-5 cursor-pointer group hover:scale-[1.03] transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-xl mb-3 flex items-center justify-center">
                    <span className="text-3xl">🍽️</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-400">$15.00</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Slide-in Glass Order */}
        <div className="w-80 flex flex-col glass-dark rounded-3xl overflow-hidden flex-shrink-0 border border-white/10">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
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
            <div className="py-3 space-y-2">
              {orderItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="glass rounded-xl p-3 animate-slide-in-right"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 text-white text-xs flex items-center justify-center font-bold">
                        {item.qty}
                      </span>
                      <span className="text-sm font-medium text-white">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">$ {item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 glass border-t border-white/10">
            <div className="space-y-2 text-sm mb-4">
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
                <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl glass text-white/70 hover:text-white">
                <Save className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl glass text-orange-400 hover:text-orange-300">
                <Flame className="w-5 h-5" />
              </Button>
              <Button className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white font-bold shadow-xl shadow-purple-500/20">
                CHARGE $ {total.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassOrders1B;