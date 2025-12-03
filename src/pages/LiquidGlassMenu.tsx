import { useState } from "react";
import { Search, Plus, Star, Flame } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const categories = ["All", "Pizza", "Pasta", "Burgers", "Salads", "Desserts", "Drinks"];

const menuItems = [
  { id: 1, name: "Margherita Pizza", description: "Fresh tomatoes, mozzarella, basil", price: "$18.99", image: "🍕", category: "Pizza", popular: true },
  { id: 2, name: "Truffle Pasta", description: "Black truffle, parmesan, cream sauce", price: "$24.99", image: "🍝", category: "Pasta", popular: true },
  { id: 3, name: "Classic Burger", description: "Angus beef, cheddar, special sauce", price: "$16.99", image: "🍔", category: "Burgers", new: true },
  { id: 4, name: "Caesar Salad", description: "Romaine, croutons, parmesan", price: "$12.99", image: "🥗", category: "Salads" },
  { id: 5, name: "Tiramisu", description: "Espresso soaked ladyfingers, mascarpone", price: "$9.99", image: "🍰", category: "Desserts", popular: true },
  { id: 6, name: "Grilled Salmon", description: "Atlantic salmon, lemon butter, asparagus", price: "$28.99", image: "🐟", category: "Main" },
  { id: 7, name: "Pepperoni Pizza", description: "Classic pepperoni, mozzarella, tomato sauce", price: "$19.99", image: "🍕", category: "Pizza" },
  { id: 8, name: "Chocolate Lava Cake", description: "Warm chocolate center, vanilla ice cream", price: "$11.99", image: "🍫", category: "Desserts", new: true },
  { id: 9, name: "Mojito", description: "Rum, mint, lime, sparkling water", price: "$12.99", image: "🍹", category: "Drinks" },
  { id: 10, name: "Carbonara", description: "Guanciale, egg yolk, pecorino", price: "$21.99", image: "🍝", category: "Pasta" },
  { id: 11, name: "Veggie Burger", description: "Plant-based patty, avocado, sprouts", price: "$15.99", image: "🍔", category: "Burgers" },
  { id: 12, name: "Espresso Martini", description: "Vodka, espresso, coffee liqueur", price: "$14.99", image: "☕", category: "Drinks", popular: true },
];

export default function LiquidGlassMenu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<typeof menuItems>([]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: typeof menuItems[0]) => {
    setCart([...cart, item]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 gradient-mesh">
      <div className="h-screen flex">
        {/* Main Menu Area */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Header with Search */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-light text-white tracking-tight">Menu</h1>
              <p className="text-neutral-400 mt-1">Browse our delicious offerings</p>
            </div>
            
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 w-80">
              <Search className="w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white placeholder-neutral-500 flex-1"
              />
            </div>
          </div>

          {/* Category Pills - Floating Style */}
          <div className="glass-dark rounded-3xl p-2 mb-6 inline-flex gap-2 self-start">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white"
                    : "text-neutral-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pr-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-vibrant rounded-3xl overflow-hidden group hover:scale-[1.03] transition-all duration-300 relative"
                >
                  {/* Tags */}
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    {item.popular && (
                      <span className="glass px-2 py-1 rounded-lg text-xs text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" /> Popular
                      </span>
                    )}
                    {item.new && (
                      <span className="glass px-2 py-1 rounded-lg text-xs text-emerald-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> New
                      </span>
                    )}
                  </div>

                  {/* Image Area */}
                  <div className="h-32 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{item.image}</span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                    <p className="text-neutral-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-semibold text-white">{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Cart Panel */}
        <div className="w-80 glass-dark border-l border-white/10 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Your Order</h2>
            <span className="glass px-3 py-1 rounded-lg text-sm text-orange-400">
              {cart.length} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">🛒</span>
                <p className="text-neutral-400">Your cart is empty</p>
                <p className="text-neutral-500 text-sm mt-1">Add items to get started</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="glass rounded-2xl p-3 flex items-center gap-3">
                      <span className="text-2xl">{item.image}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-neutral-400 text-xs">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Cart Total */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="text-white">
                    ${cart.reduce((sum, item) => sum + parseFloat(item.price.replace('$', '')), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-neutral-400">Tax</span>
                  <span className="text-white">
                    ${(cart.reduce((sum, item) => sum + parseFloat(item.price.replace('$', '')), 0) * 0.1).toFixed(2)}
                  </span>
                </div>
                <div className="glass-vibrant rounded-2xl p-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Total</span>
                    <span className="text-2xl font-semibold text-white">
                      ${(cart.reduce((sum, item) => sum + parseFloat(item.price.replace('$', '')), 0) * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl py-4 text-white font-semibold hover:opacity-90 transition-opacity">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
