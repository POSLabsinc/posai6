import { useState, useRef, useEffect } from "react";
import { Plus, X, Trash2, CreditCard, Banknote, RotateCcw } from "lucide-react";
import searchIcon from "@/assets/icons/search.png";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import emptyOrderIcon from "@/assets/icons/empty-order.png";

// Food images
import burgerGourmetImg from "@/assets/food/burger-gourmet.png";
import steakSlicedImg from "@/assets/food/steak-sliced.png";
import asparagusPlatedImg from "@/assets/food/asparagus-plated.png";
import turkeySandwichImg from "@/assets/food/turkey-sandwich.png";
import grilledChickenImg from "@/assets/food/grilled-chicken.png";
import shrimpRiceImg from "@/assets/food/shrimp-rice.png";
import macCheeseBowlImg from "@/assets/food/mac-cheese-bowl.png";
import roastedChickenImg from "@/assets/food/roasted-chicken.png";
import fettuccinePestoImg from "@/assets/food/fettuccine-pesto.png";
import spaghettiTomatoImg from "@/assets/food/spaghetti-tomato.png";
import gnocchiCreamImg from "@/assets/food/gnocchi-cream.png";
import rigatoniBasilImg from "@/assets/food/rigatoni-basil.png";
import grilledPaniniImg from "@/assets/food/grilled-panini.png";
import spaghettiMeatballsImg from "@/assets/food/spaghetti-meatballs.png";
import ravioliCreamImg from "@/assets/food/ravioli-cream.png";
import crispyChickenBurgerImg from "@/assets/food/crispy-chicken-burger.png";
import herbCrustedSalmonImg from "@/assets/food/herb-crusted-salmon.png";
import meatballsMarinaraImg from "@/assets/food/meatballs-marinara.png";
import chickenParmesanImg from "@/assets/food/chicken-parmesan.png";
import tunaTartareImg from "@/assets/food/tuna-tartare.png";

const foodImages = [burgerGourmetImg, steakSlicedImg, asparagusPlatedImg, turkeySandwichImg, grilledChickenImg, shrimpRiceImg, macCheeseBowlImg, roastedChickenImg, fettuccinePestoImg, spaghettiTomatoImg, gnocchiCreamImg, rigatoniBasilImg, grilledPaniniImg, spaghettiMeatballsImg, ravioliCreamImg, crispyChickenBurgerImg, herbCrustedSalmonImg, meatballsMarinaraImg, chickenParmesanImg, tunaTartareImg];

// Simplified food truck menu
const foodTruckCategories = ["Burgers", "Tacos", "Sides", "Drinks", "Specials"];

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

