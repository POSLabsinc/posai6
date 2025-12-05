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
import listViewIcon from "@/assets/icons/list-view.png";
import thumbnailViewIcon from "@/assets/icons/thumbnail-view.png";
import emptyOrderIcon from "@/assets/icons/empty-order.png";
import horizontalScrollIcon from "@/assets/icons/horizontal-scroll.png";
import verticalScrollIcon from "@/assets/icons/vertical-scroll.png";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import grabberIcon from "@/assets/icons/grabber.png";

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

const foodImages = [
  salmonImg, macCheeseImg, ravioliImg, turkeyImg, gnocchiImg,
  asparagusImg, chickenBreastImg, paniniImg, fettucciniImg, chickenParmesanImg,
  steakImg, ribsImg, shrimpImg, soupImg, saladImg,
  pizzaImg, burgerImg, seafoodImg, pastaImg, pancakesImg
];

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

// Category border colors based on reference design
const categoryBorderColors: Record<string, string> = {
  // BAR MENU
  "Food": "border-pink-500",
  "Desserts": "border-yellow-400",
  "Drinks": "border-green-500",
  "Beer": "border-amber-600",
  "Wine": "border-purple-500",
  "Cocktails": "border-cyan-400",
  "Spirits": "border-orange-500",
  "Mocktails": "border-lime-400",
  "Whiskey": "border-amber-700",
  "Vodka": "border-sky-400",
  "Rum": "border-rose-500",
  "Tequila": "border-emerald-500",
  "Gin": "border-blue-400",
  "Brandy": "border-amber-500",
  // BAKERY MENU
  "Breads": "border-yellow-600",
  "Pastries": "border-pink-400",
  "Cakes": "border-fuchsia-500",
  "Cookies": "border-amber-400",
  "Croissants": "border-orange-400",
  "Muffins": "border-violet-400",
  "Donuts": "border-pink-300",
  "Pies": "border-red-400",
  "Tarts": "border-rose-400",
  "Scones": "border-stone-400",
  "Bagels": "border-yellow-500",
  "Danish": "border-orange-400",
  "Baguettes": "border-amber-300",
  "Rolls": "border-orange-300",
  // HAPPY HOUR
  "Appetizers": "border-purple-400",
  "Wings": "border-red-500",
  "Sliders": "border-orange-600",
  "Nachos": "border-yellow-500",
  "Shots": "border-red-600",
  "Tacos": "border-green-400",
  "Quesadillas": "border-yellow-400",
  "Dips": "border-teal-400",
  "Fries": "border-amber-500",
  "Pretzels": "border-yellow-700",
  "Poppers": "border-lime-500",
  // Holiday Menu
  "Starters": "border-cyan-500",
  "Mains": "border-indigo-500",
  "Sides": "border-teal-500",
  "Specials": "border-fuchsia-500",
  "Platters": "border-violet-500",
  "Combos": "border-blue-500",
  "Turkey": "border-orange-500",
  "Ham": "border-pink-500",
  "Roasts": "border-red-500",
  "Stuffing": "border-yellow-600",
  "Gravies": "border-amber-600",
  // LE BRUNCH MENU
  "Eggs": "border-yellow-300",
  "Pancakes": "border-amber-400",
  "Waffles": "border-yellow-500",
  "Omelettes": "border-yellow-400",
  "Juice": "border-orange-400",
  "Coffee": "border-amber-700",
  "Mimosas": "border-yellow-300",
  "Bacon": "border-red-400",
  "Sausage": "border-rose-600",
  "Toast": "border-amber-300",
  "Fruits": "border-green-400",
  "Yogurt": "border-pink-200",
  "Granola": "border-amber-500",
  // LE DINER MENU
  "Soups": "border-orange-300",
  "Salads": "border-lime-500",
  "Entrees": "border-indigo-500",
  "Steaks": "border-red-600",
  "Seafood": "border-blue-400",
  "Pasta": "border-yellow-500",
  "Risotto": "border-amber-200",
  "Duck": "border-orange-600",
  "Lamb": "border-rose-500",
  "Veal": "border-pink-400",
  "Lobster": "border-red-500",
  "Caviar": "border-slate-500",
};

