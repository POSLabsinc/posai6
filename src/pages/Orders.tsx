import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Receipt, ArrowRightLeft, X, FileText, ChevronDown, MoreVertical, Gift, DollarSign, UserPlus, FolderOpen, AlertCircle, SplitSquareVertical, RotateCcw, Delete, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, MapPin, BadgeDollarSign, Tag, Users, Share2, Fingerprint, ScanFace, CreditCard, User, Link, QrCode, Banknote, Printer, MessageSquare, Mail, CheckCircle, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, UtensilsCrossed, ArrowLeft, Phone, AlertTriangle, RefreshCw, Send, Zap, Search, Check, Ticket } from "lucide-react";
import PaymentDialog from "@/components/PaymentDialog";
import { getOrderById, Order as DataOrder, OrderItem as DataOrderItem, formatPrice as formatOrderPrice } from "@/data/orders";
import { useSessionOrders } from "@/contexts/SessionOrderContext";
import { toast } from "sonner";
import searchIcon from "@/assets/icons/search.png";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";
import GiftCardDialog from "@/components/GiftCardDialog";
import ServiceChargeDialog from "@/components/ServiceChargeDialog";
import { TransferCheckDialog } from "@/components/TransferCheckDialog";
import InlineItemCustomization from "@/components/InlineItemCustomization";
import OrderNotesAutocomplete from "@/components/OrderNotesAutocomplete";
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
import tickSuccessIcon from "@/assets/icons/tick-success.svg";
import grabberIcon from "@/assets/icons/grabber.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import runnerIcon from "@/assets/icons/runner.png";
import discountIcon from "@/assets/icons/discount.png";
import noTaxIcon from "@/assets/icons/no-tax.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import customItemIcon from "@/assets/icons/custom-item.svg";
import discountBtnIcon from "@/assets/icons/discount-icon.svg";
import noTaxBtnIcon from "@/assets/icons/no-tax.svg";
import registerBtnIcon from "@/assets/icons/register.svg";
import giftCardIcon from "@/assets/icons/gift-card.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import expandPanelIcon from "@/assets/icons/expand-panel.png";
import collapsePanelIcon from "@/assets/icons/collapse-panel.png";
import giftCardBtnIcon from "@/assets/icons/gift-card-btn.svg";
import serviceChargeIcon from "@/assets/icons/service-charge.svg";
import addGuestIcon from "@/assets/icons/add-guest.svg";
import openOrdersIcon from "@/assets/icons/open-orders.svg";
import allergyIcon from "@/assets/icons/allergy.svg";
import splitCheckIcon from "@/assets/icons/split-check.svg";
import reopenCheckIcon from "@/assets/icons/reopen-check.svg";
import transferCheckIcon from "@/assets/icons/transfer-check.svg";
import transferIconPng from "@/assets/icons/transfer-icon.png";
import newOrderIcon from "@/assets/icons/new-order.png";
import dineInIcon from "@/assets/icons/dine-in-icon.svg";
import takeOutIcon from "@/assets/icons/take-out.svg";
import deliveryIcon from "@/assets/icons/delivery.svg";
import banquetIcon from "@/assets/icons/banquet.svg";
import driveThruIcon from "@/assets/icons/drive-thru.svg";
import curbSideIcon from "@/assets/icons/curb-side.svg";
import scheduledIcon from "@/assets/icons/scheduled.svg";
import phoneInIcon from "@/assets/icons/phone-in.svg";
import customOrderIcon from "@/assets/icons/custom-order.svg";
import menuIcon from "@/assets/icons/menu-icon.svg";
import tableOrderIcon from "@/assets/icons/table-order.png";
import mergeIcon from "@/assets/icons/link-merge.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import ticketsIcon from "@/assets/icons/tickets.png";
import settingsIcon from "@/assets/icons/settings.png";
import { usePanelPosition } from "@/contexts/PanelPositionContext";
import { PanelDropZones } from "@/components/PanelDropZone";
import { DraggablePanelHandle } from "@/components/DraggablePanelHandle";
import AddGuestForm from "@/components/AddGuestForm";
import DineInGuestForm, { DineInGuestData } from "@/components/DineInGuestForm";
import TakeOutGuestForm, { TakeOutGuestData } from "@/components/TakeOutGuestForm";
import DeliveryGuestForm, { DeliveryGuestData } from "@/components/DeliveryGuestForm";
import BanquetGuestForm, { BanquetGuestData } from "@/components/BanquetGuestForm";
import DriveThruGuestForm, { DriveThruGuestData } from "@/components/DriveThruGuestForm";
import CurbSideGuestForm, { CurbSideGuestData } from "@/components/CurbSideGuestForm";
import ScheduledGuestForm, { ScheduledGuestData } from "@/components/ScheduledGuestForm";
import PhoneInGuestForm, { PhoneInGuestData } from "@/components/PhoneInGuestForm";
import CustomOrderGuestForm, { CustomOrderGuestData } from "@/components/CustomOrderGuestForm";
import MPINDialog from "@/components/MPINDialog";
import PriceOverrideDialog from "@/components/PriceOverrideDialog";
import VoucherDialog from "@/components/VoucherDialog";
import CreateVoucherForm from "@/components/CreateVoucherForm";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

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
  "BAKERY MENU": ["Breads", "Pastries", "Cakes", "Cookies", "Croissants", "Muffins", "Donuts", "Pies", "Tarts", "Scones", "Bagels"],
  "BAR MENU": ["Food", "Desserts", "Drinks", "Beer", "Wine", "Cocktails", "Spirits", "Mocktails", "Whiskey", "Vodka", "Rum"],
  "HAPPY HOUR M/W": ["Appetizers", "Wings", "Sliders", "Nachos", "Beer", "Wine", "Cocktails", "Shots", "Tacos", "Quesadillas", "Dips"],
  "Holiday Menu": ["Starters", "Mains", "Sides", "Desserts", "Drinks", "Specials", "Platters", "Combos", "Turkey", "Ham", "Roasts"],
  "LE BRUNCH MENU": ["Eggs", "Pancakes", "Waffles", "Omelettes", "Juice", "Coffee", "Mimosas", "Pastries", "Bacon", "Sausage", "Toast"],
  "LE DINER MENU": ["Appetizers", "Soups", "Salads", "Entrees", "Steaks", "Seafood", "Pasta", "Desserts", "Risotto", "Duck", "Lamb"]
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
// Menu items organized by menu -> category -> subcategory
interface MenuItem {
  id: number;
  name: string;
  price: number;
}
type SubcategoryItems = Record<string, MenuItem[]>;
type CategoryItems = Record<string, SubcategoryItems>;
type MenuItemsStructure = Record<string, CategoryItems>;
const menuItemsData: MenuItemsStructure = {
  "BAKERY MENU": {
    "Breads": {
      "Sourdough": [{
        id: 1,
        name: "Classic Artisan Sourdough Loaf with Sea Salt",
        price: 6.99
      }, {
        id: 2,
        name: "Traditional French Style Sourdough Boule",
        price: 7.99
      }, {
        id: 3,
        name: "Mini Sourdough Rounds",
        price: 4.99
      }, {
        id: 4,
        name: "Handcrafted Sourdough Batard with Herbs",
        price: 7.49
      }, {
        id: 5,
        name: "Rustic Sourdough",
        price: 6.49
      }, {
        id: 6,
        name: "Mediterranean Olive Sourdough with Rosemary",
        price: 8.99
      }, {
        id: 7,
        name: "Fresh Rosemary & Garlic Infused Sourdough",
        price: 8.49
      }, {
        id: 8,
        name: "Seeded Sourdough",
        price: 7.99
      }, {
        id: 9,
        name: "Sourdough Focaccia",
        price: 9.99
      }],
      "Whole Wheat": [{
        id: 10,
        name: "Organic Whole Wheat Sandwich Loaf with Flax Seeds",
        price: 5.99
      }, {
        id: 11,
        name: "Local Honey Infused Wheat Bread",
        price: 6.49
      }, {
        id: 12,
        name: "Artisan Multigrain Wheat Loaf with Seeds",
        price: 6.99
      }, {
        id: 13,
        name: "100% Stone Ground Whole Wheat Bread",
        price: 5.49
      }, {
        id: 14,
        name: "Wheat Berry Bread",
        price: 7.49
      }, {
        id: 15,
        name: "Cracked Wheat Loaf",
        price: 6.99
      }, {
        id: 16,
        name: "Sprouted Ancient Grain Wheat Bread",
        price: 8.49
      }, {
        id: 17,
        name: "Fresh Baked Wheat Dinner Rolls (6 Pack)",
        price: 4.99
      }, {
        id: 18,
        name: "Wheat Baguette",
        price: 5.99
      }],
      "French": [{
        id: 19,
        name: "Traditional Parisian Style French Baguette",
        price: 4.99
      }, {
        id: 20,
        name: "Rustic Pain de Campagne Country Style",
        price: 7.99
      }, {
        id: 21,
        name: "Authentic French Country Farmhouse Loaf",
        price: 6.99
      }, {
        id: 22,
        name: "Thin Crispy Ficelle Bread Stick",
        price: 3.99
      }, {
        id: 23,
        name: "Soft Pain de Mie Japanese Style",
        price: 6.49
      }, {
        id: 24,
        name: "Provençal Fougasse with Herbs & Olives",
        price: 8.99
      }, {
        id: 25,
        name: "Pain Epi Wheat Stalk Bread",
        price: 5.99
      }, {
        id: 26,
        name: "Classic French Batard Loaf",
        price: 5.49
      }, {
        id: 27,
        name: "Round French Boule Bread",
        price: 6.99
      }],
      "Rye": [{
        id: 28,
        name: "Classic Rye Loaf",
        price: 6.99
      }, {
        id: 29,
        name: "Marble Rye",
        price: 7.49
      }, {
        id: 30,
        name: "Pumpernickel",
        price: 7.99
      }, {
        id: 31,
        name: "Light Rye Bread",
        price: 5.99
      }, {
        id: 32,
        name: "Dark Rye Bread",
        price: 6.49
      }, {
        id: 33,
        name: "Caraway Rye",
        price: 7.49
      }, {
        id: 34,
        name: "Jewish Rye",
        price: 6.99
      }, {
        id: 35,
        name: "Rye Rolls (6)",
        price: 5.49
      }, {
        id: 36,
        name: "Rye Baguette",
        price: 5.99
      }],
      "Italian": [{
        id: 37,
        name: "Italian Round Loaf",
        price: 5.99
      }, {
        id: 38,
        name: "Ciabatta Loaf",
        price: 6.49
      }, {
        id: 39,
        name: "Focaccia Sheet",
        price: 9.99
      }, {
        id: 40,
        name: "Pane Rustico",
        price: 7.49
      }, {
        id: 41,
        name: "Grissini (12 sticks)",
        price: 4.99
      }, {
        id: 42,
        name: "Pane di Casa",
        price: 6.99
      }, {
        id: 43,
        name: "Olive Focaccia",
        price: 10.99
      }, {
        id: 44,
        name: "Rosemary Focaccia",
        price: 10.49
      }, {
        id: 45,
        name: "Italian Bread Basket",
        price: 12.99
      }]
    },
    "Pastries": {
      "Croissant": [{
        id: 46,
        name: "Butter Croissant",
        price: 3.99
      }, {
        id: 47,
        name: "Almond Croissant",
        price: 4.99
      }, {
        id: 48,
        name: "Chocolate Croissant",
        price: 4.49
      }, {
        id: 49,
        name: "Ham & Cheese Croissant",
        price: 5.99
      }, {
        id: 50,
        name: "Pain au Chocolat",
        price: 4.49
      }, {
        id: 51,
        name: "Croissant aux Amandes",
        price: 5.49
      }, {
        id: 52,
        name: "Mini Croissants (6)",
        price: 7.99
      }, {
        id: 53,
        name: "Spinach Feta Croissant",
        price: 5.99
      }, {
        id: 54,
        name: "Everything Croissant",
        price: 4.99
      }],
      "Danish": [{
        id: 55,
        name: "Cheese Danish",
        price: 3.99
      }, {
        id: 56,
        name: "Cherry Danish",
        price: 4.29
      }, {
        id: 57,
        name: "Apple Danish",
        price: 4.29
      }, {
        id: 58,
        name: "Raspberry Danish",
        price: 4.29
      }, {
        id: 59,
        name: "Cream Cheese Danish",
        price: 4.49
      }, {
        id: 60,
        name: "Blueberry Danish",
        price: 4.29
      }, {
        id: 61,
        name: "Pecan Danish",
        price: 4.79
      }, {
        id: 62,
        name: "Apricot Danish",
        price: 4.29
      }, {
        id: 63,
        name: "Mixed Berry Danish",
        price: 4.49
      }],
      "Éclair": [{
        id: 64,
        name: "Chocolate Éclair",
        price: 4.99
      }, {
        id: 65,
        name: "Vanilla Éclair",
        price: 4.99
      }, {
        id: 66,
        name: "Coffee Éclair",
        price: 5.49
      }, {
        id: 67,
        name: "Caramel Éclair",
        price: 5.49
      }, {
        id: 68,
        name: "Strawberry Éclair",
        price: 5.49
      }, {
        id: 69,
        name: "Pistachio Éclair",
        price: 5.99
      }, {
        id: 70,
        name: "Salted Caramel Éclair",
        price: 5.99
      }, {
        id: 71,
        name: "Lemon Éclair",
        price: 5.49
      }, {
        id: 72,
        name: "Mini Éclairs Box (6)",
        price: 14.99
      }],
      "Palmier": [{
        id: 73,
        name: "Classic Palmier",
        price: 2.99
      }, {
        id: 74,
        name: "Chocolate Palmier",
        price: 3.49
      }, {
        id: 75,
        name: "Cinnamon Palmier",
        price: 3.29
      }, {
        id: 76,
        name: "Mini Palmiers (6)",
        price: 5.99
      }, {
        id: 77,
        name: "Sugar Palmier",
        price: 2.99
      }, {
        id: 78,
        name: "Almond Palmier",
        price: 3.49
      }, {
        id: 79,
        name: "Vanilla Palmier",
        price: 3.29
      }, {
        id: 80,
        name: "Hazelnut Palmier",
        price: 3.49
      }, {
        id: 81,
        name: "Palmier Duo Pack",
        price: 5.49
      }]
    },
    "Cakes": {
      "Chocolate": [{
        id: 82,
        name: "Dark Chocolate Cake Slice",
        price: 6.99
      }, {
        id: 83,
        name: "Triple Chocolate Mousse",
        price: 8.99
      }, {
        id: 84,
        name: "Chocolate Fudge Cake",
        price: 7.99
      }, {
        id: 85,
        name: "German Chocolate Slice",
        price: 7.49
      }, {
        id: 86,
        name: "Molten Lava Cake",
        price: 8.99
      }, {
        id: 87,
        name: "Chocolate Ganache Torte",
        price: 9.49
      }, {
        id: 88,
        name: "Death by Chocolate",
        price: 8.99
      }, {
        id: 89,
        name: "Chocolate Truffle Cake",
        price: 9.99
      }, {
        id: 90,
        name: "Black Forest Cake",
        price: 8.49
      }],
      "Vanilla": [{
        id: 91,
        name: "Classic Vanilla Cake",
        price: 5.99
      }, {
        id: 92,
        name: "Vanilla Bean Sponge",
        price: 6.99
      }, {
        id: 93,
        name: "French Vanilla Layer Cake",
        price: 7.49
      }, {
        id: 94,
        name: "Vanilla Buttercream Cake",
        price: 6.99
      }, {
        id: 95,
        name: "Vanilla Chiffon Slice",
        price: 5.99
      }, {
        id: 96,
        name: "Madagascar Vanilla Cake",
        price: 8.49
      }, {
        id: 97,
        name: "Vanilla Mousse Cake",
        price: 7.99
      }, {
        id: 98,
        name: "Vanilla Tres Leches",
        price: 7.49
      }, {
        id: 99,
        name: "Vanilla Pound Cake",
        price: 5.49
      }],
      "Red Velvet": [{
        id: 100,
        name: "Red Velvet Slice",
        price: 6.99
      }, {
        id: 101,
        name: "Red Velvet Cupcake",
        price: 4.99
      }, {
        id: 102,
        name: "Red Velvet Mini Cake",
        price: 9.99
      }, {
        id: 103,
        name: "Red Velvet Cheesecake",
        price: 8.99
      }, {
        id: 104,
        name: "Red Velvet Layer Cake",
        price: 7.99
      }, {
        id: 105,
        name: "Red Velvet Roll",
        price: 6.49
      }, {
        id: 106,
        name: "Red Velvet Whoopie Pie",
        price: 4.99
      }, {
        id: 107,
        name: "Red Velvet Bundt",
        price: 7.49
      }, {
        id: 108,
        name: "Red Velvet Cake Pop (3)",
        price: 5.99
      }],
      "Carrot": [{
        id: 109,
        name: "Classic Carrot Cake",
        price: 6.99
      }, {
        id: 110,
        name: "Carrot Walnut Slice",
        price: 7.49
      }, {
        id: 111,
        name: "Carrot Pineapple Cake",
        price: 7.49
      }, {
        id: 112,
        name: "Carrot Cupcake",
        price: 4.99
      }, {
        id: 113,
        name: "Carrot Bundt Cake",
        price: 7.99
      }, {
        id: 114,
        name: "Carrot Cream Cheese Roll",
        price: 8.49
      }, {
        id: 115,
        name: "Mini Carrot Cakes (4)",
        price: 11.99
      }, {
        id: 116,
        name: "Carrot Spice Cake",
        price: 7.49
      }, {
        id: 117,
        name: "Carrot Loaf",
        price: 8.99
      }]
    },
    "Cookies": {
      "Chocolate Chip": [{
        id: 118,
        name: "Classic Chocolate Chip",
        price: 2.99
      }, {
        id: 119,
        name: "Double Chocolate Chip",
        price: 3.49
      }, {
        id: 120,
        name: "Giant Chocolate Chip",
        price: 4.99
      }, {
        id: 121,
        name: "Mini Chocolate Chips (12)",
        price: 6.99
      }, {
        id: 122,
        name: "Chocolate Chip Walnut",
        price: 3.49
      }, {
        id: 123,
        name: "White Chocolate Chip",
        price: 3.29
      }, {
        id: 124,
        name: "Dark Chocolate Chip",
        price: 3.49
      }, {
        id: 125,
        name: "Sea Salt Chocolate Chip",
        price: 3.49
      }, {
        id: 126,
        name: "Chocolate Chip Cookie Box (6)",
        price: 9.99
      }],
      "Oatmeal": [{
        id: 127,
        name: "Oatmeal Raisin Cookie",
        price: 2.99
      }, {
        id: 128,
        name: "Oatmeal Cranberry",
        price: 3.29
      }, {
        id: 129,
        name: "Oatmeal Walnut",
        price: 3.49
      }, {
        id: 130,
        name: "Oatmeal Chocolate Chip",
        price: 3.49
      }, {
        id: 131,
        name: "Oatmeal Peanut Butter",
        price: 3.49
      }, {
        id: 132,
        name: "Oatmeal Apple Cinnamon",
        price: 3.29
      }, {
        id: 133,
        name: "Oatmeal Banana",
        price: 3.29
      }, {
        id: 134,
        name: "Oatmeal Coconut",
        price: 3.29
      }, {
        id: 135,
        name: "Oatmeal Cookie Box (6)",
        price: 9.99
      }],
      "Sugar": [{
        id: 136,
        name: "Classic Sugar Cookie",
        price: 2.49
      }, {
        id: 137,
        name: "Decorated Sugar Cookie",
        price: 3.99
      }, {
        id: 138,
        name: "Giant Sugar Cookie",
        price: 4.49
      }, {
        id: 139,
        name: "Sprinkle Sugar Cookie",
        price: 2.99
      }, {
        id: 140,
        name: "Lemon Sugar Cookie",
        price: 2.99
      }, {
        id: 141,
        name: "Brown Sugar Cookie",
        price: 2.79
      }, {
        id: 142,
        name: "Vanilla Sugar Cookie",
        price: 2.79
      }, {
        id: 143,
        name: "Sugar Cookie Sandwich",
        price: 4.49
      }, {
        id: 144,
        name: "Sugar Cookie Box (6)",
        price: 8.99
      }],
      "Peanut Butter": [{
        id: 145,
        name: "Classic Peanut Butter",
        price: 2.99
      }, {
        id: 146,
        name: "Peanut Butter Chocolate",
        price: 3.49
      }, {
        id: 147,
        name: "Peanut Butter Chip",
        price: 3.29
      }, {
        id: 148,
        name: "Peanut Butter Oatmeal",
        price: 3.29
      }, {
        id: 149,
        name: "Peanut Butter Blossoms",
        price: 3.49
      }, {
        id: 150,
        name: "Peanut Butter Sandwich",
        price: 4.49
      }, {
        id: 151,
        name: "Chunky Peanut Butter",
        price: 3.29
      }, {
        id: 152,
        name: "Peanut Butter Swirl",
        price: 3.49
      }, {
        id: 153,
        name: "PB Cookie Box (6)",
        price: 9.99
      }]
    },
    "Croissants": {
      "Plain": [{
        id: 154,
        name: "Butter Croissant",
        price: 3.99
      }, {
        id: 155,
        name: "Large Butter Croissant",
        price: 4.99
      }, {
        id: 156,
        name: "Mini Plain Croissants (4)",
        price: 6.99
      }, {
        id: 157,
        name: "Artisan Plain Croissant",
        price: 4.49
      }, {
        id: 158,
        name: "Vegan Croissant",
        price: 4.99
      }, {
        id: 159,
        name: "Whole Grain Croissant",
        price: 4.49
      }, {
        id: 160,
        name: "Flaky Butter Croissant",
        price: 4.29
      }, {
        id: 161,
        name: "French Butter Croissant",
        price: 4.79
      }, {
        id: 162,
        name: "Croissant Dozen",
        price: 39.99
      }],
      "Almond": [{
        id: 163,
        name: "Classic Almond Croissant",
        price: 4.99
      }, {
        id: 164,
        name: "Double Almond Croissant",
        price: 5.99
      }, {
        id: 165,
        name: "Almond Cream Croissant",
        price: 5.49
      }, {
        id: 166,
        name: "Toasted Almond Croissant",
        price: 5.29
      }, {
        id: 167,
        name: "Almond Paste Croissant",
        price: 5.49
      }, {
        id: 168,
        name: "Almond Chocolate Croissant",
        price: 5.99
      }, {
        id: 169,
        name: "Mini Almond Croissants (4)",
        price: 9.99
      }, {
        id: 170,
        name: "Almond Frangipane Croissant",
        price: 5.79
      }, {
        id: 171,
        name: "Almond Croissant Box (6)",
        price: 26.99
      }],
      "Chocolate": [{
        id: 172,
        name: "Classic Pain au Chocolat",
        price: 4.49
      }, {
        id: 173,
        name: "Double Chocolate Croissant",
        price: 5.49
      }, {
        id: 174,
        name: "Dark Chocolate Croissant",
        price: 4.99
      }, {
        id: 175,
        name: "White Chocolate Croissant",
        price: 4.99
      }, {
        id: 176,
        name: "Chocolate Hazelnut Croissant",
        price: 5.49
      }, {
        id: 177,
        name: "Mini Chocolate Croissants (4)",
        price: 8.99
      }, {
        id: 178,
        name: "Chocolate Almond Croissant",
        price: 5.99
      }, {
        id: 179,
        name: "Triple Chocolate Croissant",
        price: 5.99
      }, {
        id: 180,
        name: "Chocolate Croissant Box (6)",
        price: 24.99
      }]
    },
    "Muffins": {
      "Blueberry": [{
        id: 181,
        name: "Classic Blueberry Muffin",
        price: 3.99
      }, {
        id: 182,
        name: "Jumbo Blueberry Muffin",
        price: 4.99
      }, {
        id: 183,
        name: "Wild Blueberry Muffin",
        price: 4.49
      }, {
        id: 184,
        name: "Blueberry Streusel Muffin",
        price: 4.49
      }, {
        id: 185,
        name: "Blueberry Lemon Muffin",
        price: 4.29
      }, {
        id: 186,
        name: "Mini Blueberry Muffins (4)",
        price: 6.99
      }, {
        id: 187,
        name: "Blueberry Cream Cheese Muffin",
        price: 4.79
      }, {
        id: 188,
        name: "Blueberry Oat Muffin",
        price: 4.29
      }, {
        id: 189,
        name: "Blueberry Muffin Box (6)",
        price: 19.99
      }],
      "Banana Nut": [{
        id: 190,
        name: "Classic Banana Nut Muffin",
        price: 3.99
      }, {
        id: 191,
        name: "Banana Walnut Muffin",
        price: 4.49
      }, {
        id: 192,
        name: "Banana Pecan Muffin",
        price: 4.49
      }, {
        id: 193,
        name: "Jumbo Banana Nut",
        price: 4.99
      }, {
        id: 194,
        name: "Banana Chocolate Chip",
        price: 4.29
      }, {
        id: 195,
        name: "Mini Banana Nut Muffins (4)",
        price: 6.99
      }, {
        id: 196,
        name: "Banana Streusel Muffin",
        price: 4.29
      }, {
        id: 197,
        name: "Banana Coconut Muffin",
        price: 4.29
      }, {
        id: 198,
        name: "Banana Muffin Box (6)",
        price: 19.99
      }],
      "Chocolate Chip": [{
        id: 199,
        name: "Chocolate Chip Muffin",
        price: 3.99
      }, {
        id: 200,
        name: "Double Chocolate Muffin",
        price: 4.49
      }, {
        id: 201,
        name: "Jumbo Chocolate Chip",
        price: 4.99
      }, {
        id: 202,
        name: "Triple Chocolate Muffin",
        price: 4.79
      }, {
        id: 203,
        name: "White Chocolate Muffin",
        price: 4.29
      }, {
        id: 204,
        name: "Mini Chocolate Muffins (4)",
        price: 6.99
      }, {
        id: 205,
        name: "Chocolate Walnut Muffin",
        price: 4.49
      }, {
        id: 206,
        name: "Chocolate Streusel Muffin",
        price: 4.49
      }, {
        id: 207,
        name: "Chocolate Muffin Box (6)",
        price: 19.99
      }]
    },
    "Donuts": {
      "Glazed": [{
        id: 208,
        name: "Classic Glazed Donut",
        price: 2.49
      }, {
        id: 209,
        name: "Honey Glazed Donut",
        price: 2.79
      }, {
        id: 210,
        name: "Maple Glazed Donut",
        price: 2.79
      }, {
        id: 211,
        name: "Vanilla Glazed Donut",
        price: 2.69
      }, {
        id: 212,
        name: "Glazed Donut Holes (12)",
        price: 4.99
      }, {
        id: 213,
        name: "Jumbo Glazed Donut",
        price: 3.49
      }, {
        id: 214,
        name: "Glazed Twist",
        price: 2.79
      }, {
        id: 215,
        name: "Old Fashioned Glazed",
        price: 2.99
      }, {
        id: 216,
        name: "Glazed Dozen",
        price: 14.99
      }],
      "Chocolate": [{
        id: 217,
        name: "Chocolate Frosted Donut",
        price: 2.79
      }, {
        id: 218,
        name: "Double Chocolate Donut",
        price: 3.29
      }, {
        id: 219,
        name: "Chocolate Sprinkle Donut",
        price: 2.99
      }, {
        id: 220,
        name: "Chocolate Glazed Donut",
        price: 2.79
      }, {
        id: 221,
        name: "Chocolate Cream Filled",
        price: 3.49
      }, {
        id: 222,
        name: "Chocolate Donut Holes (12)",
        price: 5.49
      }, {
        id: 223,
        name: "Dark Chocolate Donut",
        price: 3.29
      }, {
        id: 224,
        name: "White Chocolate Donut",
        price: 3.29
      }, {
        id: 225,
        name: "Chocolate Dozen",
        price: 16.99
      }],
      "Boston Cream": [{
        id: 226,
        name: "Classic Boston Cream",
        price: 3.49
      }, {
        id: 227,
        name: "Jumbo Boston Cream",
        price: 4.49
      }, {
        id: 228,
        name: "Mini Boston Creams (4)",
        price: 6.99
      }, {
        id: 229,
        name: "Boston Cream Bar",
        price: 3.49
      }, {
        id: 230,
        name: "Double Boston Cream",
        price: 4.29
      }, {
        id: 231,
        name: "Boston Cream Twist",
        price: 3.79
      }, {
        id: 232,
        name: "Vanilla Boston Cream",
        price: 3.49
      }, {
        id: 233,
        name: "Chocolate Boston Cream",
        price: 3.79
      }, {
        id: 234,
        name: "Boston Cream Half Dozen",
        price: 16.99
      }]
    },
    "Pies": {
      "Apple": [{
        id: 235,
        name: "Classic Apple Pie Slice",
        price: 5.99
      }, {
        id: 236,
        name: "Dutch Apple Pie Slice",
        price: 6.49
      }, {
        id: 237,
        name: "Caramel Apple Pie",
        price: 6.99
      }, {
        id: 238,
        name: "Apple Crumb Pie",
        price: 6.49
      }, {
        id: 239,
        name: "Mini Apple Pie",
        price: 4.99
      }, {
        id: 240,
        name: "Apple Pie a la Mode",
        price: 8.99
      }, {
        id: 241,
        name: "Cinnamon Apple Pie",
        price: 6.49
      }, {
        id: 242,
        name: "Green Apple Pie",
        price: 6.49
      }, {
        id: 243,
        name: "Whole Apple Pie",
        price: 24.99
      }],
      "Cherry": [{
        id: 244,
        name: "Classic Cherry Pie Slice",
        price: 5.99
      }, {
        id: 245,
        name: "Tart Cherry Pie",
        price: 6.49
      }, {
        id: 246,
        name: "Sweet Cherry Pie",
        price: 6.49
      }, {
        id: 247,
        name: "Cherry Crumb Pie",
        price: 6.49
      }, {
        id: 248,
        name: "Mini Cherry Pie",
        price: 4.99
      }, {
        id: 249,
        name: "Cherry Pie a la Mode",
        price: 8.99
      }, {
        id: 250,
        name: "Black Cherry Pie",
        price: 6.99
      }, {
        id: 251,
        name: "Cherry Almond Pie",
        price: 7.49
      }, {
        id: 252,
        name: "Whole Cherry Pie",
        price: 24.99
      }],
      "Pumpkin": [{
        id: 253,
        name: "Classic Pumpkin Pie Slice",
        price: 5.49
      }, {
        id: 254,
        name: "Pumpkin Spice Pie",
        price: 5.99
      }, {
        id: 255,
        name: "Maple Pumpkin Pie",
        price: 6.49
      }, {
        id: 256,
        name: "Pumpkin Cream Pie",
        price: 6.99
      }, {
        id: 257,
        name: "Mini Pumpkin Pie",
        price: 4.49
      }, {
        id: 258,
        name: "Pumpkin Pie with Whipped Cream",
        price: 7.49
      }, {
        id: 259,
        name: "Streusel Pumpkin Pie",
        price: 6.49
      }, {
        id: 260,
        name: "Pumpkin Cheesecake Pie",
        price: 7.99
      }, {
        id: 261,
        name: "Whole Pumpkin Pie",
        price: 22.99
      }]
    }
  },
  "BAR MENU": {
    "Food": {
      "Appetizers": [{
        id: 300,
        name: "Crispy Calamari",
        price: 12.99
      }, {
        id: 301,
        name: "Spinach Artichoke Dip",
        price: 10.99
      }, {
        id: 302,
        name: "Loaded Potato Skins",
        price: 9.99
      }, {
        id: 303,
        name: "Mozzarella Sticks",
        price: 8.99
      }, {
        id: 304,
        name: "Buffalo Wings (10pc)",
        price: 13.99
      }, {
        id: 305,
        name: "Chicken Tenders",
        price: 11.99
      }, {
        id: 306,
        name: "Fried Pickles",
        price: 7.99
      }, {
        id: 307,
        name: "Jalapeño Poppers",
        price: 9.99
      }, {
        id: 308,
        name: "Nachos Grande",
        price: 12.99
      }],
      "Mains": [{
        id: 309,
        name: "Bar Burger Deluxe",
        price: 16.99
      }, {
        id: 310,
        name: "Fish & Chips",
        price: 15.99
      }, {
        id: 311,
        name: "Grilled Chicken Sandwich",
        price: 14.99
      }, {
        id: 312,
        name: "Philly Cheesesteak",
        price: 17.99
      }, {
        id: 313,
        name: "BBQ Pulled Pork",
        price: 15.99
      }, {
        id: 314,
        name: "Club Sandwich",
        price: 14.99
      }, {
        id: 315,
        name: "Reuben Sandwich",
        price: 15.99
      }, {
        id: 316,
        name: "BLT Deluxe",
        price: 12.99
      }, {
        id: 317,
        name: "Grilled Cheese & Tomato Soup",
        price: 11.99
      }],
      "Sides": [{
        id: 318,
        name: "Truffle Fries",
        price: 7.99
      }, {
        id: 319,
        name: "Onion Rings",
        price: 6.99
      }, {
        id: 320,
        name: "Coleslaw",
        price: 4.99
      }, {
        id: 321,
        name: "Sweet Potato Fries",
        price: 7.49
      }, {
        id: 322,
        name: "Mac & Cheese",
        price: 6.99
      }, {
        id: 323,
        name: "Side Salad",
        price: 5.99
      }, {
        id: 324,
        name: "Garlic Bread",
        price: 4.99
      }, {
        id: 325,
        name: "Loaded Fries",
        price: 8.99
      }, {
        id: 326,
        name: "Cheese Curds",
        price: 8.99
      }],
      "Salads": [{
        id: 327,
        name: "House Salad",
        price: 9.99
      }, {
        id: 328,
        name: "Caesar Salad",
        price: 10.99
      }, {
        id: 329,
        name: "Cobb Salad",
        price: 14.99
      }, {
        id: 330,
        name: "Greek Salad",
        price: 11.99
      }, {
        id: 331,
        name: "Buffalo Chicken Salad",
        price: 14.99
      }, {
        id: 332,
        name: "Spinach Salad",
        price: 11.99
      }, {
        id: 333,
        name: "Wedge Salad",
        price: 10.99
      }, {
        id: 334,
        name: "Asian Chicken Salad",
        price: 13.99
      }, {
        id: 335,
        name: "Southwest Salad",
        price: 13.99
      }]
    },
    "Desserts": {
      "Cakes": [{
        id: 336,
        name: "Molten Lava Cake",
        price: 9.99
      }, {
        id: 337,
        name: "New York Cheesecake",
        price: 8.99
      }, {
        id: 338,
        name: "Chocolate Layer Cake",
        price: 9.49
      }, {
        id: 339,
        name: "Carrot Cake",
        price: 8.49
      }, {
        id: 340,
        name: "Red Velvet Cake",
        price: 8.99
      }, {
        id: 341,
        name: "Tiramisu",
        price: 9.99
      }, {
        id: 342,
        name: "Key Lime Pie",
        price: 7.99
      }, {
        id: 343,
        name: "Cheesecake Bites",
        price: 7.99
      }, {
        id: 344,
        name: "Chocolate Mousse Cake",
        price: 9.49
      }],
      "Ice Cream": [{
        id: 345,
        name: "Vanilla Sundae",
        price: 6.99
      }, {
        id: 346,
        name: "Brownie a la Mode",
        price: 8.99
      }, {
        id: 347,
        name: "Chocolate Sundae",
        price: 6.99
      }, {
        id: 348,
        name: "Banana Split",
        price: 9.99
      }, {
        id: 349,
        name: "Ice Cream Float",
        price: 5.99
      }, {
        id: 350,
        name: "Milkshake",
        price: 6.99
      }, {
        id: 351,
        name: "Cookie Dough Sundae",
        price: 8.49
      }, {
        id: 352,
        name: "Strawberry Sundae",
        price: 6.99
      }, {
        id: 353,
        name: "Affogato",
        price: 7.49
      }],
      "Pies": [{
        id: 354,
        name: "Apple Pie Slice",
        price: 6.99
      }, {
        id: 355,
        name: "Pecan Pie Slice",
        price: 7.49
      }, {
        id: 356,
        name: "Key Lime Pie",
        price: 7.99
      }, {
        id: 357,
        name: "Chocolate Cream Pie",
        price: 7.49
      }, {
        id: 358,
        name: "Banana Cream Pie",
        price: 7.49
      }, {
        id: 359,
        name: "Coconut Cream Pie",
        price: 7.49
      }, {
        id: 360,
        name: "Pumpkin Pie",
        price: 6.99
      }, {
        id: 361,
        name: "Cherry Pie",
        price: 6.99
      }, {
        id: 362,
        name: "Lemon Meringue Pie",
        price: 7.49
      }]
    },
    "Drinks": {
      "Iced Tea": [{
        id: 363,
        name: "Classic Iced Tea",
        price: 3.99
      }, {
        id: 364,
        name: "Peach Iced Tea",
        price: 4.49
      }, {
        id: 365,
        name: "Arnold Palmer",
        price: 4.99
      }, {
        id: 366,
        name: "Raspberry Iced Tea",
        price: 4.49
      }, {
        id: 367,
        name: "Green Iced Tea",
        price: 3.99
      }, {
        id: 368,
        name: "Mango Iced Tea",
        price: 4.49
      }, {
        id: 369,
        name: "Passion Fruit Iced Tea",
        price: 4.49
      }, {
        id: 370,
        name: "Sweet Tea",
        price: 3.49
      }, {
        id: 371,
        name: "Unsweetened Iced Tea",
        price: 3.49
      }],
      "Soda": [{
        id: 372,
        name: "Coca Cola",
        price: 2.99
      }, {
        id: 373,
        name: "Sprite",
        price: 2.99
      }, {
        id: 374,
        name: "Ginger Ale",
        price: 2.99
      }, {
        id: 375,
        name: "Dr Pepper",
        price: 2.99
      }, {
        id: 376,
        name: "Root Beer",
        price: 2.99
      }, {
        id: 377,
        name: "Fanta Orange",
        price: 2.99
      }, {
        id: 378,
        name: "Lemonade",
        price: 3.49
      }, {
        id: 379,
        name: "Club Soda",
        price: 2.49
      }, {
        id: 380,
        name: "Tonic Water",
        price: 2.49
      }],
      "Lemonade": [{
        id: 381,
        name: "Classic Lemonade",
        price: 3.99
      }, {
        id: 382,
        name: "Strawberry Lemonade",
        price: 4.49
      }, {
        id: 383,
        name: "Raspberry Lemonade",
        price: 4.49
      }, {
        id: 384,
        name: "Lavender Lemonade",
        price: 4.99
      }, {
        id: 385,
        name: "Mango Lemonade",
        price: 4.49
      }, {
        id: 386,
        name: "Blueberry Lemonade",
        price: 4.49
      }, {
        id: 387,
        name: "Mint Lemonade",
        price: 4.49
      }, {
        id: 388,
        name: "Watermelon Lemonade",
        price: 4.49
      }, {
        id: 389,
        name: "Fresh Squeezed Lemonade",
        price: 4.99
      }]
    },
    "Beer": {
      "Lager": [{
        id: 390,
        name: "Budweiser",
        price: 5.99
      }, {
        id: 391,
        name: "Corona Extra",
        price: 6.99
      }, {
        id: 392,
        name: "Stella Artois",
        price: 7.49
      }, {
        id: 393,
        name: "Heineken",
        price: 6.99
      }, {
        id: 394,
        name: "Miller Lite",
        price: 5.49
      }, {
        id: 395,
        name: "Coors Light",
        price: 5.49
      }, {
        id: 396,
        name: "Modelo Especial",
        price: 6.99
      }, {
        id: 397,
        name: "Peroni",
        price: 7.49
      }, {
        id: 398,
        name: "Amstel Light",
        price: 6.49
      }],
      "IPA": [{
        id: 399,
        name: "Sierra Nevada IPA",
        price: 7.99
      }, {
        id: 400,
        name: "Lagunitas IPA",
        price: 7.99
      }, {
        id: 401,
        name: "Stone IPA",
        price: 8.49
      }, {
        id: 402,
        name: "Dogfish 60 Minute",
        price: 8.49
      }, {
        id: 403,
        name: "Goose Island IPA",
        price: 7.49
      }, {
        id: 404,
        name: "Bell's Two Hearted",
        price: 8.49
      }, {
        id: 405,
        name: "Founder's All Day",
        price: 7.49
      }, {
        id: 406,
        name: "Hazy Little Thing",
        price: 7.99
      }, {
        id: 407,
        name: "Voodoo Ranger",
        price: 7.99
      }],
      "Stout": [{
        id: 408,
        name: "Guinness Draught",
        price: 7.99
      }, {
        id: 409,
        name: "Left Hand Milk Stout",
        price: 8.49
      }, {
        id: 410,
        name: "Murphy's Irish Stout",
        price: 7.49
      }, {
        id: 411,
        name: "Founders Breakfast Stout",
        price: 9.99
      }, {
        id: 412,
        name: "North Coast Old Rasputin",
        price: 9.49
      }, {
        id: 413,
        name: "Samuel Smith Oatmeal",
        price: 8.49
      }, {
        id: 414,
        name: "Deschutes Obsidian",
        price: 7.99
      }, {
        id: 415,
        name: "Great Lakes Edmund Fitzgerald",
        price: 7.99
      }, {
        id: 416,
        name: "Brooklyn Black Chocolate",
        price: 8.99
      }],
      "Pilsner": [{
        id: 417,
        name: "Pilsner Urquell",
        price: 7.49
      }, {
        id: 418,
        name: "Bitburger",
        price: 6.99
      }, {
        id: 419,
        name: "Victory Prima Pils",
        price: 7.49
      }, {
        id: 420,
        name: "Firestone Walker Pivo",
        price: 7.99
      }, {
        id: 421,
        name: "Jever",
        price: 7.49
      }, {
        id: 422,
        name: "Trumer Pils",
        price: 6.99
      }, {
        id: 423,
        name: "Warsteiner",
        price: 6.99
      }, {
        id: 424,
        name: "Czechvar",
        price: 7.49
      }, {
        id: 425,
        name: "Lagunitas Pils",
        price: 6.99
      }]
    },
    "Wine": {
      "Red": [{
        id: 426,
        name: "Cabernet Sauvignon",
        price: 12.99
      }, {
        id: 427,
        name: "Merlot",
        price: 11.99
      }, {
        id: 428,
        name: "Pinot Noir",
        price: 13.99
      }, {
        id: 429,
        name: "Malbec",
        price: 12.99
      }, {
        id: 430,
        name: "Zinfandel",
        price: 11.99
      }, {
        id: 431,
        name: "Shiraz",
        price: 12.99
      }, {
        id: 432,
        name: "Sangiovese",
        price: 12.49
      }, {
        id: 433,
        name: "Tempranillo",
        price: 12.99
      }, {
        id: 434,
        name: "Red Blend",
        price: 11.49
      }],
      "White": [{
        id: 435,
        name: "Chardonnay",
        price: 11.99
      }, {
        id: 436,
        name: "Sauvignon Blanc",
        price: 10.99
      }, {
        id: 437,
        name: "Pinot Grigio",
        price: 10.99
      }, {
        id: 438,
        name: "Riesling",
        price: 10.99
      }, {
        id: 439,
        name: "Moscato",
        price: 9.99
      }, {
        id: 440,
        name: "Gewurztraminer",
        price: 11.99
      }, {
        id: 441,
        name: "Viognier",
        price: 12.49
      }, {
        id: 442,
        name: "Albarino",
        price: 11.99
      }, {
        id: 443,
        name: "White Blend",
        price: 10.49
      }],
      "Rosé": [{
        id: 444,
        name: "Provence Rosé",
        price: 12.99
      }, {
        id: 445,
        name: "White Zinfandel",
        price: 9.99
      }, {
        id: 446,
        name: "Grenache Rosé",
        price: 11.99
      }, {
        id: 447,
        name: "Côtes de Provence",
        price: 13.99
      }, {
        id: 448,
        name: "Spanish Rosado",
        price: 11.49
      }, {
        id: 449,
        name: "Pinot Noir Rosé",
        price: 12.49
      }, {
        id: 450,
        name: "Sangiovese Rosé",
        price: 11.99
      }, {
        id: 451,
        name: "Dry Rosé",
        price: 12.99
      }, {
        id: 452,
        name: "Sweet Rosé",
        price: 10.99
      }],
      "Sparkling": [{
        id: 453,
        name: "Prosecco",
        price: 11.99
      }, {
        id: 454,
        name: "Champagne",
        price: 18.99
      }, {
        id: 455,
        name: "Cava",
        price: 10.99
      }, {
        id: 456,
        name: "Cremant",
        price: 13.99
      }, {
        id: 457,
        name: "Sparkling Rosé",
        price: 12.99
      }, {
        id: 458,
        name: "Moscato d'Asti",
        price: 11.49
      }, {
        id: 459,
        name: "Brut",
        price: 12.99
      }, {
        id: 460,
        name: "Extra Dry",
        price: 11.99
      }, {
        id: 461,
        name: "Blanc de Blancs",
        price: 15.99
      }]
    },
    "Cocktails": {
      "Margarita": [{
        id: 462,
        name: "Classic Margarita",
        price: 10.99
      }, {
        id: 463,
        name: "Spicy Jalapeño Margarita",
        price: 12.99
      }, {
        id: 464,
        name: "Mango Margarita",
        price: 11.99
      }, {
        id: 465,
        name: "Strawberry Margarita",
        price: 11.99
      }, {
        id: 466,
        name: "Cadillac Margarita",
        price: 14.99
      }, {
        id: 467,
        name: "Skinny Margarita",
        price: 10.99
      }, {
        id: 468,
        name: "Frozen Margarita",
        price: 11.99
      }, {
        id: 469,
        name: "Blood Orange Margarita",
        price: 12.99
      }, {
        id: 470,
        name: "Tamarind Margarita",
        price: 12.99
      }],
      "Mojito": [{
        id: 471,
        name: "Classic Mojito",
        price: 10.99
      }, {
        id: 472,
        name: "Strawberry Mojito",
        price: 11.99
      }, {
        id: 473,
        name: "Coconut Mojito",
        price: 12.49
      }, {
        id: 474,
        name: "Mango Mojito",
        price: 11.99
      }, {
        id: 475,
        name: "Passion Fruit Mojito",
        price: 12.49
      }, {
        id: 476,
        name: "Watermelon Mojito",
        price: 11.99
      }, {
        id: 477,
        name: "Blackberry Mojito",
        price: 12.49
      }, {
        id: 478,
        name: "Cucumber Mojito",
        price: 11.49
      }, {
        id: 479,
        name: "Spicy Mojito",
        price: 12.49
      }],
      "Martini": [{
        id: 480,
        name: "Classic Dry Martini",
        price: 12.99
      }, {
        id: 481,
        name: "Espresso Martini",
        price: 13.99
      }, {
        id: 482,
        name: "Dirty Martini",
        price: 12.99
      }, {
        id: 483,
        name: "Lemon Drop Martini",
        price: 12.99
      }, {
        id: 484,
        name: "Cosmopolitan",
        price: 12.99
      }, {
        id: 485,
        name: "Chocolate Martini",
        price: 13.49
      }, {
        id: 486,
        name: "Apple Martini",
        price: 12.49
      }, {
        id: 487,
        name: "French Martini",
        price: 13.49
      }, {
        id: 488,
        name: "Vesper Martini",
        price: 14.99
      }],
      "Cosmopolitan": [{
        id: 489,
        name: "Classic Cosmopolitan",
        price: 12.99
      }, {
        id: 490,
        name: "White Cosmopolitan",
        price: 12.99
      }, {
        id: 491,
        name: "Pomegranate Cosmopolitan",
        price: 13.49
      }, {
        id: 492,
        name: "Raspberry Cosmopolitan",
        price: 13.49
      }, {
        id: 493,
        name: "Blood Orange Cosmo",
        price: 13.49
      }, {
        id: 494,
        name: "Elderflower Cosmopolitan",
        price: 13.99
      }, {
        id: 495,
        name: "Passion Fruit Cosmo",
        price: 13.49
      }, {
        id: 496,
        name: "Grapefruit Cosmo",
        price: 12.99
      }, {
        id: 497,
        name: "Cranberry Cosmo",
        price: 12.49
      }]
    },
    "Spirits": {
      "Whiskey": [{
        id: 498,
        name: "Jack Daniels",
        price: 9.99
      }, {
        id: 499,
        name: "Jim Beam",
        price: 8.99
      }, {
        id: 500,
        name: "Maker's Mark",
        price: 11.99
      }, {
        id: 501,
        name: "Woodford Reserve",
        price: 13.99
      }, {
        id: 502,
        name: "Buffalo Trace",
        price: 11.99
      }, {
        id: 503,
        name: "Bulleit Bourbon",
        price: 11.99
      }, {
        id: 504,
        name: "Jameson Irish",
        price: 10.99
      }, {
        id: 505,
        name: "Crown Royal",
        price: 10.99
      }, {
        id: 506,
        name: "Johnny Walker Black",
        price: 13.99
      }],
      "Vodka": [{
        id: 507,
        name: "Grey Goose",
        price: 12.99
      }, {
        id: 508,
        name: "Tito's Handmade",
        price: 10.99
      }, {
        id: 509,
        name: "Belvedere",
        price: 12.99
      }, {
        id: 510,
        name: "Ketel One",
        price: 11.99
      }, {
        id: 511,
        name: "Absolut",
        price: 9.99
      }, {
        id: 512,
        name: "Stolichnaya",
        price: 9.99
      }, {
        id: 513,
        name: "Smirnoff",
        price: 8.99
      }, {
        id: 514,
        name: "Ciroc",
        price: 13.99
      }, {
        id: 515,
        name: "Chopin",
        price: 12.99
      }],
      "Rum": [{
        id: 516,
        name: "Bacardi White",
        price: 8.99
      }, {
        id: 517,
        name: "Captain Morgan",
        price: 9.99
      }, {
        id: 518,
        name: "Malibu Coconut",
        price: 9.99
      }, {
        id: 519,
        name: "Havana Club",
        price: 11.99
      }, {
        id: 520,
        name: "Mount Gay",
        price: 11.99
      }, {
        id: 521,
        name: "Appleton Estate",
        price: 12.99
      }, {
        id: 522,
        name: "Ron Zacapa",
        price: 15.99
      }, {
        id: 523,
        name: "Diplomatico",
        price: 14.99
      }, {
        id: 524,
        name: "Kraken Black",
        price: 10.99
      }],
      "Tequila": [{
        id: 525,
        name: "Patron Silver",
        price: 13.99
      }, {
        id: 526,
        name: "Don Julio Blanco",
        price: 14.99
      }, {
        id: 527,
        name: "Casamigos Blanco",
        price: 14.99
      }, {
        id: 528,
        name: "Herradura Silver",
        price: 12.99
      }, {
        id: 529,
        name: "Jose Cuervo Gold",
        price: 8.99
      }, {
        id: 530,
        name: "Espolon Blanco",
        price: 10.99
      }, {
        id: 531,
        name: "1800 Silver",
        price: 11.99
      }, {
        id: 532,
        name: "Clase Azul Reposado",
        price: 29.99
      }, {
        id: 533,
        name: "Fortaleza Blanco",
        price: 16.99
      }]
    }
  },
  "HAPPY HOUR M/W": {
    "Appetizers": {
      "Wings": [{
        id: 600,
        name: "Buffalo Wings (10pc)",
        price: 9.99
      }, {
        id: 601,
        name: "BBQ Wings (10pc)",
        price: 9.99
      }, {
        id: 602,
        name: "Garlic Parmesan Wings",
        price: 10.99
      }, {
        id: 603,
        name: "Honey Sriracha Wings",
        price: 10.99
      }, {
        id: 604,
        name: "Teriyaki Wings",
        price: 10.99
      }, {
        id: 605,
        name: "Lemon Pepper Wings",
        price: 9.99
      }, {
        id: 606,
        name: "Nashville Hot Wings",
        price: 11.99
      }, {
        id: 607,
        name: "Korean BBQ Wings",
        price: 11.99
      }, {
        id: 608,
        name: "Sweet Chili Wings",
        price: 10.49
      }],
      "Nachos": [{
        id: 609,
        name: "Loaded Nachos",
        price: 8.99
      }, {
        id: 610,
        name: "Chicken Nachos",
        price: 10.99
      }, {
        id: 611,
        name: "Beef Nachos Supreme",
        price: 11.99
      }, {
        id: 612,
        name: "Veggie Nachos",
        price: 9.99
      }, {
        id: 613,
        name: "BBQ Pulled Pork Nachos",
        price: 12.99
      }, {
        id: 614,
        name: "Queso Nachos",
        price: 9.99
      }, {
        id: 615,
        name: "Carnitas Nachos",
        price: 12.99
      }, {
        id: 616,
        name: "Street Taco Nachos",
        price: 11.99
      }, {
        id: 617,
        name: "Buffalo Chicken Nachos",
        price: 12.99
      }],
      "Dips": [{
        id: 618,
        name: "Guacamole & Chips",
        price: 7.99
      }, {
        id: 619,
        name: "Queso Dip",
        price: 6.99
      }, {
        id: 620,
        name: "Salsa Trio",
        price: 5.99
      }, {
        id: 621,
        name: "Spinach Artichoke Dip",
        price: 9.99
      }, {
        id: 622,
        name: "Buffalo Chicken Dip",
        price: 10.99
      }, {
        id: 623,
        name: "Beer Cheese Dip",
        price: 8.99
      }, {
        id: 624,
        name: "Hummus Plate",
        price: 7.99
      }, {
        id: 625,
        name: "Seven Layer Dip",
        price: 10.99
      }, {
        id: 626,
        name: "Crab Dip",
        price: 12.99
      }],
      "Fries": [{
        id: 627,
        name: "Classic Fries",
        price: 4.99
      }, {
        id: 628,
        name: "Loaded Fries",
        price: 8.99
      }, {
        id: 629,
        name: "Truffle Fries",
        price: 7.99
      }, {
        id: 630,
        name: "Cheese Fries",
        price: 6.99
      }, {
        id: 631,
        name: "Chili Cheese Fries",
        price: 9.99
      }, {
        id: 632,
        name: "Garlic Parmesan Fries",
        price: 7.49
      }, {
        id: 633,
        name: "Cajun Fries",
        price: 5.99
      }, {
        id: 634,
        name: "Sweet Potato Fries",
        price: 6.49
      }, {
        id: 635,
        name: "Poutine",
        price: 10.99
      }]
    },
    "Wings": {
      "Buffalo": [{
        id: 636,
        name: "Mild Buffalo Wings (6)",
        price: 7.99
      }, {
        id: 637,
        name: "Hot Buffalo Wings (6)",
        price: 7.99
      }, {
        id: 638,
        name: "Extra Hot Wings (6)",
        price: 8.49
      }, {
        id: 639,
        name: "Nuclear Wings (6)",
        price: 9.99
      }, {
        id: 640,
        name: "Buffalo Wings (10)",
        price: 11.99
      }, {
        id: 641,
        name: "Buffalo Wings (20)",
        price: 21.99
      }, {
        id: 642,
        name: "Buffalo Boneless Wings",
        price: 10.99
      }, {
        id: 643,
        name: "Buffalo Wing Bucket (50)",
        price: 49.99
      }, {
        id: 644,
        name: "Carolina Reaper Wings",
        price: 12.99
      }],
      "BBQ": [{
        id: 645,
        name: "Honey BBQ Wings (6)",
        price: 7.99
      }, {
        id: 646,
        name: "Smoky BBQ Wings (6)",
        price: 7.99
      }, {
        id: 647,
        name: "Kansas City BBQ (6)",
        price: 8.49
      }, {
        id: 648,
        name: "Memphis BBQ Wings",
        price: 8.49
      }, {
        id: 649,
        name: "Texas BBQ Wings",
        price: 8.49
      }, {
        id: 650,
        name: "Carolina BBQ Wings",
        price: 8.49
      }, {
        id: 651,
        name: "BBQ Wings (10)",
        price: 11.99
      }, {
        id: 652,
        name: "BBQ Wings (20)",
        price: 21.99
      }, {
        id: 653,
        name: "Bourbon BBQ Wings",
        price: 9.99
      }],
      "Honey Garlic": [{
        id: 654,
        name: "Classic Honey Garlic (6)",
        price: 7.99
      }, {
        id: 655,
        name: "Honey Garlic (10)",
        price: 11.99
      }, {
        id: 656,
        name: "Honey Garlic (20)",
        price: 21.99
      }, {
        id: 657,
        name: "Spicy Honey Garlic",
        price: 8.49
      }, {
        id: 658,
        name: "Honey Garlic Boneless",
        price: 10.99
      }, {
        id: 659,
        name: "Honey Sriracha Garlic",
        price: 8.99
      }, {
        id: 660,
        name: "Sweet Garlic Wings",
        price: 7.99
      }, {
        id: 661,
        name: "Ginger Garlic Wings",
        price: 8.49
      }, {
        id: 662,
        name: "Sesame Honey Garlic",
        price: 8.99
      }]
    },
    "Sliders": {
      "Beef": [{
        id: 663,
        name: "Classic Beef Sliders (3)",
        price: 10.99
      }, {
        id: 664,
        name: "Bacon Cheese Sliders (3)",
        price: 12.99
      }, {
        id: 665,
        name: "Mushroom Swiss Sliders (3)",
        price: 11.99
      }, {
        id: 666,
        name: "BBQ Beef Sliders (3)",
        price: 11.99
      }, {
        id: 667,
        name: "Jalapeño Beef Sliders (3)",
        price: 11.99
      }, {
        id: 668,
        name: "Patty Melt Sliders (3)",
        price: 12.49
      }, {
        id: 669,
        name: "Truffle Beef Sliders (3)",
        price: 13.99
      }, {
        id: 670,
        name: "Cheeseburger Sliders (3)",
        price: 11.49
      }, {
        id: 671,
        name: "Western Sliders (3)",
        price: 12.49
      }],
      "Chicken": [{
        id: 672,
        name: "Crispy Chicken Sliders (3)",
        price: 10.99
      }, {
        id: 673,
        name: "Buffalo Chicken Sliders (3)",
        price: 11.99
      }, {
        id: 674,
        name: "Nashville Hot Sliders (3)",
        price: 12.99
      }, {
        id: 675,
        name: "BBQ Chicken Sliders (3)",
        price: 11.49
      }, {
        id: 676,
        name: "Honey Mustard Sliders (3)",
        price: 11.49
      }, {
        id: 677,
        name: "Ranch Chicken Sliders (3)",
        price: 11.49
      }, {
        id: 678,
        name: "Grilled Chicken Sliders (3)",
        price: 10.99
      }, {
        id: 679,
        name: "Teriyaki Chicken Sliders (3)",
        price: 11.99
      }, {
        id: 680,
        name: "Southwest Chicken Sliders (3)",
        price: 12.49
      }],
      "Pulled Pork": [{
        id: 681,
        name: "BBQ Pulled Pork Sliders (3)",
        price: 11.99
      }, {
        id: 682,
        name: "Carolina Pulled Pork (3)",
        price: 12.49
      }, {
        id: 683,
        name: "Spicy Pulled Pork (3)",
        price: 12.49
      }, {
        id: 684,
        name: "Hawaiian Pulled Pork (3)",
        price: 12.99
      }, {
        id: 685,
        name: "Classic Pulled Pork (3)",
        price: 11.49
      }, {
        id: 686,
        name: "Memphis Pulled Pork (3)",
        price: 12.49
      }, {
        id: 687,
        name: "Apple Cider Pulled Pork (3)",
        price: 12.99
      }, {
        id: 688,
        name: "Jalapeño Pulled Pork (3)",
        price: 12.49
      }, {
        id: 689,
        name: "Honey Bourbon Pulled Pork (3)",
        price: 13.49
      }]
    },
    "Nachos": {
      "Classic": [{
        id: 690,
        name: "Cheese Nachos",
        price: 7.99
      }, {
        id: 691,
        name: "Loaded Classic Nachos",
        price: 9.99
      }, {
        id: 692,
        name: "Supreme Nachos",
        price: 11.99
      }, {
        id: 693,
        name: "Deluxe Nachos",
        price: 12.99
      }, {
        id: 694,
        name: "Mini Nachos",
        price: 5.99
      }, {
        id: 695,
        name: "Giant Nachos",
        price: 16.99
      }, {
        id: 696,
        name: "Nacho Plate",
        price: 10.99
      }, {
        id: 697,
        name: "Bar Nachos",
        price: 9.49
      }, {
        id: 698,
        name: "Tex-Mex Nachos",
        price: 11.99
      }],
      "Supreme": [{
        id: 699,
        name: "Chicken Supreme Nachos",
        price: 12.99
      }, {
        id: 700,
        name: "Beef Supreme Nachos",
        price: 13.99
      }, {
        id: 701,
        name: "Mixed Supreme Nachos",
        price: 14.99
      }, {
        id: 702,
        name: "Veggie Supreme Nachos",
        price: 11.99
      }, {
        id: 703,
        name: "Supreme Platter",
        price: 17.99
      }, {
        id: 704,
        name: "Ultimate Supreme",
        price: 18.99
      }, {
        id: 705,
        name: "Fiesta Supreme",
        price: 15.99
      }, {
        id: 706,
        name: "Grand Supreme",
        price: 19.99
      }, {
        id: 707,
        name: "Southwest Supreme",
        price: 14.99
      }]
    },
    "Beer": {
      "Lager": [{
        id: 708,
        name: "HH Bud Light",
        price: 3.99
      }, {
        id: 709,
        name: "HH Miller Lite",
        price: 3.99
      }, {
        id: 710,
        name: "HH Coors Light",
        price: 3.99
      }, {
        id: 711,
        name: "HH Corona",
        price: 4.99
      }, {
        id: 712,
        name: "HH Modelo",
        price: 4.99
      }, {
        id: 713,
        name: "HH Stella",
        price: 5.49
      }, {
        id: 714,
        name: "HH Heineken",
        price: 5.49
      }, {
        id: 715,
        name: "HH Dos Equis",
        price: 4.99
      }, {
        id: 716,
        name: "HH Pacifico",
        price: 4.99
      }],
      "IPA": [{
        id: 717,
        name: "HH Local IPA",
        price: 5.99
      }, {
        id: 718,
        name: "HH Hazy IPA",
        price: 5.99
      }, {
        id: 719,
        name: "HH West Coast IPA",
        price: 5.99
      }, {
        id: 720,
        name: "HH Session IPA",
        price: 5.49
      }, {
        id: 721,
        name: "HH Double IPA",
        price: 6.99
      }, {
        id: 722,
        name: "HH New England IPA",
        price: 6.49
      }, {
        id: 723,
        name: "HH Tropical IPA",
        price: 5.99
      }, {
        id: 724,
        name: "HH Citrus IPA",
        price: 5.99
      }, {
        id: 725,
        name: "HH Imperial IPA",
        price: 7.49
      }]
    },
    "Cocktails": {
      "Margarita": [{
        id: 726,
        name: "HH Classic Margarita",
        price: 6.99
      }, {
        id: 727,
        name: "HH Frozen Margarita",
        price: 7.99
      }, {
        id: 728,
        name: "HH Mango Margarita",
        price: 7.99
      }, {
        id: 729,
        name: "HH Strawberry Margarita",
        price: 7.99
      }, {
        id: 730,
        name: "HH Spicy Margarita",
        price: 7.99
      }, {
        id: 731,
        name: "HH Skinny Margarita",
        price: 6.99
      }, {
        id: 732,
        name: "HH Cadillac Margarita",
        price: 9.99
      }, {
        id: 733,
        name: "HH Pitcher Margarita",
        price: 19.99
      }, {
        id: 734,
        name: "HH Top Shelf Margarita",
        price: 10.99
      }],
      "Mojito": [{
        id: 735,
        name: "HH Classic Mojito",
        price: 6.99
      }, {
        id: 736,
        name: "HH Passion Fruit Mojito",
        price: 7.99
      }, {
        id: 737,
        name: "HH Strawberry Mojito",
        price: 7.99
      }, {
        id: 738,
        name: "HH Mango Mojito",
        price: 7.99
      }, {
        id: 739,
        name: "HH Coconut Mojito",
        price: 7.99
      }, {
        id: 740,
        name: "HH Watermelon Mojito",
        price: 7.99
      }, {
        id: 741,
        name: "HH Blackberry Mojito",
        price: 7.99
      }, {
        id: 742,
        name: "HH Pitcher Mojito",
        price: 19.99
      }, {
        id: 743,
        name: "HH Virgin Mojito",
        price: 5.99
      }],
      "Old Fashioned": [{
        id: 744,
        name: "HH Classic Old Fashioned",
        price: 7.99
      }, {
        id: 745,
        name: "HH Bourbon Old Fashioned",
        price: 8.99
      }, {
        id: 746,
        name: "HH Rye Old Fashioned",
        price: 8.99
      }, {
        id: 747,
        name: "HH Smoked Old Fashioned",
        price: 10.99
      }, {
        id: 748,
        name: "HH Maple Old Fashioned",
        price: 8.99
      }, {
        id: 749,
        name: "HH Honey Old Fashioned",
        price: 8.99
      }, {
        id: 750,
        name: "HH Orange Old Fashioned",
        price: 8.49
      }, {
        id: 751,
        name: "HH Cherry Old Fashioned",
        price: 8.49
      }, {
        id: 752,
        name: "HH Premium Old Fashioned",
        price: 11.99
      }]
    }
  },
  "Holiday Menu": {
    "Starters": {
      "Soup": [{
        id: 800,
        name: "Butternut Squash Soup",
        price: 8.99
      }, {
        id: 801,
        name: "French Onion Soup",
        price: 9.99
      }, {
        id: 802,
        name: "Lobster Bisque",
        price: 14.99
      }, {
        id: 803,
        name: "Chestnut Soup",
        price: 10.99
      }, {
        id: 804,
        name: "Wild Mushroom Soup",
        price: 9.99
      }, {
        id: 805,
        name: "Tomato Bisque",
        price: 8.49
      }, {
        id: 806,
        name: "Cream of Potato",
        price: 7.99
      }, {
        id: 807,
        name: "Split Pea Soup",
        price: 7.99
      }, {
        id: 808,
        name: "Minestrone",
        price: 8.49
      }],
      "Salad": [{
        id: 809,
        name: "Winter Harvest Salad",
        price: 10.99
      }, {
        id: 810,
        name: "Cranberry Walnut Salad",
        price: 11.99
      }, {
        id: 811,
        name: "Pear & Gorgonzola Salad",
        price: 12.99
      }, {
        id: 812,
        name: "Roasted Beet Salad",
        price: 11.99
      }, {
        id: 813,
        name: "Apple Cider Salad",
        price: 10.99
      }, {
        id: 814,
        name: "Kale Caesar Salad",
        price: 11.49
      }, {
        id: 815,
        name: "Fig & Prosciutto Salad",
        price: 14.99
      }, {
        id: 816,
        name: "Pomegranate Salad",
        price: 12.49
      }, {
        id: 817,
        name: "Festive House Salad",
        price: 9.99
      }],
      "Bruschetta": [{
        id: 818,
        name: "Classic Tomato Bruschetta",
        price: 9.99
      }, {
        id: 819,
        name: "Mushroom Truffle Bruschetta",
        price: 13.99
      }, {
        id: 820,
        name: "Goat Cheese Bruschetta",
        price: 11.99
      }, {
        id: 821,
        name: "Burrata Bruschetta",
        price: 14.99
      }, {
        id: 822,
        name: "Fig & Prosciutto Bruschetta",
        price: 13.99
      }, {
        id: 823,
        name: "Olive Tapenade Bruschetta",
        price: 10.99
      }, {
        id: 824,
        name: "Roasted Pepper Bruschetta",
        price: 10.99
      }, {
        id: 825,
        name: "Smoked Salmon Bruschetta",
        price: 15.99
      }, {
        id: 826,
        name: "Bruschetta Trio",
        price: 16.99
      }]
    },
    "Mains": {
      "Steak": [{
        id: 827,
        name: "Prime Rib (16oz)",
        price: 44.99
      }, {
        id: 828,
        name: "Filet Mignon (8oz)",
        price: 48.99
      }, {
        id: 829,
        name: "Ribeye (14oz)",
        price: 46.99
      }, {
        id: 830,
        name: "NY Strip (12oz)",
        price: 42.99
      }, {
        id: 831,
        name: "Porterhouse (24oz)",
        price: 64.99
      }, {
        id: 832,
        name: "Bone-In Ribeye (20oz)",
        price: 56.99
      }, {
        id: 833,
        name: "Tomahawk Steak",
        price: 79.99
      }, {
        id: 834,
        name: "Surf & Turf",
        price: 69.99
      }, {
        id: 835,
        name: "Steak Oscar",
        price: 54.99
      }],
      "Chicken": [{
        id: 836,
        name: "Herb Roasted Chicken",
        price: 26.99
      }, {
        id: 837,
        name: "Stuffed Chicken Breast",
        price: 28.99
      }, {
        id: 838,
        name: "Chicken Marsala",
        price: 27.99
      }, {
        id: 839,
        name: "Chicken Piccata",
        price: 26.99
      }, {
        id: 840,
        name: "Lemon Herb Chicken",
        price: 25.99
      }, {
        id: 841,
        name: "Chicken Cordon Bleu",
        price: 29.99
      }, {
        id: 842,
        name: "Chicken Florentine",
        price: 27.99
      }, {
        id: 843,
        name: "Roasted Half Chicken",
        price: 28.99
      }, {
        id: 844,
        name: "Chicken Wellington",
        price: 34.99
      }],
      "Fish": [{
        id: 845,
        name: "Grilled Salmon",
        price: 32.99
      }, {
        id: 846,
        name: "Pan Seared Halibut",
        price: 38.99
      }, {
        id: 847,
        name: "Baked Cod",
        price: 28.99
      }, {
        id: 848,
        name: "Lobster Stuffed Sole",
        price: 42.99
      }, {
        id: 849,
        name: "Miso Glazed Sea Bass",
        price: 44.99
      }, {
        id: 850,
        name: "Herb Crusted Trout",
        price: 29.99
      }, {
        id: 851,
        name: "Blackened Snapper",
        price: 34.99
      }, {
        id: 852,
        name: "Salmon Wellington",
        price: 38.99
      }, {
        id: 853,
        name: "Seafood Stuffed Flounder",
        price: 36.99
      }]
    },
    "Turkey": {
      "Roasted": [{
        id: 854,
        name: "Roasted Turkey Plate",
        price: 24.99
      }, {
        id: 855,
        name: "Turkey Dinner for Two",
        price: 44.99
      }, {
        id: 856,
        name: "Traditional Turkey Dinner",
        price: 26.99
      }, {
        id: 857,
        name: "Herb Roasted Turkey",
        price: 27.99
      }, {
        id: 858,
        name: "Turkey with Gravy",
        price: 24.99
      }, {
        id: 859,
        name: "Family Turkey Feast",
        price: 89.99
      }, {
        id: 860,
        name: "Turkey Breast Plate",
        price: 22.99
      }, {
        id: 861,
        name: "Carved Turkey Dinner",
        price: 25.99
      }, {
        id: 862,
        name: "Turkey & Stuffing Plate",
        price: 26.99
      }],
      "Smoked": [{
        id: 863,
        name: "Smoked Turkey Breast",
        price: 26.99
      }, {
        id: 864,
        name: "Applewood Smoked Turkey",
        price: 28.99
      }, {
        id: 865,
        name: "Hickory Smoked Turkey",
        price: 28.99
      }, {
        id: 866,
        name: "Cajun Smoked Turkey",
        price: 29.99
      }, {
        id: 867,
        name: "Maple Smoked Turkey",
        price: 29.99
      }, {
        id: 868,
        name: "Honey Smoked Turkey",
        price: 28.99
      }, {
        id: 869,
        name: "Smoked Turkey Leg",
        price: 19.99
      }, {
        id: 870,
        name: "Smoked Turkey Feast",
        price: 94.99
      }, {
        id: 871,
        name: "Bourbon Smoked Turkey",
        price: 30.99
      }],
      "Fried": [{
        id: 872,
        name: "Fried Turkey Plate",
        price: 27.99
      }, {
        id: 873,
        name: "Cajun Fried Turkey",
        price: 29.99
      }, {
        id: 874,
        name: "Southern Fried Turkey",
        price: 28.99
      }, {
        id: 875,
        name: "Buttermilk Fried Turkey",
        price: 28.99
      }, {
        id: 876,
        name: "Crispy Fried Turkey Breast",
        price: 26.99
      }, {
        id: 877,
        name: "Spicy Fried Turkey",
        price: 29.99
      }, {
        id: 878,
        name: "Garlic Fried Turkey",
        price: 28.99
      }, {
        id: 879,
        name: "Fried Turkey Feast",
        price: 99.99
      }, {
        id: 880,
        name: "Honey Fried Turkey",
        price: 29.99
      }]
    },
    "Ham": {
      "Honey Glazed": [{
        id: 881,
        name: "Honey Glazed Ham Plate",
        price: 22.99
      }, {
        id: 882,
        name: "Ham Steak Dinner",
        price: 19.99
      }, {
        id: 883,
        name: "Spiral Honey Ham",
        price: 24.99
      }, {
        id: 884,
        name: "Brown Sugar Honey Ham",
        price: 23.99
      }, {
        id: 885,
        name: "Honey Ham Feast",
        price: 79.99
      }, {
        id: 886,
        name: "Clove Studded Ham",
        price: 25.99
      }, {
        id: 887,
        name: "Honey Dijon Ham",
        price: 24.99
      }, {
        id: 888,
        name: "Pineapple Honey Ham",
        price: 25.99
      }, {
        id: 889,
        name: "Holiday Honey Ham",
        price: 26.99
      }],
      "Smoked": [{
        id: 890,
        name: "Smoked Ham Platter",
        price: 24.99
      }, {
        id: 891,
        name: "Country Smoked Ham",
        price: 23.99
      }, {
        id: 892,
        name: "Hickory Smoked Ham",
        price: 25.99
      }, {
        id: 893,
        name: "Applewood Ham",
        price: 26.99
      }, {
        id: 894,
        name: "Double Smoked Ham",
        price: 27.99
      }, {
        id: 895,
        name: "Maple Smoked Ham",
        price: 25.99
      }, {
        id: 896,
        name: "Virginia Smoked Ham",
        price: 26.99
      }, {
        id: 897,
        name: "Black Forest Ham",
        price: 24.99
      }, {
        id: 898,
        name: "Smoked Ham Feast",
        price: 84.99
      }],
      "Spiral": [{
        id: 899,
        name: "Classic Spiral Ham",
        price: 24.99
      }, {
        id: 900,
        name: "Honey Spiral Ham",
        price: 26.99
      }, {
        id: 901,
        name: "Brown Sugar Spiral",
        price: 25.99
      }, {
        id: 902,
        name: "Maple Spiral Ham",
        price: 26.99
      }, {
        id: 903,
        name: "Pineapple Spiral Ham",
        price: 27.99
      }, {
        id: 904,
        name: "Bourbon Spiral Ham",
        price: 28.99
      }, {
        id: 905,
        name: "Spiral Ham Feast",
        price: 89.99
      }, {
        id: 906,
        name: "Half Spiral Ham",
        price: 44.99
      }, {
        id: 907,
        name: "Quarter Spiral Ham",
        price: 24.99
      }]
    },
    "Desserts": {
      "Pies": [{
        id: 908,
        name: "Pumpkin Pie Slice",
        price: 7.99
      }, {
        id: 909,
        name: "Pecan Pie Slice",
        price: 8.99
      }, {
        id: 910,
        name: "Apple Pie a la Mode",
        price: 9.99
      }, {
        id: 911,
        name: "Sweet Potato Pie",
        price: 7.99
      }, {
        id: 912,
        name: "Mincemeat Pie",
        price: 8.49
      }, {
        id: 913,
        name: "Bourbon Pecan Pie",
        price: 9.99
      }, {
        id: 914,
        name: "Cranberry Apple Pie",
        price: 8.99
      }, {
        id: 915,
        name: "Eggnog Cream Pie",
        price: 8.99
      }, {
        id: 916,
        name: "Caramel Apple Pie",
        price: 9.49
      }],
      "Cakes": [{
        id: 917,
        name: "Yule Log Cake",
        price: 8.99
      }, {
        id: 918,
        name: "Eggnog Cheesecake",
        price: 9.99
      }, {
        id: 919,
        name: "Red Velvet Cake",
        price: 8.99
      }, {
        id: 920,
        name: "Gingerbread Cake",
        price: 7.99
      }, {
        id: 921,
        name: "Peppermint Chocolate Cake",
        price: 9.49
      }, {
        id: 922,
        name: "Cranberry Pound Cake",
        price: 7.99
      }, {
        id: 923,
        name: "Rum Cake",
        price: 9.99
      }, {
        id: 924,
        name: "Fruitcake",
        price: 8.49
      }, {
        id: 925,
        name: "Spice Cake",
        price: 7.99
      }],
      "Cookies": [{
        id: 926,
        name: "Gingerbread Cookies (6)",
        price: 6.99
      }, {
        id: 927,
        name: "Sugar Cookie Assortment",
        price: 7.99
      }, {
        id: 928,
        name: "Peppermint Cookies (6)",
        price: 6.99
      }, {
        id: 929,
        name: "Snickerdoodles (6)",
        price: 5.99
      }, {
        id: 930,
        name: "Linzer Cookies (4)",
        price: 7.99
      }, {
        id: 931,
        name: "Holiday Cookie Box",
        price: 14.99
      }, {
        id: 932,
        name: "Thumbprint Cookies (6)",
        price: 6.99
      }, {
        id: 933,
        name: "Pfeffernusse (8)",
        price: 6.99
      }, {
        id: 934,
        name: "Butter Cookies (8)",
        price: 7.49
      }]
    },
    "Sides": {
      "Mashed Potatoes": [{
        id: 935,
        name: "Classic Mashed Potatoes",
        price: 5.99
      }, {
        id: 936,
        name: "Garlic Mashed Potatoes",
        price: 6.49
      }, {
        id: 937,
        name: "Loaded Mashed Potatoes",
        price: 7.99
      }, {
        id: 938,
        name: "Truffle Mashed Potatoes",
        price: 8.99
      }, {
        id: 939,
        name: "Sour Cream Mashed",
        price: 6.49
      }, {
        id: 940,
        name: "Roasted Garlic Mashed",
        price: 6.99
      }, {
        id: 941,
        name: "Herb Mashed Potatoes",
        price: 6.49
      }, {
        id: 942,
        name: "Bacon Cheddar Mashed",
        price: 7.99
      }, {
        id: 943,
        name: "Sweet Potato Mash",
        price: 6.99
      }],
      "Stuffing": [{
        id: 944,
        name: "Traditional Stuffing",
        price: 5.99
      }, {
        id: 945,
        name: "Cornbread Stuffing",
        price: 6.49
      }, {
        id: 946,
        name: "Sausage Stuffing",
        price: 7.49
      }, {
        id: 947,
        name: "Apple Walnut Stuffing",
        price: 7.49
      }, {
        id: 948,
        name: "Wild Mushroom Stuffing",
        price: 7.99
      }, {
        id: 949,
        name: "Herb Stuffing",
        price: 5.99
      }, {
        id: 950,
        name: "Chestnut Stuffing",
        price: 7.99
      }, {
        id: 951,
        name: "Oyster Stuffing",
        price: 8.99
      }, {
        id: 952,
        name: "Cranberry Stuffing",
        price: 6.99
      }],
      "Vegetables": [{
        id: 953,
        name: "Green Bean Casserole",
        price: 5.99
      }, {
        id: 954,
        name: "Roasted Brussels Sprouts",
        price: 6.99
      }, {
        id: 955,
        name: "Glazed Carrots",
        price: 5.49
      }, {
        id: 956,
        name: "Creamed Spinach",
        price: 6.49
      }, {
        id: 957,
        name: "Roasted Root Vegetables",
        price: 6.99
      }, {
        id: 958,
        name: "Honey Glazed Parsnips",
        price: 6.99
      }, {
        id: 959,
        name: "Sauteed Green Beans",
        price: 5.99
      }, {
        id: 960,
        name: "Candied Yams",
        price: 6.49
      }, {
        id: 961,
        name: "Braised Red Cabbage",
        price: 5.99
      }]
    }
  },
  "LE BRUNCH MENU": {
    "Eggs": {
      "Scrambled": [{
        id: 1000,
        name: "Classic Scrambled Eggs",
        price: 9.99
      }, {
        id: 1001,
        name: "Truffle Scrambled Eggs",
        price: 14.99
      }, {
        id: 1002,
        name: "Herb Scrambled Eggs",
        price: 10.99
      }, {
        id: 1003,
        name: "Cheese Scrambled Eggs",
        price: 11.49
      }, {
        id: 1004,
        name: "Loaded Scrambled Eggs",
        price: 13.99
      }, {
        id: 1005,
        name: "Veggie Scrambled Eggs",
        price: 12.49
      }, {
        id: 1006,
        name: "Smoked Salmon Scramble",
        price: 16.99
      }, {
        id: 1007,
        name: "Chorizo Scrambled Eggs",
        price: 13.99
      }, {
        id: 1008,
        name: "Mediterranean Scramble",
        price: 14.49
      }],
      "Benedict": [{
        id: 1009,
        name: "Classic Eggs Benedict",
        price: 15.99
      }, {
        id: 1010,
        name: "Smoked Salmon Benedict",
        price: 18.99
      }, {
        id: 1011,
        name: "Florentine Benedict",
        price: 14.99
      }, {
        id: 1012,
        name: "Crab Cake Benedict",
        price: 22.99
      }, {
        id: 1013,
        name: "Lobster Benedict",
        price: 26.99
      }, {
        id: 1014,
        name: "Avocado Benedict",
        price: 16.99
      }, {
        id: 1015,
        name: "Bacon Benedict",
        price: 16.99
      }, {
        id: 1016,
        name: "California Benedict",
        price: 17.99
      }, {
        id: 1017,
        name: "Steak Benedict",
        price: 24.99
      }],
      "Poached": [{
        id: 1018,
        name: "Poached Eggs on Toast",
        price: 10.99
      }, {
        id: 1019,
        name: "Avocado Toast with Poached Egg",
        price: 13.99
      }, {
        id: 1020,
        name: "Smashed Peas with Poached Eggs",
        price: 12.99
      }, {
        id: 1021,
        name: "Poached Eggs Florentine",
        price: 13.99
      }, {
        id: 1022,
        name: "Shakshuka",
        price: 14.99
      }, {
        id: 1023,
        name: "Poached Eggs & Salmon",
        price: 17.99
      }, {
        id: 1024,
        name: "Turkish Eggs",
        price: 13.99
      }, {
        id: 1025,
        name: "Eggs in Purgatory",
        price: 13.99
      }, {
        id: 1026,
        name: "Poached Egg Salad",
        price: 14.99
      }],
      "Fried": [{
        id: 1027,
        name: "Classic Fried Eggs (2)",
        price: 8.99
      }, {
        id: 1028,
        name: "Over Easy Eggs",
        price: 8.99
      }, {
        id: 1029,
        name: "Sunny Side Up",
        price: 8.99
      }, {
        id: 1030,
        name: "Fried Eggs & Bacon",
        price: 12.99
      }, {
        id: 1031,
        name: "Fried Eggs & Sausage",
        price: 12.99
      }, {
        id: 1032,
        name: "Fried Eggs & Ham",
        price: 12.99
      }, {
        id: 1033,
        name: "Huevos Rancheros",
        price: 14.99
      }, {
        id: 1034,
        name: "Chilaquiles",
        price: 13.99
      }, {
        id: 1035,
        name: "Fried Egg Sandwich",
        price: 11.99
      }]
    },
    "Pancakes": {
      "Buttermilk": [{
        id: 1036,
        name: "Classic Buttermilk Stack",
        price: 11.99
      }, {
        id: 1037,
        name: "Short Stack (2)",
        price: 8.99
      }, {
        id: 1038,
        name: "Tall Stack (5)",
        price: 14.99
      }, {
        id: 1039,
        name: "Silver Dollar Pancakes (8)",
        price: 10.99
      }, {
        id: 1040,
        name: "Buttermilk with Bacon",
        price: 14.99
      }, {
        id: 1041,
        name: "Buttermilk with Berries",
        price: 14.99
      }, {
        id: 1042,
        name: "Buttermilk with Banana",
        price: 13.99
      }, {
        id: 1043,
        name: "Buttermilk Combo",
        price: 16.99
      }, {
        id: 1044,
        name: "Fluffy Buttermilk Stack",
        price: 12.99
      }],
      "Blueberry": [{
        id: 1045,
        name: "Fresh Blueberry Pancakes",
        price: 13.99
      }, {
        id: 1046,
        name: "Blueberry Compote Pancakes",
        price: 14.99
      }, {
        id: 1047,
        name: "Wild Blueberry Stack",
        price: 14.99
      }, {
        id: 1048,
        name: "Blueberry Short Stack",
        price: 10.99
      }, {
        id: 1049,
        name: "Blueberry Lemon Pancakes",
        price: 14.99
      }, {
        id: 1050,
        name: "Blueberry Ricotta Pancakes",
        price: 15.99
      }, {
        id: 1051,
        name: "Blueberry Cream Pancakes",
        price: 15.49
      }, {
        id: 1052,
        name: "Blueberry Oat Pancakes",
        price: 13.99
      }, {
        id: 1053,
        name: "Loaded Blueberry Pancakes",
        price: 16.99
      }],
      "Chocolate Chip": [{
        id: 1054,
        name: "Chocolate Chip Pancakes",
        price: 12.99
      }, {
        id: 1055,
        name: "Double Chocolate Stack",
        price: 14.99
      }, {
        id: 1056,
        name: "White Chocolate Chip",
        price: 13.99
      }, {
        id: 1057,
        name: "Triple Chocolate Pancakes",
        price: 15.99
      }, {
        id: 1058,
        name: "Chocolate Banana Pancakes",
        price: 14.99
      }, {
        id: 1059,
        name: "Chocolate Strawberry Stack",
        price: 15.49
      }, {
        id: 1060,
        name: "Chocolate Peanut Butter",
        price: 14.99
      }, {
        id: 1061,
        name: "Mini Chocolate Chips (8)",
        price: 11.99
      }, {
        id: 1062,
        name: "Chocolate Chip Combo",
        price: 17.99
      }],
      "Banana": [{
        id: 1063,
        name: "Banana Pancakes",
        price: 12.99
      }, {
        id: 1064,
        name: "Banana Walnut Pancakes",
        price: 14.49
      }, {
        id: 1065,
        name: "Banana Foster Pancakes",
        price: 15.99
      }, {
        id: 1066,
        name: "Caramelized Banana Stack",
        price: 14.99
      }, {
        id: 1067,
        name: "Banana Nutella Pancakes",
        price: 15.49
      }, {
        id: 1068,
        name: "Peanut Butter Banana",
        price: 14.99
      }, {
        id: 1069,
        name: "Banana Coconut Pancakes",
        price: 14.49
      }, {
        id: 1070,
        name: "Banana Chocolate Chip",
        price: 14.99
      }, {
        id: 1071,
        name: "Banana Pecan Pancakes",
        price: 14.99
      }]
    },
    "Waffles": {
      "Belgian": [{
        id: 1072,
        name: "Belgian Waffle",
        price: 12.99
      }, {
        id: 1073,
        name: "Belgian Waffle with Berries",
        price: 15.99
      }, {
        id: 1074,
        name: "Chocolate Belgian Waffle",
        price: 14.99
      }, {
        id: 1075,
        name: "Strawberry Belgian Waffle",
        price: 15.49
      }, {
        id: 1076,
        name: "Banana Belgian Waffle",
        price: 14.99
      }, {
        id: 1077,
        name: "Nutella Belgian Waffle",
        price: 15.49
      }, {
        id: 1078,
        name: "Belgian Waffle Combo",
        price: 18.99
      }, {
        id: 1079,
        name: "Loaded Belgian Waffle",
        price: 17.99
      }, {
        id: 1080,
        name: "Classic Belgian with Cream",
        price: 14.99
      }],
      "Chicken &": [{
        id: 1081,
        name: "Chicken & Waffles",
        price: 18.99
      }, {
        id: 1082,
        name: "Nashville Hot Chicken & Waffles",
        price: 20.99
      }, {
        id: 1083,
        name: "Honey Butter Chicken & Waffles",
        price: 19.99
      }, {
        id: 1084,
        name: "Southern Fried Chicken & Waffle",
        price: 19.99
      }, {
        id: 1085,
        name: "Spicy Chicken & Waffles",
        price: 20.49
      }, {
        id: 1086,
        name: "Boneless Chicken & Waffles",
        price: 18.49
      }, {
        id: 1087,
        name: "Maple Chicken & Waffles",
        price: 19.49
      }, {
        id: 1088,
        name: "Buffalo Chicken & Waffles",
        price: 20.49
      }, {
        id: 1089,
        name: "BBQ Chicken & Waffles",
        price: 19.99
      }],
      "Classic": [{
        id: 1090,
        name: "Classic Waffle",
        price: 10.99
      }, {
        id: 1091,
        name: "Double Waffle Stack",
        price: 13.99
      }, {
        id: 1092,
        name: "Waffle with Bacon",
        price: 14.99
      }, {
        id: 1093,
        name: "Waffle with Sausage",
        price: 14.99
      }, {
        id: 1094,
        name: "Waffle Combo Plate",
        price: 16.99
      }, {
        id: 1095,
        name: "Kids Waffle",
        price: 7.99
      }, {
        id: 1096,
        name: "Cinnamon Waffle",
        price: 11.99
      }, {
        id: 1097,
        name: "Pecan Waffle",
        price: 13.99
      }, {
        id: 1098,
        name: "Maple Waffle",
        price: 12.49
      }]
    },
    "Omelettes": {
      "Western": [{
        id: 1099,
        name: "Western Omelette",
        price: 14.99
      }, {
        id: 1100,
        name: "Denver Omelette",
        price: 14.99
      }, {
        id: 1101,
        name: "Loaded Western Omelette",
        price: 16.99
      }, {
        id: 1102,
        name: "Spicy Western Omelette",
        price: 15.49
      }, {
        id: 1103,
        name: "Texas Western Omelette",
        price: 16.49
      }, {
        id: 1104,
        name: "Western with Cheese",
        price: 15.99
      }, {
        id: 1105,
        name: "Southwest Western",
        price: 15.99
      }, {
        id: 1106,
        name: "Western Combo Plate",
        price: 18.99
      }, {
        id: 1107,
        name: "California Western",
        price: 16.99
      }],
      "Veggie": [{
        id: 1108,
        name: "Garden Veggie Omelette",
        price: 13.99
      }, {
        id: 1109,
        name: "Spinach Mushroom Omelette",
        price: 14.99
      }, {
        id: 1110,
        name: "Tomato Basil Omelette",
        price: 13.99
      }, {
        id: 1111,
        name: "Avocado Omelette",
        price: 15.49
      }, {
        id: 1112,
        name: "Mediterranean Omelette",
        price: 15.99
      }, {
        id: 1113,
        name: "Broccoli Cheddar Omelette",
        price: 14.49
      }, {
        id: 1114,
        name: "Roasted Veggie Omelette",
        price: 14.99
      }, {
        id: 1115,
        name: "Greek Omelette",
        price: 15.49
      }, {
        id: 1116,
        name: "Caprese Omelette",
        price: 15.99
      }],
      "Cheese": [{
        id: 1117,
        name: "Three Cheese Omelette",
        price: 13.99
      }, {
        id: 1118,
        name: "Cheddar Omelette",
        price: 12.99
      }, {
        id: 1119,
        name: "Swiss Cheese Omelette",
        price: 13.49
      }, {
        id: 1120,
        name: "Goat Cheese Omelette",
        price: 14.99
      }, {
        id: 1121,
        name: "Brie Omelette",
        price: 15.49
      }, {
        id: 1122,
        name: "Gruyere Omelette",
        price: 14.99
      }, {
        id: 1123,
        name: "Four Cheese Omelette",
        price: 15.49
      }, {
        id: 1124,
        name: "Cream Cheese Omelette",
        price: 13.99
      }, {
        id: 1125,
        name: "Blue Cheese Omelette",
        price: 14.99
      }]
    },
    "Coffee": {
      "Espresso": [{
        id: 1126,
        name: "Single Espresso",
        price: 3.99
      }, {
        id: 1127,
        name: "Double Espresso",
        price: 4.99
      }, {
        id: 1128,
        name: "Triple Espresso",
        price: 5.99
      }, {
        id: 1129,
        name: "Espresso Macchiato",
        price: 4.49
      }, {
        id: 1130,
        name: "Espresso Con Panna",
        price: 4.49
      }, {
        id: 1131,
        name: "Ristretto",
        price: 3.99
      }, {
        id: 1132,
        name: "Long Shot",
        price: 4.29
      }, {
        id: 1133,
        name: "Red Eye",
        price: 5.49
      }, {
        id: 1134,
        name: "Black Eye",
        price: 5.99
      }],
      "Latte": [{
        id: 1135,
        name: "Classic Latte",
        price: 5.99
      }, {
        id: 1136,
        name: "Vanilla Latte",
        price: 6.49
      }, {
        id: 1137,
        name: "Caramel Latte",
        price: 6.49
      }, {
        id: 1138,
        name: "Hazelnut Latte",
        price: 6.49
      }, {
        id: 1139,
        name: "Mocha Latte",
        price: 6.99
      }, {
        id: 1140,
        name: "Pumpkin Spice Latte",
        price: 6.99
      }, {
        id: 1141,
        name: "Lavender Latte",
        price: 6.99
      }, {
        id: 1142,
        name: "Iced Latte",
        price: 5.99
      }, {
        id: 1143,
        name: "Oat Milk Latte",
        price: 6.49
      }],
      "Cappuccino": [{
        id: 1144,
        name: "Classic Cappuccino",
        price: 5.49
      }, {
        id: 1145,
        name: "Dry Cappuccino",
        price: 5.49
      }, {
        id: 1146,
        name: "Wet Cappuccino",
        price: 5.49
      }, {
        id: 1147,
        name: "Vanilla Cappuccino",
        price: 5.99
      }, {
        id: 1148,
        name: "Caramel Cappuccino",
        price: 5.99
      }, {
        id: 1149,
        name: "Iced Cappuccino",
        price: 5.49
      }, {
        id: 1150,
        name: "Mocha Cappuccino",
        price: 6.49
      }, {
        id: 1151,
        name: "Cinnamon Cappuccino",
        price: 5.99
      }, {
        id: 1152,
        name: "Double Shot Cappuccino",
        price: 6.49
      }],
      "Cold Brew": [{
        id: 1153,
        name: "Classic Cold Brew",
        price: 5.49
      }, {
        id: 1154,
        name: "Vanilla Cold Brew",
        price: 5.99
      }, {
        id: 1155,
        name: "Caramel Cold Brew",
        price: 5.99
      }, {
        id: 1156,
        name: "Nitro Cold Brew",
        price: 6.49
      }, {
        id: 1157,
        name: "Sweet Cream Cold Brew",
        price: 6.49
      }, {
        id: 1158,
        name: "Mocha Cold Brew",
        price: 6.49
      }, {
        id: 1159,
        name: "Cold Brew Float",
        price: 7.49
      }, {
        id: 1160,
        name: "Salted Caramel Cold Brew",
        price: 6.49
      }, {
        id: 1161,
        name: "Pumpkin Cold Brew",
        price: 6.49
      }]
    },
    "Mimosas": {
      "Classic": [{
        id: 1162,
        name: "Classic Orange Mimosa",
        price: 8.99
      }, {
        id: 1163,
        name: "Bottomless Mimosas",
        price: 24.99
      }, {
        id: 1164,
        name: "Large Mimosa Carafe",
        price: 29.99
      }, {
        id: 1165,
        name: "Brut Mimosa",
        price: 9.99
      }, {
        id: 1166,
        name: "Mimosa Flight (4)",
        price: 19.99
      }, {
        id: 1167,
        name: "Fresh Squeezed Mimosa",
        price: 10.99
      }, {
        id: 1168,
        name: "Grand Mimosa",
        price: 12.99
      }, {
        id: 1169,
        name: "Mimosa Pitcher",
        price: 34.99
      }, {
        id: 1170,
        name: "Mini Mimosa",
        price: 5.99
      }],
      "Bellini": [{
        id: 1171,
        name: "Peach Bellini",
        price: 9.99
      }, {
        id: 1172,
        name: "Strawberry Bellini",
        price: 9.99
      }, {
        id: 1173,
        name: "Mango Bellini",
        price: 9.99
      }, {
        id: 1174,
        name: "Raspberry Bellini",
        price: 9.99
      }, {
        id: 1175,
        name: "White Peach Bellini",
        price: 10.99
      }, {
        id: 1176,
        name: "Passion Fruit Bellini",
        price: 10.49
      }, {
        id: 1177,
        name: "Bellini Flight (4)",
        price: 22.99
      }, {
        id: 1178,
        name: "Tropical Bellini",
        price: 10.49
      }, {
        id: 1179,
        name: "Mixed Berry Bellini",
        price: 10.49
      }],
      "Specialty": [{
        id: 1180,
        name: "Blood Orange Mimosa",
        price: 10.99
      }, {
        id: 1181,
        name: "Grapefruit Mimosa",
        price: 9.99
      }, {
        id: 1182,
        name: "Pomegranate Mimosa",
        price: 10.49
      }, {
        id: 1183,
        name: "Pineapple Mimosa",
        price: 9.99
      }, {
        id: 1184,
        name: "Cranberry Mimosa",
        price: 9.99
      }, {
        id: 1185,
        name: "Elderflower Mimosa",
        price: 11.49
      }, {
        id: 1186,
        name: "Kir Royale",
        price: 12.99
      }, {
        id: 1187,
        name: "Lavender Mimosa",
        price: 11.49
      }, {
        id: 1188,
        name: "Hibiscus Mimosa",
        price: 10.99
      }]
    },
    "Juice": {
      "Orange": [{
        id: 1189,
        name: "Fresh Squeezed Orange",
        price: 5.99
      }, {
        id: 1190,
        name: "Small Orange Juice",
        price: 3.99
      }, {
        id: 1191,
        name: "Large Orange Juice",
        price: 5.49
      }, {
        id: 1192,
        name: "Blood Orange Juice",
        price: 6.49
      }, {
        id: 1193,
        name: "Orange Carafe",
        price: 12.99
      }, {
        id: 1194,
        name: "Orange Mango Blend",
        price: 5.99
      }, {
        id: 1195,
        name: "Orange Pineapple",
        price: 5.99
      }, {
        id: 1196,
        name: "Tangerine Juice",
        price: 5.49
      }, {
        id: 1197,
        name: "Clementine Juice",
        price: 5.49
      }],
      "Grapefruit": [{
        id: 1198,
        name: "Fresh Grapefruit Juice",
        price: 5.99
      }, {
        id: 1199,
        name: "Ruby Red Grapefruit",
        price: 5.99
      }, {
        id: 1200,
        name: "Pink Grapefruit",
        price: 5.49
      }, {
        id: 1201,
        name: "White Grapefruit",
        price: 5.49
      }, {
        id: 1202,
        name: "Grapefruit Carafe",
        price: 12.99
      }, {
        id: 1203,
        name: "Grapefruit Blend",
        price: 5.99
      }, {
        id: 1204,
        name: "Sparkling Grapefruit",
        price: 6.49
      }, {
        id: 1205,
        name: "Honey Grapefruit",
        price: 5.99
      }, {
        id: 1206,
        name: "Grapefruit Mint",
        price: 6.49
      }],
      "Green": [{
        id: 1207,
        name: "Classic Green Juice",
        price: 7.99
      }, {
        id: 1208,
        name: "Kale Apple Juice",
        price: 7.99
      }, {
        id: 1209,
        name: "Spinach Celery Juice",
        price: 7.49
      }, {
        id: 1210,
        name: "Cucumber Mint Juice",
        price: 6.99
      }, {
        id: 1211,
        name: "Green Detox Juice",
        price: 8.49
      }, {
        id: 1212,
        name: "Mean Green Juice",
        price: 8.49
      }, {
        id: 1213,
        name: "Green Goddess Juice",
        price: 8.49
      }, {
        id: 1214,
        name: "Wheatgrass Shot",
        price: 4.99
      }, {
        id: 1215,
        name: "Super Green Blend",
        price: 8.99
      }]
    }
  },
  "LE DINER MENU": {
    "Appetizers": {
      "Bruschetta": [{
        id: 1300,
        name: "Classic Tomato Bruschetta",
        price: 10.99
      }, {
        id: 1301,
        name: "Mushroom Truffle Bruschetta",
        price: 13.99
      }, {
        id: 1302,
        name: "Burrata Bruschetta",
        price: 15.99
      }, {
        id: 1303,
        name: "Goat Cheese Bruschetta",
        price: 12.99
      }, {
        id: 1304,
        name: "Fig Prosciutto Bruschetta",
        price: 14.99
      }, {
        id: 1305,
        name: "Olive Tapenade Bruschetta",
        price: 11.99
      }, {
        id: 1306,
        name: "Roasted Pepper Bruschetta",
        price: 11.99
      }, {
        id: 1307,
        name: "Smoked Salmon Bruschetta",
        price: 16.99
      }, {
        id: 1308,
        name: "Bruschetta Trio",
        price: 18.99
      }],
      "Carpaccio": [{
        id: 1309,
        name: "Beef Carpaccio",
        price: 16.99
      }, {
        id: 1310,
        name: "Tuna Carpaccio",
        price: 18.99
      }, {
        id: 1311,
        name: "Salmon Carpaccio",
        price: 17.99
      }, {
        id: 1312,
        name: "Wagyu Carpaccio",
        price: 26.99
      }, {
        id: 1313,
        name: "Octopus Carpaccio",
        price: 19.99
      }, {
        id: 1314,
        name: "Beet Carpaccio",
        price: 13.99
      }, {
        id: 1315,
        name: "Zucchini Carpaccio",
        price: 12.99
      }, {
        id: 1316,
        name: "Yellowtail Carpaccio",
        price: 19.99
      }, {
        id: 1317,
        name: "Carpaccio Duo",
        price: 24.99
      }],
      "Oysters": [{
        id: 1318,
        name: "Oysters on the Half Shell (6)",
        price: 18.99
      }, {
        id: 1319,
        name: "Oysters Rockefeller (6)",
        price: 22.99
      }, {
        id: 1320,
        name: "Oysters on the Half Shell (12)",
        price: 34.99
      }, {
        id: 1321,
        name: "Grilled Oysters (6)",
        price: 21.99
      }, {
        id: 1322,
        name: "Oysters Kilpatrick (6)",
        price: 23.99
      }, {
        id: 1323,
        name: "Oysters Mornay (6)",
        price: 24.99
      }, {
        id: 1324,
        name: "Fried Oysters",
        price: 18.99
      }, {
        id: 1325,
        name: "Oyster Shooter (3)",
        price: 15.99
      }, {
        id: 1326,
        name: "Grand Oyster Platter",
        price: 49.99
      }],
      "Charcuterie": [{
        id: 1327,
        name: "Classic Charcuterie Board",
        price: 24.99
      }, {
        id: 1328,
        name: "Premium Charcuterie",
        price: 34.99
      }, {
        id: 1329,
        name: "Italian Meats Board",
        price: 28.99
      }, {
        id: 1330,
        name: "Spanish Charcuterie",
        price: 29.99
      }, {
        id: 1331,
        name: "French Charcuterie",
        price: 32.99
      }, {
        id: 1332,
        name: "Mini Charcuterie",
        price: 16.99
      }, {
        id: 1333,
        name: "Meat & Cheese Duo",
        price: 22.99
      }, {
        id: 1334,
        name: "Artisan Charcuterie",
        price: 36.99
      }, {
        id: 1335,
        name: "Grand Charcuterie",
        price: 44.99
      }]
    },
    "Soups": {
      "Tomato": [{
        id: 1336,
        name: "Creamy Tomato Bisque",
        price: 8.99
      }, {
        id: 1337,
        name: "Roasted Tomato Soup",
        price: 7.99
      }, {
        id: 1338,
        name: "Tomato Basil Soup",
        price: 8.49
      }, {
        id: 1339,
        name: "Fire Roasted Tomato",
        price: 8.99
      }, {
        id: 1340,
        name: "Sundried Tomato Soup",
        price: 9.49
      }, {
        id: 1341,
        name: "Heirloom Tomato Soup",
        price: 9.99
      }, {
        id: 1342,
        name: "Tomato Florentine",
        price: 8.99
      }, {
        id: 1343,
        name: "Creamy Tomato with Grilled Cheese",
        price: 13.99
      }, {
        id: 1344,
        name: "Gazpacho",
        price: 8.99
      }],
      "French Onion": [{
        id: 1345,
        name: "Classic French Onion",
        price: 10.99
      }, {
        id: 1346,
        name: "Gratinée Lyonnaise",
        price: 12.99
      }, {
        id: 1347,
        name: "Caramelized Onion Soup",
        price: 10.99
      }, {
        id: 1348,
        name: "French Onion au Gratin",
        price: 11.99
      }, {
        id: 1349,
        name: "Double Cheese French Onion",
        price: 12.49
      }, {
        id: 1350,
        name: "Truffled French Onion",
        price: 14.99
      }, {
        id: 1351,
        name: "French Onion Bowl",
        price: 12.99
      }, {
        id: 1352,
        name: "Mini French Onion",
        price: 7.99
      }, {
        id: 1353,
        name: "French Onion Bread Bowl",
        price: 14.99
      }],
      "Lobster Bisque": [{
        id: 1354,
        name: "Maine Lobster Bisque",
        price: 14.99
      }, {
        id: 1355,
        name: "Lobster Bisque with Cognac",
        price: 16.99
      }, {
        id: 1356,
        name: "Creamy Lobster Bisque",
        price: 14.99
      }, {
        id: 1357,
        name: "Lobster Bisque Bowl",
        price: 18.99
      }, {
        id: 1358,
        name: "Truffled Lobster Bisque",
        price: 19.99
      }, {
        id: 1359,
        name: "Lobster & Crab Bisque",
        price: 17.99
      }, {
        id: 1360,
        name: "Mini Lobster Bisque",
        price: 10.99
      }, {
        id: 1361,
        name: "Lobster Bisque Shooter",
        price: 8.99
      }, {
        id: 1362,
        name: "Champagne Lobster Bisque",
        price: 19.99
      }],
      "Mushroom": [{
        id: 1363,
        name: "Cream of Mushroom",
        price: 8.99
      }, {
        id: 1364,
        name: "Wild Mushroom Soup",
        price: 10.99
      }, {
        id: 1365,
        name: "Truffle Mushroom Soup",
        price: 13.99
      }, {
        id: 1366,
        name: "Porcini Mushroom Soup",
        price: 11.99
      }, {
        id: 1367,
        name: "Shiitake Mushroom Soup",
        price: 10.99
      }, {
        id: 1368,
        name: "Mushroom Barley Soup",
        price: 9.99
      }, {
        id: 1369,
        name: "Forest Mushroom Soup",
        price: 11.99
      }, {
        id: 1370,
        name: "Mushroom Consomme",
        price: 9.99
      }, {
        id: 1371,
        name: "Mushroom Bisque",
        price: 10.99
      }]
    },
    "Salads": {
      "Caesar": [{
        id: 1372,
        name: "Classic Caesar Salad",
        price: 12.99
      }, {
        id: 1373,
        name: "Grilled Chicken Caesar",
        price: 16.99
      }, {
        id: 1374,
        name: "Shrimp Caesar",
        price: 18.99
      }, {
        id: 1375,
        name: "Salmon Caesar",
        price: 19.99
      }, {
        id: 1376,
        name: "Steak Caesar",
        price: 22.99
      }, {
        id: 1377,
        name: "Kale Caesar",
        price: 13.99
      }, {
        id: 1378,
        name: "Side Caesar",
        price: 8.99
      }, {
        id: 1379,
        name: "Caesar with Anchovies",
        price: 14.99
      }, {
        id: 1380,
        name: "Blackened Chicken Caesar",
        price: 17.99
      }],
      "Garden": [{
        id: 1381,
        name: "Garden Fresh Salad",
        price: 10.99
      }, {
        id: 1382,
        name: "Chef's Garden Salad",
        price: 12.99
      }, {
        id: 1383,
        name: "House Garden Salad",
        price: 9.99
      }, {
        id: 1384,
        name: "Spring Mix Salad",
        price: 11.99
      }, {
        id: 1385,
        name: "Mixed Greens Salad",
        price: 10.99
      }, {
        id: 1386,
        name: "Farmers Market Salad",
        price: 13.99
      }, {
        id: 1387,
        name: "Garden Salad with Chicken",
        price: 15.99
      }, {
        id: 1388,
        name: "Garden Salad with Shrimp",
        price: 17.99
      }, {
        id: 1389,
        name: "Side Garden Salad",
        price: 6.99
      }],
      "Wedge": [{
        id: 1390,
        name: "Classic Wedge Salad",
        price: 11.99
      }, {
        id: 1391,
        name: "Loaded Wedge Salad",
        price: 14.99
      }, {
        id: 1392,
        name: "Steakhouse Wedge",
        price: 13.99
      }, {
        id: 1393,
        name: "Blue Cheese Wedge",
        price: 12.99
      }, {
        id: 1394,
        name: "BLT Wedge",
        price: 13.99
      }, {
        id: 1395,
        name: "Wedge with Shrimp",
        price: 17.99
      }, {
        id: 1396,
        name: "Wedge with Steak",
        price: 21.99
      }, {
        id: 1397,
        name: "Mini Wedge",
        price: 8.99
      }, {
        id: 1398,
        name: "Wedge Duo",
        price: 15.99
      }],
      "Greek": [{
        id: 1399,
        name: "Traditional Greek Salad",
        price: 12.99
      }, {
        id: 1400,
        name: "Greek Salad with Chicken",
        price: 16.99
      }, {
        id: 1401,
        name: "Greek Salad with Lamb",
        price: 19.99
      }, {
        id: 1402,
        name: "Greek Salad with Falafel",
        price: 15.99
      }, {
        id: 1403,
        name: "Deconstructed Greek",
        price: 14.99
      }, {
        id: 1404,
        name: "Mediterranean Greek Salad",
        price: 13.99
      }, {
        id: 1405,
        name: "Greek Salad with Shrimp",
        price: 18.99
      }, {
        id: 1406,
        name: "Side Greek Salad",
        price: 8.99
      }, {
        id: 1407,
        name: "Family Greek Salad",
        price: 24.99
      }]
    },
    "Steaks": {
      "Filet Mignon": [{
        id: 1408,
        name: "Filet Mignon 6oz",
        price: 38.99
      }, {
        id: 1409,
        name: "Filet Mignon 8oz",
        price: 44.99
      }, {
        id: 1410,
        name: "Filet Mignon 10oz",
        price: 52.99
      }, {
        id: 1411,
        name: "Filet Mignon 12oz",
        price: 58.99
      }, {
        id: 1412,
        name: "Bacon Wrapped Filet",
        price: 48.99
      }, {
        id: 1413,
        name: "Oscar Style Filet",
        price: 54.99
      }, {
        id: 1414,
        name: "Truffle Butter Filet",
        price: 52.99
      }, {
        id: 1415,
        name: "Peppercorn Crusted Filet",
        price: 49.99
      }, {
        id: 1416,
        name: "Surf & Turf Filet",
        price: 64.99
      }],
      "Ribeye": [{
        id: 1417,
        name: "Ribeye 12oz",
        price: 38.99
      }, {
        id: 1418,
        name: "Ribeye 14oz",
        price: 42.99
      }, {
        id: 1419,
        name: "Ribeye 16oz",
        price: 48.99
      }, {
        id: 1420,
        name: "Bone-In Ribeye 20oz",
        price: 58.99
      }, {
        id: 1421,
        name: "Prime Ribeye",
        price: 54.99
      }, {
        id: 1422,
        name: "Cowboy Ribeye 22oz",
        price: 64.99
      }, {
        id: 1423,
        name: "Garlic Butter Ribeye",
        price: 46.99
      }, {
        id: 1424,
        name: "Herb Crusted Ribeye",
        price: 48.99
      }, {
        id: 1425,
        name: "Cajun Ribeye",
        price: 44.99
      }],
      "NY Strip": [{
        id: 1426,
        name: "NY Strip 10oz",
        price: 34.99
      }, {
        id: 1427,
        name: "NY Strip 12oz",
        price: 38.99
      }, {
        id: 1428,
        name: "NY Strip 14oz",
        price: 42.99
      }, {
        id: 1429,
        name: "NY Strip 16oz",
        price: 46.99
      }, {
        id: 1430,
        name: "Bone-In NY Strip",
        price: 52.99
      }, {
        id: 1431,
        name: "Prime NY Strip",
        price: 48.99
      }, {
        id: 1432,
        name: "Au Poivre NY Strip",
        price: 44.99
      }, {
        id: 1433,
        name: "Blue Cheese Crusted Strip",
        price: 46.99
      }, {
        id: 1434,
        name: "Chimichurri NY Strip",
        price: 42.99
      }],
      "T-Bone": [{
        id: 1435,
        name: "T-Bone 18oz",
        price: 48.99
      }, {
        id: 1436,
        name: "T-Bone 22oz",
        price: 54.99
      }, {
        id: 1437,
        name: "T-Bone 24oz",
        price: 58.99
      }, {
        id: 1438,
        name: "Prime T-Bone",
        price: 62.99
      }, {
        id: 1439,
        name: "Porterhouse 26oz",
        price: 64.99
      }, {
        id: 1440,
        name: "Porterhouse 32oz",
        price: 74.99
      }, {
        id: 1441,
        name: "Florentine T-Bone",
        price: 68.99
      }, {
        id: 1442,
        name: "T-Bone for Two",
        price: 89.99
      }, {
        id: 1443,
        name: "Dry Aged T-Bone",
        price: 72.99
      }]
    },
    "Seafood": {
      "Salmon": [{
        id: 1444,
        name: "Almond Crusted Salmon",
        price: 28.99
      }, {
        id: 1445,
        name: "Grilled Atlantic Salmon",
        price: 26.99
      }, {
        id: 1446,
        name: "Honey Glazed Salmon",
        price: 29.99
      }, {
        id: 1447,
        name: "Teriyaki Salmon",
        price: 27.99
      }, {
        id: 1448,
        name: "Blackened Salmon",
        price: 28.99
      }, {
        id: 1449,
        name: "Herb Crusted Salmon",
        price: 28.99
      }, {
        id: 1450,
        name: "Cedar Plank Salmon",
        price: 30.99
      }, {
        id: 1451,
        name: "Salmon Oscar",
        price: 34.99
      }, {
        id: 1452,
        name: "Miso Glazed Salmon",
        price: 29.99
      }],
      "Lobster": [{
        id: 1453,
        name: "Lobster Tail 6oz",
        price: 44.99
      }, {
        id: 1454,
        name: "Lobster Tail 8oz",
        price: 52.99
      }, {
        id: 1455,
        name: "Twin Lobster Tails",
        price: 79.99
      }, {
        id: 1456,
        name: "Butter Poached Lobster",
        price: 54.99
      }, {
        id: 1457,
        name: "Grilled Lobster Tail",
        price: 48.99
      }, {
        id: 1458,
        name: "Lobster Thermidor",
        price: 58.99
      }, {
        id: 1459,
        name: "Whole Maine Lobster",
        price: 64.99
      }, {
        id: 1460,
        name: "Lobster Mac & Cheese",
        price: 34.99
      }, {
        id: 1461,
        name: "Surf & Turf with Lobster",
        price: 74.99
      }],
      "Shrimp": [{
        id: 1462,
        name: "Shrimp Scampi",
        price: 23.99
      }, {
        id: 1463,
        name: "Grilled Jumbo Shrimp",
        price: 26.99
      }, {
        id: 1464,
        name: "Coconut Shrimp",
        price: 22.99
      }, {
        id: 1465,
        name: "Fried Shrimp Platter",
        price: 21.99
      }, {
        id: 1466,
        name: "Shrimp Alfredo",
        price: 24.99
      }, {
        id: 1467,
        name: "Bang Bang Shrimp",
        price: 22.99
      }, {
        id: 1468,
        name: "Garlic Butter Shrimp",
        price: 24.99
      }, {
        id: 1469,
        name: "Firecracker Shrimp",
        price: 23.99
      }, {
        id: 1470,
        name: "Shrimp Fra Diavolo",
        price: 25.99
      }],
      "Scallops": [{
        id: 1471,
        name: "Pan Seared Scallops",
        price: 32.99
      }, {
        id: 1472,
        name: "Bacon Wrapped Scallops",
        price: 34.99
      }, {
        id: 1473,
        name: "Scallops with Risotto",
        price: 36.99
      }, {
        id: 1474,
        name: "Jumbo Sea Scallops",
        price: 38.99
      }, {
        id: 1475,
        name: "Butter Poached Scallops",
        price: 34.99
      }, {
        id: 1476,
        name: "Lemon Herb Scallops",
        price: 33.99
      }, {
        id: 1477,
        name: "Scallops & Pasta",
        price: 32.99
      }, {
        id: 1478,
        name: "Blackened Scallops",
        price: 33.99
      }, {
        id: 1479,
        name: "Truffle Scallops",
        price: 38.99
      }]
    },
    "Pasta": {
      "Spaghetti": [{
        id: 1480,
        name: "Spaghetti Carbonara",
        price: 16.99
      }, {
        id: 1481,
        name: "Spaghetti Bolognese",
        price: 17.99
      }, {
        id: 1482,
        name: "Spaghetti & Meatballs",
        price: 18.99
      }, {
        id: 1483,
        name: "Spaghetti Marinara",
        price: 14.99
      }, {
        id: 1484,
        name: "Spaghetti Aglio e Olio",
        price: 15.99
      }, {
        id: 1485,
        name: "Spaghetti Pomodoro",
        price: 15.99
      }, {
        id: 1486,
        name: "Spaghetti Puttanesca",
        price: 17.99
      }, {
        id: 1487,
        name: "Spaghetti Vongole",
        price: 22.99
      }, {
        id: 1488,
        name: "Truffle Spaghetti",
        price: 24.99
      }],
      "Fettuccine": [{
        id: 1489,
        name: "Fettuccine Alfredo",
        price: 15.99
      }, {
        id: 1490,
        name: "Chicken Fettuccine Alfredo",
        price: 19.99
      }, {
        id: 1491,
        name: "Shrimp Fettuccine Alfredo",
        price: 23.99
      }, {
        id: 1492,
        name: "Lobster Fettuccine",
        price: 32.99
      }, {
        id: 1493,
        name: "Fettuccine Bolognese",
        price: 18.99
      }, {
        id: 1494,
        name: "Fettuccine Primavera",
        price: 17.99
      }, {
        id: 1495,
        name: "Truffle Fettuccine",
        price: 26.99
      }, {
        id: 1496,
        name: "Mushroom Fettuccine",
        price: 18.99
      }, {
        id: 1497,
        name: "Carbonara Fettuccine",
        price: 19.99
      }],
      "Ravioli": [{
        id: 1498,
        name: "Four Cheese Ravioli",
        price: 18.99
      }, {
        id: 1499,
        name: "Lobster Ravioli",
        price: 26.99
      }, {
        id: 1500,
        name: "Spinach Ricotta Ravioli",
        price: 17.99
      }, {
        id: 1501,
        name: "Mushroom Ravioli",
        price: 18.99
      }, {
        id: 1502,
        name: "Butternut Squash Ravioli",
        price: 19.99
      }, {
        id: 1503,
        name: "Beef Short Rib Ravioli",
        price: 22.99
      }, {
        id: 1504,
        name: "Crab Ravioli",
        price: 24.99
      }, {
        id: 1505,
        name: "Truffle Ravioli",
        price: 28.99
      }, {
        id: 1506,
        name: "Ravioli Trio",
        price: 24.99
      }],
      "Risotto": [{
        id: 1507,
        name: "Mushroom Risotto",
        price: 18.99
      }, {
        id: 1508,
        name: "Truffle Risotto",
        price: 26.99
      }, {
        id: 1509,
        name: "Seafood Risotto",
        price: 28.99
      }, {
        id: 1510,
        name: "Lobster Risotto",
        price: 34.99
      }, {
        id: 1511,
        name: "Saffron Risotto",
        price: 19.99
      }, {
        id: 1512,
        name: "Parmesan Risotto",
        price: 17.99
      }, {
        id: 1513,
        name: "Asparagus Risotto",
        price: 19.99
      }, {
        id: 1514,
        name: "Pumpkin Risotto",
        price: 18.99
      }, {
        id: 1515,
        name: "Short Rib Risotto",
        price: 26.99
      }]
    },
    "Desserts": {
      "Tiramisu": [{
        id: 1516,
        name: "Classic Tiramisu",
        price: 9.99
      }, {
        id: 1517,
        name: "Espresso Tiramisu",
        price: 10.99
      }, {
        id: 1518,
        name: "Chocolate Tiramisu",
        price: 11.49
      }, {
        id: 1519,
        name: "Berry Tiramisu",
        price: 11.49
      }, {
        id: 1520,
        name: "Limoncello Tiramisu",
        price: 11.99
      }, {
        id: 1521,
        name: "Nutella Tiramisu",
        price: 11.49
      }, {
        id: 1522,
        name: "Mini Tiramisu",
        price: 6.99
      }, {
        id: 1523,
        name: "Tiramisu Martini",
        price: 12.99
      }, {
        id: 1524,
        name: "Pistachio Tiramisu",
        price: 12.49
      }],
      "Crème Brûlée": [{
        id: 1525,
        name: "Classic Crème Brûlée",
        price: 9.99
      }, {
        id: 1526,
        name: "Lavender Crème Brûlée",
        price: 11.99
      }, {
        id: 1527,
        name: "Vanilla Bean Crème Brûlée",
        price: 10.99
      }, {
        id: 1528,
        name: "Chocolate Crème Brûlée",
        price: 11.49
      }, {
        id: 1529,
        name: "Espresso Crème Brûlée",
        price: 10.99
      }, {
        id: 1530,
        name: "Citrus Crème Brûlée",
        price: 10.99
      }, {
        id: 1531,
        name: "Pumpkin Crème Brûlée",
        price: 10.99
      }, {
        id: 1532,
        name: "Grand Marnier Crème Brûlée",
        price: 12.99
      }, {
        id: 1533,
        name: "Salted Caramel Crème Brûlée",
        price: 11.49
      }],
      "Cheesecake": [{
        id: 1534,
        name: "New York Cheesecake",
        price: 8.99
      }, {
        id: 1535,
        name: "Raspberry Swirl Cheesecake",
        price: 10.99
      }, {
        id: 1536,
        name: "Chocolate Cheesecake",
        price: 10.99
      }, {
        id: 1537,
        name: "Caramel Cheesecake",
        price: 10.99
      }, {
        id: 1538,
        name: "Oreo Cheesecake",
        price: 10.99
      }, {
        id: 1539,
        name: "Pumpkin Cheesecake",
        price: 9.99
      }, {
        id: 1540,
        name: "Strawberry Cheesecake",
        price: 10.49
      }, {
        id: 1541,
        name: "Triple Chocolate Cheesecake",
        price: 11.99
      }, {
        id: 1542,
        name: "White Chocolate Cheesecake",
        price: 11.49
      }],
      "Chocolate": [{
        id: 1543,
        name: "Molten Chocolate Cake",
        price: 10.99
      }, {
        id: 1544,
        name: "Chocolate Mousse",
        price: 8.99
      }, {
        id: 1545,
        name: "Chocolate Ganache Torte",
        price: 11.49
      }, {
        id: 1546,
        name: "Death by Chocolate",
        price: 12.49
      }, {
        id: 1547,
        name: "Chocolate Soufflé",
        price: 13.99
      }, {
        id: 1548,
        name: "Belgian Chocolate Cake",
        price: 11.49
      }, {
        id: 1549,
        name: "Chocolate Fondue",
        price: 16.99
      }, {
        id: 1550,
        name: "Triple Chocolate Decadence",
        price: 12.99
      }, {
        id: 1551,
        name: "Flourless Chocolate Cake",
        price: 10.99
      }]
    }
  }
};

