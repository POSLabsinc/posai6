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
import burgerCloseIcon from "@/assets/icons/burger-close.png";
import burgerOpenIcon from "@/assets/icons/burger-open.png";

const menuList = ["BAKERY MENU", "BAR MENU", "HAPPY HOUR M/W", "Holiday Menu", "LE BRUNCH MENU", "LE DINER MENU"];

const menuCategories: Record<string, string[]> = {
  "BAKERY MENU": ["Breads", "Pastries", "Cakes", "Cookies", "Croissants", "Muffins", "Donuts", "Pies", "Tarts", "Scones", "Bagels", "Danish", "Baguettes", "Rolls"],
  "BAR MENU": ["Food", "Desserts", "Drinks", "Beer", "Wine", "Cocktails", "Spirits", "Mocktails", "Whiskey", "Vodka", "Rum", "Tequila", "Gin", "Brandy"],
  "HAPPY HOUR M/W": ["Appetizers", "Wings", "Sliders", "Nachos", "Beer", "Wine", "Cocktails", "Shots", "Tacos", "Quesadillas", "Dips", "Fries", "Pretzels", "Poppers"],
  "Holiday Menu": ["Starters", "Mains", "Sides", "Desserts", "Drinks", "Specials", "Platters", "Combos", "Turkey", "Ham", "Roasts", "Pies", "Stuffing", "Gravies"],
  "LE BRUNCH MENU": ["Eggs", "Pancakes", "Waffles", "Omelettes", "Juice", "Coffee", "Mimosas", "Pastries", "Bacon", "Sausage", "Toast", "Fruits", "Yogurt", "Granola"],
  "LE DINER MENU": ["Appetizers", "Soups", "Salads", "Entrees", "Steaks", "Seafood", "Pasta", "Desserts", "Risotto", "Duck", "Lamb", "Veal", "Lobster", "Caviar"],
};

