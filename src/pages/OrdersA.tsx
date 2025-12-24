import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, MoreVertical, X, FileText, Receipt } from "lucide-react";
import searchIcon from "@/assets/icons/search.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import saveIcon from "@/assets/icons/save.png";
import fireIcon from "@/assets/icons/fire.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import emptyOrderIcon from "@/assets/icons/empty-order.png";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import runnerIcon from "@/assets/icons/runner.png";
import discountIcon from "@/assets/icons/discount.png";
import noTaxIcon from "@/assets/icons/no-tax.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import giftCardIcon from "@/assets/icons/gift-card.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";

// Food images
import salmonImg from "@/assets/food/salmon.jpg";
import macCheeseImg from "@/assets/food/mac-cheese.jpg";
import ravioliImg from "@/assets/food/ravioli.jpg";
import turkeyImg from "@/assets/food/turkey.jpg";
import gnocchiImg from "@/assets/food/gnocchi.jpg";
import asparagusImg from "@/assets/food/asparagus.jpg";
import chickenBreastImg from "@/assets/food/chicken-breast.jpg";
import paniniImg from "@/assets/food/panini.jpg";
import fettucciniImg from "@/assets/food/fettuccini.jpg";
import chickenParmesanImg from "@/assets/food/chicken-parmesan.jpg";
import steakImg from "@/assets/food/steak.jpg";
import ribsImg from "@/assets/food/ribs.jpg";
import shrimpImg from "@/assets/food/shrimp.jpg";
import soupImg from "@/assets/food/soup.jpg";
import saladImg from "@/assets/food/salad.jpg";
import pizzaImg from "@/assets/food/pizza.jpg";
import burgerImg from "@/assets/food/burger.jpg";
import seafoodImg from "@/assets/food/seafood.jpg";
import pastaImg from "@/assets/food/pasta.jpg";
import pancakesImg from "@/assets/food/pancakes.jpg";

const foodImages = [salmonImg, macCheeseImg, ravioliImg, turkeyImg, gnocchiImg, asparagusImg, chickenBreastImg, paniniImg, fettucciniImg, chickenParmesanImg, steakImg, ribsImg, shrimpImg, soupImg, saladImg, pizzaImg, burgerImg, seafoodImg, pastaImg, pancakesImg];

const menuList = ["BAKERY MENU", "BAR MENU", "HAPPY HOUR M/W", "Holiday Menu", "LE BRUNCH MENU", "LE DINER MENU"];

const menuCategories: Record<string, string[]> = {
  "BAKERY MENU": ["Breads", "Pastries", "Cakes", "Cookies", "Croissants", "Muffins"],
  "BAR MENU": ["Food", "Desserts", "Drinks", "Beer", "Wine", "Cocktails"],
  "HAPPY HOUR M/W": ["Appetizers", "Wings", "Sliders", "Nachos", "Beer", "Wine"],
  "Holiday Menu": ["Starters", "Mains", "Sides", "Desserts", "Drinks", "Specials"],
  "LE BRUNCH MENU": ["Eggs", "Pancakes", "Waffles", "Omelettes", "Juice", "Coffee"],
  "LE DINER MENU": ["Appetizers", "Soups", "Salads", "Entrees", "Steaks", "Seafood"]
};

const categorySubcategories: Record<string, string[]> = {
  "Food": ["Appetizers", "Mains", "Sides", "Salads"],
  "Desserts": ["Cakes", "Ice Cream", "Pies", "Cookies"],
  "Drinks": ["Iced Tea", "Soda", "Lemonade", "Sparkling"],
  "Beer": ["Lager", "IPA", "Stout", "Pilsner"],
  "Wine": ["Red", "White", "Rosé", "Sparkling"],
  "Cocktails": ["Margarita", "Mojito", "Martini", "Cosmopolitan"],
  "Breads": ["Sourdough", "Whole Wheat", "Rye", "French"],
  "Pastries": ["Croissant", "Danish", "Éclair", "Palmier"],
  "Cakes": ["Chocolate", "Vanilla", "Red Velvet", "Carrot"],
  "Appetizers": ["Wings", "Nachos", "Sliders", "Dips"],
  "Eggs": ["Scrambled", "Fried", "Poached", "Benedict"],
  "Pancakes": ["Buttermilk", "Blueberry", "Chocolate Chip", "Banana"],
  "Soups": ["Tomato", "Chicken Noodle", "French Onion", "Clam Chowder"],
  "Salads": ["Caesar", "Garden", "Greek", "Cobb"],
  "Entrees": ["Steak", "Chicken", "Fish", "Pasta"],
  "Steaks": ["Filet Mignon", "Ribeye", "NY Strip", "T-Bone"],
  "Seafood": ["Salmon", "Lobster", "Shrimp", "Scallops"]
};

