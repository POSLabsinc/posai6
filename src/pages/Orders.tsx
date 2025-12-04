import { useState } from "react";
import { Plus, Receipt, ArrowRightLeft, X, FileText, ChevronDown } from "lucide-react";
import clearIcon from "@/assets/icons/clear.png";
import saveIcon from "@/assets/icons/save.png";
import fireIcon from "@/assets/icons/fire.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import burgerCloseIcon from "@/assets/icons/burger-close.png";
import burgerOpenIcon from "@/assets/icons/burger-open.png";
import gridViewIcon from "@/assets/icons/grid-view.png";
import scrollViewIcon from "@/assets/icons/scroll-view.png";

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
  // BAR MENU categories
  "Food": ["Appetizers", "Mains", "Sides", "Salads", "Soups", "Sandwiches", "Burgers", "Wraps", "Tacos", "Platters", "Kids Menu", "Specials"],
  "Desserts": ["Cakes", "Ice Cream", "Pies", "Cookies", "Brownies", "Cheesecake", "Puddings", "Tarts", "Mousse", "Tiramisu", "Churros", "Sundaes"],
  "Drinks": ["Iced Tea", "Soda", "Lemonade", "Sparkling", "Coffee", "Juice", "Smoothies", "Milkshakes", "Hot Chocolate", "Tea", "Energy", "Water"],
  "Beer": ["Lager", "IPA", "Stout", "Pilsner", "Wheat", "Ale", "Porter", "Amber", "Pale Ale", "Draft", "Imported", "Craft"],
  "Wine": ["Red", "White", "Rosé", "Sparkling", "Champagne", "Merlot", "Cabernet", "Pinot", "Chardonnay", "Riesling", "Moscato", "House"],
  "Cocktails": ["Margarita", "Mojito", "Martini", "Cosmopolitan", "Old Fashioned", "Daiquiri", "Negroni", "Manhattan", "Sangria", "Piña Colada", "Mai Tai", "Bellini"],
  "Spirits": ["Whiskey", "Vodka", "Rum", "Tequila", "Gin", "Brandy", "Bourbon", "Scotch", "Cognac", "Mezcal", "Sake", "Absinthe"],
  "Mocktails": ["Virgin Mojito", "Shirley Temple", "Virgin Colada", "Fruit Punch", "Lemon Fizz", "Berry Blast", "Ginger Ale", "Arnold Palmer", "Virgin Mary", "Sunrise", "Sunset", "Cooler"],
  // BAKERY MENU categories
  "Breads": ["Sourdough", "Whole Wheat", "Rye", "French", "Italian", "Ciabatta", "Focaccia", "Brioche", "Multigrain", "White", "Pumpernickel", "Challah"],
  "Pastries": ["Croissant", "Danish", "Éclair", "Palmier", "Strudel", "Napoleon", "Turnover", "Pain au Chocolat", "Kouign-Amann", "Bear Claw", "Cannoli", "Sfogliatella"],
  "Cakes": ["Chocolate", "Vanilla", "Red Velvet", "Carrot", "Lemon", "Strawberry", "Coffee", "Cheesecake", "Pound", "Angel Food", "Black Forest", "Opera"],
  "Cookies": ["Chocolate Chip", "Oatmeal", "Sugar", "Peanut Butter", "Snickerdoodle", "Macaron", "Shortbread", "Ginger", "Biscotti", "Fortune", "Linzer", "Thumbprint"],
  "Croissants": ["Plain", "Almond", "Chocolate", "Ham & Cheese", "Spinach", "Apple", "Berry", "Cream", "Nutella", "Cinnamon", "Savory", "Mini"],
  "Muffins": ["Blueberry", "Banana Nut", "Chocolate Chip", "Lemon Poppy", "Bran", "Corn", "Apple Cinnamon", "Cranberry", "Pumpkin", "Carrot", "Double Chocolate", "Streusel"],
  "Donuts": ["Glazed", "Chocolate", "Boston Cream", "Jelly", "Maple", "Sprinkles", "Old Fashioned", "Cruller", "Apple Fritter", "Cinnamon", "Powdered", "Bavarian"],
  "Pies": ["Apple", "Cherry", "Pumpkin", "Pecan", "Key Lime", "Blueberry", "Lemon Meringue", "Banana Cream", "Coconut", "Peach", "Mixed Berry", "Chess"],
  "Tarts": ["Fruit", "Custard", "Chocolate", "Lemon", "Berry", "Almond", "Caramel", "Pear", "Fig", "Apple", "Raspberry", "Passion Fruit"],
  "Scones": ["Plain", "Blueberry", "Cranberry Orange", "Chocolate Chip", "Cinnamon", "Lemon", "Maple", "Pumpkin", "Lavender", "Earl Grey", "Cheese", "Ham"],
  "Bagels": ["Plain", "Everything", "Sesame", "Poppy", "Onion", "Cinnamon Raisin", "Blueberry", "Whole Wheat", "Garlic", "Asiago", "Salt", "Jalapeño"],
  "Danish": ["Cheese", "Cherry", "Apple", "Raspberry", "Almond", "Lemon", "Apricot", "Blueberry", "Pecan", "Cream Cheese", "Cinnamon", "Bear Claw"],
  "Baguettes": ["Traditional", "Whole Grain", "Seeded", "Sourdough", "Olive", "Herb", "Garlic", "Cheese", "Tomato", "Rosemary", "Sesame", "Multigrain"],
  "Rolls": ["Dinner", "Kaiser", "Brioche", "Ciabatta", "Pretzel", "Potato", "Hawaiian", "Sourdough", "Whole Wheat", "Slider", "Hoagie", "Knot"],
  // Other common categories
  "Appetizers": ["Wings", "Nachos", "Sliders", "Dips", "Fries", "Rings", "Poppers", "Quesadillas", "Bruschetta", "Calamari", "Shrimp", "Meatballs"],
  "Starters": ["Soup", "Salad", "Bruschetta", "Carpaccio", "Tartare", "Oysters", "Shrimp Cocktail", "Ceviche", "Antipasto", "Charcuterie", "Pâté", "Terrine"],
  "Mains": ["Steak", "Chicken", "Fish", "Pasta", "Risotto", "Lamb", "Pork", "Duck", "Veal", "Lobster", "Salmon", "Prime Rib"],
  "Sides": ["Fries", "Rice", "Vegetables", "Mashed Potatoes", "Coleslaw", "Mac & Cheese", "Beans", "Corn", "Asparagus", "Brussels Sprouts", "Salad", "Bread"],
  "Specials": ["Chef's Choice", "Daily Special", "Seasonal", "Prix Fixe", "Tasting Menu", "Holiday", "Weekend", "Happy Hour", "Early Bird", "Late Night", "Brunch", "Lunch"],
  "Platters": ["Seafood", "Meat", "Cheese", "Veggie", "Fruit", "Dessert", "Appetizer", "Mixed Grill", "Party", "Family", "Sharing", "Combo"],
  "Combos": ["Lunch Special", "Dinner Deal", "Family Pack", "Party Pack", "Value Meal", "Combo 1", "Combo 2", "Combo 3", "Kids Combo", "Senior Combo", "Date Night", "Group"],
  // BRUNCH categories
  "Eggs": ["Scrambled", "Fried", "Poached", "Benedict", "Florentine", "Huevos Rancheros", "Shakshuka", "Soft Boiled", "Hard Boiled", "Baked", "Deviled", "Sunny Side"],
  "Pancakes": ["Buttermilk", "Blueberry", "Chocolate Chip", "Banana", "Strawberry", "Red Velvet", "Pumpkin", "Lemon Ricotta", "Whole Wheat", "Protein", "Silver Dollar", "Dutch Baby"],
  "Waffles": ["Belgian", "Classic", "Chocolate", "Strawberry", "Banana", "Chicken &", "Liège", "Pumpkin", "Red Velvet", "Cinnamon", "Pecan", "Maple"],
  "Omelettes": ["Western", "Cheese", "Veggie", "Mushroom", "Ham", "Spinach", "Greek", "Denver", "French", "Spanish", "Italian", "Florentine"],
  "Juice": ["Orange", "Apple", "Grapefruit", "Cranberry", "Pineapple", "Tomato", "Carrot", "Beet", "Green", "Mixed Berry", "Watermelon", "Fresh Squeezed"],
  "Coffee": ["Espresso", "Americano", "Latte", "Cappuccino", "Mocha", "Macchiato", "Cold Brew", "Iced Coffee", "Drip", "French Press", "Pour Over", "Cortado"],
  "Mimosas": ["Classic", "Bellini", "Strawberry", "Mango", "Grapefruit", "Pineapple", "Pomegranate", "Kir Royale", "Blood Orange", "Peach", "Elderflower", "Lavender"],
  "Bacon": ["Crispy", "Chewy", "Thick Cut", "Maple", "Peppered", "Applewood", "Turkey", "Canadian", "Pancetta", "Guanciale", "Smoked", "Candied"],
  "Sausage": ["Pork", "Chicken", "Turkey", "Italian", "Breakfast", "Chorizo", "Andouille", "Bratwurst", "Kielbasa", "Merguez", "Bangers", "Veggie"],
  "Toast": ["White", "Wheat", "Sourdough", "Rye", "French", "Texas", "Avocado", "Cinnamon", "Brioche", "Multigrain", "Gluten Free", "English Muffin"],
  "Fruits": ["Berries", "Tropical", "Melon", "Citrus", "Seasonal", "Fresh Cut", "Fruit Salad", "Compote", "Grilled", "Dried", "Poached", "Macerated"],
  "Yogurt": ["Greek", "Regular", "Coconut", "Almond", "Parfait", "Honey", "Vanilla", "Berry", "Tropical", "Granola", "Chia", "Overnight"],
  "Granola": ["Classic", "Honey Almond", "Chocolate", "Berry", "Coconut", "Maple Pecan", "Pumpkin", "Apple Cinnamon", "Tropical", "Protein", "Paleo", "Keto"],
  // DINER categories
  "Soups": ["Tomato", "Chicken Noodle", "French Onion", "Clam Chowder", "Minestrone", "Lobster Bisque", "Gazpacho", "Butternut", "Mushroom", "Vegetable", "Lentil", "Daily"],
  "Salads": ["Caesar", "Garden", "Greek", "Cobb", "Wedge", "Caprese", "Nicoise", "Spinach", "Arugula", "Kale", "House", "Chef"],
  "Entrees": ["Steak", "Chicken", "Fish", "Pasta", "Risotto", "Lamb", "Pork", "Duck", "Veal", "Seafood", "Vegetarian", "Chef's Special"],
  "Steaks": ["Filet Mignon", "Ribeye", "NY Strip", "T-Bone", "Porterhouse", "Sirloin", "Prime Rib", "Flank", "Hanger", "Flat Iron", "Wagyu", "Tomahawk"],
  "Seafood": ["Salmon", "Lobster", "Shrimp", "Scallops", "Crab", "Oysters", "Tuna", "Halibut", "Mahi Mahi", "Sea Bass", "Cod", "Branzino"],
  "Pasta": ["Spaghetti", "Penne", "Fettuccine", "Rigatoni", "Linguine", "Ravioli", "Lasagna", "Gnocchi", "Carbonara", "Bolognese", "Alfredo", "Primavera"],
  "Risotto": ["Mushroom", "Seafood", "Saffron", "Truffle", "Asparagus", "Pumpkin", "Lobster", "Parmesan", "Lemon", "Pea", "Tomato", "Wild"],
  "Duck": ["Roasted", "Confit", "Breast", "Leg", "Orange", "Peking", "Smoked", "Crispy", "Braised", "Grilled", "Pan Seared", "Magret"],
  "Lamb": ["Rack", "Chops", "Leg", "Shank", "Loin", "Shoulder", "Ground", "Braised", "Grilled", "Roasted", "Moroccan", "Greek"],
  "Veal": ["Milanese", "Piccata", "Scallopini", "Osso Buco", "Chop", "Medallion", "Cutlet", "Roast", "Braised", "Grilled", "Parmigiana", "Marsala"],
  "Lobster": ["Tail", "Whole", "Thermidor", "Bisque", "Roll", "Ravioli", "Risotto", "Grilled", "Steamed", "Butter Poached", "Newburg", "Fra Diavolo"],
  "Caviar": ["Beluga", "Osetra", "Sevruga", "American", "Salmon Roe", "Trout Roe", "Paddlefish", "Hackleback", "White Sturgeon", "Kaluga", "Siberian", "Imperial"],
  // HAPPY HOUR categories
  "Wings": ["Buffalo", "BBQ", "Honey Garlic", "Teriyaki", "Lemon Pepper", "Garlic Parmesan", "Spicy", "Sweet Chili", "Mango Habanero", "Korean", "Nashville Hot", "Jerk"],
  "Sliders": ["Beef", "Chicken", "Pork", "Fish", "Veggie", "Pulled Pork", "BBQ", "Buffalo", "Philly", "Hawaiian", "Mushroom", "Bacon"],
  "Nachos": ["Classic", "Supreme", "Chicken", "Beef", "Veggie", "BBQ", "Buffalo", "Loaded", "Carnitas", "Shrimp", "Pulled Pork", "Brisket"],
  "Shots": ["Tequila", "Vodka", "Whiskey", "Rum", "Jäger", "Fireball", "Kamikaze", "Lemon Drop", "B-52", "Irish Car Bomb", "Buttery Nipple", "Washington Apple"],
  "Tacos": ["Beef", "Chicken", "Fish", "Shrimp", "Carnitas", "Barbacoa", "Al Pastor", "Chorizo", "Veggie", "Birria", "Street", "Baja"],
  "Quesadillas": ["Cheese", "Chicken", "Beef", "Shrimp", "Veggie", "Steak", "Mushroom", "Spinach", "BBQ", "Buffalo", "Philly", "Fajita"],
  "Dips": ["Guacamole", "Queso", "Salsa", "Spinach Artichoke", "Buffalo Chicken", "Hummus", "French Onion", "Crab", "Seven Layer", "Beer Cheese", "Ranch", "Blue Cheese"],
  "Fries": ["Classic", "Curly", "Waffle", "Sweet Potato", "Truffle", "Loaded", "Cheese", "Chili", "Garlic", "Cajun", "Poutine", "Animal Style"],
  "Pretzels": ["Soft", "Bites", "Sticks", "Stuffed", "Cinnamon Sugar", "Garlic", "Jalapeño", "Cheese Filled", "Everything", "Salt", "Beer Cheese", "Mustard"],
  "Poppers": ["Jalapeño", "Cream Cheese", "Bacon Wrapped", "Cheddar", "Buffalo", "Pizza", "Loaded", "Stuffed Mushroom", "Avocado", "Mac & Cheese", "Pickle", "Onion"],
  // HOLIDAY categories
  "Turkey": ["Roasted", "Smoked", "Fried", "Breast", "Leg", "Sliced", "Carved", "Herb", "Butter Basted", "Cajun", "Maple Glazed", "Traditional"],
  "Ham": ["Honey Glazed", "Smoked", "Spiral", "Country", "Black Forest", "Virginia", "Bone-In", "Sliced", "Brown Sugar", "Pineapple", "Maple", "Bourbon"],
  "Roasts": ["Prime Rib", "Beef Tenderloin", "Pork Loin", "Leg of Lamb", "Crown Roast", "Standing Rib", "Chuck", "Brisket", "Pot Roast", "Wellington", "Rack of Lamb", "Porchetta"],
  "Stuffing": ["Traditional", "Cornbread", "Sausage", "Oyster", "Wild Rice", "Apple", "Chestnut", "Herb", "Mushroom", "Sourdough", "Cranberry", "Pecan"],
  "Gravies": ["Turkey", "Brown", "White", "Mushroom", "Giblet", "Pan", "Red Eye", "Onion", "Sausage", "Herb", "Wine", "Cream"],
  // Whiskey, Vodka, Rum, Tequila, Gin, Brandy subcategories
  "Whiskey": ["Bourbon", "Scotch", "Irish", "Rye", "Tennessee", "Canadian", "Japanese", "Single Malt", "Blended", "Cask Strength", "Small Batch", "Reserve"],
  "Vodka": ["Plain", "Citrus", "Berry", "Vanilla", "Pepper", "Cucumber", "Grape", "Potato", "Wheat", "Corn", "Premium", "Flavored"],
  "Rum": ["White", "Dark", "Spiced", "Aged", "Coconut", "Banana", "Pineapple", "Overproof", "Gold", "Navy", "Añejo", "Premium"],
  "Tequila": ["Blanco", "Reposado", "Añejo", "Extra Añejo", "Gold", "Silver", "Mezcal", "Cristalino", "Joven", "Premium", "Ultra Premium", "Organic"],
  "Gin": ["London Dry", "Old Tom", "Plymouth", "Navy Strength", "Sloe", "Barrel Aged", "Flavored", "Contemporary", "Classic", "Botanical", "Pink", "Premium"],
  "Brandy": ["Cognac", "Armagnac", "Calvados", "Pisco", "Grappa", "VS", "VSOP", "XO", "Napoleon", "Fruit", "Spanish", "American"],
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
  { id: 13, name: "Mozzarella Sticks" },
  { id: 14, name: "Chicken Wings" },
  { id: 15, name: "Nacho Supreme" },
  { id: 16, name: "Garlic Bread" },
  { id: 17, name: "Caesar Salad" },
  { id: 18, name: "Greek Salad" },
  { id: 19, name: "Tomato Basil Soup" },
  { id: 20, name: "French Onion Soup" },
  { id: 21, name: "Ribeye Steak" },
  { id: 22, name: "Filet Mignon" },
  { id: 23, name: "Grilled Salmon" },
  { id: 24, name: "Shrimp Scampi" },
  { id: 25, name: "Lobster Tail" },
  { id: 26, name: "Lamb Chops" },
  { id: 27, name: "BBQ Ribs" },
  { id: 28, name: "Pork Tenderloin" },
  { id: 29, name: "Duck Breast" },
  { id: 30, name: "Beef Wellington" },
  { id: 31, name: "Mushroom Risotto" },
  { id: 32, name: "Truffle Pasta" },
  { id: 33, name: "Spaghetti Carbonara" },
  { id: 34, name: "Lasagna Bolognese" },
  { id: 35, name: "Chicken Marsala" },
  { id: 36, name: "Eggplant Parmesan" },
  { id: 37, name: "Seafood Platter" },
  { id: 38, name: "Fish & Chips" },
  { id: 39, name: "Crab Cakes" },
  { id: 40, name: "Oysters Rockefeller" },
  { id: 41, name: "Tiramisu" },
  { id: 42, name: "Chocolate Lava Cake" },
  { id: 43, name: "Cheesecake" },
  { id: 44, name: "Crème Brûlée" },
  { id: 45, name: "Apple Pie" },
];

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
}