const categorySubcategories: Record<string, string[]> = {
  "Food": ["Appetizers", "Mains", "Sides", "Salads", "Soups", "Sandwiches", "Burgers", "Wraps", "Tacos", "Platters", "Kids Menu", "Specials"],
  "Desserts": ["Cakes", "Ice Cream", "Pies", "Cookies", "Brownies", "Cheesecake", "Puddings", "Tarts", "Mousse", "Tiramisu", "Churros", "Sundaes"],
  "Drinks": ["Iced Tea", "Soda", "Lemonade", "Sparkling", "Coffee", "Juice", "Smoothies", "Milkshakes", "Hot Chocolate", "Tea", "Energy", "Water"],
  "Beer": ["Lager", "IPA", "Stout", "Pilsner", "Wheat", "Ale", "Porter", "Amber", "Pale Ale", "Draft", "Imported", "Craft"],
  "Wine": ["Red", "White", "Rosé", "Sparkling", "Champagne", "Merlot", "Cabernet", "Pinot", "Chardonnay", "Riesling", "Moscato", "House"],
  "Cocktails": ["Margarita", "Mojito", "Martini", "Cosmopolitan", "Old Fashioned", "Daiquiri", "Negroni", "Manhattan", "Sangria", "Piña Colada", "Mai Tai", "Bellini"],
  "Starters": ["Soup", "Salad", "Bruschetta", "Carpaccio", "Tartare", "Oysters", "Shrimp Cocktail", "Ceviche", "Antipasto", "Charcuterie", "Pâté", "Terrine"],
  "Mains": ["Steak", "Chicken", "Fish", "Pasta", "Risotto", "Lamb", "Pork", "Duck", "Veal", "Lobster", "Salmon", "Prime Rib"],
  "Sides": ["Fries", "Rice", "Vegetables", "Mashed Potatoes", "Coleslaw", "Mac & Cheese", "Beans", "Corn", "Asparagus", "Brussels Sprouts", "Salad", "Bread"],
  "Specials": ["Chef's Choice", "Daily Special", "Seasonal", "Prix Fixe", "Tasting Menu", "Holiday", "Weekend", "Happy Hour", "Early Bird", "Late Night", "Brunch", "Lunch"],
  "Platters": ["Seafood", "Meat", "Cheese", "Veggie", "Fruit", "Dessert", "Appetizer", "Mixed Grill", "Party", "Family", "Sharing", "Combo"],
  "Combos": ["Lunch Special", "Dinner Deal", "Family Pack", "Party Pack", "Value Meal", "Combo 1", "Combo 2", "Combo 3", "Kids Combo", "Senior Combo", "Date Night", "Group"],
  "Turkey": ["Roasted", "Smoked", "Fried", "Breast", "Leg", "Sliced", "Carved", "Herb", "Butter Basted", "Cajun", "Maple Glazed", "Traditional"],
  "Ham": ["Honey Glazed", "Smoked", "Spiral", "Country", "Black Forest", "Virginia", "Bone-In", "Sliced", "Brown Sugar", "Pineapple", "Maple", "Bourbon"],
  "Roasts": ["Prime Rib", "Beef Tenderloin", "Pork Loin", "Leg of Lamb", "Crown Roast", "Standing Rib", "Chuck", "Brisket", "Pot Roast", "Wellington", "Rack of Lamb", "Porchetta"],
  "Stuffing": ["Traditional", "Cornbread", "Sausage", "Oyster", "Wild Rice", "Apple", "Chestnut", "Herb", "Mushroom", "Sourdough", "Cranberry", "Pecan"],
  "Gravies": ["Turkey", "Brown", "White", "Mushroom", "Giblet", "Pan", "Red Eye", "Onion", "Sausage", "Herb", "Wine", "Cream"],
  "Pies": ["Apple", "Cherry", "Pumpkin", "Pecan", "Key Lime", "Blueberry", "Lemon Meringue", "Banana Cream", "Coconut", "Peach", "Mixed Berry", "Chess"],
  "Appetizers": ["Wings", "Nachos", "Sliders", "Dips", "Fries", "Rings", "Poppers", "Quesadillas", "Bruschetta", "Calamari", "Shrimp", "Meatballs"],
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

const OrdersDesign3 = () => {
  const [activeCategory, setActiveCategory] = useState("Starters");
  const [activeSubcategory, setActiveSubcategory] = useState("Soup");
  const [selectedMenu, setSelectedMenu] = useState("Holiday Menu");
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
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
    <div className="flex gap-3 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden bg-neutral-900 rounded-lg p-3">
        {/* Menu Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 p-0"
            onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}
          >
            <img src={isMenuSelectOpen ? burgerCloseIcon : burgerOpenIcon} alt="Menu" className="w-7 h-7" />
          </Button>
          {isMenuSelectOpen && (
            <Select value={selectedMenu} onValueChange={setSelectedMenu}>
              <SelectTrigger className="w-[180px] rounded-full border-sidebar-border bg-background text-foreground h-10">
                <SelectValue placeholder="Select Menu" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-sidebar-border">
                {menuList.map((menu) => (
                  <SelectItem key={menu} value={menu} className="text-foreground">
                    {menu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-sm text-muted-foreground ml-auto">Design 3: Card-Based Grid</span>
        </div>

        {/* Main Category Cards */}
        <div className="flex-shrink-0">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {menuCategories[selectedMenu].map((cat) => (
              <div
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveSubcategory(categorySubcategories[cat]?.[0] || "");
                }}
                className={`flex-shrink-0 min-w-[140px] h-[80px] rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                  activeCategory === cat 
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-neutral-900 shadow-xl shadow-orange-500/40" 
                    : "bg-sidebar-accent text-foreground hover:bg-sidebar-accent/80 border border-white/20"
                }`}
              >
                <span className="text-base font-bold text-center px-2">{cat}</span>
                <span className="text-xs opacity-70">{(categorySubcategories[cat] || []).length} items</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent flex-shrink-0" />

        {/* Subcategory Pills - Wrapping Grid */}
        <div className="flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {(categorySubcategories[activeCategory] || []).map((sub) => (
              <Button
                key={sub}
                variant="outline"
                onClick={() => setActiveSubcategory(sub)}
                className={`rounded-full px-6 py-3 h-auto min-h-[52px] max-w-[160px] text-sm font-medium whitespace-normal text-center leading-tight border transition-all ${
                  activeSubcategory === sub 
                    ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-500 shadow-lg shadow-amber-500/30" 
                    : "bg-header text-header-foreground border-white/30 hover:bg-header/80 hover:border-white/50"
                }`}
              >
                {sub}
              </Button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-sidebar-border flex-shrink-0" />

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="flex items-stretch bg-sidebar-accent rounded-lg overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border"
              >
                <span className="flex-1 text-xs font-bold leading-tight uppercase text-foreground p-3">
                  {item.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                  className="w-10 bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order */}
      <div className="w-80 flex flex-col bg-sidebar-accent/30 rounded-lg overflow-hidden flex-shrink-0">
        <div className="p-2 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <div className="flex items-center gap-2">
              <span>GUEST NAME</span>
              <span>📞 (XXX)XXX-XXXX</span>
            </div>
            <span>🕐 10:20 PM</span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5">
              <span className="text-muted-foreground">%</span> Discount
            </Button>
            <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5">
              <Receipt className="w-3 h-3 text-muted-foreground" /> Receipt
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">DINE IN</span>
              <span className="bg-sidebar-accent px-2 py-0.5 rounded text-base font-bold">20</span>
            </div>
          </div>
        </div>

        <div className="px-2 py-1 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>Order notes</span>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="py-1 space-y-1">
            {orderItems.map((item) => (
              <div key={item.id} className="bg-sidebar-accent rounded-lg p-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">
                        {item.qty}
                      </span>
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium">$ {item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-sidebar-border flex-shrink-0">
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sub Total</span>
              <span>$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax 2%</span>
              <span>$ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-sidebar-border">
              <span>Total</span>
              <span>$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-2 flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="icon" className="w-10 h-10 rounded-lg border-sidebar-border">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="w-10 h-10 rounded-lg border-sidebar-border text-orange-500">
            <Flame className="w-4 h-4" />
          </Button>
          <Button className="flex-1 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm">
            CHARGE $ {total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrdersDesign3;