// Category background colors for active state (matching border colors)
const categoryBgColors: Record<string, string> = {
  // BAR MENU
  "Food": "bg-pink-500",
  "Desserts": "bg-yellow-400",
  "Drinks": "bg-green-500",
  "Beer": "bg-amber-600",
  "Wine": "bg-purple-500",
  "Cocktails": "bg-cyan-400",
  "Spirits": "bg-orange-500",
  "Mocktails": "bg-lime-400",
  "Whiskey": "bg-amber-700",
  "Vodka": "bg-sky-400",
  "Rum": "bg-rose-500",
  "Tequila": "bg-emerald-500",
  "Gin": "bg-blue-400",
  "Brandy": "bg-amber-500",
  // BAKERY MENU
  "Breads": "bg-yellow-600",
  "Pastries": "bg-pink-400",
  "Cakes": "bg-fuchsia-500",
  "Cookies": "bg-amber-400",
  "Croissants": "bg-orange-400",
  "Muffins": "bg-violet-400",
  "Donuts": "bg-pink-300",
  "Pies": "bg-red-400",
  "Tarts": "bg-rose-400",
  "Scones": "bg-stone-400",
  "Bagels": "bg-yellow-500",
  "Danish": "bg-orange-400",
  "Baguettes": "bg-amber-300",
  "Rolls": "bg-orange-300",
  // HAPPY HOUR
  "Appetizers": "bg-purple-400",
  "Wings": "bg-red-500",
  "Sliders": "bg-orange-600",
  "Nachos": "bg-yellow-500",
  "Shots": "bg-red-600",
  "Tacos": "bg-green-400",
  "Quesadillas": "bg-yellow-400",
  "Dips": "bg-teal-400",
  "Fries": "bg-amber-500",
  "Pretzels": "bg-yellow-700",
  "Poppers": "bg-lime-500",
  // Holiday Menu
  "Starters": "bg-cyan-500",
  "Mains": "bg-indigo-500",
  "Sides": "bg-teal-500",
  "Specials": "bg-fuchsia-500",
  "Platters": "bg-violet-500",
  "Combos": "bg-blue-500",
  "Turkey": "bg-orange-500",
  "Ham": "bg-pink-500",
  "Roasts": "bg-red-500",
  "Stuffing": "bg-yellow-600",
  "Gravies": "bg-amber-600",
  // LE BRUNCH MENU
  "Eggs": "bg-yellow-300",
  "Pancakes": "bg-amber-400",
  "Waffles": "bg-yellow-500",
  "Omelettes": "bg-yellow-400",
  "Juice": "bg-orange-400",
  "Coffee": "bg-amber-700",
  "Mimosas": "bg-yellow-300",
  "Bacon": "bg-red-400",
  "Sausage": "bg-rose-600",
  "Toast": "bg-amber-300",
  "Fruits": "bg-green-400",
  "Yogurt": "bg-pink-200",
  "Granola": "bg-amber-500",
  // LE DINER MENU
  "Soups": "bg-orange-300",
  "Salads": "bg-lime-500",
  "Entrees": "bg-indigo-500",
  "Steaks": "bg-red-600",
  "Seafood": "bg-blue-400",
  "Pasta": "bg-yellow-500",
  "Risotto": "bg-amber-200",
  "Duck": "bg-orange-600",
  "Lamb": "bg-rose-500",
  "Veal": "bg-pink-400",
  "Lobster": "bg-red-500",
  "Caviar": "bg-slate-500",
};

