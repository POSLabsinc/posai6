import { useState, useRef, useEffect } from "react";
import { Plus, Receipt, ArrowRightLeft, X, FileText, ChevronDown, Search, MoreVertical } from "lucide-react";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";
import clearIcon from "@/assets/icons/clear.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import saveIcon from "@/assets/icons/save.png";
import fireIcon from "@/assets/icons/fire.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import runnerIcon from "@/assets/icons/runner.png";
import discountIcon from "@/assets/icons/discount.png";
import noTaxIcon from "@/assets/icons/no-tax.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import giftCardIcon from "@/assets/icons/gift-card.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import expandPanelIcon from "@/assets/icons/expand-panel.png";
import collapsePanelIcon from "@/assets/icons/collapse-panel.png";
import newOrderIcon from "@/assets/icons/new-order.png";
import tableOrderIcon from "@/assets/icons/table-order.png";
import ticketsIcon from "@/assets/icons/tickets.png";
import settingsIcon from "@/assets/icons/settings.png";

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
  "BAKERY MENU": ["Breads", "Pastries", "Cakes", "Cookies", "Croissants", "Muffins", "Donuts", "Pies", "Tarts", "Scones", "Bagels", "Danish", "Baguettes", "Rolls"],
  "BAR MENU": ["Food", "Desserts", "Drinks", "Beer", "Wine", "Cocktails", "Spirits", "Mocktails", "Whiskey", "Vodka", "Rum", "Tequila", "Gin", "Brandy"],
  "HAPPY HOUR M/W": ["Appetizers", "Wings", "Sliders", "Nachos", "Beer", "Wine", "Cocktails", "Shots", "Tacos", "Quesadillas", "Dips", "Fries", "Pretzels", "Poppers"],
  "Holiday Menu": ["Starters", "Mains", "Sides", "Desserts", "Drinks", "Specials", "Platters", "Combos", "Turkey", "Ham", "Roasts", "Pies", "Stuffing", "Gravies"],
  "LE BRUNCH MENU": ["Eggs", "Pancakes", "Waffles", "Omelettes", "Juice", "Coffee", "Mimosas", "Pastries", "Bacon", "Sausage", "Toast", "Fruits", "Yogurt", "Granola"],
  "LE DINER MENU": ["Appetizers", "Soups", "Salads", "Entrees", "Steaks", "Seafood", "Pasta", "Desserts", "Risotto", "Duck", "Lamb", "Veal", "Lobster", "Caviar"]
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
  "Brandy": ["Cognac", "Armagnac", "Calvados", "Pisco", "Grappa", "VS", "VSOP", "XO", "Napoleon", "Fruit", "Spanish", "American"]
};
const menuItems = [{
  id: 1,
  name: "Almond Crusted Salmon",
  price: 28.99
}, {
  id: 2,
  name: "Hand Cut Fettuccini Alfredo",
  price: 18.99
}, {
  id: 3,
  name: "Four Cheese Ravioli",
  price: 19.99
}, {
  id: 4,
  name: "Grilled Organic Chicken Panini",
  price: 14.99
}, {
  id: 5,
  name: "Grilled Asparagus",
  price: 8.99
}, {
  id: 6,
  name: "Jidori Chicken Parmesan",
  price: 24.99
}, {
  id: 7,
  name: "Prime London Sirloin",
  price: 34.99
}, {
  id: 8,
  name: "Pan Roasted Salmon Sandwich",
  price: 16.99
}, {
  id: 9,
  name: "Oven Roasted Free Range Chicken",
  price: 22.99
}, {
  id: 10,
  name: "Crispy Calamari",
  price: 12.99
}, {
  id: 11,
  name: "Spinach & Artichoke Dip",
  price: 10.99
}, {
  id: 12,
  name: "Loaded Potato Skins",
  price: 9.99
}, {
  id: 13,
  name: "Mozzarella Sticks",
  price: 8.99
}, {
  id: 14,
  name: "Chicken Wings",
  price: 13.99
}, {
  id: 15,
  name: "Nacho Supreme",
  price: 11.99
}, {
  id: 16,
  name: "Garlic Bread",
  price: 5.99
}, {
  id: 17,
  name: "Caesar Salad",
  price: 10.99
}, {
  id: 18,
  name: "Greek Salad",
  price: 11.99
}, {
  id: 19,
  name: "Tomato Basil Soup",
  price: 7.99
}, {
  id: 20,
  name: "French Onion Soup",
  price: 8.99
}, {
  id: 21,
  name: "Ribeye Steak",
  price: 38.99
}, {
  id: 22,
  name: "Filet Mignon",
  price: 44.99
}, {
  id: 23,
  name: "Grilled Salmon",
  price: 26.99
}, {
  id: 24,
  name: "Shrimp Scampi",
  price: 23.99
}, {
  id: 25,
  name: "Lobster Tail",
  price: 49.99
}, {
  id: 26,
  name: "Lamb Chops",
  price: 36.99
}, {
  id: 27,
  name: "BBQ Ribs",
  price: 24.99
}, {
  id: 28,
  name: "Pork Tenderloin",
  price: 21.99
}, {
  id: 29,
  name: "Duck Breast",
  price: 32.99
}, {
  id: 30,
  name: "Beef Wellington",
  price: 52.99
}, {
  id: 31,
  name: "Mushroom Risotto",
  price: 17.99
}, {
  id: 32,
  name: "Truffle Pasta",
  price: 28.99
}, {
  id: 33,
  name: "Spaghetti Carbonara",
  price: 16.99
}, {
  id: 34,
  name: "Lasagna Bolognese",
  price: 18.99
}, {
  id: 35,
  name: "Chicken Marsala",
  price: 22.99
}, {
  id: 36,
  name: "Eggplant Parmesan",
  price: 17.99
}, {
  id: 37,
  name: "Seafood Platter",
  price: 54.99
}, {
  id: 38,
  name: "Fish & Chips",
  price: 15.99
}, {
  id: 39,
  name: "Crab Cakes",
  price: 19.99
}, {
  id: 40,
  name: "Oysters Rockefeller",
  price: 24.99
}, {
  id: 41,
  name: "Tiramisu",
  price: 9.99
}, {
  id: 42,
  name: "Chocolate Lava Cake",
  price: 10.99
}, {
  id: 43,
  name: "Cheesecake",
  price: 8.99
}, {
  id: 44,
  name: "Crème Brûlée",
  price: 9.99
}, {
  id: 45,
  name: "Apple Pie",
  price: 7.99
}];
interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
}
const initialOrderItems: OrderItem[] = [];
const orderTypes = ["DINE IN", "TAKE OUT", "DELIVERY", "BANQUET", "DRIVE THRU", "CURB SIDE", "SCHEDULED", "PHONE-IN", "CUSTOM"];