// Generate menu items
const generateMenuItems = (subcategory: string) => {
  const items = categorySubcategories[subcategory] || ["Item 1", "Item 2", "Item 3", "Item 4"];
  return items.map((item, index) => ({
    id: Date.now() + index + Math.random() * 1000,
    name: `${item} ${subcategory}`,
    price: parseFloat((Math.random() * 20 + 5).toFixed(2))
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
  phone: string;
  initials: string;
  avatar?: string;
}

const mockGuestUsers: GuestUser[] = [
  { id: "1", name: "John Smith", phone: "(555) 123-4567", initials: "JS" },
  { id: "2", name: "Jane Doe", phone: "(555) 234-5678", initials: "JD" },
  { id: "3", name: "Mike Johnson", phone: "(555) 345-6789", initials: "MJ" }
];

const orderTypes = ["DINE IN", "TAKE OUT", "DELIVERY", "PICKUP"];

const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  return phone;
};

/**
 * Layout A: Split Screen with Categories Sidebar
 * - Left: Vertical sidebar with category icons/labels (collapsible)
 * - Center: Subcategories + Menu items grid (larger area)
 * - Right: Order panel
 */
const OrdersA = () => {
  const [selectedMenu, setSelectedMenu] = useState("BAR MENU");
  const [activeCategory, setActiveCategory] = useState("Food");
  const [activeSubcategory, setActiveSubcategory] = useState("Appetizers");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState("DINE IN");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [filteredGuests, setFilteredGuests] = useState<GuestUser[]>([]);
  const [isGuestSelected, setIsGuestSelected] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{id: number; name: string; price: number} | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<number | null>(null);

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
    setGuestPhone(guest.phone.replace(/\D/g, ''));
    setShowGuestDropdown(false);
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
    <div className="flex h-full overflow-hidden gap-2 p-2">
      {/* Left Sidebar - Categories */}
      <div className={`flex flex-col bg-neutral-900 rounded-xl transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-48'}`}>
        {/* Menu Selector */}
        <div className="p-2 border-b border-neutral-700">
          <Select value={selectedMenu} onValueChange={setSelectedMenu}>
            <SelectTrigger className={`bg-neutral-800 border-neutral-700 text-white ${isSidebarCollapsed ? 'w-12 px-2' : 'w-full'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              {menuList.map(menu => (
                <SelectItem key={menu} value={menu} className="text-white hover:bg-neutral-700">
                  {menu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {isSidebarCollapsed ? '→' : '←'}
        </button>

        {/* Categories List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {menuCategories[selectedMenu].map(category => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  const subs = categorySubcategories[category] || [];
                  if (subs.length > 0) setActiveSubcategory(subs[0]);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeCategory === category 
                    ? 'bg-orange-500 text-white' 
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {isSidebarCollapsed ? category.slice(0, 2) : category}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center Panel - Menu Items */}
      <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl overflow-hidden">
        {/* Subcategories */}
        <div className="p-3 border-b border-neutral-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
              <img src={searchIcon} alt="Search" className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(categorySubcategories[activeCategory] || []).map(sub => (
              <Button
                key={sub}
                variant={activeSubcategory === sub ? "default" : "outline"}
                className={`rounded-full px-4 h-8 text-xs whitespace-nowrap ${
                  activeSubcategory === sub 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
                onClick={() => setActiveSubcategory(sub)}
              >
                {sub}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {menuItems
              .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
                <div
                  key={item.id}
                  className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 hover:border-orange-500 transition-colors cursor-pointer"
                  onClick={() => openCustomizationDialog(item, index)}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={foodImages[index % foodImages.length]} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2">{item.name}</h3>
                    <p className="text-orange-500 font-semibold mt-1">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order */}
      <div className="w-80 flex flex-col bg-neutral-900 rounded-xl overflow-hidden">
        {/* Order Header */}
        <div className="p-3 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="relative flex-1">
              <input
                ref={guestInputRef}
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Guest Name"
                className="bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none w-full"
              />
              {showGuestDropdown && filteredGuests.length > 0 && (
                <div ref={guestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-lg shadow-xl border border-neutral-600 z-50 w-full">
                  {filteredGuests.map(guest => (
                    <button
                      key={guest.id}
                      onClick={() => selectGuest(guest)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-600 text-white text-sm"
                    >
                      {guest.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-neutral-400 text-xs">
              <img src={timeIcon} alt="Time" className="w-4 h-4" />
              <span>12:30 PM</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img src={phoneIcon} alt="Phone" className="w-4 h-4" />
            <input
              type="tel"
              value={formatPhoneNumber(guestPhone)}
              onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="(XXX) XXX-XXXX"
              className="bg-transparent text-neutral-400 text-xs placeholder:text-neutral-500 outline-none flex-1"
            />
          </div>
        </div>

        {/* Order Type */}
        <div className="p-3 border-b border-neutral-700 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-xs font-medium bg-neutral-700 px-3 py-1.5 rounded">
                {orderType} <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
              {orderTypes.map(type => (
                <DropdownMenuItem 
                  key={type} 
                  onClick={() => setOrderType(type)}
                  className="text-white hover:bg-neutral-700"
                >
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <img src={runnerIcon} alt="Server" className="w-4 h-4" />
            <span>Server</span>
          </div>
        </div>

        {/* Order Notes */}
        <div className="p-3 border-b border-neutral-700">
          <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
            <img src={itemNotesIcon} alt="Notes" className="w-4 h-4" />
            <input
              type="text"
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="Order notes..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
            />
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 p-3">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <img src={emptyOrderIcon} alt="Empty" className="w-16 h-16 opacity-50 mb-3" />
              <span className="text-neutral-500 text-sm">No items yet</span>
            </div>
          ) : (
            <div className="space-y-2">
              {orderItems.map(item => (
                <SwipeableCartItem
                  key={item.id}
                  onDelete={() => removeFromCart(item.id)}
                  itemOrderType={item.itemOrderType || "Dine In"}
                  onOrderTypeChange={(type) => updateItemOrderType(item.id, type)}
                  isOpen={activeSwipedItemId === item.id}
                  onSwipeStart={() => setActiveSwipedItemId(item.id)}
                >
                  <div className="p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center justify-center">
                          {item.qty}
                        </span>
                        <span className="text-sm text-white">{item.name}</span>
                      </div>
                      <span className="text-sm text-white">${item.price.toFixed(2)}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-2 ml-8 space-y-0.5">
                        {item.modifiers.map((mod, idx) => (
                          <div key={idx} className="text-xs text-orange-400">+ {mod}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </SwipeableCartItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <div className="p-3 border-t border-neutral-700">
            <div className="bg-neutral-800 rounded-lg p-3 text-xs space-y-1 mb-3">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold text-sm pt-1 border-t border-neutral-700">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderItems([])}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
              >
                <img src={clearCIcon} alt="Clear" className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center">
                <img src={saveIcon} alt="Save" className="w-5 h-5" />
              </button>
              <button 
                className="flex-1 h-10 rounded-full flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
              >
                <img src={fireIcon} alt="Fire" className="w-5 h-5" />
                <span className="text-white font-semibold">FIRE</span>
              </button>
              <button 
                className="flex-1 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
              >
                <span className="text-black font-semibold text-sm">${total.toFixed(2)}</span>
              </button>
            </div>
          </div>
        )}
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