const initialOrderItems: OrderItem[] = [];

const orderTypes = ["DINE IN", "TAKE OUT", "DELIVERY", "BANQUET", "DRIVE THRU", "CURB SIDE", "SCHEDULED", "PHONE-IN", "CUSTOM"];

const Orders = () => {
  const [activeCategory, setActiveCategory] = useState("Food");
  const [activeSubcategory, setActiveSubcategory] = useState("Lemonade");
  const [activeFoodCategory, setActiveFoodCategory] = useState("Appetizer");
  const [selectedMenu, setSelectedMenu] = useState("BAR MENU");
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [horizontalScrollMode, setHorizontalScrollMode] = useState(false);
  const [orderType, setOrderType] = useState("DINE IN");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const addToCart = (item: { id: number; name: string }) => {
    setOrderItems(prev => {
      const existing = prev.find(o => o.name === item.name);
      if (existing) {
        return prev.map(o => o.name === item.name ? { ...o, qty: o.qty + 1 } : o);
      }
      return [...prev, { id: Date.now(), qty: 1, name: item.name, price: 15.00 }];
    });
  };

  const handleMenuSelect = (value: string) => {
    setSelectedMenu(value);
    setIsMenuSelectOpen(false);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = 0.00;
  const serviceCharge = 0.00;
  const taxRate = 0.02;
  const tax = subtotal * taxRate;
  const total = subtotal - discount + serviceCharge + tax;

  return (
    <div className="flex gap-3 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden bg-neutral-900 rounded-lg p-3">
        {/* Main Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Menu Controls Group */}
          {isMenuSelectOpen ? (
            <div className="flex items-center gap-2 bg-sidebar-accent rounded-full px-2 py-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 p-0"
                onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}
              >
                <img src={burgerCloseIcon} alt="Close menu" className="w-7 h-7" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
                onClick={() => setHorizontalScrollMode(!horizontalScrollMode)}
                title={horizontalScrollMode ? "Show all subcategories" : "Enable horizontal scroll"}
              >
                {horizontalScrollMode ? (
                  <img src={gridViewIcon} alt="Grid view" className="w-7 h-7" />
                ) : (
                  <img src={scrollViewIcon} alt="Scroll view" className="w-7 h-7" />
                )}
              </Button>
              <Select value={selectedMenu} onValueChange={handleMenuSelect}>
                <SelectTrigger className="w-[160px] rounded-full border-sidebar-border bg-background text-foreground h-10">
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
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 p-0"
              onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}
            >
              <img src={burgerOpenIcon} alt="Open menu" className="w-10 h-10" />
            </Button>
          )}
          {/* Categories */}
          {menuCategories[selectedMenu].map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={`rounded-full px-8 h-10 text-sm whitespace-nowrap border ${
                activeCategory === cat 
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                  : "bg-header text-header-foreground border-white/50 hover:bg-header/80"
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="h-px bg-sidebar-border" />

        {/* Subcategories based on selected category */}
        <div className={`overflow-x-auto scrollbar-hide ${horizontalScrollMode ? '' : 'max-h-[8.5rem]'}`}>
          <div className={`flex gap-2 ${horizontalScrollMode ? 'flex-row flex-nowrap' : 'flex-row flex-wrap'}`}>
            {(categorySubcategories[activeCategory] || []).map((sub) => (
              <Button
                key={sub}
                variant="outline"
                className={`rounded-full px-8 h-10 text-sm whitespace-nowrap border ${
                  activeSubcategory === sub 
                    ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-500" 
                    : "bg-header text-header-foreground border-white/50 hover:bg-header/80"
                }`}
                onClick={() => setActiveSubcategory(sub)}
              >
                {sub}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-px bg-sidebar-border" />

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
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
        {/* Order Header */}
        <div className="p-2 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 gap-2">
            <div className="flex items-center gap-2 flex-shrink min-w-0">
              <input 
                type="text" 
                value={guestName} 
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="GUEST NAME"
                className="bg-transparent border-b border-sidebar-border focus:border-orange-500 outline-none text-foreground placeholder:text-muted-foreground w-20 min-w-0"
              />
              <div className="flex items-center gap-1">
                <span>📞</span>
                <input 
                  type="tel" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={guestPhone} 
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXX-XXX-XXXX"
                  className="bg-transparent border-b border-sidebar-border focus:border-orange-500 outline-none text-foreground placeholder:text-muted-foreground w-24 min-w-0"
                />
              </div>
            </div>
            <span className="whitespace-nowrap flex-shrink-0">🕐 10:20 PM</span>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide mb-2">
            <div className="flex items-center gap-2 w-max">
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">%</span> Discount
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground" /> Transfer
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <X className="w-3 h-3 text-muted-foreground" /> No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">$</span> Cash Register
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <Receipt className="w-3 h-3 text-muted-foreground" /> Receipt
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded transition-colors">
                    {orderType} <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px]">
                  {orderTypes.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => setOrderType(type)}
                      className="text-white hover:bg-neutral-700 cursor-pointer"
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="bg-sidebar-accent px-2 py-0.5 rounded text-base font-bold">20</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>👤</span>
              <span>MIA JONE</span>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        <div className="px-2 py-1 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>Order notes</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="py-1 space-y-1">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="bg-sidebar-accent rounded-lg p-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">
                        {item.qty}
                      </span>
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    {item.modifiers && (
                      <div className="mt-0.5 ml-6 text-[10px] text-muted-foreground space-y-0">
                        {item.modifiers.map((mod, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span>{mod.startsWith("W/") ? "+" : "-"}</span>
                            <span>{mod}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium">$ {item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground">Sub Total</span>
              <span className="text-foreground">$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">Discount</span>
              <span className="text-red-500">$ {discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Service Charge</span>
              <span className="text-foreground">$ {serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Tax</span>
              <span className="text-foreground">$ {tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-sidebar-border my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-2 flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 border-red-600"
          >
            <img src={clearIcon} alt="Clear" className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-lg border-sidebar-border bg-sidebar"
          >
            <img src={saveIcon} alt="Save" className="w-5 h-5" />
          </Button>
          <Button
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold text-sm gap-1.5"
          >
            <img src={fireIcon} alt="Fire" className="w-4 h-4" /> FIRE
          </Button>
          <Button
            className="flex-1 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-600"
          >
            CHARGE $ {total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Orders;