// Mock user data for guest name dropdown
interface GuestUser {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  initials: string;
}
const mockGuestUsers: GuestUser[] = [{
  id: 1,
  name: "John Doe",
  phone: "(122) 456-7890",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
  initials: "JD"
}, {
  id: 2,
  name: "Nancy John",
  phone: "(123) 454-7890",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
  initials: "NJ"
}, {
  id: 3,
  name: "Jonathan Byers",
  phone: "(123) 454-7890",
  initials: "JB"
}, {
  id: 4,
  name: "Jane Smith",
  phone: "(555) 123-4567",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
  initials: "JS"
}, {
  id: 5,
  name: "Michael Brown",
  phone: "(555) 987-6543",
  initials: "MB"
}, {
  id: 6,
  name: "Sarah Johnson",
  phone: "(555) 246-8135",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
  initials: "SJ"
}, {
  id: 7,
  name: "David Wilson",
  phone: "(555) 369-2580",
  initials: "DW"
}, {
  id: 8,
  name: "Emily Davis",
  phone: "(555) 147-2583",
  avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
  initials: "ED"
}];

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
  "Caviar": "border-slate-500"
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
  "Caviar": "bg-slate-500"
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
  "Caviar": "text-slate-500"
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
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [filteredGuests, setFilteredGuests] = useState<GuestUser[]>([]);
  const [filteredByPhone, setFilteredByPhone] = useState<GuestUser[]>([]);
  const [isGuestSelected, setIsGuestSelected] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{
    id: number;
    name: string;
    price: number;
  } | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const guestInputRef = useRef<HTMLInputElement>(null);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const mobileGuestInputRef = useRef<HTMLInputElement>(null);
  const mobileGuestDropdownRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);
  const mobilePhoneInputRef = useRef<HTMLInputElement>(null);
  const mobilePhoneDropdownRef = useRef<HTMLDivElement>(null);

  // Filter guests based on name input
  useEffect(() => {
    if (isGuestSelected) {
      setIsGuestSelected(false);
      return;
    }
    if (guestName.trim().length > 0) {
      const filtered = mockGuestUsers.filter(user => user.name.toLowerCase().includes(guestName.toLowerCase()));
      setFilteredGuests(filtered);
      setShowGuestDropdown(filtered.length > 0);
    } else {
      setFilteredGuests([]);
      setShowGuestDropdown(false);
    }
  }, [guestName]);

  // Filter guests based on phone input
  useEffect(() => {
    if (isGuestSelected) {
      return;
    }
    if (guestPhone.trim().length > 0) {
      const filtered = mockGuestUsers.filter(user => user.phone.replace(/\D/g, '').includes(guestPhone));
      setFilteredByPhone(filtered);
      setShowPhoneDropdown(filtered.length > 0);
    } else {
      setFilteredByPhone([]);
      setShowPhoneDropdown(false);
    }
  }, [guestPhone]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Close guest name dropdown
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(target) && guestInputRef.current && !guestInputRef.current.contains(target) && mobileGuestDropdownRef.current && !mobileGuestDropdownRef.current.contains(target) && mobileGuestInputRef.current && !mobileGuestInputRef.current.contains(target)) {
        setShowGuestDropdown(false);
      }
      // Close phone dropdown
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(target) && phoneInputRef.current && !phoneInputRef.current.contains(target) && mobilePhoneDropdownRef.current && !mobilePhoneDropdownRef.current.contains(target) && mobilePhoneInputRef.current && !mobilePhoneInputRef.current.contains(target)) {
        setShowPhoneDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectGuest = (guest: GuestUser) => {
    setIsGuestSelected(true);
    setGuestName(guest.name);
    setGuestPhone(guest.phone.replace(/\D/g, ''));
    setShowGuestDropdown(false);
    setShowPhoneDropdown(false);
  };

  // Get base height in pixels for each menu position
  const getMenuHeight = (position: 'minimized' | 'center' | 'full') => {
    if (typeof window === 'undefined') return 48;
    if (position === 'minimized') return 48; // h-12 = 3rem = 48px
    if (position === 'center') return window.innerHeight * 0.4; // 40% of screen
    return window.innerHeight - 64 - 64; // full minus bottom nav and header
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchStartTime(Date.now());
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStart - currentY; // positive = swiping up
    setDragOffset(diff);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || touchStartTime === null) {
      setIsDragging(false);
      return;
    }
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    const timeDiff = Date.now() - touchStartTime;
    const velocity = Math.abs(diff) / timeDiff; // pixels per millisecond

    // Fast swipe (velocity > 0.5) - snap to next/previous state
    if (velocity > 0.5) {
      if (diff > 20) {
        // Swipe up
        setMenuPosition(prev => prev === 'minimized' ? 'center' : 'full');
      } else if (diff < -20) {
        // Swipe down
        setMenuPosition(prev => prev === 'full' ? 'center' : 'minimized');
      }
    } else {
      // Slow drag - snap based on current visual height
      const baseHeight = getMenuHeight(menuPosition);
      const currentHeight = baseHeight + dragOffset;
      const minimizedH = getMenuHeight('minimized');
      const centerH = getMenuHeight('center');
      const fullH = getMenuHeight('full');

      // Find nearest position
      const distances = [{
        pos: 'minimized' as const,
        dist: Math.abs(currentHeight - minimizedH)
      }, {
        pos: 'center' as const,
        dist: Math.abs(currentHeight - centerH)
      }, {
        pos: 'full' as const,
        dist: Math.abs(currentHeight - fullH)
      }];
      const nearest = distances.reduce((a, b) => a.dist < b.dist ? a : b);
      setMenuPosition(nearest.pos);
    }

    // Reset drag states
    setDragOffset(0);
    setIsDragging(false);
    setTouchStart(null);
    setTouchStartTime(null);
  };

  // Mouse/Pointer event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTime = Date.now();
    setTouchStart(startY);
    setTouchStartTime(startTime);
    setIsDragging(true);

    // Add global listeners for mouse move and up
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const diff = startY - e.clientY;
      setDragOffset(diff);
    };
    const handleGlobalMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      const diff = startY - e.clientY;
      const timeDiff = Date.now() - startTime;
      const velocity = Math.abs(diff) / timeDiff;
      if (velocity > 0.5) {
        if (diff > 20) {
          setMenuPosition(prev => prev === 'minimized' ? 'center' : 'full');
        } else if (diff < -20) {
          setMenuPosition(prev => prev === 'full' ? 'center' : 'minimized');
        }
      } else {
        // Snap based on final position
        if (diff > 80) {
          setMenuPosition(prev => prev === 'minimized' ? 'center' : 'full');
        } else if (diff < -80) {
          setMenuPosition(prev => prev === 'full' ? 'center' : 'minimized');
        }
      }
      setDragOffset(0);
      setIsDragging(false);
      setTouchStart(null);
      setTouchStartTime(null);
    };
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };
  const addToCart = (item: {
    id: number;
    name: string;
    price: number;
  }) => {
    setOrderItems(prev => {
      const existing = prev.find(o => o.name === item.name && (!o.modifiers || o.modifiers.length === 0));
      if (existing) {
        return prev.map(o => o.name === item.name && (!o.modifiers || o.modifiers.length === 0) ? {
          ...o,
          qty: o.qty + 1
        } : o);
      }
      return [...prev, {
        id: Date.now(),
        qty: 1,
        name: item.name,
        price: item.price
      }];
    });
  };
  const addToCartWithModifiers = (item: {
    id: number;
    name: string;
    price: number;
  }, quantity: number, modifiers: string[], notes: string) => {
    setOrderItems(prev => {
      return [...prev, {
        id: Date.now(),
        qty: quantity,
        name: item.name,
        price: item.price,
        modifiers: modifiers.length > 0 ? modifiers : undefined
      }];
    });
  };
  const openCustomizationDialog = (item: {
    id: number;
    name: string;
    price: number;
  }, imageIndex: number) => {
    setSelectedItemForCustomization(item);
    setSelectedItemImage(foodImages[imageIndex % foodImages.length]);
    setCustomizationDialogOpen(true);
  };
  const removeFromCart = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };
  const handleMenuSelect = (value: string) => {
    setSelectedMenu(value);
    setIsMenuSelectOpen(false);
  };
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = 0.00;
  const serviceCharge = 0.00;
  const taxRate = 0.02;
  const tax = subtotal * taxRate;
  const total = subtotal - discount + serviceCharge + tax;
  return <div className="flex flex-col md:flex-row gap-1 h-full overflow-hidden pb-16 md:pb-0 relative">
      {/* Right Panel - Order (Shows first on mobile) */}
      <div className={`md:hidden flex flex-col overflow-hidden transition-all duration-300 ${isOrderPanelExpanded ? 'flex-1 pb-14' : 'flex-shrink-0'}`}>
        {/* Order Header - Outside background container */}
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-2 gap-2">
            <div className="relative">
              <input ref={mobileGuestInputRef} type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="GUEST NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 font-medium text-[#808080]" />
              {showGuestDropdown && filteredGuests.length > 0 && <div ref={mobileGuestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map(guest => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                          {guest.initials}
                        </div>}
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>)}
                </div>}
            </div>
            <div className="relative flex items-center gap-0.5">
              <img src={phoneIcon} alt="Phone" className="w-4 h-4" />
              <input ref={mobilePhoneInputRef} type="tel" inputMode="numeric" pattern="[0-9]*" value={guestPhone} onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="(XXX) XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-[#808080]" />
              {showPhoneDropdown && filteredByPhone.length > 0 && <div ref={mobilePhoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredByPhone.map(guest => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                          {guest.initials}
                        </div>}
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>)}
                </div>}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-4 h-4" />
              <span className="text-white">12:30 PM</span>
            </div>
          </div>
          
          {/* Action buttons - hidden on mobile, shown via three-dot dropdown */}
          <div className="hidden md:block overflow-x-auto scrollbar-hide mb-2">
            <div className="flex items-center gap-2 w-max">
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                Custom Item
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                Discount
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                Register
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                Gift
              </Button>
              <Button variant="secondary" size="icon" className="h-7 w-7 rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Background Container for Order Content */}
        <div className={`flex flex-col bg-[#7575754D] border border-white rounded-lg overflow-hidden mx-1 transition-all duration-300 ${isOrderPanelExpanded ? 'flex-1 h-full mb-2' : 'min-h-0'}`}>
          {/* Order Type & Guest Info */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded transition-colors text-black" style={{
                  background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                }}>
                    {orderType} <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[100px] p-1">
                  {orderTypes.map(type => <DropdownMenuItem key={type} onClick={() => setOrderType(type)} className="text-white hover:bg-neutral-700 cursor-pointer text-[10px] py-1 px-2">
                      {type}
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <img src={runnerIcon} alt="User" className="w-4 h-4" />
              <span>Dustin H</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-5 h-5 bg-white rounded-full flex items-center justify-center ml-2">
                    <MoreVertical className="w-3 h-3 text-black" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 min-w-[140px] p-1 z-50">
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    Custom Item
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    Discount
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    No Tax
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    Open Register
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    Gift Card
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    Service Charge
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3">
                    Add Guest
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button onClick={() => {
              const newExpanded = !isOrderPanelExpanded;
              setIsOrderPanelExpanded(newExpanded);
              if (newExpanded) {
                setMenuPosition('minimized');
              } else {
                setMenuPosition('center');
              }
            }} className="p-1 rounded hover:bg-neutral-700 transition-colors">
                <img src={isOrderPanelExpanded ? collapsePanelIcon : expandPanelIcon} alt="Toggle panel" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Order Notes */}
          <div className="px-2 py-1.5 border-b border-sidebar-border">
            <div className="flex items-center gap-2 bg-neutral-700 rounded px-2 py-1.5">
              <img src={itemNotesIcon} alt="Notes" className="w-3.5 h-3.5 flex-shrink-0" />
              <input type="text" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="bg-transparent outline-none text-xs text-white placeholder:text-muted-foreground flex-1 min-w-0" placeholder="Order notes and Allergies" />
            </div>
          </div>

          {/* Mobile Cart Items */}
          <div className={`min-h-0 overflow-hidden flex flex-col ${isOrderPanelExpanded ? 'flex-1' : ''}`}>
            {orderItems.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center">
                <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                <span className="text-muted-foreground text-sm">Let's create an order</span>
              </div> : <ScrollArea className={`h-full ${isOrderPanelExpanded ? 'flex-1' : 'max-h-28'}`}>
                <div className="px-2 py-1 space-y-1">
                  {orderItems.map(item => <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)}>
                      <div className="flex items-center justify-between bg-neutral-800 rounded-lg px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md border border-white/50 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                            {item.qty}
                          </span>
                          <span className="text-xs font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-xs font-medium text-foreground">${item.price.toFixed(2)}</span>
                      </div>
                    </SwipeableCartItem>)}
                </div>
              </ScrollArea>}
          </div>

          {/* Order Summary - Only show when items exist */}
          {orderItems.length > 0 && <div className="px-2 py-1 border-t border-sidebar-border text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Sub:</span>
                <span className="text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-500">Disc:</span>
                <span className="text-red-500">${discount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Svc:</span>
                <span className="text-foreground">${serviceCharge.toFixed(2)}</span>
              </div>
            </div>}

          {/* Action Buttons */}
          <div className="px-2 py-2 flex items-center gap-2">
            <button onClick={() => setOrderItems([])} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
              <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
            backgroundColor: '#C9C9C9'
          }}>
              <img src={saveIcon} alt="Save" className="w-4 h-4" />
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{
            background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
          }}>
              <img src={fireIcon} alt="Fire" className="w-4 h-4" />
              <span className="text-white font-semibold text-sm">FIRE</span>
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{
            background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
          }}>
              <span className="text-black font-semibold text-xs">CHARGE ${total.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Left Panel - Menu */}
      <div className={`md:flex-1 flex flex-col min-w-0 md:bg-black border border-sidebar-border md:border-0 rounded-[20px] fixed md:relative bottom-16 md:bottom-auto left-2 right-2 md:left-0 md:right-0 md:left-auto md:right-auto z-10 ${!isDragging ? 'transition-all duration-300 ease-out' : ''} ${!isDragging ? menuPosition === 'minimized' ? 'h-12' : menuPosition === 'center' ? 'h-[40%]' : 'h-[calc(100%-5.5rem)]' : ''} md:h-auto md:top-auto`} style={isDragging ? {
      height: `${Math.max(48, Math.min(window.innerHeight - 152, getMenuHeight(menuPosition) + dragOffset))}px`
    } : undefined}>
        {/* Grabber for minimize/maximize OR Search Bar */}
        {isSearchMode ? <div className="flex items-center gap-2 px-3 py-2.5 md:hidden bg-neutral-900 rounded-t-[20px]">
            <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <input ref={searchInputRef} type="text" placeholder="Chicken" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="p-0.5">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>}
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 p-0 flex-shrink-0" onClick={() => {
          setIsSearchMode(false);
          setSearchQuery('');
          setMenuPosition('center');
        }}>
              <X className="w-4 h-4 text-white" />
            </Button>
          </div> : <div className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing select-none md:hidden touch-none bg-neutral-900 rounded-t-[20px]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown}>
            <div className="w-8" /> {/* Spacer for balance */}
            <img src={grabberIcon} alt="Drag to resize" className="w-10 h-1.5 opacity-60 hover:opacity-100 transition-opacity" />
            <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full bg-white/90 hover:bg-white p-0" onClick={e => {
          e.stopPropagation();
          setIsSearchMode(true);
          setMenuPosition('full');
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}>
              <Search className="w-3 h-3 text-neutral-800" />
            </Button>
          </div>}
        {/* Menu Content - Hidden when minimized */}
        <div className={`flex flex-col gap-2 p-2 md:p-3 transition-all duration-300 bg-neutral-900 rounded-b-[20px] ${menuPosition === 'minimized' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100 overflow-y-auto md:overflow-hidden scrollbar-hide'}`}>
        {/* Main Categories - Hidden in search mode on mobile */}
        <div className={`flex flex-wrap items-center gap-1 md:gap-2 ${isSearchMode ? 'hidden md:flex' : ''}`}>
          {/* Menu Controls Group */}
          {isMenuSelectOpen ? <div className="flex items-center gap-1 md:gap-2 bg-sidebar-accent rounded-full px-1 md:px-2 py-0.5 md:py-1">
              <Button variant="ghost" size="icon" className="h-6 md:h-10 w-6 md:w-10 p-0" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
                <img src={burgerCloseIcon} alt="Close menu" className="w-4 md:w-7 h-4 md:h-7" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 md:h-10 w-6 md:w-10 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setHorizontalScrollMode(!horizontalScrollMode)} title={horizontalScrollMode ? "Show all subcategories" : "Enable horizontal scroll"}>
                {horizontalScrollMode ? <img src={verticalScrollIcon} alt="All view" className="w-3 md:w-5 h-3 md:h-5" /> : <img src={horizontalScrollIcon} alt="Horizontal scroll" className="w-3 md:w-5 h-3 md:h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 md:h-10 w-6 md:w-10 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setThumbnailViewMode(!thumbnailViewMode)} title={thumbnailViewMode ? "Show list view" : "Show thumbnail view"}>
                {thumbnailViewMode ? <img src={listViewIcon} alt="List view" className="w-3 md:w-5 h-3 md:h-5" /> : <img src={thumbnailViewIcon} alt="Thumbnail view" className="w-3 md:w-5 h-3 md:h-5" />}
              </Button>
              <Select value={selectedMenu} onValueChange={handleMenuSelect}>
                <SelectTrigger className="w-[100px] md:w-[160px] rounded-full bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white h-6 md:h-10 text-[10px] md:text-sm">
                  <SelectValue placeholder="Select Menu" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {menuList.map(menu => <SelectItem key={menu} value={menu} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                      {menu}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div> : <Button variant="ghost" size="icon" className="h-6 md:h-10 w-6 md:w-10 p-0" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
              <img src={burgerOpenIcon} alt="Open menu" className="w-6 md:w-10 h-6 md:h-10" />
            </Button>}
          {/* Categories */}
          {menuCategories[selectedMenu].map(cat => <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} className={`rounded-full px-1.5 md:px-8 h-5 md:h-10 text-[9px] md:text-sm whitespace-nowrap border-2 ${activeCategory === cat ? `${getCategoryBgColor(cat)} ${getCategoryHoverBgColor(cat)} text-white ${getCategoryBorderColor(cat)}` : `bg-header text-header-foreground ${getCategoryBorderColor(cat)} hover:bg-header/80`}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </Button>)}
        </div>

        <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

        {/* Subcategories based on selected category - Hidden in search mode on mobile */}
        <div className={`overflow-x-auto scrollbar-hide ${horizontalScrollMode ? '' : 'max-h-[6rem] md:max-h-[8.5rem]'} ${isSearchMode ? 'hidden md:block' : ''}`}>
          <div className={`flex gap-1 md:gap-2 ${horizontalScrollMode ? 'flex-row flex-nowrap' : 'flex-row flex-wrap'}`}>
            {(categorySubcategories[activeCategory] || []).map(sub => <Button key={sub} variant="outline" className={`rounded-lg md:rounded-full px-2 md:px-8 h-6 md:h-10 text-[10px] md:text-sm whitespace-nowrap border ${activeSubcategory === sub ? `bg-black md:bg-header ${getCategoryTextColor(activeCategory)} ${getCategoryHoverTextColor(activeCategory)} ${getCategoryBorderColor(activeCategory)} font-semibold hover:bg-black md:hover:bg-header` : `bg-black md:bg-header text-header-foreground ${getCategoryBorderColor(activeCategory)} hover:bg-black/80 md:hover:bg-header/80`}`} onClick={() => setActiveSubcategory(sub)}>
                {sub}
              </Button>)}
          </div>
        </div>

        <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
          {(() => {
            // Filter items based on search query (mobile only)
            const filteredItems = isSearchMode && searchQuery.trim() ? menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : menuItems;
            return thumbnailViewMode ? <div className="grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-3">
                {filteredItems.map((item, index) => <div key={item.id} className="flex flex-col rounded-lg overflow-hidden cursor-pointer group border border-neutral-700">
                    <div className="relative aspect-[4/3] bg-neutral-800" onClick={() => openCustomizationDialog(item, index)}>
                      <img src={foodImages[index % foodImages.length]} alt={item.name} className="w-full h-full object-cover" />
                      <button onClick={e => {
                    e.stopPropagation();
                    addToCart(item);
                  }} className="absolute top-1 md:top-2 left-1 md:left-2 w-6 md:w-8 h-6 md:h-8 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center transition-colors">
                        <Plus className="w-3 md:w-4 h-3 md:h-4 text-white" strokeWidth={3} />
                      </button>
                    </div>
                    <div className="p-1 md:p-2 bg-neutral-900" onClick={() => openCustomizationDialog(item, index)}>
                      <span className="text-[10px] md:text-xs font-medium text-white uppercase leading-tight line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                  </div>)}
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
                {filteredItems.map((item, index) => <div key={item.id} onClick={() => openCustomizationDialog(item, index)} className="flex items-stretch bg-sidebar-accent rounded-lg overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border">
                    <div className="flex-1 p-1.5 md:p-3" style={{
                  background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)'
                }}>
                      <span className="float-right text-[9px] md:text-xs text-white/80 ml-2">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] md:text-xs font-bold leading-tight uppercase text-foreground line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                    <button onClick={e => {
                  e.stopPropagation();
                  addToCart(item);
                }} className="w-6 md:w-10 text-white flex-shrink-0 flex items-center justify-center" style={{
                  background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                }}>
                      <Plus className="w-3 md:w-4 h-3 md:h-4" strokeWidth={4} />
                    </button>
                  </div>)}
              </div>;
          })()}
        </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Order (Desktop only) */}
      <div className="hidden md:flex w-[345px] flex-col overflow-hidden flex-shrink-0">
        {/* Order Header - Outside background container */}
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-2 gap-2">
            <div className="relative">
              <input ref={guestInputRef} type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="GUEST NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-20 min-w-0 font-medium text-[#808080]" />
              {showGuestDropdown && filteredGuests.length > 0 && <div ref={guestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map(guest => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                          {guest.initials}
                        </div>}
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>)}
                </div>}
            </div>
            <div className="relative flex items-center gap-0.5">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input ref={phoneInputRef} type="tel" inputMode="numeric" pattern="[0-9]*" value={guestPhone} onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-16 min-w-0 text-[#808080]" />
              {showPhoneDropdown && filteredByPhone.length > 0 && <div ref={phoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredByPhone.map(guest => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                          {guest.initials}
                        </div>}
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>)}
                </div>}
            </div>
            <div className="flex items-center gap-0.5 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-3 h-3" />
              <span className="text-white text-[10px]">12:30 PM</span>
            </div>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide mb-2">
            <div className="flex items-center gap-1.5 w-max">
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Custom Item
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Discount
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Register
              </Button>
              <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-2 whitespace-nowrap">
                Gift
              </Button>
              <Button variant="secondary" size="icon" className="h-6 w-6 rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border">
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
                  {orderTypes.map(type => <DropdownMenuItem key={type} onClick={() => setOrderType(type)} className="text-white hover:bg-neutral-700 cursor-pointer">
                      {type}
                    </DropdownMenuItem>)}
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
          <div className="flex items-center gap-2 rounded px-3 py-2" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input type="text" placeholder="Order notes" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground outline-none" />
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          {orderItems.length === 0 ? <div className="flex flex-col items-center justify-center h-full py-8">
              <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
              <span className="text-muted-foreground text-sm">Let's create an order</span>
            </div> : <div className="py-1 space-y-2">
              {orderItems.map(item => <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)}>
                  <div className="p-3 border border-sidebar-border rounded-lg" style={{
                background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)'
              }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {item.qty}
                        </span>
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">${item.price.toFixed(2)}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && <div className="mt-2 ml-8 space-y-0.5">
                        {item.modifiers.map((mod, idx) => <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{mod.startsWith("W/") ? "+" : "-"}</span>
                            <span>{mod}</span>
                          </div>)}
                      </div>}
                  </div>
                </SwipeableCartItem>)}
            </div>}
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <div className="space-y-1.5 text-sm rounded px-3 py-2" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex justify-between">
              <span className="text-foreground">Sub Total</span>
              <span className="text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">Discount</span>
              <span className="text-red-500">${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Service Charge</span>
              <span className="text-foreground">${serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Tax</span>
              <span className="text-foreground">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-sidebar-border my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons - Inside background container */}
          <div className="px-2 py-2 flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setOrderItems([])} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
              <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{
              backgroundColor: '#C9C9C9'
            }}>
              <img src={saveIcon} alt="Save" className="w-4 h-4" />
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>
              <img src={fireIcon} alt="Fire" className="w-4 h-4" />
              <span className="text-white font-semibold text-sm">FIRE</span>
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
            }}>
              <span className="text-black font-semibold text-xs">CHARGE ${total.toFixed(2)}</span>
            </button>
          </div>
        </div>
        </div>
      </div>


      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center py-2 px-3 z-50">
        <div className="flex items-center justify-around bg-neutral-900 rounded-2xl py-2 px-3 w-full border border-neutral-700">
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg border border-neutral-500 bg-transparent">
            <img src={newOrderIcon} alt="New Order" className="w-5 h-5" />
            <span className="text-[10px] font-medium text-white">New Order</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <img src={tableOrderIcon} alt="Table Order" className="w-5 h-5 opacity-60" />
            <span className="text-[10px] text-neutral-400">Table Order</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <img src={ticketsIcon} alt="Tickets" className="w-5 h-5 opacity-60" />
            <span className="text-[10px] text-neutral-400">Tickets</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <img src={settingsIcon} alt="Settings" className="w-5 h-5 opacity-60" />
            <span className="text-[10px] text-neutral-400">Settings</span>
          </button>
        </div>
      </div>
      {/* Item Customization Dialog */}
      <ItemCustomizationDialog open={customizationDialogOpen} onOpenChange={setCustomizationDialogOpen} item={selectedItemForCustomization} itemImage={selectedItemImage} onAddToCart={addToCartWithModifiers} />
    </div>;
};
export default Orders;