// Category text colors for selected subcategory (matching border colors)
const categoryTextColors: Record<string, string> = {
  // BAR MENU
  "Food": "text-pink-500",
  "Desserts": "text-yellow-400",
  "Drinks": "text-green-500",
  "Beer": "text-amber-600",
  "Wine": "text-purple-500",
  "Cocktails": "text-cyan-400",
  "Spirits": "text-orange-500",
  "Mocktails": "text-lime-400",
  "Whiskey": "text-amber-700",
  "Vodka": "text-sky-400",
  "Rum": "text-rose-500",
  "Tequila": "text-emerald-500",
  "Gin": "text-blue-400",
  "Brandy": "text-amber-500",
  // BAKERY MENU
  "Breads": "text-yellow-600",
  "Pastries": "text-pink-400",
  "Cakes": "text-fuchsia-500",
  "Cookies": "text-amber-400",
  "Croissants": "text-orange-400",
  "Muffins": "text-violet-400",
  "Donuts": "text-pink-300",
  "Pies": "text-red-400",
  "Tarts": "text-rose-400",
  "Scones": "text-stone-400",
  "Bagels": "text-yellow-500",
  "Danish": "text-orange-400",
  "Baguettes": "text-amber-300",
  "Rolls": "text-orange-300",
  // HAPPY HOUR
  "Appetizers": "text-purple-400",
  "Wings": "text-red-500",
  "Sliders": "text-orange-600",
  "Nachos": "text-yellow-500",
  "Shots": "text-red-600",
  "Tacos": "text-green-400",
  "Quesadillas": "text-yellow-400",
  "Dips": "text-teal-400",
  "Fries": "text-amber-500",
  "Pretzels": "text-yellow-700",
  "Poppers": "text-lime-500",
  // Holiday Menu
  "Starters": "text-cyan-500",
  "Mains": "text-indigo-500",
  "Sides": "text-teal-500",
  "Specials": "text-fuchsia-500",
  "Platters": "text-violet-500",
  "Combos": "text-blue-500",
  "Turkey": "text-orange-500",
  "Ham": "text-pink-500",
  "Roasts": "text-red-500",
  "Stuffing": "text-yellow-600",
  "Gravies": "text-amber-600",
  // LE BRUNCH MENU
  "Eggs": "text-yellow-300",
  "Pancakes": "text-amber-400",
  "Waffles": "text-yellow-500",
  "Omelettes": "text-yellow-400",
  "Juice": "text-orange-400",
  "Coffee": "text-amber-700",
  "Mimosas": "text-yellow-300",
  "Bacon": "text-red-400",
  "Sausage": "text-rose-600",
  "Toast": "text-amber-300",
  "Fruits": "text-green-400",
  "Yogurt": "text-pink-200",
  "Granola": "text-amber-500",
  // LE DINER MENU
  "Soups": "text-orange-300",
  "Salads": "text-lime-500",
  "Entrees": "text-indigo-500",
  "Steaks": "text-red-600",
  "Seafood": "text-blue-400",
  "Pasta": "text-yellow-500",
  "Risotto": "text-amber-200",
  "Duck": "text-orange-600",
  "Lamb": "text-rose-500",
  "Veal": "text-pink-400",
  "Lobster": "text-red-500",
  "Caviar": "text-slate-500",
};

const getCategoryBorderColor = (category: string) => {
  return categoryBorderColors[category] || "border-white/50";
};

const getCategoryBgColor = (category: string) => {
  return categoryBgColors[category] || "bg-orange-500";
};

const getCategoryHoverBgColor = (category: string) => {
  const bgColor = categoryBgColors[category] || "bg-orange-500";
  return bgColor.replace("bg-", "hover:bg-");
};

const getCategoryTextColor = (category: string) => {
  return categoryTextColors[category] || "text-orange-500";
};

const getCategoryHoverTextColor = (category: string) => {
  const textColor = categoryTextColors[category] || "text-orange-500";
  return textColor.replace("text-", "hover:text-");
};