// Helper function to get items based on menu, category, and subcategory
const getMenuItems = (menu: string, category: string, subcategory: string): MenuItem[] => {
  const menuData = menuItemsData[menu];
  if (!menuData) return [];
  const categoryData = menuData[category];
  if (!categoryData) return [];
  const items = categoryData[subcategory];
  if (!items) return [];
  return items;
};

// Get all items for a category (when no subcategory selected)
const getAllCategoryItems = (menu: string, category: string): MenuItem[] => {
  const menuData = menuItemsData[menu];
  if (!menuData) return [];
  const categoryData = menuData[category];
  if (!categoryData) return [];
  return Object.values(categoryData).flat();
};

// Get all items for a menu (when no category selected)
const getAllMenuItems = (menu: string): MenuItem[] => {
  const menuData = menuItemsData[menu];
  if (!menuData) return [];
  return Object.values(menuData).flatMap((cat) => Object.values(cat).flat());
};
interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
  notes?: string;
  itemOrderType?: string;
  priceOverrideReason?: string;
  priceOverrideNotes?: string;
  assignedSeats?: number[];
  discountName?: string;
  discountAmount?: number;
  noTax?: boolean;
  isFired?: boolean;
  isTransferred?: boolean;
}
const initialOrderItems: OrderItem[] = [];
const orderTypes = [
{ label: "DINE IN", icon: dineInIcon },
{ label: "TAKE OUT", icon: takeOutIcon },
{ label: "DELIVERY", icon: deliveryIcon },
{ label: "BANQUET", icon: banquetIcon },
{ label: "DRIVE THRU", icon: driveThruIcon },
{ label: "CURB SIDE", icon: curbSideIcon },
{ label: "SCHEDULED", icon: scheduledIcon },
{ label: "PHONE-IN", icon: phoneInIcon },
{ label: "CUSTOM", icon: customOrderIcon }];


