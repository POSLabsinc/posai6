import { useState, useRef, useEffect, useMemo } from "react";
import { SettingsManager } from "@/lib/settingsManager";
import { Plus, ChevronDown, ChevronRight, X, FileText } from "lucide-react";
import searchIcon from "@/assets/icons/search.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import saveIcon from "@/assets/icons/save.png";
import fireIcon from "@/assets/icons/fire.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import emptyOrderIcon from "@/assets/icons/empty-order.png";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import runnerIcon from "@/assets/icons/runner.png";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";

// Food images - 20 custom images
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
 * Layout D: Three-Column Professional Layout
 * - Left Column: Categories (accordion-style, expandable)
 * - Center Column: Subcategories + Menu items
 * - Right Column: Full order panel with guest info and cart
 */
const OrdersD = () => {
  const checkoutOptionsSettings = useMemo(() => SettingsManager.getCheckoutOptionsSettings(), []);
  const showSaveButton = checkoutOptionsSettings.showSaveButton;
  const [selectedMenu, setSelectedMenu] = useState("BAR MENU");
  const [activeCategory, setActiveCategory] = useState("Food");
  const [activeSubcategory, setActiveSubcategory] = useState("Appetizers");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState("DINE IN");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState("Food");
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [filteredGuests, setFilteredGuests] = useState<GuestUser[]>([]);
  const [isGuestSelected, setIsGuestSelected] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{id: number; name: string; price: number} | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<number | null>(null);

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
    <div className="flex h-full overflow-hidden gap-1 p-2">
      {/* Left Column - Categories Accordion */}
      <div className="w-56 flex flex-col rounded-xl overflow-hidden" style={{
        background: '#7575754D',
        boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
      }}>
        {/* Menu Selector */}
        <div className="p-3 border-b border-sidebar-border">
          <Select value={selectedMenu} onValueChange={setSelectedMenu}>
            <SelectTrigger className="bg-neutral-700 border-sidebar-border text-foreground text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-sidebar-border z-50">
              {menuList.map(menu => (
                <SelectItem key={menu} value={menu} className="text-foreground hover:bg-neutral-700 text-sm">
                  {menu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categories Accordion */}
        <ScrollArea className="flex-1">
          <Accordion 
            type="single" 
            collapsible 
            value={expandedCategory}
            onValueChange={(val) => {
              setExpandedCategory(val);
              if (val) {
                setActiveCategory(val);
                const subs = categorySubcategories[val] || [];
                if (subs.length > 0) setActiveSubcategory(subs[0]);
              }
            }}
            className="p-2"
          >
            {menuCategories[selectedMenu].map(category => (
              <AccordionItem key={category} value={category} className="border-sidebar-border">
                <AccordionTrigger className={`text-sm py-3 px-3 rounded-lg hover:bg-neutral-700/50 ${activeCategory === category ? 'text-primary' : 'text-foreground'}`}>
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-2 space-y-1">
                    {(categorySubcategories[category] || []).map(sub => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubcategory(sub)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                          activeSubcategory === sub 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-neutral-700/50 hover:text-foreground'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>

      {/* Center Column - Menu Items */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{
        background: '#7575754D',
        boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
      }}>
        {/* Search Bar */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
            <img src={searchIcon} alt="Search" className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Current Selection Header */}
        <div className="px-4 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{activeCategory}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-primary font-medium">{activeSubcategory}</span>
          </div>
        </div>

        {/* Items Grid */}
        <ScrollArea className="flex-1 p-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems
              .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden border border-sidebar-border hover:border-primary/50 transition-colors cursor-pointer"
                  style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                  onClick={() => openCustomizationDialog(item, index)}
                >
                  <div className="relative aspect-[4/3]">
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
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <span className="text-primary font-bold text-sm">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-foreground line-clamp-2">{item.name}</h3>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column - Full Order Panel */}
      <div className="w-80 flex flex-col overflow-hidden">
        {/* Order Header - Outside background container */}
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="flex items-center text-xs mb-2 gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={guestName} 
                onChange={e => setGuestName(e.target.value)} 
                placeholder="GUEST NAME" 
                className="bg-transparent outline-none placeholder:text-[#808080] w-full min-w-0 font-medium text-[#808080]" 
              />
              {showGuestDropdown && filteredGuests.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map(guest => (
                    <button 
                      key={guest.id} 
                      onClick={() => selectGuest(guest)} 
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                        {guest.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-sm">{guest.name}</span>
                        <span className="text-muted-foreground text-xs">{guest.phone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex items-center gap-0.5 flex-shrink-0">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input 
                type="tel" 
                inputMode="tel" 
                value={formatPhoneNumber(guestPhone)} 
                onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))} 
                placeholder="(XXX) XXX-XXXX" 
                className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-[#808080] text-xs" 
              />
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-3 h-3" />
              <span className="text-foreground text-[10px]">12:30 PM</span>
            </div>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide mb-2">
            <div className="flex items-center gap-1.5 w-max">
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Custom Item
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Discount
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                No Sale
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Gift
              </Button>
              <Button variant="secondary" size="icon" className="h-6 w-6 rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Background Container for Order Content */}
        <div className="flex-1 flex flex-col rounded-lg overflow-hidden min-h-0" style={{
          background: '#7575754D',
          boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
        }}>
          {/* Order Type & Server */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded transition-colors">
                    {orderType} <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-neutral-800 border-sidebar-border min-w-[140px] z-50">
                  {orderTypes.map(type => (
                    <DropdownMenuItem 
                      key={type} 
                      onClick={() => setOrderType(type)}
                      className="text-foreground hover:bg-neutral-700 cursor-pointer"
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {orderItems.length > 0 && (
                <span className="bg-sidebar-accent px-2 py-0.5 rounded text-base font-bold">{orderItems.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <img src={runnerIcon} alt="Server" className="w-4 h-4" />
              <span>Server</span>
            </div>
          </div>

          {/* Notes */}
          <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-2 rounded px-3 py-2" style={{
              background: '#7575754D',
              boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
            }}>
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Order notes" 
                value={orderNotes} 
                onChange={e => setOrderNotes(e.target.value)} 
                className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground outline-none" 
              />
            </div>
          </div>

          {/* Order Items */}
          <ScrollArea className="flex-1 min-h-0 px-2">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                <span className="text-muted-foreground text-sm">Let's create an order</span>
              </div>
            ) : (
              <div className="py-1 space-y-2">
                {orderItems.map(item => (
                  <SwipeableCartItem
                    key={item.id}
                    onDelete={() => removeFromCart(item.id)}
                    itemOrderType={item.itemOrderType || "Dine In"}
                    onOrderTypeChange={(type) => updateItemOrderType(item.id, type)}
                    isOpen={activeSwipedItemId === item.id}
                    onSwipeStart={() => setActiveSwipedItemId(item.id)}
                  >
                    <div 
                      className="p-3 border border-sidebar-border rounded-lg"
                      style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center flex-shrink-0">
                            {item.qty}
                          </span>
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">${item.price.toFixed(2)}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-2 ml-8 space-y-0.5">
                          {item.modifiers.map((mod, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs text-primary">
                              <span>{mod.startsWith("W/") ? "+" : "-"}</span>
                              <span>{mod}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SwipeableCartItem>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Order Summary - Only show when cart has items */}
          {orderItems.length > 0 && (
            <div className="p-2 border-t border-sidebar-border flex-shrink-0">
              <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
                background: '#7575754D',
                boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
              }}>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
                  <span className="text-white">Discount: <span className="font-medium">$0.00</span></span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground">Service Charge: <span className="font-medium">$0.00</span></span>
                  <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-2 py-2 flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => setOrderItems([])} 
                  className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0"
                >
                  <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
                </button>
                {showSaveButton && (
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: '#C9C9C9' }}
                >
                  <img src={saveIcon} alt="Save" className="w-4 h-4" />
                </button>
                )}
                <button 
                  className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" 
                  style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                >
                  <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                  <span className="text-white font-semibold text-sm">FIRE</span>
                </button>
                <button 
                  className="flex-1 h-8 rounded-full flex items-center justify-center" 
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                >
                  <span className="text-black font-semibold text-xs">CHARGE ${total.toFixed(2)}</span>
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

export default OrdersD;
