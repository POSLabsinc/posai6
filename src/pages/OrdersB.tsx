import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, X, FileText } from "lucide-react";
import searchIcon from "@/assets/icons/search.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import saveIcon from "@/assets/icons/save.png";
import fireIcon from "@/assets/icons/fire.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import emptyOrderIcon from "@/assets/icons/empty-order.png";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import runnerIcon from "@/assets/icons/runner.png";
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
 * Layout B: Top Navigation with Tabs
 * - Top Bar: Category tabs (horizontal scrolling)
 * - Below Categories: Subcategory pills
 * - Main Area: Full-width menu items grid
 * - Right Panel: Order panel (narrower, always visible)
 */
const OrdersB = () => {
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
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{id: number; name: string; price: number} | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<number | null>(null);

  const guestInputRef = useRef<HTMLInputElement>(null);

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
  const tax = subtotal * 0.02;
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Navigation - Menu & Category Tabs */}
      <div className="bg-neutral-900 border-b border-neutral-700 p-3">
        {/* Menu Selector & Search */}
        <div className="flex items-center gap-4 mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium">
                {selectedMenu} <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
              {menuList.map(menu => (
                <DropdownMenuItem 
                  key={menu} 
                  onClick={() => setSelectedMenu(menu)}
                  className="text-white hover:bg-neutral-700"
                >
                  {menu}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2 max-w-md">
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

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {menuCategories[selectedMenu].map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                const subs = categorySubcategories[category] || [];
                if (subs.length > 0) setActiveSubcategory(subs[0]);
              }}
              className={`px-5 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                activeCategory === category 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Subcategory Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3">
          {(categorySubcategories[activeCategory] || []).map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(sub)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeSubcategory === sub 
                  ? 'bg-white text-black' 
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Menu Items Grid */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {menuItems
                .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 hover:border-orange-500 transition-all cursor-pointer group"
                    onClick={() => openCustomizationDialog(item, index)}
                  >
                    <div className="relative aspect-square">
                      <img 
                        src={foodImages[index % foodImages.length]} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="absolute bottom-2 right-2 w-10 h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Plus className="w-5 h-5 text-white" strokeWidth={3} />
                      </button>
                      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-md">
                        <span className="text-white font-bold text-sm">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs font-medium text-white line-clamp-2 text-center">{item.name}</h3>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Order Panel - Narrower */}
        <div className="w-72 flex flex-col bg-neutral-900 border-l border-neutral-700">
          {/* Header */}
          <div className="p-3 border-b border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <input
                ref={guestInputRef}
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Guest Name"
                className="bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none flex-1"
              />
              <span className="text-neutral-400 text-xs flex items-center gap-1">
                <img src={timeIcon} alt="Time" className="w-3 h-3" />
                12:30 PM
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input
                type="tel"
                value={formatPhoneNumber(guestPhone)}
                onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Phone"
                className="bg-transparent outline-none flex-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-xs bg-neutral-700 px-2 py-1 rounded flex items-center gap-1">
                    {orderType} <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
                  {orderTypes.map(type => (
                    <DropdownMenuItem 
                      key={type} 
                      onClick={() => setOrderType(type)}
                      className="text-white hover:bg-neutral-700 text-xs"
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-xs text-neutral-400 flex items-center gap-1">
                <img src={runnerIcon} alt="Server" className="w-3 h-3" />
                Server
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="p-2 border-b border-neutral-700">
            <div className="flex items-center gap-2 bg-neutral-800 rounded px-2 py-1.5">
              <img src={itemNotesIcon} alt="Notes" className="w-3 h-3" />
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Notes..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-500 outline-none"
              />
            </div>
          </div>

          {/* Items */}
          <ScrollArea className="flex-1 p-2">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <img src={emptyOrderIcon} alt="Empty" className="w-12 h-12 opacity-50 mb-2" />
                <span className="text-neutral-500 text-xs">No items</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {orderItems.map(item => (
                  <SwipeableCartItem
                    key={item.id}
                    onDelete={() => removeFromCart(item.id)}
                    itemOrderType={item.itemOrderType || "Dine In"}
                    onOrderTypeChange={(type) => updateItemOrderType(item.id, type)}
                    isOpen={activeSwipedItemId === item.id}
                    onSwipeStart={() => setActiveSwipedItemId(item.id)}
                  >
                    <div className="p-2 bg-neutral-800 rounded border border-neutral-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-medium flex items-center justify-center">
                            {item.qty}
                          </span>
                          <span className="text-xs text-white line-clamp-1">{item.name}</span>
                        </div>
                        <span className="text-xs text-white">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </SwipeableCartItem>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Summary */}
          {orderItems.length > 0 && (
            <div className="p-2 border-t border-neutral-700">
              <div className="bg-neutral-800 rounded p-2 text-[10px] space-y-0.5 mb-2">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold text-xs pt-1 border-t border-neutral-700">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOrderItems([])}
                  className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                >
                  <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
                </button>
                <button className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center">
                  <img src={saveIcon} alt="Save" className="w-4 h-4" />
                </button>
                <button 
                  className="flex-1 h-8 rounded-full flex items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                >
                  <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                  <span className="text-white font-semibold text-xs">FIRE</span>
                </button>
                <button 
                  className="flex-1 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                >
                  <span className="text-black font-semibold text-xs">${total.toFixed(2)}</span>
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

export default OrdersB;