// Discount types data
interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: 'briefcase' | 'heart' | 'graduation' | 'shield' | 'star' | 'clock' | 'cake' | 'mappin' | 'dollar' | 'tag';
}

const discountTypes: DiscountType[] = [
{ id: 'employee', name: 'Employee Discount', description: '20% off', percentage: 20, icon: 'briefcase' },
{ id: 'senior', name: 'Senior Citizen', description: '15% off', percentage: 15, icon: 'heart' },
{ id: 'student', name: 'Student Discount', description: '10% off', percentage: 10, icon: 'graduation' },
{ id: 'military', name: 'Military Discount', description: '15% off', percentage: 15, icon: 'shield' },
{ id: 'loyalty', name: 'Loyalty Member', description: '5% off', percentage: 5, icon: 'star' },
{ id: 'happy', name: 'Happy Hour', description: '25% off', percentage: 25, icon: 'clock' },
{ id: 'birthday', name: 'Birthday Special', description: '30% off', percentage: 30, icon: 'cake' },
{ id: 'first', name: 'First Visit', description: '10% off', percentage: 10, icon: 'mappin' },
{ id: 'comp5', name: 'Manager Comp $5', description: '$5.00 off', fixedAmount: 5, icon: 'dollar' },
{ id: 'comp10', name: 'Manager Comp $10', description: '$10.00 off', fixedAmount: 10, icon: 'dollar' },
{ id: 'comp15', name: 'Manager Comp $15', description: '$15.00 off', fixedAmount: 15, icon: 'dollar' },
{ id: 'promo', name: 'Promo Code Discount', description: '20% off', percentage: 20, icon: 'tag' }];


