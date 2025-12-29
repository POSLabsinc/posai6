import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, ChevronDown, X, Printer } from "lucide-react";
import searchIcon from "@/assets/icons/search.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import timeIcon from "@/assets/icons/time-icon.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import emptyOrderIcon from "@/assets/icons/empty-order.png";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";

// Food images - Custom uploaded images
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

// Food Truck Categories
const foodTruckCategories = ["Mains", "Sides", "Drinks", "Specials"];

const categorySubcategories: Record<string, string[]> = {
  "Mains": ["Burgers", "Tacos", "Sandwiches", "Wraps"],
  "Sides": ["Fries", "Onion Rings", "Coleslaw", "Chips"],
  "Drinks": ["Soda", "Lemonade", "Water", "Iced Tea"],
  "Specials": ["Combo 1", "Combo 2", "Daily Special", "Kids Meal"]
};

// Category border colors
const categoryBorderColors: Record<string, string> = {
  "Mains": "border-orange-500",
  "Sides": "border-amber-500",
  "Drinks": "border-green-500",
  "Specials": "border-fuchsia-500"
};

// Category background colors for active state
const categoryBgColors: Record<string, string> = {
  "Mains": "bg-orange-500",
  "Sides": "bg-amber-500",
  "Drinks": "bg-green-500",
  "Specials": "bg-fuchsia-500"
};

// Category text colors for selected subcategory
const categoryTextColors: Record<string, string> = {
  "Mains": "text-orange-500",
  "Sides": "text-amber-500",
  "Drinks": "text-green-500",
  "Specials": "text-fuchsia-500"
};

const getCategoryBorderColor = (category: string) => categoryBorderColors[category] || "border-orange-500";
const getCategoryBgColor = (category: string) => categoryBgColors[category] || "bg-orange-500";
const getCategoryHoverBgColor = (category: string) => (categoryBgColors[category] || "bg-orange-500").replace("bg-", "hover:bg-");
const getCategoryTextColor = (category: string) => categoryTextColors[category] || "text-orange-500";
const getCategoryHoverTextColor = (category: string) => (categoryTextColors[category] || "text-orange-500").replace("text-", "hover:text-");

// Generate stable menu items with fixed prices based on subcategory
const generateMenuItems = (subcategory: string): { id: number; name: string; price: number }[] => {
  const items = categorySubcategories[subcategory] || ["Item 1", "Item 2", "Item 3", "Item 4"];
  // Use a simple hash based on the item name to generate consistent prices
  const getStablePrice = (itemName: string): number => {
    let hash = 0;
    for (let i = 0; i < itemName.length; i++) {
      hash = ((hash << 5) - hash) + itemName.charCodeAt(i);
      hash = hash & hash;
    }
    return parseFloat((Math.abs(hash % 2000) / 100 + 5).toFixed(2));
  };
  
  return items.map((item, index) => ({
    id: index + 1,
    name: `${item} ${subcategory}`,
    price: getStablePrice(`${item} ${subcategory}`)
  }));
};

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
  itemOrderType?: string;
}

interface GuestUser {
  id: string;
  name: string;
  initials: string;
}

const mockGuestUsers: GuestUser[] = [
  { id: "1", name: "John", initials: "J" },
  { id: "2", name: "Mike", initials: "M" },
  { id: "3", name: "Sarah", initials: "S" }
];

// Food truck order types only
const orderTypes = ["TAKE OUT", "PICKUP"];

/**
 * Food Truck POS - Simplified Order Screen
 * - Left: Category sidebar
 * - Center: Menu items grid
 * - Right: Order panel with order number
 */