const Orders = () => {
  const [activeCategory, setActiveCategory] = useState("Food");
  const [activeSubcategory, setActiveSubcategory] = useState("Lemonade");
  const [activeFoodCategory, setActiveFoodCategory] = useState("Appetizer");
  const [selectedMenu, setSelectedMenu] = useState("BAR MENU");
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [horizontalScrollMode, setHorizontalScrollMode] = useState(false);
  const [thumbnailViewMode, setThumbnailViewMode] = useState(false);
  const [orderType, setOrderType] = useState("DINE IN");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isOrderPanelExpanded, setIsOrderPanelExpanded] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'minimized' | 'center' | 'full'>('center');
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const addToCart = (item: { id: number; name: string }) => {
    setOrderItems(prev => {
      const existing = prev.find(o => o.name === item.name);
      if (existing) {
        return prev.map(o => o.name === item.name ? { ...o, qty: o.qty + 1 } : o);
      }
      return [...prev, { id: Date.now(), qty: 1, name: item.name, price: 15.00 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
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
    <div className="flex flex-col md:flex-row gap-3 h-full overflow-hidden pb-16 md:pb-0">
      {/* Right Panel - Order (Shows first on mobile) */}
      <div className="md:hidden flex flex-col overflow-hidden flex-shrink-0">
        {/* Order Header - Outside background container */}
        <div className="p-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 gap-2">
            <input 
              type="text" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="GUEST NAME"
              className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-24 min-w-0 font-medium"
            />
            <div className="flex items-center gap-1">
              <span>📞</span>
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={guestPhone} 
                onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="(XXX) XXX-XXXX"
                className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-28 min-w-0 text-center"
              />
            </div>
            <span className="whitespace-nowrap flex-shrink-0">🕐 12:30 PM</span>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide mb-2">
            <div className="flex items-center gap-2 w-max">
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">%</span> Discount
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <X className="w-3 h-3 text-muted-foreground" /> No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">$</span> Open Register
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <Receipt className="w-3 h-3 text-muted-foreground" /> Gift Card
              </Button>
              <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-sidebar border border-sidebar-border">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Background Container for Order Content */}
        <div className="flex flex-col bg-sidebar-accent/30 rounded-lg overflow-hidden min-h-0 mx-2">
          {/* Order Type & Guest Info */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
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
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>👤</span>
              <span>Dustin H</span>
              <button className="ml-1 p-1" onClick={() => setIsOrderPanelExpanded(true)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Empty Order State */}
          <div className="flex flex-col items-center justify-center py-6">
            {orderItems.length === 0 ? (
              <>
                <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                <span className="text-muted-foreground text-sm">Let's create an order</span>
              </>
            ) : (
              <ScrollArea className="w-full max-h-32 px-2">
                <div className="py-1 space-y-2">
                  {orderItems.map((item) => (
                    <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)}>
                      <div className="p-2 border border-sidebar-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                              {item.qty}
                            </span>
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">$ {item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </SwipeableCartItem>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Left Panel - Menu */}
      <div className={`md:flex-1 flex flex-col min-w-0 bg-sidebar-accent/30 border border-sidebar-border md:border-0 rounded-t-2xl md:rounded-lg transition-all duration-300 ease-out fixed md:relative bottom-16 md:bottom-auto left-2 right-2 md:left-0 md:right-0 md:left-auto md:right-auto z-10 ${
        menuPosition === 'minimized' ? 'h-12' : 
        menuPosition === 'center' ? 'h-[40%]' : 
        'h-[calc(100%-4rem)]'
      } md:h-auto md:top-auto`}>
        {/* Grabber for minimize/maximize */}
        <div 
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing select-none md:hidden"
          onTouchStart={(e) => setTouchStart(e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (touchStart !== null) {
              const touchEnd = e.changedTouches[0].clientY;
              const diff = touchStart - touchEnd;
              // Swipe up = expand to next state
              if (diff > 50) {
                setMenuPosition(prev => prev === 'minimized' ? 'center' : prev === 'center' ? 'full' : 'full');
              }
              // Swipe down = collapse to previous state
              if (diff < -50) {
                setMenuPosition(prev => prev === 'full' ? 'center' : prev === 'center' ? 'minimized' : 'minimized');
              }
              setTouchStart(null);
            }
          }}
          onClick={() => setMenuPosition(prev => prev === 'minimized' ? 'center' : prev === 'center' ? 'full' : 'minimized')}
        >
          <img src={grabberIcon} alt="Drag to resize" className="w-10 h-1.5 opacity-60 hover:opacity-100 transition-opacity" />
        </div>
        {/* Menu Content - Hidden when minimized */}
        <div className={`flex flex-col gap-2 p-2 md:p-3 transition-all duration-300 ${menuPosition === 'minimized' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100 overflow-y-auto md:overflow-hidden scrollbar-hide'}`}>
        {/* Main Categories */}
        <div className="flex flex-wrap items-center gap-1 md:gap-2">
          {/* Menu Controls Group */}
          {isMenuSelectOpen ? (
            <div className="flex items-center gap-1 md:gap-2 bg-sidebar-accent rounded-full px-1 md:px-2 py-0.5 md:py-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 md:h-10 w-6 md:w-10 p-0"
                onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}
              >
                <img src={burgerCloseIcon} alt="Close menu" className="w-4 md:w-7 h-4 md:h-7" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 md:h-10 w-6 md:w-10 p-0 bg-white hover:bg-white border border-white rounded-full"
                onClick={() => setHorizontalScrollMode(!horizontalScrollMode)}
                title={horizontalScrollMode ? "Show all subcategories" : "Enable horizontal scroll"}
              >
                {horizontalScrollMode ? (
                  <img src={verticalScrollIcon} alt="All view" className="w-3 md:w-5 h-3 md:h-5" />
                ) : (
                  <img src={horizontalScrollIcon} alt="Horizontal scroll" className="w-3 md:w-5 h-3 md:h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 md:h-10 w-6 md:w-10 p-0 bg-white hover:bg-white border border-white rounded-full"
                onClick={() => setThumbnailViewMode(!thumbnailViewMode)}
                title={thumbnailViewMode ? "Show list view" : "Show thumbnail view"}
              >
                {thumbnailViewMode ? (
                  <img src={listViewIcon} alt="List view" className="w-3 md:w-5 h-3 md:h-5" />
                ) : (
                  <img src={thumbnailViewIcon} alt="Thumbnail view" className="w-3 md:w-5 h-3 md:h-5" />
                )}
              </Button>
              <Select value={selectedMenu} onValueChange={handleMenuSelect}>
                <SelectTrigger className="w-[100px] md:w-[160px] rounded-full bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white h-6 md:h-10 text-[10px] md:text-sm">
                  <SelectValue placeholder="Select Menu" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {menuList.map((menu) => (
                    <SelectItem key={menu} value={menu} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
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
              className="h-6 md:h-10 w-6 md:w-10 p-0"
              onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}
            >
              <img src={burgerOpenIcon} alt="Open menu" className="w-6 md:w-10 h-6 md:h-10" />
            </Button>
          )}
          {/* Categories */}
          {menuCategories[selectedMenu].map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={`rounded-full px-2 md:px-8 h-6 md:h-10 text-[10px] md:text-sm whitespace-nowrap border-2 ${
                activeCategory === cat 
                  ? `${getCategoryBgColor(cat)} ${getCategoryHoverBgColor(cat)} text-white ${getCategoryBorderColor(cat)}` 
                  : `bg-header text-header-foreground ${getCategoryBorderColor(cat)} hover:bg-header/80`
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="h-px bg-sidebar-border" />

        {/* Subcategories based on selected category */}
        <div className={`overflow-x-auto scrollbar-hide ${horizontalScrollMode ? '' : 'max-h-[6rem] md:max-h-[8.5rem]'}`}>
          <div className={`flex gap-1 md:gap-2 ${horizontalScrollMode ? 'flex-row flex-nowrap' : 'flex-row flex-wrap'}`}>
            {(categorySubcategories[activeCategory] || []).map((sub) => (
              <Button
                key={sub}
                variant="outline"
                className={`rounded-full px-2 md:px-8 h-6 md:h-10 text-[10px] md:text-sm whitespace-nowrap border ${
                  activeSubcategory === sub 
                    ? `bg-header ${getCategoryTextColor(activeCategory)} ${getCategoryHoverTextColor(activeCategory)} ${getCategoryBorderColor(activeCategory)} font-semibold hover:bg-header` 
                    : `bg-header text-header-foreground ${getCategoryBorderColor(activeCategory)} hover:bg-header/80`
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
          {thumbnailViewMode ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-3">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-lg overflow-hidden cursor-pointer group border border-neutral-700"
                >
                  <div className="relative aspect-[4/3] bg-neutral-800">
                    <img 
                      src={foodImages[index % foodImages.length]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="absolute top-1 md:top-2 left-1 md:left-2 w-6 md:w-8 h-6 md:h-8 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 md:w-4 h-3 md:h-4 text-white" />
                    </button>
                  </div>
                  <div className="p-1 md:p-2 bg-neutral-900" onClick={() => addToCart(item)}>
                    <span className="text-[10px] md:text-xs font-medium text-white uppercase leading-tight line-clamp-2">
                      {item.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex items-stretch bg-sidebar-accent rounded-lg overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border"
                >
                  <span className="flex-1 text-[10px] md:text-xs font-bold leading-tight uppercase text-foreground p-1.5 md:p-3">
                    {item.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="w-6 md:w-10 bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0 flex items-center justify-center"
                  >
                    <Plus className="w-3 md:w-4 h-3 md:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Order (Desktop only) */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {/* Order Header - Outside background container */}
        <div className="p-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 gap-2">
            <input 
              type="text" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="GUEST NAME"
              className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-24 min-w-0"
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
                className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-24 min-w-0 text-center"
              />
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
        </div>

        {/* Background Container for Order Content */}
        <div className="flex-1 flex flex-col bg-sidebar-accent/30 rounded-lg overflow-hidden min-h-0">
          {/* Order Type & Guest Info */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
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

          {/* Order Notes */}
          <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2 bg-neutral-700 rounded px-3 py-2">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Order notes"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
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
              {orderItems.map((item) => (
                <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)}>
                  <div className="p-3 border border-sidebar-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {item.qty}
                        </span>
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">$ {item.price.toFixed(2)}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-2 ml-8 space-y-0.5">
                        {item.modifiers.map((mod, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
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

          {/* Action Buttons - Inside background container */}
          <div className="p-2 flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 border-red-600"
              onClick={() => setOrderItems([])}
            >
              <img src={clearIcon} alt="Clear" className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-lg border-sidebar-border bg-white/20"
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
      </div>

      {/* Expanded Order Panel - Mobile Only */}
      {isOrderPanelExpanded && (
        <div className="md:hidden fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between p-3 border-b border-neutral-700">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={guestName} 
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="GUEST NAME"
                className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-24 text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>📞</span>
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={guestPhone} 
                onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="(XXX) XXX-XXXX"
                className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-28"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>🕐 12:30 PM</span>
              <button className="p-1" onClick={() => setIsOrderPanelExpanded(false)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 14h6v6M20 10h-6V4M4 14l7-7M20 10l-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="overflow-x-auto scrollbar-hide p-2">
            <div className="flex items-center gap-2 w-max">
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">%</span> Discount
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground" /> Transfer Check
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <X className="w-3 h-3 text-muted-foreground" /> No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-full bg-sidebar border border-sidebar-border h-7 px-3 gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">$</span> Open R...
              </Button>
              <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-sidebar border border-sidebar-border">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Order Type & Table */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
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
              <span className="bg-neutral-700 px-2 py-0.5 rounded text-sm font-bold">20</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>👤</span>
              <span>Dustin H</span>
            </div>
          </div>

          {/* Order Notes */}
          <div className="px-3 py-2 border-b border-neutral-700">
            <div className="flex items-center gap-2 bg-neutral-800 rounded px-3 py-2">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Order notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Order Items */}
          <ScrollArea className="flex-1 min-h-0 px-3">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                <span className="text-muted-foreground text-sm">Let's create an order</span>
              </div>
            ) : (
              <div className="py-2 space-y-2">
                {orderItems.map((item) => (
                  <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)}>
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                            {item.qty}
                          </span>
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">$ {(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-2 ml-9 space-y-0.5">
                          {item.modifiers.map((mod, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
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

          {/* Order Summary */}
          <div className="p-3 border-t border-neutral-700 bg-neutral-900/50">
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 flex items-center gap-2 border-t border-neutral-700">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 border-red-600"
              onClick={() => setOrderItems([])}
            >
              <img src={clearIcon} alt="Clear" className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-lg border-sidebar-border bg-white/20"
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

          {/* Bottom Navigation */}
          <div className="flex items-center justify-around py-2 px-4 bg-neutral-900 border-t border-neutral-700">
            <button className="flex flex-col items-center gap-1 px-4 py-1 rounded-lg bg-neutral-800 border border-neutral-600">
              <Plus className="w-5 h-5" />
              <span className="text-xs">New Order</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-1">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span className="text-xs text-muted-foreground">Table Order</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-1">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tickets</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-1">
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              <span className="text-xs text-muted-foreground">Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      {!isOrderPanelExpanded && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 flex items-center justify-around py-2 px-4 z-50">
          <button className="flex flex-col items-center gap-1 px-4 py-1 rounded-lg bg-neutral-800 border border-neutral-600">
            <Plus className="w-5 h-5" />
            <span className="text-xs">New Order</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-4 py-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="text-xs text-muted-foreground">Table Order</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-4 py-1">
            <Receipt className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tickets</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-4 py-1">
            <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span className="text-xs text-muted-foreground">Settings</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