// Payment methods constants
const initialPaymentMethods = [
{ id: 'loyalty', name: 'Loyalty', icon: Tag },
{ id: 'account', name: 'Account', icon: User },
{ id: 'card', name: 'Card', icon: CreditCard },
{ id: 'cash', name: 'Cash', icon: Banknote },
{ id: 'gift-card', name: 'Gift Card', icon: Gift },
{ id: 'pay-link', name: 'Pay by Link', icon: Link }];


const initialOtherPaymentMethods = [
{ id: 'qr-code', name: 'QR Code', icon: QrCode },
{ id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
{ id: 'external-cc', name: 'External CC', icon: ExternalLink },
{ id: 'manual-card', name: 'Manual card', icon: Clipboard },
{ id: 'blizzful', name: 'Blizzful', icon: Utensils },
{ id: 'ubereats', name: 'UberEats', icon: ShoppingBag },
{ id: 'doordash', name: 'DoorDash', icon: Truck },
{ id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed }];


type PaymentMethodType = {
  id: string;
  name: string;
  icon: React.ComponentType<{className?: string;}>;
};

const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

interface GuestUser {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  initials: string;
}

// Format phone number based on country code
// USA-centric phone format: (XXX) XXX-XXXX
const formatPhoneNumber = (digits: string): string => {
  if (!digits) return '';

  // Limit to 10 digits for USA format
  const d = digits.slice(0, 10);

  if (d.length <= 3) {
    return `(${d}`;
  }
  if (d.length <= 6) {
    return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  }
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
};
const mockGuestUsers: GuestUser[] = [{
  id: 1,
  name: "John Doe",
  phone: "+1 (212) 456-7890",
  // USA
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
  initials: "JD"
}, {
  id: 2,
  name: "Nancy John",
  phone: "+1 (415) 555-7890",
  // USA
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
  initials: "NJ"
}, {
  id: 3,
  name: "Jonathan Byers",
  phone: "+44 20 7946 0958",
  // UK
  initials: "JB"
}, {
  id: 4,
  name: "Jane Smith",
  phone: "+971 50 123 4567",
  // UAE
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
  initials: "JS"
}, {
  id: 5,
  name: "Michael Brown",
  phone: "+1 (310) 987-6543",
  // USA
  initials: "MB"
}, {
  id: 6,
  name: "Sarah Johnson",
  phone: "+44 7911 123456",
  // UK Mobile
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
  initials: "SJ"
}, {
  id: 7,
  name: "David Wilson",
  phone: "+971 4 369 2580",
  // UAE Dubai
  initials: "DW"
}, {
  id: 8,
  name: "Emily Davis",
  phone: "+44 121 147 2583",
  // UK Birmingham
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
  // Read URL params for add-item mode
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { panelLayout } = usePanelPosition();
  const { getOrderBySessionId, updateOrderItems, fireOrder: fireSessionOrder, updateOrderStatus, saveSplitConfiguration: saveContextSplitConfig } = useSessionOrders();

  const addItemMode = searchParams.get('mode') === 'addItem';
  const transferNewMode = searchParams.get('mode') === 'transferNew';
  const transferItemsParam = searchParams.get('transferItems');
  const existingOrderId = searchParams.get('orderId');
  const tableIdFromParams = searchParams.get('tableId');
  const sessionIdFromParams = searchParams.get('sessionId');
  const partySizeFromParams = searchParams.get('partySize');
  const seatsFromParams = searchParams.get('seats');
  const guestsFromParams = searchParams.get('guests');

  // Session order mode - coming from TableOrder seat selection
  const isSessionOrderMode = !!sessionIdFromParams && !!tableIdFromParams;
  const sessionOrder = isSessionOrderMode ? getOrderBySessionId(sessionIdFromParams) : null;
  const sessionPartySize = partySizeFromParams ? parseInt(partySizeFromParams) : sessionOrder?.partySize || 0;

  const isTableOrder = !!tableIdFromParams && !!seatsFromParams && !!guestsFromParams;
  const totalSeats = seatsFromParams ? parseInt(seatsFromParams) : sessionPartySize || 0;
  const guestCount = guestsFromParams ? parseInt(guestsFromParams) : sessionPartySize || 0;

  // Get existing order data if in add-item mode
  const existingOrder = addItemMode && existingOrderId ? getOrderById(existingOrderId) : null;
  const existingOrderPaymentStatus = existingOrder?.paymentStatus || existingOrder?.status;
  const isExistingOrderPaid = existingOrderPaymentStatus === 'Paid' || existingOrderPaymentStatus === 'PAID';

  // Helper to get first category and subcategory for a menu
  const getFirstCategoryAndSubcategory = (menu: string) => {
    const categories = menuCategories[menu] || [];
    const firstCategory = categories[0] || "";
    const subcategories = categorySubcategories[firstCategory] || [];
    const firstSubcategory = subcategories[0] || "";
    return {
      firstCategory,
      firstSubcategory
    };
  };
  const defaultMenu = "BAR MENU";
  const {
    firstCategory: defaultCategory,
    firstSubcategory: defaultSubcategory
  } = getFirstCategoryAndSubcategory(defaultMenu);
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(defaultSubcategory);
  const [activeFoodCategory, setActiveFoodCategory] = useState("Appetizer");
  const [selectedMenu, setSelectedMenu] = useState(defaultMenu);
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [existingItems, setExistingItems] = useState<OrderItem[]>([]);
  const [horizontalScrollMode, setHorizontalScrollMode] = useState(false);
  const [thumbnailViewMode, setThumbnailViewMode] = useState(false);
  const [orderType, setOrderType] = useState("DINE IN");
  const [showDineInForm, setShowDineInForm] = useState(false);
  const [dineInGuestData, setDineInGuestData] = useState<DineInGuestData | null>(null);
  const [showTakeOutForm, setShowTakeOutForm] = useState(false);
  const [takeOutGuestData, setTakeOutGuestData] = useState<TakeOutGuestData | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryGuestData, setDeliveryGuestData] = useState<DeliveryGuestData | null>(null);
  const [showBanquetForm, setShowBanquetForm] = useState(false);
  const [banquetGuestData, setBanquetGuestData] = useState<BanquetGuestData | null>(null);
  const [showDriveThruForm, setShowDriveThruForm] = useState(false);
  const [driveThruGuestData, setDriveThruGuestData] = useState<DriveThruGuestData | null>(null);
  const [showCurbSideForm, setShowCurbSideForm] = useState(false);
  const [curbSideGuestData, setCurbSideGuestData] = useState<CurbSideGuestData | null>(null);
  const [showScheduledForm, setShowScheduledForm] = useState(false);
  const [scheduledGuestData, setScheduledGuestData] = useState<ScheduledGuestData | null>(null);
  const [showPhoneInForm, setShowPhoneInForm] = useState(false);
  const [phoneInGuestData, setPhoneInGuestData] = useState<PhoneInGuestData | null>(null);
  const [showCustomOrderForm, setShowCustomOrderForm] = useState(false);
  const [customOrderGuestData, setCustomOrderGuestData] = useState<CustomOrderGuestData | null>(null);
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
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [showCustomItemPanel, setShowCustomItemPanel] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [activeCustomItemField, setActiveCustomItemField] = useState<'name' | 'price'>('price');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [showNoTaxDialog, setShowNoTaxDialog] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false); // TODO: Connect to actual user role system
  const [discountDialogView, setDiscountDialogView] = useState<'mpin' | 'discounts'>('mpin');
  const [discountPin, setDiscountPin] = useState("");
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{
    id: number;
    name: string;
    price: number;
  } | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [showInlineCustomization, setShowInlineCustomization] = useState(false);
  const [isProductInfoFullScreen, setIsProductInfoFullScreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const guestInputRef = useRef<HTMLInputElement>(null);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const mobileGuestInputRef = useRef<HTMLInputElement>(null);
  const mobileGuestDropdownRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);
  const mobilePhoneInputRef = useRef<HTMLInputElement>(null);
  const mobilePhoneDropdownRef = useRef<HTMLDivElement>(null);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<number | null>(null);
  const [expandedCartItems, setExpandedCartItems] = useState<Set<number>>(new Set());
  const [isOrderActionsSidebarOpen, setIsOrderActionsSidebarOpen] = useState(false);
  const [showGiftCardDialog, setShowGiftCardDialog] = useState(false);
  const [appliedGiftCardAmount, setAppliedGiftCardAmount] = useState(0);
  const [showServiceChargeDialog, setShowServiceChargeDialog] = useState(false);
  const [appliedServiceCharge, setAppliedServiceCharge] = useState(0);
  const [appliedServiceChargeName, setAppliedServiceChargeName] = useState('');
  const [showTransferCheckDialog, setShowTransferCheckDialog] = useState(false);
  const [currentServerName, setCurrentServerName] = useState("Mia Jones");
  const [showAddGuestForm, setShowAddGuestForm] = useState(false);
  const [showMPINDialog, setShowMPINDialog] = useState(false);
  const [showPriceOverrideDialog, setShowPriceOverrideDialog] = useState(false);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherDialogInitialView, setVoucherDialogInitialView] = useState<'sell' | 'redeem'>('sell');
  const [showVoucherOptionsPopup, setShowVoucherOptionsPopup] = useState(false);
  const [showCreateVoucherForm, setShowCreateVoucherForm] = useState(false);
  const [appliedVoucherAmount, setAppliedVoucherAmount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [priceOverrideItem, setPriceOverrideItem] = useState<{id: number;name: string;price: number;image?: string;} | null>(null);
  const [orderNumber, setOrderNumber] = useState(1);
  const [orderCreatedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  // Payment Dialog State (component manages its own internal states)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Split order state
  const [isOrderSplit, setIsOrderSplit] = useState(false);
  const [splitConfiguration, setSplitConfiguration] = useState<{
    mode: 'seat' | 'evenly' | 'custom';
    numberOfChecks: number;
    checkAssignments: Record<number, number>;
  } | null>(null);
  const [showSplitOrderAlert, setShowSplitOrderAlert] = useState(false);

  // Table order seat selection state - initialize with all seats selected when coming from table orders
  const [selectedSeats, setSelectedSeats] = useState<number[]>(() => {
    if (isTableOrder && guestCount > 0) {
      return Array.from({ length: guestCount }, (_, i) => i + 1);
    }
    return [];
  });

  // Seat filter for cart display - empty array means show all, 'all' for shared items, numbers for specific seats (multi-select)
  const [seatFilter, setSeatFilter] = useState<(number | 'all')[]>([]);

  // Toggle seat selection for table orders
  const toggleSeatSelection = (seatNumber: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      return [...prev, seatNumber].sort((a, b) => a - b);
    });
  };

  // Toggle seat filter for cart display
  const toggleSeatFilter = (seatNumber: number | 'all') => {
    setSeatFilter((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      return [...prev, seatNumber];
    });
  };

  // Filter order items based on seat filter (multi-select)
  const filteredOrderItems = seatFilter.length === 0 ?
  orderItems :
  orderItems.filter((item) => {
    // Check if item matches any of the selected filters
    return seatFilter.some((filter) => {
      if (filter === 'all') {
        return item.assignedSeats?.length === guestCount;
      }
      return item.assignedSeats?.includes(filter as number);
    });
  });

  // Initialize order with existing items when in add-item mode
  useEffect(() => {
    if (addItemMode && existingOrder) {
      // Pre-populate guest info
      setGuestName(existingOrder.name);
      setGuestPhone(existingOrder.phone.replace(/\D/g, ''));
      setOrderNotes(existingOrder.notes);

      // Convert order type
      const orderTypeMap: Record<string, string> = {
        'Dine-In': 'DINE IN',
        'Takeout': 'TAKE OUT',
        'Delivery': 'DELIVERY',
        'Bar': 'DINE IN'
      };
      setOrderType(orderTypeMap[existingOrder.orderType] || 'DINE IN');

      // Convert existing order items to local format
      const convertedItems: OrderItem[] = existingOrder.items.map((item, index) => ({
        id: Date.now() + index,
        qty: item.qty,
        name: item.name,
        price: item.price,
        modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
        itemOrderType: orderTypeMap[existingOrder.orderType] || 'Dine In'
      }));

      // Store existing items separately to track what's paid vs new
      setExistingItems(convertedItems);

      // If existing order is unpaid, show all items; if paid, start with empty cart for new items
      if (!isExistingOrderPaid) {
        setOrderItems(convertedItems);
      }
    }
  }, [addItemMode, existingOrderId]);

  // Handle Transfer to New Order mode - pre-fill cart with transferred items
  useEffect(() => {
    if (transferNewMode && transferItemsParam) {
      try {
        const items = JSON.parse(transferItemsParam) as Array<{
          name: string;
          price: number;
          qty: number;
          modifiers?: string[];
        }>;
        const convertedItems: OrderItem[] = items.map((item, index) => ({
          id: Date.now() + index,
          qty: item.qty,
          name: item.name,
          price: item.price,
          modifiers: item.modifiers && item.modifiers.length > 0 ? item.modifiers : undefined,
          isTransferred: true
        }));
        setOrderItems(convertedItems);
      } catch (e) {
        console.error('Failed to parse transfer items:', e);
      }
    }
  }, [transferNewMode, transferItemsParam]);


  useEffect(() => {
    if (isGuestSelected) {
      setIsGuestSelected(false);
      return;
    }
    if (guestName.trim().length > 0) {
      const filtered = mockGuestUsers.filter((user) => user.name.toLowerCase().includes(guestName.toLowerCase()));
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
      const filtered = mockGuestUsers.filter((user) => user.phone.replace(/\D/g, '').includes(guestPhone));
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
    if (position === 'center') return window.innerHeight - 344; // screen minus order panel area (18rem = 288px) + bottom nav (3.5rem = 56px)
    return window.innerHeight - 168; // full minus header area (7rem = 112px) + bottom nav (3.5rem = 56px)
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
      if (diff < -20) {
        // Swipe down - hide/minimize
        setMenuPosition((prev) => prev === 'full' ? 'center' : 'minimized');
      } else if (diff > 20) {
        // Swipe up - show/expand
        setMenuPosition((prev) => prev === 'minimized' ? 'center' : 'full');
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
        if (diff < -20) {
          // Swipe down - hide/minimize
          setMenuPosition((prev) => prev === 'full' ? 'center' : 'minimized');
        } else if (diff > 20) {
          // Swipe up - show/expand
          setMenuPosition((prev) => prev === 'minimized' ? 'center' : 'full');
        }
      } else {
        // Snap based on final position
        if (diff < -80) {
          // Drag down - hide/minimize
          setMenuPosition((prev) => prev === 'full' ? 'center' : 'minimized');
        } else if (diff > 80) {
          // Drag up - show/expand
          setMenuPosition((prev) => prev === 'minimized' ? 'center' : 'full');
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
    // Block adding items if order is split
    if (isOrderSplit) {
      setShowSplitOrderAlert(true);
      return;
    }

    // When coming from table order, assign all seats by default
    const allSeats = isTableOrder ? Array.from({ length: guestCount }, (_, i) => i + 1) : undefined;

    setOrderItems((prev) => {
      const existing = prev.find((o) => o.name === item.name && (!o.modifiers || o.modifiers.length === 0));
      if (existing) {
        return prev.map((o) => o.name === item.name && (!o.modifiers || o.modifiers.length === 0) ? {
          ...o,
          qty: o.qty + 1
        } : o);
      }
      return [...prev, {
        id: Date.now(),
        qty: 1,
        name: item.name,
        price: item.price,
        assignedSeats: allSeats
      }];
    });
  };
  const addToCartWithModifiers = (item: {
    id: number;
    name: string;
    price: number;
  }, quantity: number, modifiers: string[], notes: string, totalPrice: number, assignedSeats?: number[], discountInfo?: {name: string;amount: number;}) => {
    // When assignedSeats is defined (from table order) but empty, treat as "share on table" (all seats)
    const allSeats = isTableOrder ? Array.from({ length: guestCount }, (_, i) => i + 1) : undefined;
    const seatsToAssign = assignedSeats !== undefined ?
    assignedSeats.length > 0 ? assignedSeats : allSeats :
    undefined;

    setOrderItems((prev) => {
      return [...prev, {
        id: Date.now(),
        qty: quantity,
        name: item.name,
        price: totalPrice / quantity, // Store the unit price including modifiers/add-ons
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        assignedSeats: seatsToAssign,
        discountName: discountInfo?.name,
        discountAmount: discountInfo?.amount
      }];
    });
  };
  const openCustomizationDialog = (item: {
    id: number;
    name: string;
    price: number;
  }, imageIndex: number) => {
    // Block opening customization if order is split
    if (isOrderSplit) {
      setShowSplitOrderAlert(true);
      return;
    }

    setSelectedItemForCustomization(item);
    setSelectedItemImage(foodImages[imageIndex % foodImages.length]);

    // Check if mobile (window width < 768px)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Show inline customization on mobile - stay in current position
      setShowInlineCustomization(true);
    } else {
      // Show dialog on desktop
      setCustomizationDialogOpen(true);
    }
  };
  const handleInlineAddToCart = (item: {
    id: number;
    name: string;
    price: number;
  }, quantity: number, modifiers: string[], notes: string, totalPrice: number, discountInfo?: {name: string;amount: number;}) => {
    addToCartWithModifiers(item, quantity, modifiers, notes, totalPrice, undefined, discountInfo);
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
    setMenuPosition('center');
  };
  const handleInlineCancel = () => {
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
    setMenuPosition('center');
    setIsProductInfoFullScreen(false);
  };
  const handleInlineViewChange = (view: 'customization' | 'mpin' | 'priceOverride' | 'productInfo') => {
    setIsProductInfoFullScreen(view === 'productInfo');
  };
  const removeFromCart = (itemId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };
  const updateItemOrderType = (itemId: number, newOrderType: string) => {
    setOrderItems((prev) => prev.map((item) =>
    item.id === itemId ? { ...item, itemOrderType: newOrderType } : item
    ));
  };

  // Price Override functions
  const handlePriceClick = (item: {id: number;name: string;price: number;}, image?: string) => {
    setPriceOverrideItem({ ...item, image });
    setShowMPINDialog(true);
  };

  const handleMPINSuccess = () => {
    setShowPriceOverrideDialog(true);
  };

  const handlePriceOverrideApply = (newPrice: number, reason: string, notes?: string) => {
    if (priceOverrideItem) {
      setOrderItems((prev) => prev.map((item) =>
      item.id === priceOverrideItem.id ?
      { ...item, price: newPrice, priceOverrideReason: reason, priceOverrideNotes: notes } :
      item
      ));
      setPriceOverrideItem(null);
    }
  };

  // Custom Item Panel functions
  const handleCustomItemNumpadClick = (value: string) => {
    if (activeCustomItemField === 'price') {
      if (value === 'clear') {
        setCustomItemPrice("");
      } else if (value === 'backspace') {
        setCustomItemPrice((prev) => prev.slice(0, -1));
      } else if (value === '.') {
        if (!customItemPrice.includes('.')) {
          setCustomItemPrice((prev) => prev + value);
        }
      } else {
        // Limit decimal places to 2
        const parts = customItemPrice.split('.');
        if (parts.length === 2 && parts[1].length >= 2) return;
        setCustomItemPrice((prev) => prev + value);
      }
    }
  };

  const handleCustomItemKeyboardClick = (key: string) => {
    if (activeCustomItemField === 'name') {
      if (key === 'backspace') {
        setCustomItemName((prev) => prev.slice(0, -1));
      } else if (key === 'clear') {
        setCustomItemName("");
      } else if (key === 'space') {
        setCustomItemName((prev) => prev + ' ');
      } else if (key === 'shift') {
        setIsShiftActive((prev) => !prev);
      } else if (key === '123') {
        // Switch to price field when 123 is pressed
        setActiveCustomItemField('price');
      } else {
        // Auto-capitalize first letter of each word
        setCustomItemName((prev) => {
          const shouldCapitalize = prev.length === 0 || prev.endsWith(' ');
          const char = shouldCapitalize || isShiftActive ? key.toUpperCase() : key.toLowerCase();
          return prev + char;
        });
        // Auto-disable shift after typing a character
        if (isShiftActive) {
          setIsShiftActive(false);
        }
      }
    }
  };

  const addCustomItemToOrder = () => {
    const price = parseFloat(customItemPrice) || 0;
    if (customItemName.trim() && price > 0) {
      setOrderItems((prev) => [...prev, {
        id: Date.now(),
        qty: 1,
        name: customItemName.trim(),
        price: price
      }]);
      setCustomItemName("");
      setCustomItemPrice("");
      setShowCustomItemPanel(false);
    }
  };

  const toggleCustomItemPanel = () => {
    if (showCustomItemPanel) {
      // Going back to menu
      setShowCustomItemPanel(false);
      setCustomItemName("");
      setCustomItemPrice("");
    } else {
      // Opening custom item panel
      setShowCustomItemPanel(true);
      setMenuPosition('full');
      setActiveCustomItemField('name');
    }
  };
  const handleMenuSelect = (value: string) => {
    setSelectedMenu(value);
    setIsMenuSelectOpen(false);
    // Auto-select first category and subcategory for the new menu
    const {
      firstCategory,
      firstSubcategory
    } = getFirstCategoryAndSubcategory(value);
    setActiveCategory(firstCategory);
    setActiveSubcategory(firstSubcategory);
  };

  // Handle category change - auto-select first subcategory
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const subcategories = categorySubcategories[category] || [];
    const firstSubcategory = subcategories[0] || "";
    setActiveSubcategory(firstSubcategory);
  };
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const selectedDiscount = discountTypes.find((d) => d.id === selectedDiscountId);
  const discount = selectedDiscount ?
  selectedDiscount.fixedAmount || subtotal * ((selectedDiscount.percentage || 0) / 100) :
  0;
  const serviceCharge = appliedServiceCharge;
  const taxRate = 0.02;
  // Calculate tax only on items NOT marked as noTax
  const taxableSubtotal = orderItems.
  filter((item) => !item.noTax).
  reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = isTaxExempt ? 0 : Math.max(0, taxableSubtotal - discount) * taxRate;

  // Handler to toggle no-tax state for individual items
  const handleToggleItemNoTax = (itemId: number) => {
    setOrderItems((prev) => prev.map((item) =>
    item.id === itemId ?
    { ...item, noTax: !item.noTax } :
    item
    ));
  };

  // Handler to toggle fired state for individual items
  const handleToggleItemFire = (itemId: number) => {
    setOrderItems((prev) => prev.map((item) =>
    item.id === itemId ?
    { ...item, isFired: !item.isFired } :
    item
    ));
  };

  // Handler to fire the entire order (session orders)
  const handleFireOrder = () => {
    if (!isSessionOrderMode || !sessionIdFromParams) {
      // Not a session order, just toggle all items to fired
      setOrderItems((prev) => prev.map((item) => ({ ...item, isFired: true })));
      toast.success("Order items marked as fired!");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add items to the order before firing");
      return;
    }

    // Convert cart items to the format expected by session orders
    const sessionOrderItems = orderItems.map((item) => ({
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.assignedSeats || [],
      modifiers: item.modifiers || [],
      isShared: item.assignedSeats?.length === guestCount
    }));

    // Update session order items
    updateOrderItems(sessionIdFromParams, sessionOrderItems);

    // Fire the order - changes status to ORDERED
    fireSessionOrder(sessionIdFromParams);

    toast.success("Order fired to kitchen!");

    // Navigate to TableOrderDetails
    if (tableIdFromParams) {
      navigate(`/tableorder/${tableIdFromParams}`);
    }
  };

  const total = subtotal - discount + serviceCharge + tax;

  // Calculate new items total for add-item mode when existing order is paid
  const newItemsSubtotal = addItemMode && isExistingOrderPaid ?
  orderItems.reduce((sum, item) => sum + item.price * item.qty, 0) :
  subtotal;
  const newItemsTax = newItemsSubtotal * taxRate;
  const newItemsTotal = newItemsSubtotal + newItemsTax;

  // Determine what to charge based on payment status, gift card, and voucher
  const baseChargeAmount = addItemMode && isExistingOrderPaid ? newItemsTotal : total;
  const chargeAmount = Math.max(0, baseChargeAmount - appliedGiftCardAmount - appliedVoucherAmount);
  const chargeLabel = addItemMode ?
  isExistingOrderPaid ? 'NEW ITEMS' : 'FULL ORDER' :
  '';
  return <div className="relative flex flex-col md:flex-row gap-[10px] md:gap-1 lg:gap-2 h-full overflow-hidden pt-2">
      {/* Panel Drop Zones for drag and drop repositioning */}
      <PanelDropZones />
      {/* Right Panel - Order (Shows first on mobile) */}
      <div className={`md:hidden flex flex-col overflow-hidden transition-all duration-300 ${isOrderPanelExpanded ? 'flex-1' : 'flex-shrink-0'}`}>
        {/* Order Header - Outside background container */}
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-2 gap-2">
            <div className="relative">
              <input ref={mobileGuestInputRef} type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="GUEST NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 font-medium text-[#808080]" />
              {showGuestDropdown && filteredGuests.length > 0 && <div ref={mobileGuestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
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
              <input ref={mobilePhoneInputRef} type="tel" inputMode="tel" value={formatPhoneNumber(guestPhone)} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="(XXX) XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-36 min-w-0 text-[#808080]" />
              {showPhoneDropdown && filteredByPhone.length > 0 && <div ref={mobilePhoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredByPhone.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
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
              <Button
              variant="secondary"
              size="sm"
              className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap flex items-center gap-1.5"
              onClick={toggleCustomItemPanel}>

                <img src={showCustomItemPanel ? menuIcon : customItemIcon} alt="" className="w-4 h-4" />
                {showCustomItemPanel ? "Menu" : "Custom Item"}
              </Button>
              <Button
              variant="secondary"
              size="sm"
              className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap"
              onClick={() => {
                if (isManager) {
                  setDiscountDialogView('discounts');
                } else {
                  setDiscountDialogView('mpin');
                }
                setShowDiscountDialog(true);
              }}>

                Discount
              </Button>
              <Button
              variant="secondary"
              size="sm"
              className={`text-xs rounded-[10px] ${isTaxExempt ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#666666] border h-7 px-3 whitespace-nowrap`}
              onClick={() => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true)}>

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
        <div className={`flex flex-col bg-[#7575754D] border border-white rounded-lg overflow-hidden mx-1 transition-all duration-300 ${isOrderPanelExpanded ? 'flex-1 min-h-0' : 'min-h-0'}`}>
          {/* Order Type & Guest Info */}
          {isTableOrder ?
        <>
              {/* Table Order Header - Row 1 */}
              <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
                    TABLE {tableIdFromParams}
                  </span>
                  <Users className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-400 text-xs">{totalSeats}</span>
                  <span className="font-bold text-white text-sm">{guestCount}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <img src={runnerIcon} alt="User" className="w-4 h-4" />
                  <span className="text-neutral-400">{guestName || "Mia Jone"}</span>
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
              {/* Table Order Header - Row 2: Seat buttons */}
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-sidebar-border">
                <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
                  <img src={chairWhiteIcon} alt="Chair" className="w-3 h-3" />
                </button>
                <button
              onClick={() => toggleSeatFilter('all')}
              className={`p-1 rounded transition-colors ${
              seatFilter.includes('all') ?
              'bg-white' :
              'bg-neutral-700 hover:bg-neutral-600'}`
              }>

                  <Share2 className={`w-3 h-3 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
                </button>
                {Array.from({ length: guestCount }).map((_, i) =>
            <button
              key={i}
              onClick={() => toggleSeatFilter(i + 1)}
              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
              seatFilter.includes(i + 1) ?
              'bg-white text-black' :
              'bg-neutral-600 text-white hover:bg-neutral-500'}`
              }>

                    {i + 1}
                  </button>
            )}
              </div>
            </> :

        <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors text-black" style={{
                  background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                }}>
                      <img src={orderTypes.find((t) => t.label === orderType)?.icon} alt="" className="w-4 h-4 invert" />
                      {orderType} <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px] p-1 z-50">
                    {orderTypes.map((type) => <DropdownMenuItem key={type.label} onClick={() => {
                  setOrderType(type.label);
                  if (type.label === "DINE IN") {
                    setShowDineInForm(true);
                    setDineInGuestData(null);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "TAKE OUT") {
                    setShowTakeOutForm(true);
                    setTakeOutGuestData(null);
                    setShowDineInForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "DELIVERY") {
                    setShowDeliveryForm(true);
                    setDeliveryGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowBanquetForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "BANQUET") {
                    setShowBanquetForm(true);
                    setBanquetGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "DRIVE THRU") {
                    setShowDriveThruForm(true);
                    setDriveThruGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowBanquetForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "CURB SIDE") {
                    setShowCurbSideForm(true);
                    setCurbSideGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "SCHEDULED") {
                    setShowScheduledForm(true);
                    setScheduledGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "PHONE-IN") {
                    setShowPhoneInForm(true);
                    setPhoneInGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowCustomOrderForm(false);
                  } else if (type.label === "CUSTOM") {
                    setShowCustomOrderForm(true);
                    setCustomOrderGuestData(null);
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                  } else {
                    setShowDineInForm(false);
                    setShowTakeOutForm(false);
                    setShowDeliveryForm(false);
                    setShowDriveThruForm(false);
                    setShowCurbSideForm(false);
                    setShowScheduledForm(false);
                    setShowPhoneInForm(false);
                    setShowCustomOrderForm(false);
                  }
                }} className="text-white hover:bg-neutral-700 cursor-pointer text-[10px] py-1 px-2 flex items-center gap-2">
                        <img src={type.icon} alt="" className="w-4 h-4" />
                        {type.label}
                      </DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
                {orderItems.length > 0 && <span className="bg-sidebar-accent px-2 py-0.5 rounded text-xs font-bold">20</span>}
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
                  <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 min-w-[160px] p-1 z-50">
                    <DropdownMenuItem
                  onClick={toggleCustomItemPanel}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={customItemIcon} alt="" className="w-3.5 h-3.5" />
                      Custom Item
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => {
                    if (isManager) {
                      setDiscountDialogView('discounts');
                    } else {
                      setDiscountDialogView('mpin');
                    }
                    setShowDiscountDialog(true);
                  }}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={discountIcon} alt="" className="w-3.5 h-3.5" />
                      Discount
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={noTaxBtnIcon} alt="" className="w-3.5 h-3.5" />
                      No Tax
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                      <img src={registerBtnIcon} alt="" className="w-3.5 h-3.5" />
                      Register
                    </DropdownMenuItem>
                    {orderItems.length > 0 && (
                    <DropdownMenuItem
                  onClick={() => setShowTransferCheckDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={transferCheckIcon} alt="" className="w-3.5 h-3.5" />
                      Transfer Check
                    </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                  onClick={() => setShowGiftCardDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={giftCardBtnIcon} alt="" className="w-3.5 h-3.5" />
                      Gift Card
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowServiceChargeDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={serviceChargeIcon} alt="" className="w-3.5 h-3.5" />
                      Service Charge
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowAddGuestForm(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={addGuestIcon} alt="" className="w-3.5 h-3.5" />
                      Add Guest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowVoucherOptionsPopup(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <Ticket className="w-3.5 h-3.5" />
                      Voucher
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                      <img src={reopenCheckIcon} alt="" className="w-3.5 h-3.5" />
                      Reopen Check
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
        }

          {/* Order Notes */}
          <div className="px-2 py-1.5 border-b border-sidebar-border">
            <OrderNotesAutocomplete
            value={orderNotes}
            onChange={setOrderNotes}
            placeholder="Order notes and Allergies" />

          </div>
          {transferNewMode &&
        <div className="px-3 py-1.5 border-b border-sidebar-border flex items-center gap-2">
              <img src={transferIconPng} alt="Transferred" className="w-4 h-4 opacity-70" />
              <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                Transferred from Order {searchParams.get('transferFrom')} · Table {searchParams.get('transferFromTable')?.replace('T', '')}
              </span>
            </div>
        }

           {/* Mobile Guest Forms - Bottom Sheet Drawers */}
          <Drawer open={showDineInForm && orderType === "DINE IN"} onOpenChange={(open) => { if (!open) setShowDineInForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <DineInGuestForm
                  onSave={(data) => { setDineInGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowDineInForm(false); }}
                  onCancel={() => setShowDineInForm(false)}
                  onClose={() => setShowDineInForm(false)}
                  initialData={dineInGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showTakeOutForm && orderType === "TAKE OUT"} onOpenChange={(open) => { if (!open) setShowTakeOutForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <TakeOutGuestForm
                  onSave={(data) => { setTakeOutGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowTakeOutForm(false); }}
                  onCancel={() => setShowTakeOutForm(false)}
                  onClose={() => setShowTakeOutForm(false)}
                  initialData={takeOutGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showDeliveryForm && orderType === "DELIVERY"} onOpenChange={(open) => { if (!open) setShowDeliveryForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <DeliveryGuestForm
                  onSave={(data) => { setDeliveryGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowDeliveryForm(false); }}
                  onCancel={() => setShowDeliveryForm(false)}
                  onClose={() => setShowDeliveryForm(false)}
                  initialData={deliveryGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showBanquetForm && orderType === "BANQUET"} onOpenChange={(open) => { if (!open) setShowBanquetForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <BanquetGuestForm
                  onSave={(data) => { setBanquetGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowBanquetForm(false); }}
                  onCancel={() => setShowBanquetForm(false)}
                  onClose={() => setShowBanquetForm(false)}
                  initialData={banquetGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showDriveThruForm && orderType === "DRIVE THRU"} onOpenChange={(open) => { if (!open) setShowDriveThruForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <DriveThruGuestForm
                  onSave={(data) => { setDriveThruGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowDriveThruForm(false); }}
                  onCancel={() => setShowDriveThruForm(false)}
                  onClose={() => setShowDriveThruForm(false)}
                  initialData={driveThruGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showCurbSideForm && orderType === "CURB SIDE"} onOpenChange={(open) => { if (!open) setShowCurbSideForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <CurbSideGuestForm
                  onSave={(data) => { setCurbSideGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowCurbSideForm(false); }}
                  onCancel={() => setShowCurbSideForm(false)}
                  onClose={() => setShowCurbSideForm(false)}
                  initialData={curbSideGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showScheduledForm && orderType === "SCHEDULED"} onOpenChange={(open) => { if (!open) setShowScheduledForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <ScheduledGuestForm
                  onSave={(data) => { setScheduledGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowScheduledForm(false); }}
                  onCancel={() => setShowScheduledForm(false)}
                  onClose={() => setShowScheduledForm(false)}
                  initialData={scheduledGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showPhoneInForm && orderType === "PHONE-IN"} onOpenChange={(open) => { if (!open) setShowPhoneInForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <PhoneInGuestForm
                  onSave={(data) => { setPhoneInGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowPhoneInForm(false); }}
                  onClose={() => setShowPhoneInForm(false)}
                  initialData={phoneInGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showCustomOrderForm && orderType === "CUSTOM"} onOpenChange={(open) => { if (!open) setShowCustomOrderForm(false); }}>
            <DrawerContent className="max-h-[92vh] bg-neutral-900 border-t border-neutral-700" hideHandle={false}>
              <div className="flex flex-col h-[85vh]">
                <CustomOrderGuestForm
                  onSave={(data) => { setCustomOrderGuestData(data); setGuestName(data.guestName); setGuestPhone(data.phoneNumber || ''); setShowCustomOrderForm(false); }}
                  onClose={() => setShowCustomOrderForm(false)}
                  initialData={customOrderGuestData || undefined} />
              </div>
            </DrawerContent>
          </Drawer>

          {/* Mobile Add Guest Form Overlay */}
          {showAddGuestForm &&
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-md h-[85vh] rounded-xl overflow-hidden relative" style={{ background: '#2A2A2A' }}>
                <AddGuestForm
              onClose={() => setShowAddGuestForm(false)}
              onSave={(guestData) => {
                setGuestName(`${guestData.firstName} ${guestData.lastName}`);
                setGuestPhone(guestData.phoneNumber);
                setShowAddGuestForm(false);
              }} />

              </div>
            </div>
        }

          {/* Mobile Create Voucher Form Overlay */}
          {showCreateVoucherForm &&
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-md h-[85vh] rounded-xl overflow-hidden relative" style={{ background: '#2A2A2A' }}>
                <CreateVoucherForm
              onClose={() => setShowCreateVoucherForm(false)}
              onCreate={(voucherData) => {
                toast.success("Voucher created successfully!");
                setShowCreateVoucherForm(false);
              }} />
              </div>
            </div>
        }

          {/* Mobile Cart Items */}
          <div className={`min-h-0 overflow-hidden flex flex-col ${isOrderPanelExpanded ? 'flex-1' : ''}`}>
            {orderItems.length === 0 ? null : <ScrollArea className={`h-full ${isOrderPanelExpanded ? 'flex-1' : 'max-h-[78px]'}`}>
                <div className="px-1.5 py-0.5 space-y-0.5">
                  {(isTableOrder ? filteredOrderItems : orderItems).map((item, index) => <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)} onNoTax={() => handleToggleItemNoTax(item.id)} isNoTax={item.noTax || false} onFire={() => handleToggleItemFire(item.id)} isFired={item.isFired || false} itemOrderType={item.itemOrderType || "Dine In"} onOrderTypeChange={(type) => updateItemOrderType(item.id, type)} isOpen={activeSwipedItemId === item.id} onSwipeStart={() => setActiveSwipedItemId(item.id)}>
                      <div
                  className={`rounded px-1.5 py-1 cursor-pointer ${item.isTransferred ? 'border border-[#3B6A9E]' : 'bg-neutral-800'}`}
                  style={item.isTransferred ? { background: 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)' } : undefined}
                  onClick={() => openCustomizationDialog({ id: item.id, name: item.name, price: item.price }, index)}>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0 ${item.isTransferred ? 'bg-[#3B6A9E]' : 'border border-white/50'}`}>
                              {item.qty}
                            </span>
                            <span className="text-[11px] font-medium text-foreground">{item.name}</span>
                          </div>
                          {item.itemOrderType === 'VOUCHER' ?
                    <span
                      className="text-[11px] font-medium text-foreground cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                      }}>

                              ${item.price.toFixed(2)}
                            </span> :
                    item.noTax ?
                    <span
                      className="text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                      }}>

                              <span className="line-through text-white/40">${(item.price * (1 + taxRate)).toFixed(2)}</span>
                              <span className="text-green-400">${item.price.toFixed(2)}</span>
                            </span> :

                    <span
                      className="text-[11px] font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                      }}>

                              ${item.price.toFixed(2)}
                            </span>
                    }
                        </div>
                        
                        {/* Modifiers with tree hierarchy - Mobile */}
                        {item.modifiers && item.modifiers.length > 0 && (() => {
                    const displayedModifiers = expandedCartItems.has(item.id) ? item.modifiers : item.modifiers.slice(0, 2);
                    const hasShowButton = item.modifiers.length > 2;

                    return (
                      <div className="ml-2.5 mt-0.5 relative">
                              {displayedModifiers.map((mod, idx) => {
                          const isAddOn = mod.startsWith("Add:");
                          const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                          const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                          const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;

                          return (
                            <div key={idx} className="relative flex items-center text-[10px] py-[2px]">
                                    {/* Vertical line - only show if not last item */}
                                    {!isLastItem &&
                              <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                              }
                                    {/* Vertical line segment to connect to horizontal */}
                                    <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                    {/* Horizontal connector */}
                                    <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                    {/* Content */}
                                    <div className="flex items-center gap-1.5 ml-4">
                                      <span className="text-white">
                                        {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                      </span>
                                      <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>
                                        {displayMod}
                                      </span>
                                    </div>
                                  </div>);

                        })}
                              {hasShowButton &&
                        <div className="relative flex items-center py-[2px]">
                                  {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                  <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                  {/* Horizontal connector */}
                                  <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                  <button
                            className="text-[10px] text-white/60 hover:text-white ml-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCartItems((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(item.id)) {
                                  newSet.delete(item.id);
                                } else {
                                  newSet.add(item.id);
                                }
                                return newSet;
                              });
                            }}>

                                    {expandedCartItems.has(item.id) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                  </button>
                                </div>
                        }
                            </div>);

                  })()}
                        
                        {/* Item Notes Display - Mobile */}
                        {item.notes &&
                  <div className="ml-2.5 mt-0.5 relative">
                            <div className="relative flex items-center text-[10px] py-[2px]">
                              {/* Vertical line segment to connect to horizontal */}
                              <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                              {/* Horizontal connector */}
                              <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                              {/* Content */}
                              <div className="flex items-center gap-1.5 ml-4">
                                <span className="text-white">📝</span>
                                <span className="text-white italic">{item.notes}</span>
                              </div>
                            </div>
                          </div>
                  }
                        
                        {/* Item Discount Display - Mobile */}
                        {item.discountName && item.discountAmount && item.discountAmount > 0 &&
                  <div className="ml-2.5 mt-0.5 relative">
                            <div className="relative flex items-center text-[10px] py-[2px]">
                              {/* Vertical line segment to connect to horizontal */}
                              <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                              {/* Horizontal connector */}
                              <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                              {/* Content */}
                              <div className="flex items-center gap-1.5 ml-4">
                                <Tag className="w-3 h-3 text-white" />
                                <span className="text-white">{item.discountName} (-${item.discountAmount.toFixed(2)})</span>
                              </div>
                            </div>
                          </div>
                  }
                        
                        {/* Seat Assignment Display - Mobile */}
                        {isTableOrder && item.assignedSeats && item.assignedSeats.length > 0 &&
                  <div className="mt-0.5 flex items-center gap-1 ml-5">
                            <img src={chairWhiteIcon} alt="Seats" className="w-3 h-3 opacity-70" />
                            {item.assignedSeats.length === guestCount ?
                    <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
                                <Share2 className="w-2.5 h-2.5" />
                              </span> :

                    item.assignedSeats.map((seat) =>
                    <span
                      key={seat}
                      className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center">

                                  {seat}
                                </span>
                    )
                    }
                          </div>
                  }
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
                <span className="text-red-500">{selectedDiscount ? selectedDiscount.name.split(' ')[0] : 'Disc'}:</span>
                <span className="text-red-500">${discount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{appliedServiceChargeName ? appliedServiceChargeName.split(' ')[0] : 'Svc'}:</span>
                <span className="text-foreground">${serviceCharge.toFixed(2)}</span>
              </div>
            </div>}

          {/* Action Buttons - Only show when cart has items */}
          {orderItems.length > 0 &&
        <div className="px-2 py-2 flex items-center gap-2">
              <button onClick={() => setOrderItems([])} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
            backgroundColor: '#C9C9C9'
          }}>
                <img src={saveIcon} alt="Save" className="w-4 h-4" />
              </button>
              <button
            onClick={handleFireOrder}
            disabled={orderItems.length === 0}
            className={`flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 ${orderItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>

                <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                <span className="text-white font-semibold text-sm">FIRE</span>
              </button>
              <button
            onClick={() => setShowPaymentDialog(true)}
            className="flex-1 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
            }}>

                <span className="text-black font-semibold text-xs">
                  CHARGE ${chargeAmount.toFixed(2)}{chargeLabel && ` (${chargeLabel})`}
                </span>
              </button>
            </div>
        }
        </div>
      </div>

      {/* Left Panel - Menu */}
      <div className={`md:flex-1 flex flex-col min-w-0 bg-neutral-900 md:bg-black border-t border-sidebar-border md:border-0 rounded-t-[20px] md:rounded-none overflow-hidden md:pb-2 ${!isDragging ? 'transition-all duration-300 ease-out' : ''} ${menuPosition === 'minimized' && !isDragging ? 'h-12 flex-grow-0 flex-shrink-0 mt-auto' : menuPosition !== 'minimized' && !isDragging ? 'flex-1' : 'flex-grow-0 flex-shrink-0'} md:h-auto ${panelLayout === 'menu-right' ? 'md:order-2 md:pr-2' : 'md:order-1'}`} style={isDragging && dragOffset !== 0 ? {
      height: `${Math.max(48, Math.min(window.innerHeight - 80, getMenuHeight(menuPosition) + dragOffset))}px`,
      flexGrow: 0,
      flexShrink: 0,
      marginTop: 'auto'
    } : isDragging ? {
      height: `${getMenuHeight(menuPosition)}px`,
      flexGrow: 0,
      flexShrink: 0,
      marginTop: 'auto'
    } : undefined}>
        {/* Grabber for minimize/maximize */}
        <div className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing select-none md:hidden bg-neutral-900 rounded-t-[20px]">
          <div className="w-8" /> {/* Spacer for balance */}
          <div className="touch-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown}>
            <img src={grabberIcon} alt="Drag to resize" className="w-10 h-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-grab" />
          </div>
          {!(showInlineCustomization && selectedItemForCustomization) && !isSearchMode && <button className="w-6 h-6 p-0 border-0 bg-transparent z-10 touch-auto" onClick={(e) => {
          e.stopPropagation();
          setIsSearchMode(true);
          setMenuPosition('full');
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}>
            <img src={searchIcon} alt="Search" className="w-full h-full object-contain" />
          </button>}
          {showInlineCustomization && selectedItemForCustomization || isSearchMode ? <div className="w-8" /> : null}
        </div>
        {/* Menu Content - Hidden when minimized */}
      <div className={`flex flex-col gap-2 transition-all duration-300 bg-neutral-900 rounded-[12px] md:rounded-[16px] ${showInlineCustomization && selectedItemForCustomization ? 'p-0' : 'p-2 md:p-2 lg:p-3'} ${menuPosition === 'minimized' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100 overflow-hidden scrollbar-hide'}`}>
        {/* Custom Item Panel */}
        {showCustomItemPanel ?
        <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-white text-lg font-semibold">Custom Item</h2>
              <button
              onClick={toggleCustomItemPanel}
              className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors">

                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-3 flex-shrink-0">
              <div
              className={`flex items-center gap-3 bg-neutral-800 rounded-lg px-4 py-3 border ${activeCustomItemField === 'name' ? 'border-orange-500' : 'border-neutral-700'}`}
              onClick={() => setActiveCustomItemField('name')}>

                <span className="text-neutral-500 text-sm uppercase">NAME</span>
                <input
                type="text"
                value={customItemName}
                onChange={(e) => {
                  // Auto-capitalize first letter of each word
                  const value = e.target.value;
                  const capitalizedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
                  setCustomItemName(capitalizedValue);
                }}
                onFocus={() => setActiveCustomItemField('name')}
                placeholder="Enter item name"
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-neutral-500" />

              </div>
            </div>

            {/* Price Input */}
            <div className="mb-3 flex-shrink-0">
              <div
              className={`flex items-center gap-3 bg-neutral-800 rounded-lg px-4 py-3 border ${activeCustomItemField === 'price' ? 'border-orange-500' : 'border-neutral-700'}`}
              onClick={() => setActiveCustomItemField('price')}>

                <span className="text-neutral-500 text-sm uppercase">PRICE</span>
                <div className="flex-1 flex items-center">
                  <span className="text-white text-sm mr-1">$</span>
                  <input
                  type="text"
                  value={customItemPrice}
                  readOnly
                  onFocus={() => setActiveCustomItemField('price')}
                  placeholder="0.00"
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-neutral-500" />

                </div>
              </div>
            </div>

            {/* Add to Order Button */}
            <button
            onClick={addCustomItemToOrder}
            disabled={!customItemName.trim() || !customItemPrice}
            className="w-full py-3 rounded-lg font-semibold text-white mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>

              <Plus className="w-4 h-4" />
              Add to Order
              {customItemPrice && <span className="ml-2">${parseFloat(customItemPrice).toFixed(2)}</span>}
            </button>

            {/* Keyboard / Numpad */}
            {activeCustomItemField === 'name' ? (
          /* QWERTY Keyboard for Name */
          <div className="flex flex-col gap-1.5 min-h-0">
                {/* Row 1: q-p */}
                <div className="grid grid-cols-10 gap-1">
                  {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((key) =>
              <button
                key={key}
                onClick={() => handleCustomItemKeyboardClick(key)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-base md:text-lg font-medium py-3 transition-colors">

                      {isShiftActive ? key.toUpperCase() : key}
                    </button>
              )}
                </div>
                {/* Row 2: a-l */}
                <div className="grid grid-cols-10 gap-1">
                  {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((key) =>
              <button
                key={key}
                onClick={() => handleCustomItemKeyboardClick(key)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-base md:text-lg font-medium py-3 transition-colors">

                      {isShiftActive ? key.toUpperCase() : key}
                    </button>
              )}
                  <div /> {/* Empty space to align */}
                </div>
                {/* Row 3: shift, z-m, backspace */}
                <div className="grid grid-cols-10 gap-1">
                  <button
                onClick={() => handleCustomItemKeyboardClick('shift')}
                className={`bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors ${isShiftActive ? 'bg-blue-600 hover:bg-blue-500' : ''}`}>

                    ⇧
                  </button>
                  {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((key) =>
              <button
                key={key}
                onClick={() => handleCustomItemKeyboardClick(key)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-base md:text-lg font-medium py-3 transition-colors">

                      {isShiftActive ? key.toUpperCase() : key}
                    </button>
              )}
                  <button
                onClick={() => handleCustomItemKeyboardClick('backspace')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors col-span-2 flex items-center justify-center">

                    <Delete className="w-5 h-5" />
                  </button>
                </div>
                {/* Row 4: 123, Space, Clear */}
                <div className="grid grid-cols-6 gap-1">
                  <button
                onClick={() => handleCustomItemKeyboardClick('123')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors">

                    123
                  </button>
                  <button
                onClick={() => handleCustomItemKeyboardClick('space')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors col-span-4">

                    Space
                  </button>
                  <button
                onClick={() => handleCustomItemKeyboardClick('clear')}
                className="bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm font-medium py-3 transition-colors">

                    Clear
                  </button>
                </div>
              </div>) : (

          /* Numpad for Price */
          <div className="flex flex-col gap-2 min-h-0">
                <div className="grid grid-cols-3 gap-2">
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) =>
              <button
                key={num}
                onClick={() => handleCustomItemNumpadClick(num)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xl font-medium py-4 transition-colors">

                      {num}
                    </button>
              )}
                  <button
                onClick={() => handleCustomItemNumpadClick('clear')}
                className="bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-lg font-medium py-4 transition-colors">

                    Clear
                  </button>
                  <button
                onClick={() => handleCustomItemNumpadClick('0')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xl font-medium py-4 transition-colors">

                    0
                  </button>
                  <button
                onClick={() => handleCustomItemNumpadClick('.')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xl font-medium py-4 transition-colors">

                    .
                  </button>
                </div>
                
                {/* Backspace Button */}
                <button
              onClick={() => handleCustomItemNumpadClick('backspace')}
              className="w-full bg-neutral-800 hover:bg-neutral-700 rounded-lg py-4 flex items-center justify-center transition-colors">

                  <Delete className="w-5 h-5 text-white" />
                </button>
              </div>)
          }
          </div> :
        showInlineCustomization && selectedItemForCustomization ?
        isProductInfoFullScreen ?
        // Full-screen product info overlay on mobile
        <div className="fixed inset-0 z-50 bg-neutral-900 md:hidden flex flex-col" style={{ bottom: '56px' }}>
              <InlineItemCustomization
            item={selectedItemForCustomization}
            itemImage={selectedItemImage}
            onAddToCart={handleInlineAddToCart}
            onCancel={handleInlineCancel}
            onViewChange={handleInlineViewChange}
            className="h-full" />

            </div> :

        <div className="flex-1 flex flex-col md:hidden overflow-y-auto scrollbar-hide">
              <InlineItemCustomization
            item={selectedItemForCustomization}
            itemImage={selectedItemImage}
            onAddToCart={handleInlineAddToCart}
            onCancel={handleInlineCancel}
            onViewChange={handleInlineViewChange}
            className="h-full" />

            </div> :

        <>
        {/* Main Categories - Hidden in search mode on mobile */}
        <div className={`relative flex flex-wrap items-center gap-1 md:gap-1.5 lg:gap-2 pr-10 md:pr-12 lg:pr-14 ${isSearchMode ? 'hidden md:flex' : ''}`}>
          {/* Desktop Search Button - Top Right Corner */}
          <div className="hidden md:flex absolute top-1 right-0 z-10 items-center">
            <button
                className="cursor-pointer"
                onClick={() => setIsDesktopSearchOpen(true)}>

              <img src={searchIcon} alt="Search" className="w-8 h-8 lg:w-9 lg:h-9" />
            </button>
          </div>
          {/* Menu Controls Group */}
          {isMenuSelectOpen ? <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 bg-sidebar-accent rounded-full pl-1 pr-0.5 md:pl-1.5 md:pr-0.5 lg:pl-2 lg:pr-0.5 h-7 md:h-8 lg:h-9">
              <Button variant="ghost" size="icon" className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 p-0" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
                <img src={burgerCloseIcon} alt="Close menu" className="w-4 md:w-5 lg:w-6 h-4 md:h-5 lg:h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setHorizontalScrollMode(!horizontalScrollMode)} title={horizontalScrollMode ? "Show all subcategories" : "Enable horizontal scroll"}>
                {horizontalScrollMode ? <img src={horizontalScrollIcon} alt="Horizontal scroll" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" /> : <img src={verticalScrollIcon} alt="All view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setThumbnailViewMode(!thumbnailViewMode)} title={thumbnailViewMode ? "Show list view" : "Show thumbnail view"}>
                {thumbnailViewMode ? <img src={listViewIcon} alt="List view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" /> : <img src={thumbnailViewIcon} alt="Thumbnail view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" />}
              </Button>
              <Select value={selectedMenu} onValueChange={handleMenuSelect}>
                <SelectTrigger className="w-[100px] md:w-[110px] lg:w-[160px] rounded-full bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white h-6 md:h-7 lg:h-8 text-[11px] md:text-xs lg:text-sm">
                  <SelectValue placeholder="Select Menu" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {menuList.map((menu) => <SelectItem key={menu} value={menu} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                      {menu}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div> : <Button variant="ghost" size="icon" className="h-7 md:h-8 lg:h-9 w-7 md:w-8 lg:w-9 p-0 hover:bg-transparent" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
              <img src={burgerOpenIcon} alt="Open menu" className="w-6 md:w-8 lg:w-9 h-6 md:h-8 lg:h-9" />
            </Button>}
          {/* Categories */}
          {menuCategories[selectedMenu].map((cat) => <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} className={`rounded-full px-2.5 md:px-4 lg:px-6 h-7 md:h-8 lg:h-9 text-[11px] md:text-xs lg:text-sm whitespace-nowrap border-2 ${activeCategory === cat ? `${getCategoryBgColor(cat)} ${getCategoryHoverBgColor(cat)} text-white ${getCategoryBorderColor(cat)}` : `bg-header text-header-foreground ${getCategoryBorderColor(cat)} hover:bg-header/80`}`} onClick={() => handleCategoryChange(cat)}>
              {cat}
            </Button>)}
        </div>

        <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

        {/* Subcategories based on selected category - Hidden in search mode on mobile */}
        <div className={`overflow-x-auto scrollbar-hide ${horizontalScrollMode ? '' : 'max-h-[6rem] md:max-h-[7rem] lg:max-h-[8.5rem]'} ${isSearchMode ? 'hidden md:block' : ''}`}>
          <div className={`flex gap-1 md:gap-1.5 lg:gap-2 ${horizontalScrollMode ? 'flex-row flex-nowrap' : 'flex-row flex-wrap'}`}>
            {(categorySubcategories[activeCategory] || []).map((sub) => <Button key={sub} variant="outline" className={`rounded-md px-3 md:px-4 lg:px-6 h-7 md:h-7 lg:h-8 text-[11px] md:text-[10px] lg:text-xs whitespace-nowrap border ${activeSubcategory === sub ? `bg-black ${getCategoryTextColor(activeCategory)} ${getCategoryHoverTextColor(activeCategory)} ${getCategoryBorderColor(activeCategory)} font-semibold hover:bg-black` : `bg-black text-header-foreground ${getCategoryBorderColor(activeCategory)} hover:bg-black/80`}`} onClick={() => setActiveSubcategory(sub)}>
                {sub}
              </Button>)}
          </div>
        </div>

        <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
          {(() => {
              // Get items based on selected menu, category, and subcategory
              let currentItems: MenuItem[] = [];

              // When there's a search query, always search across ALL menu items
              if (searchQuery.trim()) {
                currentItems = getAllMenuItems(selectedMenu);
              } else if (activeSubcategory) {
                currentItems = getMenuItems(selectedMenu, activeCategory, activeSubcategory);
              } else if (activeCategory) {
                currentItems = getAllCategoryItems(selectedMenu, activeCategory);
              } else {
                currentItems = getAllMenuItems(selectedMenu);
              }

              // Filter items based on search query
              const filteredItems = searchQuery.trim() ? currentItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : currentItems;
              return thumbnailViewMode ? <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1 md:gap-1.5 lg:gap-2 pb-4 md:pb-0">
                {filteredItems.map((item, index) => <div key={item.id} className="flex flex-col rounded-md overflow-hidden cursor-pointer group border border-neutral-700">
                    <div className="relative aspect-[2/1] md:aspect-square bg-neutral-800" onClick={() => openCustomizationDialog(item, index)}>
                      <img src={foodImages[index % foodImages.length]} alt={item.name} className="w-full h-full object-cover" />
                      <button onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }} className="absolute top-0.5 md:top-1 left-0.5 md:left-1 w-5 md:w-6 h-5 md:h-6 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center transition-colors">
                        <Plus className="w-2.5 md:w-3 h-2.5 md:h-3 text-white" strokeWidth={3} />
                      </button>
                    </div>
                    <div className="p-0.5 md:p-1 bg-neutral-900 flex items-center justify-between gap-1" onClick={() => openCustomizationDialog(item, index)}>
                      <span className="text-[11px] md:text-xs font-medium text-white uppercase leading-tight line-clamp-1 flex-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] md:text-[11px] text-orange-400 font-semibold shrink-0">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>)}
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-1.5 pb-4 md:pb-0">
                {filteredItems.map((item, index) => <div key={item.id} onClick={() => openCustomizationDialog(item, index)} className="flex items-stretch bg-sidebar-accent rounded-md overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border min-h-[38px] md:min-h-[42px]">
                    <div className="flex-1 p-1.5 md:p-2" style={{
                    background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)'
                  }}>
                      <span className="float-right text-[9px] md:text-[10px] ml-1 text-white">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-bold leading-tight uppercase text-foreground line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                    <button onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }} className="w-6 md:w-8 text-white flex-shrink-0 flex items-center justify-center" style={{
                    background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                  }}>
                      <Plus className="w-2.5 md:w-3 h-2.5 md:h-3" strokeWidth={4} />
                    </button>
                  </div>)}
              </div>;
            })()}
        </ScrollArea>
        </>}
        
        {/* Desktop/Tablet Search Bar - At Bottom */}
        {isDesktopSearchOpen && <div className="hidden md:flex items-center gap-2 px-3 py-2.5 bg-neutral-900 border-t border-neutral-700 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
            <img src={searchIcon} alt="Search" className="w-4 h-4 flex-shrink-0" />
            <input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="p-0.5">
              <X className="w-4 h-4 text-neutral-400" />
            </button>}
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 p-0 flex-shrink-0" onClick={() => {
            setIsDesktopSearchOpen(false);
            setSearchQuery('');
          }}>
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>}
        
        {/* Mobile Search Bar - At Bottom */}
        {isSearchMode && <div className="flex items-center gap-2 px-3 py-2.5 md:hidden bg-neutral-900 border-t border-neutral-700 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
            <img src={searchIcon} alt="Search" className="w-4 h-4 flex-shrink-0" />
            <input ref={searchInputRef} type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
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
        </div>}
      </div>
      </div>

      {/* Right Panel - Order (Desktop only) */}
      <div className={`hidden md:flex ${isOrderActionsSidebarOpen ? 'w-[350px] lg:w-[415px]' : 'w-[280px] lg:w-[345px]'} overflow-hidden flex-shrink-0 pb-2 pr-2 gap-0 transition-all duration-300 ${panelLayout === 'menu-right' ? 'md:order-1' : 'md:order-2'}`}>
        {/* Order Panel Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Order Header - Outside background container */}
          <div className="px-1 pb-2 flex-shrink-0">
            <div className="flex items-center text-xs mb-2 gap-2">
              <div className="relative flex-1">
                <input ref={guestInputRef} type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="GUEST NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-full min-w-0 font-medium text-[#808080]" />
                {showGuestDropdown && filteredGuests.length > 0 && <div ref={guestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                    {filteredGuests.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
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
              <div className="relative flex items-center gap-0.5 flex-shrink-0">
                <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
                <input ref={phoneInputRef} type="tel" inputMode="tel" value={formatPhoneNumber(guestPhone)} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="(XXX) XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-[#808080] text-xs" />
                {showPhoneDropdown && filteredByPhone.length > 0 && <div ref={phoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                    {filteredByPhone.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
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
                <img src={timeIcon} alt="Time" className="w-3 h-3" />
                <span className="text-white text-[10px]">12:30 PM</span>
                <DraggablePanelHandle panelId="order" className="flex-shrink-0" />
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center justify-between flex-1 overflow-x-auto scrollbar-hide gap-1.5">
                <Button
                variant="secondary"
                size="sm"
                className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-3 whitespace-nowrap flex-1 gap-1.5"
                onClick={toggleCustomItemPanel}>

                  <img src={showCustomItemPanel ? menuIcon : customItemIcon} alt="" className="w-3 h-3" />
                  {showCustomItemPanel ? "Menu" : "Custom Item"}
                </Button>
                <Button
                variant="secondary"
                size="sm"
                className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-3 whitespace-nowrap flex-1 gap-1.5"
                onClick={() => {
                  if (isManager) {
                    setDiscountDialogView('discounts');
                  } else {
                    setDiscountDialogView('mpin');
                  }
                  setShowDiscountDialog(true);
                }}>

                  <img src={discountBtnIcon} alt="" className="w-3 h-3" />
                  Discount
                </Button>
                <Button
                variant="secondary"
                size="sm"
                className={`text-[10px] rounded-[10px] ${isTaxExempt ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#666666] border h-6 px-3 whitespace-nowrap flex-1 gap-1.5`}
                onClick={() => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true)}>

                  <img src={noTaxBtnIcon} alt="" className="w-3 h-3" />
                  No Tax
                </Button>
                <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-3 whitespace-nowrap flex-1 gap-1.5">
                  <img src={registerBtnIcon} alt="" className="w-3 h-3" />
                  Register
                </Button>
              </div>
              <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border flex-shrink-0"
              onClick={() => setIsOrderActionsSidebarOpen(!isOrderActionsSidebarOpen)}>

                {isOrderActionsSidebarOpen ? <X className="w-3 h-3" /> : <MoreVertical className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Order Content Area with Sidebar */}
          <div className="flex-1 flex gap-2 min-h-0">
            {/* Background Container for Order Content */}
            <div className="flex-1 flex flex-col rounded-lg overflow-hidden min-h-0 relative" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
              {/* Add Guest Form Overlay */}
              {showAddGuestForm &&
            <div className="absolute inset-0 z-10 bg-background">
                  <AddGuestForm
                onClose={() => setShowAddGuestForm(false)}
                onSave={(guestData) => {
                  setGuestName(`${guestData.firstName} ${guestData.lastName}`);
                  setGuestPhone(guestData.phoneNumber);
                  setShowAddGuestForm(false);
                }} />

                </div>
            }
              {/* Create Voucher Form Overlay */}
              {showCreateVoucherForm &&
            <div className="absolute inset-0 z-10 bg-background">
                  <CreateVoucherForm
                onClose={() => setShowCreateVoucherForm(false)}
                onCreate={(voucherData) => {
                  toast.success("Voucher created successfully!");
                  setShowCreateVoucherForm(false);
                }} />
                </div>
            }
              {/* Order Type & Guest Info */}
              {isTableOrder ?
            <>
                  {/* Table Order Header - Row 1 */}
                  <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                      <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
                        TABLE {tableIdFromParams}
                      </span>
                      <Users className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-400 text-xs">{guestCount}</span>
                      <span className="font-bold text-white text-sm">{orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
                      <span className="text-neutral-400">{guestName || "MIA JONE"}</span>
                    </div>
                  </div>
                  {/* Table Order Header - Row 2: Seat buttons */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border">
                    <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
                      <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
                    </button>
                    <button
                  onClick={() => toggleSeatFilter('all')}
                  className={`p-1 rounded transition-colors ${
                  seatFilter.includes('all') ?
                  'bg-white' :
                  'bg-neutral-700 hover:bg-neutral-600'}`
                  }>

                      <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
                    </button>
                    {Array.from({ length: guestCount }).map((_, i) =>
                <button
                  key={i}
                  onClick={() => toggleSeatFilter(i + 1)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                  seatFilter.includes(i + 1) ?
                  'bg-white text-black' :
                  'bg-neutral-600 text-white hover:bg-neutral-500'}`
                  }>

                        {i + 1}
                      </button>
                )}
                  </div>
                </> :

            <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded transition-colors">
                          <img src={orderTypes.find((t) => t.label === orderType)?.icon} alt="" className="w-4 h-4" />
                          {orderType} <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px]">
                        {orderTypes.map((type) => <DropdownMenuItem key={type.label} onClick={() => {
                      setOrderType(type.label);
                      if (type.label === "DINE IN") {
                        setShowDineInForm(true);
                        setDineInGuestData(null);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                      } else if (type.label === "TAKE OUT") {
                        setShowTakeOutForm(true);
                        setTakeOutGuestData(null);
                        setShowDineInForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                      } else if (type.label === "DELIVERY") {
                        setShowDeliveryForm(true);
                        setDeliveryGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowBanquetForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                      } else if (type.label === "BANQUET") {
                        setShowBanquetForm(true);
                        setBanquetGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                        setShowScheduledForm(false);
                        setShowPhoneInForm(false);
                        setShowCustomOrderForm(false);
                      } else if (type.label === "DRIVE THRU") {
                        setShowDriveThruForm(true);
                        setDriveThruGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowBanquetForm(false);
                        setShowCurbSideForm(false);
                      } else if (type.label === "CURB SIDE") {
                        setShowCurbSideForm(true);
                        setCurbSideGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowBanquetForm(false);
                        setShowDriveThruForm(false);
                        setShowScheduledForm(false);
                      } else if (type.label === "SCHEDULED") {
                        setShowScheduledForm(true);
                        setScheduledGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                        setShowPhoneInForm(false);
                        setShowCustomOrderForm(false);
                      } else if (type.label === "PHONE-IN") {
                        setShowPhoneInForm(true);
                        setPhoneInGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                        setShowScheduledForm(false);
                        setShowCustomOrderForm(false);
                      } else if (type.label === "CUSTOM") {
                        setShowCustomOrderForm(true);
                        setCustomOrderGuestData(null);
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                        setShowScheduledForm(false);
                        setShowPhoneInForm(false);
                      } else {
                        setShowDineInForm(false);
                        setShowTakeOutForm(false);
                        setShowDeliveryForm(false);
                        setShowDriveThruForm(false);
                        setShowCurbSideForm(false);
                        setShowScheduledForm(false);
                        setShowPhoneInForm(false);
                        setShowCustomOrderForm(false);
                      }
                    }} className="text-white hover:bg-neutral-700 cursor-pointer flex items-center gap-2">
                            <img src={type.icon} alt="" className="w-4 h-4" />
                            {type.label}
                          </DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {orderItems.length > 0 && <span className="bg-sidebar-accent px-2 py-0.5 rounded text-base font-bold">20</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                  <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
                    <span>MIA JONE</span>
                  </div>
                </div>
            }

              {/* Dine In Guest Form */}
              {orderType === "DINE IN" && showDineInForm ?
            <DineInGuestForm
              onSave={(data) => {
                setDineInGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowDineInForm(false);
              }}
              onClose={() => setShowDineInForm(false)}
              initialData={dineInGuestData} /> :

            orderType === "TAKE OUT" && showTakeOutForm ?
            <TakeOutGuestForm
              onSave={(data) => {
                setTakeOutGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowTakeOutForm(false);
              }}
              onClose={() => setShowTakeOutForm(false)}
              initialData={takeOutGuestData} /> :

            orderType === "DELIVERY" && showDeliveryForm ?
            <DeliveryGuestForm
              onSave={(data) => {
                setDeliveryGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowDeliveryForm(false);
              }}
              onClose={() => setShowDeliveryForm(false)}
              initialData={deliveryGuestData} /> :

            orderType === "BANQUET" && showBanquetForm ?
            <BanquetGuestForm
              onSave={(data) => {
                setBanquetGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowBanquetForm(false);
              }}
              onClose={() => setShowBanquetForm(false)}
              initialData={banquetGuestData} /> :

            orderType === "DRIVE THRU" && showDriveThruForm ?
            <DriveThruGuestForm
              onSave={(data) => {
                setDriveThruGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowDriveThruForm(false);
              }}
              onClose={() => setShowDriveThruForm(false)}
              initialData={driveThruGuestData} /> :

            orderType === "CURB SIDE" && showCurbSideForm ?
            <CurbSideGuestForm
              onSave={(data) => {
                setCurbSideGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowCurbSideForm(false);
              }}
              onClose={() => setShowCurbSideForm(false)}
              initialData={curbSideGuestData} /> :

            orderType === "SCHEDULED" && showScheduledForm ?
            <ScheduledGuestForm
              onSave={(data) => {
                setScheduledGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowScheduledForm(false);
              }}
              onClose={() => setShowScheduledForm(false)}
              initialData={scheduledGuestData} /> :

            orderType === "PHONE-IN" && showPhoneInForm ?
            <PhoneInGuestForm
              onSave={(data) => {
                setPhoneInGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowPhoneInForm(false);
              }}
              onClose={() => setShowPhoneInForm(false)}
              initialData={phoneInGuestData} /> :

            orderType === "CUSTOM" && showCustomOrderForm ?
            <CustomOrderGuestForm
              onSave={(data) => {
                setCustomOrderGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowCustomOrderForm(false);
              }}
              onClose={() => setShowCustomOrderForm(false)}
              initialData={customOrderGuestData} /> :


            <>
                  {/* Edit Guest Info Button for Dine In */}
                  {orderType === "DINE IN" && dineInGuestData &&
              <button
                onClick={() => setShowDineInForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {dineInGuestData.guestName} | Table {dineInGuestData.tableNumber}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Take Out */}
                  {orderType === "TAKE OUT" && takeOutGuestData &&
              <button
                onClick={() => setShowTakeOutForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {takeOutGuestData.guestName}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Delivery */}
                  {orderType === "DELIVERY" && deliveryGuestData &&
              <button
                onClick={() => setShowDeliveryForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {deliveryGuestData.guestName} | {deliveryGuestData.address.fullAddress.slice(0, 25)}...</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Banquet */}
                  {orderType === "BANQUET" && banquetGuestData &&
              <button
                onClick={() => setShowBanquetForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {banquetGuestData.guestName} | {banquetGuestData.eventType}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Drive Thru */}
                  {orderType === "DRIVE THRU" && driveThruGuestData &&
              <button
                onClick={() => setShowDriveThruForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {driveThruGuestData.guestName}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Curb Side */}
                  {orderType === "CURB SIDE" && curbSideGuestData &&
              <button
                onClick={() => setShowCurbSideForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {curbSideGuestData.guestName}{curbSideGuestData.parkingSpot ? ` | ${curbSideGuestData.parkingSpot}` : ''}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Scheduled */}
                  {orderType === "SCHEDULED" && scheduledGuestData &&
              <button
                onClick={() => setShowScheduledForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {scheduledGuestData.guestName} | {scheduledGuestData.scheduledDate ? new Date(scheduledGuestData.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Phone-In */}
                  {orderType === "PHONE-IN" && phoneInGuestData &&
              <button
                onClick={() => setShowPhoneInForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {phoneInGuestData.guestName} | {phoneInGuestData.orderFulfillmentType}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Edit Guest Info Button for Custom Order */}
                  {orderType === "CUSTOM" && customOrderGuestData &&
              <button
                onClick={() => setShowCustomOrderForm(true)}
                className="w-full px-4 py-2 border-b border-sidebar-border text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ background: 'rgba(117, 117, 117, 0.2)' }}>

                      <span>Guest: {customOrderGuestData.guestName} | {customOrderGuestData.orderType || 'Custom'} {customOrderGuestData.priority !== "Normal" ? `(${customOrderGuestData.priority})` : ''}</span>
                      <span className="text-xs underline">Edit</span>
                    </button>
              }
                  {/* Order Notes */}
                  <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
                    <OrderNotesAutocomplete
                  value={orderNotes}
                  onChange={setOrderNotes}
                  placeholder="Order notes" />

                  </div>
                  {transferNewMode &&
              <div className="px-3 py-1.5 border-b border-sidebar-border flex items-center gap-2 flex-shrink-0">
                      <img src={transferIconPng} alt="Transferred" className="w-4 h-4 opacity-70" />
                      <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                        Transferred from Order {searchParams.get('transferFrom')} · Table {searchParams.get('transferFromTable')?.replace('T', '')}
                      </span>
                    </div>
              }

                  {/* Order Items */}
                  <ScrollArea className="flex-1 min-h-0 px-2">
                    {orderItems.length === 0 ? <div className="flex flex-col items-center justify-center h-full py-8">
                        <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                        <span className="text-muted-foreground text-sm">Let's create an order</span>
                      </div> : <div className="py-1 space-y-1 md:space-y-1 lg:space-y-2">
                        {(isTableOrder ? filteredOrderItems : orderItems).map((item, index) => <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)} onNoTax={() => handleToggleItemNoTax(item.id)} isNoTax={item.noTax || false} onFire={() => handleToggleItemFire(item.id)} isFired={item.isFired || false} itemOrderType={item.itemOrderType || "Dine In"} onOrderTypeChange={(type) => updateItemOrderType(item.id, type)} isOpen={activeSwipedItemId === item.id} onSwipeStart={() => setActiveSwipedItemId(item.id)}>
                            <div
                      className={`p-2 md:p-1.5 lg:p-3 border rounded-md md:rounded lg:rounded-lg cursor-pointer ${item.isTransferred ? 'border-[#3B6A9E]' : 'border-sidebar-border'}`}
                      style={item.isTransferred ?
                      { background: 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)' } :
                      { background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                      onClick={() => openCustomizationDialog({ id: item.id, name: item.name, price: item.price }, index)}>

                              <div className="flex flex-col">
                                {/* Item header row */}
                                <div className="flex items-start gap-2 md:gap-1.5 lg:gap-3">
                                  <span className={`w-6 h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded text-white text-xs md:text-[10px] lg:text-xs font-medium flex items-center justify-center flex-shrink-0 ${item.isTransferred ? 'bg-[#3B6A9E]' : 'bg-neutral-700 border border-neutral-600'}`}>
                                    {item.qty}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm md:text-xs lg:text-sm font-medium text-foreground">{item.name}</span>
                                      {item.itemOrderType === 'VOUCHER' ?
                              <span
                                className="text-sm md:text-xs lg:text-sm font-medium text-foreground cursor-pointer transition-colors ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                                }}>

                                          ${item.price.toFixed(2)}
                                        </span> :
                              item.noTax ?
                              <span
                                className="text-sm md:text-xs lg:text-sm font-medium flex items-center gap-1.5 ml-2 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                                }}>

                                          <span className="line-through text-white/40">${(item.price * (1 + taxRate)).toFixed(2)}</span>
                                          <span className="text-green-400">${item.price.toFixed(2)}</span>
                                        </span> :

                              <span
                                className="text-sm md:text-xs lg:text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                                }}>

                                          ${item.price.toFixed(2)}
                                        </span>
                              }
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Modifiers with tree hierarchy */}
                                {item.modifiers && item.modifiers.length > 0 && (() => {
                          const displayedModifiers = expandedCartItems.has(item.id) ? item.modifiers : item.modifiers.slice(0, 2);
                          const hasShowButton = item.modifiers.length > 2;

                          return (
                            <div className="ml-3 mt-1 relative">
                                      {displayedModifiers.map((mod, idx) => {
                                const isAddOn = mod.startsWith("Add:");
                                const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                                const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;

                                return (
                                  <div key={idx} className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                            {/* Vertical line - only show if not last item */}
                                            {!isLastItem &&
                                    <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                                    }
                                            {/* Vertical line segment to connect to horizontal */}
                                            <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                            {/* Horizontal connector */}
                                            <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                            {/* Content */}
                                            <div className="flex items-center gap-2 ml-5">
                                              <span className="text-white">
                                                {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                              </span>
                                              <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>
                                                {displayMod}
                                              </span>
                                            </div>
                                          </div>);

                              })}
                                      {hasShowButton &&
                              <div className="relative flex items-center py-[3px]">
                                          {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                          <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                          {/* Horizontal connector */}
                                          <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                          <button
                                  className="text-xs text-white/60 hover:text-white ml-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedCartItems((prev) => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(item.id)) {
                                        newSet.delete(item.id);
                                      } else {
                                        newSet.add(item.id);
                                      }
                                      return newSet;
                                    });
                                  }}>

                                            {expandedCartItems.has(item.id) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                          </button>
                                        </div>
                              }
                                    </div>);

                        })()}
                                
                                {/* Item Notes Display - Desktop/Tablet */}
                                {item.notes &&
                        <div className="ml-3 mt-1 relative">
                                    <div className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                      {/* Vertical line segment to connect to horizontal */}
                                      <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                      {/* Horizontal connector */}
                                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                      {/* Content */}
                                      <div className="flex items-center gap-2 ml-5">
                                        <span className="text-white">📝</span>
                                        <span className="text-white italic">{item.notes}</span>
                                      </div>
                                    </div>
                                  </div>
                        }
                                
                                {/* Item Discount Display - Desktop/Tablet */}
                                {item.discountName && item.discountAmount && item.discountAmount > 0 &&
                        <div className="ml-3 mt-1 relative">
                                    <div className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                      {/* Vertical line segment to connect to horizontal */}
                                      <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                      {/* Horizontal connector */}
                                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                      {/* Content */}
                                      <div className="flex items-center gap-2 ml-5">
                                        <Tag className="w-3 h-3 text-white" />
                                        <span className="text-white">{item.discountName} (-${item.discountAmount.toFixed(2)})</span>
                                      </div>
                                    </div>
                                  </div>
                        }
                                
                                {/* No Tax Added Display for Vouchers - Desktop/Tablet */}
                                {item.itemOrderType === 'VOUCHER' &&
                        <div className="ml-3 mt-1 relative">
                                    <div className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                      {/* Vertical line segment to connect to horizontal */}
                                      <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                      {/* Horizontal connector */}
                                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                      {/* Content */}
                                      <div className="flex items-center gap-2 ml-5">
                                        <span className="text-white/60 italic">No tax added</span>
                                      </div>
                                    </div>
                                  </div>
                        }
                                
                                {/* Seat Assignment Display - Desktop/Tablet */}
                                {isTableOrder && item.assignedSeats && item.assignedSeats.length > 0 &&
                        <div className="mt-1.5 md:mt-1 lg:mt-2 flex items-center gap-1.5 ml-8">
                                    <img src={chairWhiteIcon} alt="Seats" className="w-4 h-4 opacity-70" />
                                    {item.assignedSeats.length === guestCount ?
                          <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                                        <Share2 className="w-3 h-3" />
                                      </span> :

                          item.assignedSeats.map((seat) =>
                          <span
                            key={seat}
                            className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center">

                                          {seat}
                                        </span>
                          )
                          }
                                  </div>
                        }
                              </div>
                            </div>
                          </SwipeableCartItem>)}
                      </div>}
                  </ScrollArea>

                  {/* Split Order Warning */}
                  {isOrderSplit && orderItems.length > 0 &&
              <div className="px-2 py-2">
                      <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2">
                        <p className="text-amber-400 text-xs leading-relaxed">
                          This check has been split. Re-merge this ticket if you want to fire it or add products to it.
                        </p>
                      </div>
                    </div>
              }

                  {/* Order Summary - Only show when cart has items */}
                  {orderItems.length > 0 &&
              <div className="p-2 border-t border-sidebar-border flex-shrink-0">
                <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
                  background: '#7575754D',
                  boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
                }}>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
                    <span className="text-white">
                      {selectedDiscount ? selectedDiscount.name : 'Discount'}: <span className="font-medium">${discount.toFixed(2)}</span>
                      {selectedDiscount &&
                      <button
                        onClick={() => setSelectedDiscountId(null)}
                        className="text-white hover:text-white/80 text-xs font-bold ml-0.5">

                          ×
                        </button>
                      }
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground flex items-center gap-1">
                      {appliedServiceChargeName || 'Service Charge'}: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span>
                      {appliedServiceCharge > 0 &&
                      <button
                        onClick={() => {
                          setAppliedServiceCharge(0);
                          setAppliedServiceChargeName('');
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-bold ml-0.5">

                          ×
                        </button>
                      }
                    </span>
                    <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
                  </div>
                  {appliedGiftCardAmount > 0 &&
                  <div className="flex justify-between gap-3 pt-1 border-t border-white/10">
                      <span className="text-green-500">Gift Card: <span className="font-medium">-${appliedGiftCardAmount.toFixed(2)}</span></span>
                    </div>
                  }
                  {appliedVoucherAmount > 0 &&
                  <div className="flex justify-between gap-3">
                      <span className="text-foreground flex items-center gap-1">
                        Voucher ({voucherCode}): <span className="font-medium">-${appliedVoucherAmount.toFixed(2)}</span>
                        <button
                        onClick={() => {
                          setAppliedVoucherAmount(0);
                          setVoucherCode('');
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-bold ml-0.5">

                          ×
                        </button>
                      </span>
                    </div>
                  }
                </div>

                {/* Action Buttons - Inside background container */}
                <div className="px-2 py-2 flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => setOrderItems([])} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                    <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
                    backgroundColor: '#C9C9C9'
                  }}>
                    <img src={saveIcon} alt="Save" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFireOrder}
                    disabled={isOrderSplit || orderItems.length === 0}
                    className={`flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 ${
                    isOrderSplit || orderItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
                    }
                    style={{
                      background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                    }}>

                    <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                    <span className="text-white font-semibold text-sm">FIRE</span>
                  </button>
                  <button
                    onClick={() => setShowPaymentDialog(true)}
                    className="flex-1 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                    }}>

                    <span className="text-black font-semibold text-xs">
                      CHARGE ${chargeAmount.toFixed(2)}{chargeLabel && ` (${chargeLabel})`}
                    </span>
                  </button>
                </div>
              </div>
              }
                </>
            }
            </div>

            {/* Right Side Actions Sidebar */}
            {isOrderActionsSidebarOpen && !showCreateVoucherForm &&
          <div className="w-[70px] flex flex-col flex-shrink-0 animate-slide-in-right">
                <div className="flex-1 flex flex-col rounded-2xl p-1.5 gap-1" style={{
              background: '#7575754D',
              boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
            }}>
                  {/* Transfer Check - Only show when items in cart */}
                  {orderItems.length > 0 &&
              <button
                onClick={() => setShowTransferCheckDialog(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                      <img src={transferCheckIcon} alt="" className="w-5 h-5" />
                      <span className="text-[9px] text-white text-center leading-tight">Transfer<br />Check</span>
                    </button>
              }
                  {/* Action Buttons */}
                  <button
                onClick={() => setShowGiftCardDialog(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <img src={giftCardBtnIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Gift<br />Card</span>
                  </button>
                  <button
                onClick={() => setShowServiceChargeDialog(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <img src={serviceChargeIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Service<br />Charge</span>
                  </button>
                  <button
                onClick={() => {
                  setShowAddGuestForm(true);
                  setIsOrderActionsSidebarOpen(false);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <img src={addGuestIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Add<br />Guest</span>
                  </button>
                  <button
                onClick={() => setShowVoucherOptionsPopup(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <Ticket className="w-5 h-5 text-white" />
                    <span className="text-[9px] text-white text-center leading-tight">Voucher</span>
                  </button>
                  {/* Merge - Only show when order is split */}
                  {isOrderSplit &&
              <button
                onClick={() => {
                  setIsOrderSplit(false);
                  setSplitConfiguration(null);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                      <img src={mergeIcon} alt="" className="w-5 h-5" />
                      <span className="text-[9px] text-white text-center leading-tight">Merge</span>
                    </button>
              }
                  <button className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">
                    <img src={reopenCheckIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Reopen<br />Check</span>
                  </button>
                </div>
              </div>
          }
          </div>
        </div>
      </div>

      {/* Item Customization Dialog */}
      <ItemCustomizationDialog
      open={customizationDialogOpen}
      onOpenChange={setCustomizationDialogOpen}
      item={selectedItemForCustomization}
      itemImage={selectedItemImage}
      onAddToCart={addToCartWithModifiers}
      isTableOrder={isTableOrder}
      guestCount={guestCount} />


      {/* Discount Dialog with integrated MPIN */}
      {showDiscountDialog &&
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            {discountDialogView === 'mpin' ? (
        /* MPIN View */
        <div className="w-full max-w-[280px] flex flex-col items-center mx-auto py-6 px-4">
                {/* Manager Profile */}
                <div className="flex flex-col items-center mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-primary/30">
                    <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                alt="Manager"
                className="w-full h-full object-cover" />

                  </div>
                  <h3 className="text-base font-semibold text-foreground">Mia Jones</h3>
                  <p className="text-xs text-muted-foreground">Manager</p>
                </div>

                {/* PIN Dots */}
                <div className="flex items-center justify-center gap-2.5 mb-4">
                  {[0, 1, 2, 3].map((index) =>
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index < discountPin.length ? "bg-primary" : "bg-neutral-600"}`
              } />

            )}
                </div>

                {/* Title */}
                <p className="text-center text-muted-foreground text-xs mb-4">Enter Manager PIN</p>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) =>
            <button
              key={num}
              type="button"
              onClick={() => {
                if (discountPin.length < 4) {
                  const newPin = discountPin + num.toString();
                  setDiscountPin(newPin);
                  if (newPin.length === 4) {
                    setTimeout(() => {
                      setDiscountDialogView('discounts');
                      setDiscountPin("");
                    }, 200);
                  }
                }
              }}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors">

                      {num}
                    </button>
            )}
                  <button
              type="button"
              onClick={() => setDiscountPin(discountPin.slice(0, -1))}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center">

                    <Delete className="w-5 h-5" />
                  </button>
                  <button
              type="button"
              onClick={() => {
                if (discountPin.length < 4) {
                  const newPin = discountPin + "0";
                  setDiscountPin(newPin);
                  if (newPin.length === 4) {
                    setTimeout(() => {
                      setDiscountDialogView('discounts');
                      setDiscountPin("");
                    }, 200);
                  }
                }
              }}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors">

                    0
                  </button>
                  <button
              type="button"
              onClick={() => setDiscountPin("")}
              className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-xl font-bold text-destructive hover:bg-neutral-700 active:bg-neutral-600 transition-colors">

                    C
                  </button>
                </div>

                {/* Biometric Options */}
                <div className="flex justify-center gap-3 mt-4">
                  <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
                    <Fingerprint className="w-4 h-4" />
                    <span className="text-xs">Touch ID</span>
                  </button>
                  <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-muted-foreground hover:bg-neutral-700 transition-colors">
                    <ScanFace className="w-4 h-4" />
                    <span className="text-xs">Face ID</span>
                  </button>
                </div>

                {/* Cancel button */}
                <button
            type="button"
            onClick={() => {
              setShowDiscountDialog(false);
              setDiscountPin("");
            }}
            className="mt-4 text-xs text-neutral-400 hover:text-white transition-colors">

                  Cancel
                </button>
              </div>) : (

        /* Discount Selection View */
        <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                  <h2 className="text-white text-lg font-semibold">Select Discounts</h2>
                  <button
              onClick={() => setShowDiscountDialog(false)}
              className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors">

                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                {/* Discount Options */}
                <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-none space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {discountTypes.map((discountType) => {
              const discountAmount = discountType.fixedAmount || subtotal * ((discountType.percentage || 0) / 100);
              const isSelected = selectedDiscountId === discountType.id;

              const IconComponent = {
                briefcase: Briefcase,
                heart: Heart,
                graduation: GraduationCap,
                shield: Shield,
                star: Star,
                clock: Clock,
                cake: Cake,
                mappin: MapPin,
                dollar: BadgeDollarSign,
                tag: Tag
              }[discountType.icon];

              return (
                <button
                  key={discountType.id}
                  onClick={() => setSelectedDiscountId(isSelected ? null : discountType.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isSelected ?
                  'bg-orange-500/20 border border-orange-500' :
                  'bg-neutral-800 border border-transparent hover:bg-neutral-700'}`
                  }>

                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-orange-500/30' : 'bg-neutral-700'}`
                  }>
                          <IconComponent className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-white text-sm font-medium">{discountType.name}</div>
                          <div className="text-neutral-400 text-xs">{discountType.description}</div>
                        </div>
                        <div className="text-white text-sm font-medium">
                          -${discountAmount.toFixed(2)}
                        </div>
                      </button>);

            })}
                </div>

                {/* Apply Button */}
                <div className="p-3 border-t border-neutral-700">
                  <button
              onClick={() => setShowDiscountDialog(false)}
              className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm">

                    Apply
                  </button>
                </div>
              </>)
        }
          </div>
        </div>
    }

      {/* No Tax Confirmation Dialog */}
      {showNoTaxDialog &&
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-[300px] mx-4 overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <h2 className="text-white text-lg font-semibold mb-2">Disable Tax?</h2>
              <p className="text-neutral-400 text-sm">Are you sure you want to remove tax from this order?</p>
            </div>
            <div className="flex border-t border-neutral-700">
              <button
            onClick={() => setShowNoTaxDialog(false)}
            className="flex-1 py-3 text-white font-medium hover:bg-neutral-800 transition-colors border-r border-neutral-700">

                Cancel
              </button>
              <button
            onClick={() => {
              setIsTaxExempt(true);
              setShowNoTaxDialog(false);
            }}
            className="flex-1 py-3 text-orange-500 font-medium hover:bg-neutral-800 transition-colors">

                Remove
              </button>
            </div>
          </div>
        </div>
    }

      {/* Gift Card Dialog */}
      <GiftCardDialog
      isOpen={showGiftCardDialog}
      onClose={() => setShowGiftCardDialog(false)}
      onApply={(amount) => setAppliedGiftCardAmount(amount)}
      orderTotal={total} />


      {/* Service Charge Dialog */}
      <ServiceChargeDialog
      open={showServiceChargeDialog}
      onOpenChange={setShowServiceChargeDialog}
      subtotal={subtotal}
      onApply={(amount, name) => {
        setAppliedServiceCharge(amount);
        setAppliedServiceChargeName(name);
      }} />


      {/* MPIN Dialog for Price Override */}
      <MPINDialog
      open={showMPINDialog}
      onOpenChange={setShowMPINDialog}
      onSuccess={handleMPINSuccess}
      correctPin="1234" />



      {/* Price Override Dialog */}
      <PriceOverrideDialog
      open={showPriceOverrideDialog}
      onOpenChange={setShowPriceOverrideDialog}
      itemName={priceOverrideItem?.name || ""}
      itemImage={priceOverrideItem?.image}
      originalPrice={priceOverrideItem?.price || 0}
      onApply={handlePriceOverrideApply} />


      {/* Payment Dialog */}
      <PaymentDialog
      open={showPaymentDialog}
      onOpenChange={setShowPaymentDialog}
      orderDetails={{
        guest: guestName || "Guest",
        phone: guestPhone ? formatPhoneNumber(guestPhone) : undefined,
        table: isTableOrder ? `T${orderNumber}` : undefined,
        check: orderNumber,
        orderType: orderType,
        orderNumber: orderNumber,
        serverName: currentServerName,
        orderTime: orderCreatedTime,
        items: orderItems.map((item) => ({
          id: item.id,
          qty: item.qty,
          name: item.name,
          price: item.price
        }))
      }}
      subtotal={subtotal}
      tax={tax}
      total={chargeAmount}
      onPaymentComplete={(history) => {
        console.log("Payment completed:", history);
      }}
      onSaveSplit={(config) => {
        setIsOrderSplit(true);
        setSplitConfiguration(config);

        // Persist to session context if this is a session order
        if (sessionIdFromParams && isSessionOrderMode) {
          // Build split checks from the configuration
          const checks = Array.from({ length: config.numberOfChecks }, (_, i) => {
            const checkLetter = String.fromCharCode(97 + i); // a, b, c...
            const itemsForCheck = orderItems.filter((_, itemIdx) =>
            config.checkAssignments[itemIdx + 1] === i + 1
            );
            const checkTotal = itemsForCheck.reduce((sum, item) => sum + item.price * item.qty, 0);

            return {
              checkId: checkLetter,
              items: itemsForCheck.map((item) => ({
                qty: item.qty,
                name: item.name,
                price: item.price,
                seats: [],
                modifiers: []
              })),
              status: 'unpaid' as const,
              total: checkTotal
            };
          });

          saveContextSplitConfig(sessionIdFromParams, {
            ...config,
            checks
          });
        }
      }} />


      {/* Split Order Alert Dialog */}
      {showSplitOrderAlert &&
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 overflow-hidden animate-scale-in relative">
            {/* Close X button */}
            <button
          onClick={() => setShowSplitOrderAlert(false)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors z-10">

              <X className="w-4 h-4 text-neutral-400" />
            </button>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Cannot Add Items</h3>
              <p className="text-neutral-400 text-sm mb-6">
                You cannot add more items to a split order. If you want to add items, please merge the order first.
              </p>
              <button
            onClick={() => {
              setShowSplitOrderAlert(false);
              setIsOrderSplit(false);
              setSplitConfiguration(null);
            }}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">

                <img src={mergeIcon} alt="Merge" className="w-4 h-4" />
                Merge
              </button>
            </div>
          </div>
        </div>
    }

      {/* Transfer Check Dialog */}
      <TransferCheckDialog
      isOpen={showTransferCheckDialog}
      onClose={() => setShowTransferCheckDialog(false)}
      currentServer={currentServerName}
      onTransfer={(newServerName) => {
        setCurrentServerName(newServerName);
        setShowTransferCheckDialog(false);
      }} />


      {/* Voucher Dialog */}
      <VoucherDialog
      isOpen={showVoucherDialog}
      onClose={() => { setShowVoucherDialog(false); setVoucherDialogInitialView('sell'); }}
      initialView={voucherDialogInitialView}
      onAddVoucher={(amount) => {
        setOrderItems((prev) => [...prev, {
          id: Date.now(),
          qty: 1,
          name: `Voucher - $${amount.toFixed(2)}`,
          price: amount,
          itemOrderType: 'VOUCHER',
          noTax: true
        }]);
        setShowVoucherDialog(false);
      }}
      onRedeemVoucher={(code, balance) => {
        setAppliedVoucherAmount(balance);
        setVoucherCode(code);
        setShowVoucherDialog(false);
      }} />


      {/* Voucher Options Popup - matching Transfer Order popup UI */}
      {showVoucherOptionsPopup &&
    <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowVoucherOptionsPopup(false)} />
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-[380px] max-w-[90vw] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white text-lg font-semibold">Voucher</h2>
              <button
            onClick={() => setShowVoucherOptionsPopup(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">

                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-white/60 text-sm mb-3">What would you like to do?</p>
              
              <div className="space-y-2">
                {/* Create Voucher */}
                <button
              onClick={() => {
                setShowVoucherOptionsPopup(false);
                setShowCreateVoucherForm(true);
              }}
              className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">

                  <div className="flex items-center gap-3 mb-0.5">
                    <Ticket className="w-5 h-5 text-white/80" />
                    <span className="text-white font-medium">Create Voucher</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Create and send a new voucher to a customer.</p>
                </button>

                {/* Redeem Voucher */}
                <button
              onClick={() => {
                setShowVoucherOptionsPopup(false);
                setVoucherDialogInitialView('redeem');
                setShowVoucherDialog(true);
              }}
              className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">

                  <div className="flex items-center gap-3 mb-0.5">
                    <Gift className="w-5 h-5 text-white/80" />
                    <span className="text-white font-medium">Redeem Voucher</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Apply an existing voucher code to this order.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
    }
    </div>;
};
export default Orders;