// Simplified food truck menu items
const foodTruckMenuItems: Record<string, MenuItem[]> = {
  "Burgers": [
    { id: 1, name: "Classic Burger", price: 8.99 },
    { id: 2, name: "Cheese Burger", price: 9.99 },
    { id: 3, name: "Bacon Burger", price: 11.99 },
    { id: 4, name: "Mushroom Swiss", price: 11.49 },
    { id: 5, name: "BBQ Burger", price: 10.99 },
    { id: 6, name: "Double Stack", price: 13.99 },
    { id: 7, name: "Veggie Burger", price: 9.49 },
    { id: 8, name: "Spicy Jalapeño", price: 10.99 },
  ],
  "Tacos": [
    { id: 9, name: "Beef Taco", price: 3.99 },
    { id: 10, name: "Chicken Taco", price: 3.99 },
    { id: 11, name: "Fish Taco", price: 4.49 },
    { id: 12, name: "Carnitas", price: 4.29 },
    { id: 13, name: "Al Pastor", price: 4.29 },
    { id: 14, name: "Veggie Taco", price: 3.49 },
    { id: 15, name: "3 Taco Combo", price: 10.99 },
    { id: 16, name: "Taco Platter", price: 14.99 },
  ],
  "Sides": [
    { id: 17, name: "Fries", price: 3.99 },
    { id: 18, name: "Onion Rings", price: 4.49 },
    { id: 19, name: "Loaded Fries", price: 6.99 },
    { id: 20, name: "Coleslaw", price: 2.99 },
    { id: 21, name: "Mac & Cheese", price: 4.99 },
    { id: 22, name: "Chips & Salsa", price: 3.49 },
    { id: 23, name: "Nachos", price: 7.99 },
    { id: 24, name: "Corn on the Cob", price: 2.99 },
  ],
  "Drinks": [
    { id: 25, name: "Soda", price: 2.49 },
    { id: 26, name: "Lemonade", price: 2.99 },
    { id: 27, name: "Iced Tea", price: 2.49 },
    { id: 28, name: "Water", price: 1.49 },
    { id: 29, name: "Horchata", price: 3.49 },
    { id: 30, name: "Jarritos", price: 2.99 },
    { id: 31, name: "Coffee", price: 2.99 },
    { id: 32, name: "Milkshake", price: 5.99 },
  ],
  "Specials": [
    { id: 33, name: "Combo Meal", price: 12.99 },
    { id: 34, name: "Family Pack", price: 34.99 },
    { id: 35, name: "Kids Meal", price: 6.99 },
    { id: 36, name: "Today's Special", price: 9.99 },
    { id: 37, name: "Loaded Nachos", price: 9.99 },
    { id: 38, name: "Burrito Bowl", price: 10.99 },
    { id: 39, name: "Quesadilla", price: 8.99 },
    { id: 40, name: "Street Corn", price: 4.99 },
  ],
};

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  "Burgers": { bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-500" },
  "Tacos": { bg: "bg-green-500", border: "border-green-500", text: "text-green-500" },
  "Sides": { bg: "bg-yellow-500", border: "border-yellow-500", text: "text-yellow-500" },
  "Drinks": { bg: "bg-cyan-500", border: "border-cyan-500", text: "text-cyan-500" },
  "Specials": { bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-500" },
};

const OrdersG = () => {
  const [activeCategory, setActiveCategory] = useState("Burgers");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNumber, setOrderNumber] = useState(() => Math.floor(Math.random() * 900) + 100);
  const [customerName, setCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get items for current category
  const currentItems = foodTruckMenuItems[activeCategory] || [];
  
  // Filter by search
  const filteredItems = searchQuery.trim() 
    ? Object.values(foodTruckMenuItems).flat().filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentItems;

  const addToCart = (item: MenuItem) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: Date.now(), qty: 1, name: item.name, price: item.price }];
    });
  };

  const addToCartWithModifiers = (item: { name: string; price: number }, qty: number, modifiers: string[]) => {
    setOrderItems(prev => [...prev, {
      id: Date.now(),
      qty,
      name: item.name,
      price: item.price,
      modifiers: modifiers.length > 0 ? modifiers : undefined
    }]);
    setCustomizationDialogOpen(false);
  };

  const removeFromCart = (id: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const openCustomizationDialog = (item: MenuItem, index: number) => {
    setSelectedItemForCustomization(item);
    setSelectedItemImage(foodImages[index % foodImages.length]);
    setCustomizationDialogOpen(true);
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName("");
    setOrderNumber(Math.floor(Math.random() * 900) + 100);
  };

  const handleCashPayment = () => {
    if (orderItems.length === 0) return;
    // TODO: Process cash payment
    alert(`Cash payment: $${total.toFixed(2)}`);
    clearOrder();
  };

  const handleCardPayment = () => {
    if (orderItems.length === 0) return;
    // TODO: Process card payment
    alert(`Card payment: $${total.toFixed(2)}`);
    clearOrder();
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const categoryColor = categoryColors[activeCategory] || categoryColors["Burgers"];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-neutral-950 overflow-hidden">
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col min-h-0 p-2 md:p-3">
        {/* Header with Order Number */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 rounded-xl px-4 py-2">
              <span className="text-black font-bold text-2xl">#{orderNumber}</span>
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="bg-neutral-800 rounded-xl px-4 py-2.5 text-white text-lg font-medium placeholder:text-neutral-500 outline-none border border-neutral-700 focus:border-orange-500 min-w-[200px]"
            />
          </div>
          
          {/* Search Toggle */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              } else {
                setSearchQuery("");
              }
            }}
            className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center border border-neutral-700"
          >
            {isSearchOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <img src={searchIcon} alt="Search" className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="mb-3">
            <div className="flex items-center gap-3 bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-700">
              <img src={searchIcon} alt="Search" className="w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="flex-1 bg-transparent text-white text-lg placeholder:text-neutral-500 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
          {foodTruckCategories.map(cat => {
            const colors = categoryColors[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className={`px-5 py-3 rounded-xl font-bold text-base whitespace-nowrap transition-all ${
                  isActive 
                    ? `${colors.bg} text-black` 
                    : `bg-neutral-800 ${colors.text} border-2 ${colors.border}`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid - Large Touch Targets */}
        <ScrollArea className="flex-1 [&>div>div]:!block">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="relative rounded-xl overflow-hidden cursor-pointer group border-2 border-neutral-700 hover:border-orange-500 transition-colors"
                onClick={() => openCustomizationDialog(item, index)}
              >
                <div className="aspect-square bg-neutral-800">
                  <img
                    src={foodImages[index % foodImages.length]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-neutral-900">
                  <h3 className="text-white font-bold text-base mb-1 line-clamp-1">{item.name}</h3>
                  <p className="text-orange-400 font-bold text-lg">${item.price.toFixed(2)}</p>
                </div>
                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  className="absolute top-2 right-2 w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center shadow-lg transition-colors"
                >
                  <Plus className="w-7 h-7 text-white" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order */}
      <div className="w-full md:w-[340px] lg:w-[380px] flex flex-col bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-700 flex-shrink-0">
        {/* Order Header */}
        <div className="px-4 py-3 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Order #{orderNumber}</h2>
            <span className="text-neutral-400 text-sm">{orderItems.reduce((sum, i) => sum + i.qty, 0)} items</span>
          </div>
          {customerName && (
            <p className="text-orange-400 font-medium mt-1">{customerName}</p>
          )}
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 min-h-0">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <img src={emptyOrderIcon} alt="Empty order" className="w-20 h-20 opacity-40 mb-4" />
              <span className="text-neutral-500 text-lg">Add items to order</span>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {orderItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-neutral-700"
                >
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-white font-bold text-lg">{item.qty}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-base truncate">{item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-orange-400 text-sm truncate">
                        {item.modifiers.join(", ")}
                      </p>
                    )}
                  </div>
                  
                  {/* Price & Delete */}
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base">
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Order Summary & Actions */}
        <div className="p-4 border-t border-neutral-700 space-y-3">
          {/* Totals */}
          {orderItems.length > 0 && (
            <div className="space-y-1 text-base">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-xl pt-1 border-t border-neutral-700">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Clear Button */}
            <button
              onClick={clearOrder}
              className="w-14 h-14 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>

            {/* Cash Button */}
            <button
              onClick={handleCashPayment}
              disabled={orderItems.length === 0}
              className="flex-1 h-14 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Banknote className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">CASH</span>
            </button>

            {/* Card/Pay Button */}
            <button
              onClick={handleCardPayment}
              disabled={orderItems.length === 0}
              className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: orderItems.length > 0 
                  ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                  : '#404040'
              }}
            >
              <CreditCard className="w-6 h-6 text-black" />
              <span className="text-black font-bold text-lg">
                {orderItems.length > 0 ? `$${total.toFixed(2)}` : 'PAY'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Customization Dialog */}
      <ItemCustomizationDialog
        open={customizationDialogOpen}
        onOpenChange={setCustomizationDialogOpen}
        item={selectedItemForCustomization}
        itemImage={selectedItemImage}
        onAddToCart={addToCartWithModifiers}
      />
    </div>
  );
};

export default OrdersG;