const OrdersA = () => {
  const [activeCategory, setActiveCategory] = useState("Mains");
  const [activeSubcategory, setActiveSubcategory] = useState("Burgers");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState("TAKE OUT");
  const [guestName, setGuestName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [filteredGuests, setFilteredGuests] = useState<GuestUser[]>([]);
  const [isGuestSelected, setIsGuestSelected] = useState(false);
  
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{id: number; name: string; price: number} | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState(1);
  
  const guestInputRef = useRef<HTMLInputElement>(null);
  const guestDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGuestSelected) {
      setIsGuestSelected(false);
      return;
    }
    if (guestName.trim().length > 0) {
      const filtered = mockGuestUsers.filter(user => 
        user.name.toLowerCase().includes(guestName.toLowerCase())
      );
      setFilteredGuests(filtered);
      setShowGuestDropdown(filtered.length > 0);
    } else {
      setFilteredGuests([]);
      setShowGuestDropdown(false);
    }
  }, [guestName]);

  const selectGuest = (guest: GuestUser) => {
    setIsGuestSelected(true);
    setGuestName(guest.name);
    setShowGuestDropdown(false);
  };

  const completeOrder = () => {
    setOrderItems([]);
    setGuestName("");
    setOrderNotes("");
    setOrderNumber(prev => prev + 1);
  };

  const menuItems = generateMenuItems(activeSubcategory);

  const addToCart = (item: { id: number; name: string; price: number }) => {
    setOrderItems(prev => {
      const existing = prev.find(o => o.name === item.name && (!o.modifiers || o.modifiers.length === 0));
      if (existing) {
        return prev.map(o => 
          o.name === item.name && (!o.modifiers || o.modifiers.length === 0) 
            ? { ...o, qty: o.qty + 1 } 
            : o
        );
      }
      return [...prev, { id: Date.now(), qty: 1, name: item.name, price: item.price }];
    });
  };

  const addToCartWithModifiers = (item: { id: number; name: string; price: number }, quantity: number, modifiers: string[], notes: string, totalPrice: number) => {
    setOrderItems(prev => [...prev, {
      id: Date.now(),
      qty: quantity,
      name: item.name,
      price: totalPrice / quantity,
      modifiers: modifiers.length > 0 ? modifiers : undefined
    }]);
  };

  const removeFromCart = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItemOrderType = (itemId: number, newOrderType: string) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, itemOrderType: newOrderType } : item
    ));
  };

  const openCustomizationDialog = (item: { id: number; name: string; price: number }, imageIndex: number) => {
    setSelectedItemForCustomization(item);
    setSelectedItemImage(foodImages[imageIndex % foodImages.length]);
    setCustomizationDialogOpen(true);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = 0;
  const serviceCharge = 0;
  const tax = subtotal * 0.02;
  const total = subtotal - discount + serviceCharge + tax;

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden gap-1 md:gap-2 p-1 md:p-2">
      {/* Top Categories Bar - Tablet Only */}
      <div className="lg:hidden bg-neutral-900 rounded-xl p-2 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {foodTruckCategories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => {
                setActiveCategory(category);
                const subs = categorySubcategories[category] || [];
                if (subs.length > 0) setActiveSubcategory(subs[0]);
              }}
              className={`rounded-full px-4 h-8 text-xs whitespace-nowrap border-2 flex-shrink-0 ${
                activeCategory === category 
                  ? `${getCategoryBgColor(category)} ${getCategoryHoverBgColor(category)} text-white ${getCategoryBorderColor(category)}` 
                  : `bg-header text-header-foreground ${getCategoryBorderColor(category)} hover:bg-header/80`
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content - Vertical on Tablet, Horizontal on Desktop */}
      <div className="flex flex-col lg:flex-row flex-1 gap-1 md:gap-2 overflow-hidden">
        {/* Left Sidebar - Categories (Desktop Only) */}
        <div className="hidden lg:flex flex-col bg-neutral-900 rounded-xl w-48">
          {/* Food Truck Header */}
          <div className="p-3 border-b border-neutral-700">
            <h2 className="text-white font-bold text-sm">
              FOOD TRUCK
            </h2>
          </div>

          {/* Categories List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {foodTruckCategories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => {
                    setActiveCategory(category);
                    const subs = categorySubcategories[category] || [];
                    if (subs.length > 0) setActiveSubcategory(subs[0]);
                  }}
                  className={`w-full justify-start rounded-full px-4 h-8 text-xs whitespace-nowrap border-2 ${
                    activeCategory === category 
                      ? `${getCategoryBgColor(category)} ${getCategoryHoverBgColor(category)} text-white ${getCategoryBorderColor(category)}` 
                      : `bg-header text-header-foreground ${getCategoryBorderColor(category)} hover:bg-header/80`
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Menu Items (Expands on Tablet) */}
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl overflow-hidden min-h-0">
          {/* Subcategories */}
          <div className="p-2 md:p-3 border-b border-neutral-700">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
              <div className="flex-1 flex items-center gap-1.5 md:gap-2 bg-neutral-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                <img src={searchIcon} alt="Search" className="w-3 h-3 md:w-4 md:h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white text-xs md:text-sm placeholder:text-neutral-500 outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3 md:w-4 md:h-4 text-neutral-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
              {(categorySubcategories[activeCategory] || []).map(sub => (
                <Button
                  key={sub}
                  variant="outline"
                  className={`rounded-lg px-3 md:px-4 lg:px-5 h-8 md:h-9 text-xs md:text-sm whitespace-nowrap border ${
                    activeSubcategory === sub 
                      ? `bg-black ${getCategoryTextColor(activeCategory)} ${getCategoryHoverTextColor(activeCategory)} ${getCategoryBorderColor(activeCategory)} font-semibold hover:bg-black` 
                      : `bg-black text-header-foreground ${getCategoryBorderColor(activeCategory)} hover:bg-black/80`
                  }`}
                  onClick={() => setActiveSubcategory(sub)}
                >
                  {sub}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items List */}
          <ScrollArea className="flex-1 p-2 md:p-3">
            <div className="grid grid-cols-2 gap-1 md:gap-1.5">
              {menuItems
                .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="flex items-stretch bg-sidebar-accent rounded-md overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border min-h-[38px] md:min-h-[42px]"
                  >
                    <div 
                      className="flex-1 p-1.5 md:p-2"
                      style={{
                        background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)'
                      }}
                    >
                      <span className="float-right text-[9px] md:text-[10px] ml-1 text-white">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-bold leading-tight uppercase text-foreground line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="w-6 md:w-8 text-white flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                      }}
                    >
                      <Plus className="w-2.5 md:w-3 h-2.5 md:h-3" strokeWidth={4} />
                    </button>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Order (Bottom on Tablet, Right on Desktop) */}
        <div className="lg:w-80 flex flex-col lg:flex-col bg-neutral-900 rounded-xl overflow-hidden lg:max-h-none max-h-[65vh]">
          {/* Horizontal layout for tablet order panel */}
          <div className="flex lg:flex-col flex-1 overflow-hidden">
            {/* Left side - Order Header, Type, Notes (Tablet) / Top section (Desktop) */}
            <div className="flex flex-col lg:flex-col flex-shrink-0 lg:flex-shrink lg:w-auto w-1/3 border-r lg:border-r-0 border-neutral-700">
              {/* Order Header with Name, Order Number, Time */}
              <div className="px-2 md:px-3 py-1.5 md:py-2 border-b border-neutral-700">
                <div className="flex items-center text-[10px] md:text-xs gap-1.5 md:gap-2">
                  <div className="relative flex-1 min-w-0">
                    <input
                      ref={guestInputRef}
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="GUEST"
                      className="bg-transparent outline-none placeholder:text-[#808080] w-full min-w-0 font-medium text-[#808080] text-[10px] md:text-xs"
                    />
                    {showGuestDropdown && filteredGuests.length > 0 && (
                      <div ref={guestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[180px] md:min-w-[220px] py-1 overflow-hidden">
                        {filteredGuests.map(guest => (
                          <button
                            key={guest.id}
                            onClick={() => selectGuest(guest)}
                            className="w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 hover:bg-neutral-600 transition-colors text-left"
                          >
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                              {guest.initials}
                            </div>
                            <span className="text-white font-medium text-xs md:text-sm">{guest.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[#808080] text-[10px] md:text-xs whitespace-nowrap">
                    #{String(orderNumber).padStart(3, '0')}
                  </span>
                  <div className="flex items-center gap-0.5 md:gap-1 whitespace-nowrap flex-shrink-0">
                    <img src={timeIcon} alt="Time" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    <span className="text-white text-[9px] md:text-[10px]">12:30</span>
                  </div>
                </div>
              </div>

              {/* Order Type */}
              <div className="p-2 md:p-3 border-b border-neutral-700">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] md:text-xs font-medium bg-neutral-700 px-2 md:px-3 py-1 md:py-1.5 rounded">
                      {orderType} <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
                    {orderTypes.map(type => (
                      <DropdownMenuItem 
                        key={type} 
                        onClick={() => setOrderType(type)}
                        className="text-white hover:bg-neutral-700 text-xs md:text-sm"
                      >
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Order Notes */}
              <div className="p-2 md:p-3 lg:border-b border-neutral-700">
                <div className="flex items-center gap-1.5 md:gap-2 bg-neutral-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                  <img src={itemNotesIcon} alt="Notes" className="w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Notes..."
                    className="flex-1 bg-transparent text-xs md:text-sm text-white placeholder:text-neutral-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right side - Order Items (Tablet) / Middle section (Desktop) */}
            <ScrollArea className="flex-1 p-2 md:p-3">
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-4 md:py-6 lg:py-8">
                  <img src={emptyOrderIcon} alt="Empty" className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 opacity-50 mb-2 md:mb-3" />
                  <span className="text-neutral-500 text-xs md:text-sm">No items yet</span>
                </div>
              ) : (
                <div className="space-y-1.5 md:space-y-2">
                  {orderItems.map(item => (
                    <SwipeableCartItem
                      key={item.id}
                      onDelete={() => removeFromCart(item.id)}
                      itemOrderType={item.itemOrderType || "Dine In"}
                      onOrderTypeChange={(type) => updateItemOrderType(item.id, type)}
                      isOpen={activeSwipedItemId === item.id}
                      onSwipeStart={() => setActiveSwipedItemId(item.id)}
                    >
                      <div className="p-2 md:p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 text-white text-[10px] md:text-xs font-medium flex items-center justify-center">
                              {item.qty}
                            </span>
                            <span className="text-xs md:text-sm text-white line-clamp-1">{item.name}</span>
                          </div>
                          <span className="text-xs md:text-sm text-white ml-1">${item.price.toFixed(2)}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-1.5 md:mt-2 ml-6 md:ml-8 space-y-0.5">
                            {item.modifiers.map((mod, idx) => (
                              <div key={idx} className="text-[10px] md:text-xs text-orange-400">+ {mod}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </SwipeableCartItem>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Order Summary - Bottom on both */}
          {orderItems.length > 0 && (
            <div className="p-2 md:p-3 border-t border-neutral-700 flex-shrink-0">
              <div className="flex items-center justify-center text-[10px] md:text-xs mb-1.5 md:mb-2 px-1">
                <span className="text-neutral-400">Sub ${subtotal.toFixed(2)} · Tax ${tax.toFixed(2)}</span>
              </div>
              <div className="flex gap-1.5 md:gap-2">
                <button
                  onClick={() => setOrderItems([])}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                >
                  <img src={clearCIcon} alt="Clear" className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <button 
                  onClick={completeOrder}
                  className="flex-1 h-8 md:h-10 rounded-full flex items-center justify-center gap-1 md:gap-2"
                  style={{ background: 'linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)' }}
                >
                  <Printer className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  <span className="text-white font-semibold text-xs md:text-sm">PRINT</span>
                </button>
                <button 
                  className="flex-1 h-8 md:h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                >
                  <span className="text-black font-semibold text-xs md:text-sm">${total.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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

export default OrdersA;
