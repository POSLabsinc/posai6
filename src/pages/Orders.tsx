import { useState } from "react";
import { Search, Plus, Save, Flame, Receipt, ArrowRightLeft, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const categories = ["Food", "Desserts", "Drinks", "Beer"];
const subcategories = ["Iced Tea", "Soda", "Lemonade", "Sparkling", "Coffee"];
const foodCategories = ["Appetizer", "Soup", "Entrees", "Pastas", "Pizzas", "Snacks", "Steak", "Fish", "Chicken", "Burgers", "Pan Cakes", "Vegan", "Waffles", "Pastries"];

const menuItems = [
  { id: 1, name: "Almond Crusted Salmon", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100&h=100&fit=crop" },
  { id: 2, name: "Hand Cut Fettuccini Alfredo", image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=100&h=100&fit=crop" },
  { id: 3, name: "Four Cheese Ravioli", image: "https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=100&h=100&fit=crop" },
  { id: 4, name: "Grilled Organic Chicken Panini", image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=100&h=100&fit=crop" },
  { id: 5, name: "Grilled Asparagus", image: "https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=100&h=100&fit=crop" },
  { id: 6, name: "Jidori Chicken Parmesan", image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=100&h=100&fit=crop" },
  { id: 7, name: "Prime London Sirloin", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=100&h=100&fit=crop" },
  { id: 8, name: "Pan Roasted Salmon Sandwich", image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=100&h=100&fit=crop" },
  { id: 9, name: "Oven Roasted Free Range Chicken", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=100&h=100&fit=crop" },
  { id: 10, name: "Crispy Calamari", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=100&h=100&fit=crop" },
  { id: 11, name: "Spinach & Artichoke Dip", image: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=100&h=100&fit=crop" },
  { id: 12, name: "Loaded Potato Skins", image: "https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?w=100&h=100&fit=crop" },
  { id: 13, name: "Mozzarella Sticks", image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=100&h=100&fit=crop" },
  { id: 14, name: "Chicken Wings", image: "https://images.unsplash.com/photo-1608039829572-9b0179e29b12?w=100&h=100&fit=crop" },
  { id: 15, name: "Nacho Supreme", image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=100&h=100&fit=crop" },
];

const orderItems = [
  { id: 1, qty: 1, name: "Classic Crispy Burger", price: 12.00 },
  { id: 2, qty: 1, name: "Meatballs", price: 16.00 },
  { id: 3, qty: 2, name: "Rigatoni Pasta", price: 8.00 },
  { 
    id: 4, 
    qty: 1, 
    name: "Alomd crusted salmon", 
    price: 20.00,
    modifiers: ["Salad", "Balsamic Vinaigrette", "Medium Rare", "W/ Potato Wedges", "large", "W/ Extra Cheese"]
  },
];

const Orders = () => {
  const [activeCategory, setActiveCategory] = useState("Food");
  const [activeSubcategory, setActiveSubcategory] = useState("Lemonade");
  const [activeFoodCategory, setActiveFoodCategory] = useState("Appetizer");

  const subtotal = 56.00;
  const discount = 0.00;
  const serviceCharge = 0.00;
  const tax = 3.00;
  const total = 59.00;

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">
        {/* Main Categories */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full border border-sidebar-border">
            <span className="sr-only">Menu</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={`rounded-full px-6 ${
                activeCategory === cat 
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                  : "border-sidebar-border text-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="rounded-full border border-sidebar-border ml-auto">
            <span className="w-1 h-1 bg-current rounded-full" />
            <span className="w-1 h-1 bg-current rounded-full" />
            <span className="w-1 h-1 bg-current rounded-full" />
          </Button>
        </div>

        {/* Subcategories */}
        <div className="flex items-center gap-2 flex-wrap">
          {subcategories.map((sub) => (
            <Button
              key={sub}
              variant="outline"
              size="sm"
              className={`rounded-full px-4 ${
                activeSubcategory === sub 
                  ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-500" 
                  : "border-sidebar-border text-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveSubcategory(sub)}
            >
              {sub}
            </Button>
          ))}
        </div>

        {/* Food Categories */}
        <div className="flex items-center gap-2 flex-wrap">
          {foodCategories.map((cat) => (
            <Button
              key={cat}
              variant="outline"
              size="sm"
              className={`rounded-full px-3 text-xs ${
                activeFoodCategory === cat 
                  ? "bg-orange-500/20 text-orange-500 border-orange-500" 
                  : "border-sidebar-border text-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setActiveFoodCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-sidebar-accent/50 rounded-lg p-2 hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="flex-1 text-xs font-medium leading-tight uppercase">
                  {item.name}
                </span>
                <Button
                  size="icon"
                  className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order */}
      <div className="w-80 flex flex-col bg-sidebar-accent/30 rounded-lg">
        {/* Order Header */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-2">
              <span>GUEST NAME</span>
              <span>📞 (XXX)XXX-XXXX</span>
            </div>
            <span>🕐 10:20 PM</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" size="sm" className="text-xs rounded border-sidebar-border">
              <span className="text-green-500 mr-1">%</span> Discount
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded border-sidebar-border">
              <ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded border-sidebar-border">
              <Receipt className="w-3 h-3 mr-1" /> Receipt
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded border-sidebar-border">
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">DINE IN</span>
              <span className="bg-sidebar-accent px-3 py-1 rounded text-lg font-bold">20</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>👤</span>
              <span>MIA JONE</span>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Order notes</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-2">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="bg-sidebar-accent rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                      {item.qty}
                    </span>
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.modifiers && (
                        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          {item.modifiers.map((mod, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span>{mod.startsWith("W/") ? "+" : "-"}</span>
                              <span>{mod}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">$ {item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sub Total</span>
              <span>$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>$ {discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Charge</span>
              <span>$ {serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax 2%</span>
              <span>$ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-sidebar-border">
              <span>Total</span>
              <span>$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-lg border-sidebar-border"
          >
            <Save className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-lg border-sidebar-border text-orange-500"
          >
            <Flame className="w-5 h-5" />
          </Button>
          <Button
            className="flex-1 h-12 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            CHARGE $ {total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Orders;
