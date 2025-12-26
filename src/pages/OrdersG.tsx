import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Receipt, ArrowRightLeft, X, FileText, ChevronDown, MoreVertical } from "lucide-react";
import { getOrderById, Order as DataOrder, OrderItem as DataOrderItem, formatPrice as formatOrderPrice } from "@/data/orders";
import searchIcon from "@/assets/icons/search.png";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";
import InlineItemCustomization from "@/components/InlineItemCustomization";
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
import { usePanelPosition } from "@/contexts/PanelPositionContext";
import { PanelDropZones } from "@/components/PanelDropZone";
import { DraggablePanelHandle } from "@/components/DraggablePanelHandle";

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

// Food Truck Menu List
const menuList = ["FOOD TRUCK MENU", "STREET FOOD", "GRILL MENU", "DRINKS MENU"];

// Food Truck Menu Categories
const menuCategories: Record<string, string[]> = {
  "FOOD TRUCK MENU": ["Burgers", "Tacos", "Sides", "Drinks", "Specials", "Desserts"],
  "STREET FOOD": ["Tacos", "Burritos", "Quesadillas", "Nachos", "Bowls", "Wraps"],
  "GRILL MENU": ["Burgers", "Hot Dogs", "Sandwiches", "Plates", "Combos"],
  "DRINKS MENU": ["Sodas", "Fresh Juices", "Agua Fresca", "Shakes", "Coffee", "Beer"]
};

// Subcategories for each category
const categorySubcategories: Record<string, string[]> = {
  // FOOD TRUCK MENU
  "Burgers": ["Classic", "Gourmet", "Veggie", "Specialty", "Sliders", "Double Stack"],
  "Tacos": ["Beef", "Chicken", "Fish", "Pork", "Veggie", "Street Style"],
  "Sides": ["Fries", "Onion Rings", "Loaded", "Salads", "Corn", "Beans"],
  "Drinks": ["Sodas", "Juices", "Agua Fresca", "Coffee", "Shakes", "Beer"],
  "Specials": ["Combos", "Family Pack", "Kids Meal", "Daily Special"],
  "Desserts": ["Churros", "Ice Cream", "Cookies", "Brownies"],
  // STREET FOOD
  "Burritos": ["Carne Asada", "Carnitas", "Chicken", "Veggie", "Breakfast"],
  "Quesadillas": ["Cheese", "Chicken", "Steak", "Veggie", "Shrimp"],
  "Nachos": ["Classic", "Loaded", "Supreme", "Veggie"],
  "Bowls": ["Burrito Bowl", "Rice Bowl", "Salad Bowl", "Protein Bowl"],
  "Wraps": ["Chicken", "Beef", "Veggie", "BBQ", "Spicy"],
  // GRILL MENU
  "Hot Dogs": ["Classic", "Loaded", "Chicago", "Coney"],
  "Sandwiches": ["Philly", "Cuban", "Club", "Grilled Cheese"],
  "Plates": ["Steak Plate", "Chicken Plate", "Combo Plate", "Veggie Plate"],
  "Combos": ["Burger Combo", "Dog Combo", "Sandwich Combo", "Family Combo"],
  // DRINKS MENU
  "Sodas": ["Cola", "Lemon-Lime", "Orange", "Root Beer", "Ginger Ale"],
  "Fresh Juices": ["Orange", "Lemonade", "Watermelon", "Pineapple"],
  "Agua Fresca": ["Horchata", "Jamaica", "Tamarindo", "Lime"],
  "Shakes": ["Vanilla", "Chocolate", "Strawberry", "Oreo", "Peanut Butter"],
  "Coffee": ["Hot Coffee", "Iced Coffee", "Cold Brew", "Espresso"],
  "Beer": ["Lager", "IPA", "Wheat", "Mexican", "Craft"]
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
  "FOOD TRUCK MENU": {
    "Burgers": {
      "Classic": [
        { id: 1, name: "Classic Burger", price: 8.99 },
        { id: 2, name: "Cheese Burger", price: 9.99 },
        { id: 3, name: "Bacon Cheese Burger", price: 11.99 },
        { id: 4, name: "Lettuce Wrap Burger", price: 9.49 },
        { id: 5, name: "Plain Jane Burger", price: 7.99 },
      ],
      "Gourmet": [
        { id: 6, name: "Truffle Burger", price: 14.99 },
        { id: 7, name: "Blue Cheese Bacon", price: 13.99 },
        { id: 8, name: "Avocado Ranch Burger", price: 12.99 },
        { id: 9, name: "Smokehouse BBQ", price: 13.49 },
        { id: 10, name: "Mediterranean Lamb", price: 15.99 },
      ],
      "Veggie": [
        { id: 11, name: "Black Bean Burger", price: 9.99 },
        { id: 12, name: "Impossible Burger", price: 12.99 },
        { id: 13, name: "Portobello Burger", price: 10.99 },
        { id: 14, name: "Quinoa Veggie Burger", price: 11.49 },
      ],
      "Specialty": [
        { id: 15, name: "Jalapeño Popper Burger", price: 12.99 },
        { id: 16, name: "Mac & Cheese Burger", price: 13.99 },
        { id: 17, name: "Breakfast Burger", price: 12.49 },
        { id: 18, name: "Peanut Butter Bacon", price: 13.49 },
      ],
      "Sliders": [
        { id: 19, name: "Classic Sliders (3)", price: 9.99 },
        { id: 20, name: "BBQ Pulled Pork (3)", price: 11.99 },
        { id: 21, name: "Mini Cheese (3)", price: 8.99 },
        { id: 22, name: "Slider Sampler (4)", price: 14.99 },
      ],
      "Double Stack": [
        { id: 23, name: "Double Classic", price: 13.99 },
        { id: 24, name: "Double Bacon Cheese", price: 15.99 },
        { id: 25, name: "Triple Stack", price: 17.99 },
        { id: 26, name: "The Beast (4 Patties)", price: 21.99 },
      ]
    },
    "Tacos": {
      "Beef": [
        { id: 27, name: "Carne Asada Taco", price: 4.49 },
        { id: 28, name: "Ground Beef Taco", price: 3.49 },
        { id: 29, name: "Birria Taco", price: 5.49 },
        { id: 30, name: "Korean BBQ Beef", price: 5.99 },
      ],
      "Chicken": [
        { id: 31, name: "Grilled Chicken Taco", price: 3.99 },
        { id: 32, name: "Crispy Chicken Taco", price: 4.29 },
        { id: 33, name: "Chipotle Chicken", price: 4.49 },
        { id: 34, name: "Chicken Tinga", price: 4.29 },
      ],
      "Fish": [
        { id: 35, name: "Baja Fish Taco", price: 4.99 },
        { id: 36, name: "Grilled Mahi Mahi", price: 5.49 },
        { id: 37, name: "Shrimp Taco", price: 5.29 },
        { id: 38, name: "Fish Fry Taco", price: 4.79 },
      ],
      "Pork": [
        { id: 39, name: "Carnitas Taco", price: 4.29 },
        { id: 40, name: "Al Pastor Taco", price: 4.49 },
        { id: 41, name: "Chorizo Taco", price: 4.29 },
        { id: 42, name: "Pulled Pork Taco", price: 4.49 },
      ],
      "Veggie": [
        { id: 43, name: "Black Bean Taco", price: 3.49 },
        { id: 44, name: "Grilled Veggie Taco", price: 3.99 },
        { id: 45, name: "Cauliflower Taco", price: 4.29 },
        { id: 46, name: "Mushroom Taco", price: 3.99 },
      ],
      "Street Style": [
        { id: 47, name: "Street Taco (Single)", price: 2.99 },
        { id: 48, name: "Street Taco Trio", price: 8.49 },
        { id: 49, name: "Taco Sampler (5)", price: 12.99 },
        { id: 50, name: "Taco Platter (8)", price: 19.99 },
      ]
    },
    "Sides": {
      "Fries": [
        { id: 51, name: "Regular Fries", price: 3.99 },
        { id: 52, name: "Seasoned Fries", price: 4.49 },
        { id: 53, name: "Curly Fries", price: 4.49 },
        { id: 54, name: "Sweet Potato Fries", price: 4.99 },
        { id: 55, name: "Truffle Fries", price: 6.99 },
      ],
      "Onion Rings": [
        { id: 56, name: "Classic Onion Rings", price: 4.49 },
        { id: 57, name: "Beer Battered Rings", price: 5.49 },
        { id: 58, name: "Onion Ring Tower", price: 7.99 },
      ],
      "Loaded": [
        { id: 59, name: "Loaded Fries", price: 7.99 },
        { id: 60, name: "Chili Cheese Fries", price: 8.49 },
        { id: 61, name: "Animal Style Fries", price: 7.99 },
        { id: 62, name: "Carne Asada Fries", price: 10.99 },
      ],
      "Salads": [
        { id: 63, name: "Side Salad", price: 4.99 },
        { id: 64, name: "Caesar Salad", price: 6.99 },
        { id: 65, name: "Coleslaw", price: 2.99 },
      ],
      "Corn": [
        { id: 66, name: "Elote (Street Corn)", price: 4.99 },
        { id: 67, name: "Corn on the Cob", price: 2.99 },
        { id: 68, name: "Esquites (Corn Cup)", price: 4.49 },
      ],
      "Beans": [
        { id: 69, name: "Refried Beans", price: 2.99 },
        { id: 70, name: "Black Beans", price: 2.99 },
        { id: 71, name: "Rice & Beans", price: 4.49 },
      ]
    },
    "Drinks": {
      "Sodas": [
        { id: 72, name: "Coca-Cola", price: 2.49 },
        { id: 73, name: "Sprite", price: 2.49 },
        { id: 74, name: "Fanta Orange", price: 2.49 },
        { id: 75, name: "Root Beer", price: 2.49 },
        { id: 76, name: "Dr Pepper", price: 2.49 },
      ],
      "Juices": [
        { id: 77, name: "Fresh Lemonade", price: 3.49 },
        { id: 78, name: "Orange Juice", price: 3.99 },
        { id: 79, name: "Watermelon Agua", price: 3.99 },
        { id: 80, name: "Pineapple Juice", price: 3.99 },
      ],
      "Agua Fresca": [
        { id: 81, name: "Horchata", price: 3.99 },
        { id: 82, name: "Jamaica", price: 3.49 },
        { id: 83, name: "Tamarindo", price: 3.49 },
        { id: 84, name: "Lime", price: 3.49 },
      ],
      "Coffee": [
        { id: 85, name: "Hot Coffee", price: 2.99 },
        { id: 86, name: "Iced Coffee", price: 3.49 },
        { id: 87, name: "Cold Brew", price: 4.49 },
        { id: 88, name: "Espresso", price: 2.99 },
      ],
      "Shakes": [
        { id: 89, name: "Vanilla Shake", price: 5.99 },
        { id: 90, name: "Chocolate Shake", price: 5.99 },
        { id: 91, name: "Strawberry Shake", price: 5.99 },
        { id: 92, name: "Oreo Shake", price: 6.49 },
      ],
      "Beer": [
        { id: 93, name: "Corona", price: 4.99 },
        { id: 94, name: "Modelo", price: 4.99 },
        { id: 95, name: "Pacifico", price: 4.99 },
        { id: 96, name: "Local IPA", price: 5.99 },
      ]
    },
    "Specials": {
      "Combos": [
        { id: 97, name: "Burger Combo (Fries + Drink)", price: 13.99 },
        { id: 98, name: "Taco Combo (3 Tacos + Side)", price: 12.99 },
        { id: 99, name: "Street Food Combo", price: 14.99 },
        { id: 100, name: "Slider Combo", price: 12.49 },
      ],
      "Family Pack": [
        { id: 101, name: "Family Burger Pack (4)", price: 39.99 },
        { id: 102, name: "Taco Party Pack (12)", price: 34.99 },
        { id: 103, name: "Mixed Grill Family", price: 44.99 },
        { id: 104, name: "Sides Sampler Pack", price: 19.99 },
      ],
      "Kids Meal": [
        { id: 105, name: "Kids Burger Meal", price: 7.99 },
        { id: 106, name: "Kids Taco Meal (2)", price: 6.99 },
        { id: 107, name: "Kids Chicken Strips", price: 7.49 },
        { id: 108, name: "Kids Hot Dog", price: 5.99 },
      ],
      "Daily Special": [
        { id: 109, name: "Today's Special", price: 11.99 },
        { id: 110, name: "Chef's Choice", price: 13.99 },
        { id: 111, name: "Happy Hour Deal", price: 9.99 },
        { id: 112, name: "Lunch Special", price: 10.99 },
      ]
    },
    "Desserts": {
      "Churros": [
        { id: 113, name: "Churros (3)", price: 4.99 },
        { id: 114, name: "Churros with Chocolate", price: 5.99 },
        { id: 115, name: "Churro Sundae", price: 7.99 },
      ],
      "Ice Cream": [
        { id: 116, name: "Vanilla Cup", price: 3.99 },
        { id: 117, name: "Chocolate Cup", price: 3.99 },
        { id: 118, name: "Sundae", price: 5.99 },
        { id: 119, name: "Ice Cream Sandwich", price: 4.49 },
      ],
      "Cookies": [
        { id: 120, name: "Chocolate Chip (2)", price: 3.49 },
        { id: 121, name: "Oatmeal Raisin (2)", price: 3.49 },
        { id: 122, name: "Cookie Sandwich", price: 4.99 },
      ],
      "Brownies": [
        { id: 123, name: "Fudge Brownie", price: 3.99 },
        { id: 124, name: "Brownie Sundae", price: 6.99 },
        { id: 125, name: "Brownie Bites (4)", price: 4.99 },
      ]
    }
  },
  "STREET FOOD": {
    "Tacos": {
      "Beef": [
        { id: 200, name: "Street Carne Asada", price: 3.99 },
        { id: 201, name: "Birria Taco", price: 5.49 },
        { id: 202, name: "Suadero Taco", price: 4.49 },
      ],
      "Chicken": [
        { id: 203, name: "Pollo Asado Taco", price: 3.49 },
        { id: 204, name: "Chicken Tinga Street", price: 3.99 },
      ],
      "Fish": [
        { id: 205, name: "Fish Street Taco", price: 4.49 },
        { id: 206, name: "Shrimp Street Taco", price: 4.99 },
      ],
      "Pork": [
        { id: 207, name: "Al Pastor Street", price: 3.99 },
        { id: 208, name: "Carnitas Street", price: 3.99 },
      ],
      "Veggie": [
        { id: 209, name: "Nopales Taco", price: 3.49 },
        { id: 210, name: "Rajas Taco", price: 3.49 },
      ],
      "Street Style": [
        { id: 211, name: "Trio Callejero", price: 10.99 },
        { id: 212, name: "Taco Loco Mix", price: 14.99 },
      ]
    },
    "Burritos": {
      "Carne Asada": [
        { id: 213, name: "Carne Asada Burrito", price: 11.99 },
        { id: 214, name: "California Burrito", price: 12.99 },
      ],
      "Carnitas": [
        { id: 215, name: "Carnitas Burrito", price: 10.99 },
        { id: 216, name: "Carnitas Supreme", price: 12.49 },
      ],
      "Chicken": [
        { id: 217, name: "Chicken Burrito", price: 10.49 },
        { id: 218, name: "Chicken Mole Burrito", price: 11.99 },
      ],
      "Veggie": [
        { id: 219, name: "Veggie Burrito", price: 9.99 },
        { id: 220, name: "Bean & Cheese", price: 7.99 },
      ],
      "Breakfast": [
        { id: 221, name: "Breakfast Burrito", price: 8.99 },
        { id: 222, name: "Chorizo & Egg", price: 9.49 },
      ]
    },
    "Quesadillas": {
      "Cheese": [
        { id: 223, name: "Cheese Quesadilla", price: 6.99 },
        { id: 224, name: "Three Cheese Quesadilla", price: 7.99 },
      ],
      "Chicken": [
        { id: 225, name: "Chicken Quesadilla", price: 9.99 },
        { id: 226, name: "Chipotle Chicken Quesadilla", price: 10.49 },
      ],
      "Steak": [
        { id: 227, name: "Steak Quesadilla", price: 11.99 },
        { id: 228, name: "Fajita Quesadilla", price: 12.49 },
      ],
      "Veggie": [
        { id: 229, name: "Veggie Quesadilla", price: 8.99 },
        { id: 230, name: "Mushroom Quesadilla", price: 9.49 },
      ],
      "Shrimp": [
        { id: 231, name: "Shrimp Quesadilla", price: 12.99 },
        { id: 232, name: "Garlic Shrimp Quesadilla", price: 13.49 },
      ]
    },
    "Nachos": {
      "Classic": [
        { id: 233, name: "Classic Nachos", price: 7.99 },
        { id: 234, name: "Cheese Nachos", price: 6.99 },
      ],
      "Loaded": [
        { id: 235, name: "Loaded Nachos", price: 11.99 },
        { id: 236, name: "Super Nachos", price: 13.99 },
      ],
      "Supreme": [
        { id: 237, name: "Supreme Nachos", price: 14.99 },
        { id: 238, name: "Nacho Grande", price: 16.99 },
      ],
      "Veggie": [
        { id: 239, name: "Veggie Nachos", price: 9.99 },
        { id: 240, name: "Garden Nachos", price: 10.99 },
      ]
    },
    "Bowls": {
      "Burrito Bowl": [
        { id: 241, name: "Chicken Burrito Bowl", price: 10.99 },
        { id: 242, name: "Steak Burrito Bowl", price: 12.99 },
        { id: 243, name: "Carnitas Bowl", price: 11.49 },
      ],
      "Rice Bowl": [
        { id: 244, name: "Teriyaki Rice Bowl", price: 10.99 },
        { id: 245, name: "Korean BBQ Bowl", price: 12.49 },
      ],
      "Salad Bowl": [
        { id: 246, name: "Taco Salad Bowl", price: 10.99 },
        { id: 247, name: "Southwest Salad", price: 9.99 },
      ],
      "Protein Bowl": [
        { id: 248, name: "Power Bowl", price: 12.99 },
        { id: 249, name: "Fit Bowl", price: 11.99 },
      ]
    },
    "Wraps": {
      "Chicken": [
        { id: 250, name: "Chicken Wrap", price: 9.99 },
        { id: 251, name: "Buffalo Chicken Wrap", price: 10.49 },
      ],
      "Beef": [
        { id: 252, name: "Steak Wrap", price: 11.99 },
        { id: 253, name: "Philly Wrap", price: 11.49 },
      ],
      "Veggie": [
        { id: 254, name: "Garden Wrap", price: 8.99 },
        { id: 255, name: "Mediterranean Wrap", price: 9.49 },
      ],
      "BBQ": [
        { id: 256, name: "BBQ Chicken Wrap", price: 10.49 },
        { id: 257, name: "BBQ Beef Wrap", price: 11.49 },
      ],
      "Spicy": [
        { id: 258, name: "Spicy Chicken Wrap", price: 10.49 },
        { id: 259, name: "Firecracker Wrap", price: 10.99 },
      ]
    }
  },
  "GRILL MENU": {
    "Burgers": {
      "Classic": [
        { id: 300, name: "Grill Master Burger", price: 10.99 },
        { id: 301, name: "Flame Grilled Classic", price: 9.99 },
      ],
      "Gourmet": [
        { id: 302, name: "Wagyu Burger", price: 18.99 },
        { id: 303, name: "Prime Rib Burger", price: 16.99 },
      ],
      "Veggie": [
        { id: 304, name: "Grilled Veggie Burger", price: 10.99 },
      ],
      "Specialty": [
        { id: 305, name: "Smash Burger", price: 11.99 },
        { id: 306, name: "Double Smash", price: 14.99 },
      ],
      "Sliders": [
        { id: 307, name: "Grill Sliders (3)", price: 10.99 },
      ],
      "Double Stack": [
        { id: 308, name: "Grill Master Double", price: 15.99 },
      ]
    },
    "Hot Dogs": {
      "Classic": [
        { id: 309, name: "Classic Hot Dog", price: 4.99 },
        { id: 310, name: "All Beef Dog", price: 5.99 },
      ],
      "Loaded": [
        { id: 311, name: "Loaded Dog", price: 7.99 },
        { id: 312, name: "Chili Cheese Dog", price: 7.49 },
      ],
      "Chicago": [
        { id: 313, name: "Chicago Style Dog", price: 6.99 },
      ],
      "Coney": [
        { id: 314, name: "Coney Island Dog", price: 6.99 },
      ]
    },
    "Sandwiches": {
      "Philly": [
        { id: 315, name: "Philly Cheesesteak", price: 12.99 },
        { id: 316, name: "Chicken Philly", price: 11.99 },
      ],
      "Cuban": [
        { id: 317, name: "Classic Cuban", price: 11.99 },
        { id: 318, name: "Medianoche", price: 10.99 },
      ],
      "Club": [
        { id: 319, name: "Turkey Club", price: 10.99 },
        { id: 320, name: "Chicken Club", price: 10.99 },
      ],
      "Grilled Cheese": [
        { id: 321, name: "Classic Grilled Cheese", price: 6.99 },
        { id: 322, name: "Gourmet Grilled Cheese", price: 9.99 },
      ]
    },
    "Plates": {
      "Steak Plate": [
        { id: 323, name: "Ribeye Plate", price: 19.99 },
        { id: 324, name: "NY Strip Plate", price: 18.99 },
      ],
      "Chicken Plate": [
        { id: 325, name: "Grilled Chicken Plate", price: 13.99 },
        { id: 326, name: "Chicken Fajita Plate", price: 14.99 },
      ],
      "Combo Plate": [
        { id: 327, name: "Surf & Turf", price: 24.99 },
        { id: 328, name: "Mixed Grill Plate", price: 21.99 },
      ],
      "Veggie Plate": [
        { id: 329, name: "Grilled Veggie Plate", price: 11.99 },
      ]
    },
    "Combos": {
      "Burger Combo": [
        { id: 330, name: "Burger + Fries + Drink", price: 14.99 },
        { id: 331, name: "Double Combo", price: 17.99 },
      ],
      "Dog Combo": [
        { id: 332, name: "Dog + Fries + Drink", price: 9.99 },
        { id: 333, name: "Two Dog Combo", price: 12.99 },
      ],
      "Sandwich Combo": [
        { id: 334, name: "Sandwich + Fries + Drink", price: 14.99 },
      ],
      "Family Combo": [
        { id: 335, name: "Family Grill Pack", price: 49.99 },
        { id: 336, name: "Party Pack", price: 79.99 },
      ]
    }
  },
  "DRINKS MENU": {
    "Sodas": {
      "Cola": [
        { id: 400, name: "Coca-Cola", price: 2.49 },
        { id: 401, name: "Pepsi", price: 2.49 },
        { id: 402, name: "Diet Coke", price: 2.49 },
      ],
      "Lemon-Lime": [
        { id: 403, name: "Sprite", price: 2.49 },
        { id: 404, name: "7-Up", price: 2.49 },
      ],
      "Orange": [
        { id: 405, name: "Fanta Orange", price: 2.49 },
        { id: 406, name: "Crush Orange", price: 2.49 },
      ],
      "Root Beer": [
        { id: 407, name: "A&W Root Beer", price: 2.49 },
        { id: 408, name: "Barq's Root Beer", price: 2.49 },
      ],
      "Ginger Ale": [
        { id: 409, name: "Canada Dry", price: 2.49 },
        { id: 410, name: "Schweppes", price: 2.49 },
      ]
    },
    "Fresh Juices": {
      "Orange": [
        { id: 411, name: "Fresh OJ", price: 4.49 },
        { id: 412, name: "OJ with Pulp", price: 4.49 },
      ],
      "Lemonade": [
        { id: 413, name: "Fresh Lemonade", price: 3.99 },
        { id: 414, name: "Strawberry Lemonade", price: 4.49 },
        { id: 415, name: "Mango Lemonade", price: 4.49 },
      ],
      "Watermelon": [
        { id: 416, name: "Watermelon Juice", price: 4.49 },
      ],
      "Pineapple": [
        { id: 417, name: "Pineapple Juice", price: 4.49 },
        { id: 418, name: "Piña Colada (NA)", price: 5.49 },
      ]
    },
    "Agua Fresca": {
      "Horchata": [
        { id: 419, name: "Horchata", price: 3.99 },
        { id: 420, name: "Horchata Large", price: 5.49 },
      ],
      "Jamaica": [
        { id: 421, name: "Jamaica", price: 3.49 },
        { id: 422, name: "Jamaica Large", price: 4.99 },
      ],
      "Tamarindo": [
        { id: 423, name: "Tamarindo", price: 3.49 },
        { id: 424, name: "Tamarindo Large", price: 4.99 },
      ],
      "Lime": [
        { id: 425, name: "Agua de Limon", price: 3.49 },
        { id: 426, name: "Limonada Large", price: 4.99 },
      ]
    },
    "Shakes": {
      "Vanilla": [
        { id: 427, name: "Vanilla Shake", price: 5.99 },
        { id: 428, name: "Vanilla Malt", price: 6.49 },
      ],
      "Chocolate": [
        { id: 429, name: "Chocolate Shake", price: 5.99 },
        { id: 430, name: "Double Chocolate", price: 6.49 },
      ],
      "Strawberry": [
        { id: 431, name: "Strawberry Shake", price: 5.99 },
        { id: 432, name: "Strawberry Cheesecake", price: 6.99 },
      ],
      "Oreo": [
        { id: 433, name: "Oreo Shake", price: 6.49 },
        { id: 434, name: "Oreo Deluxe", price: 7.49 },
      ],
      "Peanut Butter": [
        { id: 435, name: "PB Shake", price: 6.49 },
        { id: 436, name: "PB & Chocolate", price: 6.99 },
      ]
    },
    "Coffee": {
      "Hot Coffee": [
        { id: 437, name: "Hot Coffee", price: 2.99 },
        { id: 438, name: "Coffee with Cream", price: 3.29 },
      ],
      "Iced Coffee": [
        { id: 439, name: "Iced Coffee", price: 3.49 },
        { id: 440, name: "Iced Mocha", price: 4.49 },
      ],
      "Cold Brew": [
        { id: 441, name: "Cold Brew", price: 4.49 },
        { id: 442, name: "Nitro Cold Brew", price: 5.49 },
      ],
      "Espresso": [
        { id: 443, name: "Single Espresso", price: 2.49 },
        { id: 444, name: "Double Espresso", price: 3.49 },
        { id: 445, name: "Americano", price: 3.49 },
      ]
    },
    "Beer": {
      "Lager": [
        { id: 446, name: "Bud Light", price: 4.49 },
        { id: 447, name: "Coors Light", price: 4.49 },
        { id: 448, name: "Miller Lite", price: 4.49 },
      ],
      "IPA": [
        { id: 449, name: "Local IPA", price: 5.99 },
        { id: 450, name: "West Coast IPA", price: 6.49 },
      ],
      "Wheat": [
        { id: 451, name: "Blue Moon", price: 5.49 },
        { id: 452, name: "Hefeweizen", price: 5.49 },
      ],
      "Mexican": [
        { id: 453, name: "Corona", price: 4.99 },
        { id: 454, name: "Modelo Especial", price: 4.99 },
        { id: 455, name: "Pacifico", price: 4.99 },
        { id: 456, name: "Dos Equis", price: 4.99 },
      ],
      "Craft": [
        { id: 457, name: "Local Craft", price: 6.99 },
        { id: 458, name: "Seasonal Craft", price: 6.99 },
      ]
    }
  }
};

// Initial order items (empty for food truck)
const initialOrderItems: OrderItem[] = [];

// Mock guest users for autocomplete
interface GuestUser {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  initials: string;
}

const mockGuestUsers: GuestUser[] = [
  { id: "1", name: "John Smith", phone: "(555) 123-4567", initials: "JS" },
  { id: "2", name: "Jane Doe", phone: "(555) 234-5678", initials: "JD" },
  { id: "3", name: "Mike Johnson", phone: "(555) 345-6789", initials: "MJ" },
  { id: "4", name: "Sarah Williams", phone: "(555) 456-7890", initials: "SW" },
  { id: "5", name: "David Brown", phone: "(555) 567-8901", initials: "DB" },
  { id: "6", name: "Emily Davis", phone: "(555) 678-9012", initials: "ED" },
  { id: "7", name: "Chris Martinez", phone: "(555) 789-0123", initials: "CM" },
  { id: "8", name: "Jessica Garcia", phone: "(555) 890-1234", initials: "JG" },
];

// Order item interface
interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
  itemOrderType?: string;
}

// Order types for food truck (simplified)
const orderTypes = ["PICK UP", "DINE HERE", "DELIVERY", "CATERING"];

// Phone number formatter
const formatPhoneNumber = (digits: string) => {
  const cleaned = digits.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

// Category colors for food truck theme
const categoryBorderColors: Record<string, string> = {
  "Burgers": "border-orange-500",
  "Tacos": "border-green-500",
  "Sides": "border-yellow-500",
  "Drinks": "border-cyan-500",
  "Specials": "border-pink-500",
  "Desserts": "border-purple-500",
  "Burritos": "border-red-500",
  "Quesadillas": "border-amber-500",
  "Nachos": "border-lime-500",
  "Bowls": "border-teal-500",
  "Wraps": "border-indigo-500",
  "Hot Dogs": "border-rose-500",
  "Sandwiches": "border-emerald-500",
  "Plates": "border-violet-500",
  "Combos": "border-fuchsia-500",
  "Sodas": "border-blue-500",
  "Fresh Juices": "border-orange-400",
  "Agua Fresca": "border-pink-400",
  "Shakes": "border-rose-400",
  "Coffee": "border-amber-700",
  "Beer": "border-amber-500"
};

const categoryBgColors: Record<string, string> = {
  "Burgers": "bg-orange-500",
  "Tacos": "bg-green-500",
  "Sides": "bg-yellow-500",
  "Drinks": "bg-cyan-500",
  "Specials": "bg-pink-500",
  "Desserts": "bg-purple-500",
  "Burritos": "bg-red-500",
  "Quesadillas": "bg-amber-500",
  "Nachos": "bg-lime-500",
  "Bowls": "bg-teal-500",
  "Wraps": "bg-indigo-500",
  "Hot Dogs": "bg-rose-500",
  "Sandwiches": "bg-emerald-500",
  "Plates": "bg-violet-500",
  "Combos": "bg-fuchsia-500",
  "Sodas": "bg-blue-500",
  "Fresh Juices": "bg-orange-400",
  "Agua Fresca": "bg-pink-400",
  "Shakes": "bg-rose-400",
  "Coffee": "bg-amber-700",
  "Beer": "bg-amber-500"
};

const categoryTextColors: Record<string, string> = {
  "Burgers": "text-orange-500",
  "Tacos": "text-green-500",
  "Sides": "text-yellow-500",
  "Drinks": "text-cyan-500",
  "Specials": "text-pink-500",
  "Desserts": "text-purple-500",
  "Burritos": "text-red-500",
  "Quesadillas": "text-amber-500",
  "Nachos": "text-lime-500",
  "Bowls": "text-teal-500",
  "Wraps": "text-indigo-500",
  "Hot Dogs": "text-rose-500",
  "Sandwiches": "text-emerald-500",
  "Plates": "text-violet-500",
  "Combos": "text-fuchsia-500",
  "Sodas": "text-blue-500",
  "Fresh Juices": "text-orange-400",
  "Agua Fresca": "text-pink-400",
  "Shakes": "text-rose-400",
  "Coffee": "text-amber-700",
  "Beer": "text-amber-500"
};

const getCategoryBorderColor = (category: string) => {
  return categoryBorderColors[category] || "border-orange-500";
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

// Helper functions to get menu items
const getMenuItems = (menu: string, category: string, subcategory: string): MenuItem[] => {
  return menuItemsData[menu]?.[category]?.[subcategory] || [];
};

const getAllCategoryItems = (menu: string, category: string): MenuItem[] => {
  const categoryData = menuItemsData[menu]?.[category] || {};
  return Object.values(categoryData).flat();
};

const getAllMenuItems = (menu: string): MenuItem[] => {
  const menuData = menuItemsData[menu] || {};
  return Object.values(menuData).flatMap(category => Object.values(category).flat());
};

const OrdersG = () => {
  const [searchParams] = useSearchParams();
  const { panelLayout } = usePanelPosition();
  const addItemMode = searchParams.get('mode') === 'addItem';
  const existingOrderId = searchParams.get('orderId');
  
  const existingOrder = addItemMode && existingOrderId ? getOrderById(existingOrderId) : null;
  const existingOrderPaymentStatus = existingOrder?.paymentStatus || existingOrder?.status;
  const isExistingOrderPaid = existingOrderPaymentStatus === 'Paid' || existingOrderPaymentStatus === 'PAID';
  
  const getFirstCategoryAndSubcategory = (menu: string) => {
    const categories = menuCategories[menu] || [];
    const firstCategory = categories[0] || "";
    const subcategories = categorySubcategories[firstCategory] || [];
    const firstSubcategory = subcategories[0] || "";
    return { firstCategory, firstSubcategory };
  };

  const defaultMenu = "FOOD TRUCK MENU";
  const { firstCategory: defaultCategory, firstSubcategory: defaultSubcategory } = getFirstCategoryAndSubcategory(defaultMenu);
  
  // Order number for food truck (prominent display)
  const [orderNumber, setOrderNumber] = useState(() => Math.floor(Math.random() * 900) + 100);
  
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(defaultSubcategory);
  const [selectedMenu, setSelectedMenu] = useState(defaultMenu);
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [existingItems, setExistingItems] = useState<OrderItem[]>([]);
  const [horizontalScrollMode, setHorizontalScrollMode] = useState(false);
  const [thumbnailViewMode, setThumbnailViewMode] = useState(true); // Default to thumbnail for food truck
  const [orderType, setOrderType] = useState("PICK UP");
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
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [showInlineCustomization, setShowInlineCustomization] = useState(false);
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

  // Initialize order with existing items when in add-item mode
  useEffect(() => {
    if (addItemMode && existingOrder) {
      setGuestName(existingOrder.name);
      setGuestPhone(existingOrder.phone.replace(/\D/g, ''));
      setOrderNotes(existingOrder.notes);
      
      const orderTypeMap: Record<string, string> = {
        'Dine-In': 'DINE HERE',
        'Takeout': 'PICK UP',
        'Delivery': 'DELIVERY',
        'Bar': 'DINE HERE'
      };
      setOrderType(orderTypeMap[existingOrder.orderType] || 'PICK UP');
      
      const convertedItems: OrderItem[] = existingOrder.items.map((item, index) => ({
        id: Date.now() + index,
        qty: item.qty,
        name: item.name,
        price: item.price,
        modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
        itemOrderType: orderTypeMap[existingOrder.orderType] || 'Pick Up'
      }));
      
      setExistingItems(convertedItems);
      
      if (!isExistingOrderPaid) {
        setOrderItems(convertedItems);
      }
    }
  }, [addItemMode, existingOrderId]);

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
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(target) && guestInputRef.current && !guestInputRef.current.contains(target) && mobileGuestDropdownRef.current && !mobileGuestDropdownRef.current.contains(target) && mobileGuestInputRef.current && !mobileGuestInputRef.current.contains(target)) {
        setShowGuestDropdown(false);
      }
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

  const getMenuHeight = (position: 'minimized' | 'center' | 'full') => {
    if (typeof window === 'undefined') return 48;
    if (position === 'minimized') return 48;
    if (position === 'center') return window.innerHeight - 344;
    return window.innerHeight - 168;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchStartTime(Date.now());
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStart - currentY;
    setDragOffset(diff);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || touchStartTime === null) {
      setIsDragging(false);
      return;
    }
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    const duration = Date.now() - touchStartTime;
    const velocity = Math.abs(diff) / duration;
    const threshold = 50;
    const velocityThreshold = 0.5;

    if (Math.abs(diff) > threshold || velocity > velocityThreshold) {
      if (diff > 0) {
        if (menuPosition === 'minimized') setMenuPosition('center');
        else if (menuPosition === 'center') setMenuPosition('full');
      } else {
        if (menuPosition === 'full') setMenuPosition('center');
        else if (menuPosition === 'center') setMenuPosition('minimized');
      }
    }

    setTouchStart(null);
    setTouchStartTime(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientY);
    setTouchStartTime(Date.now());
    setIsDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (touchStart === null) return;
      const diff = touchStart - e.clientY;
      setDragOffset(diff);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (touchStart === null || touchStartTime === null) {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }
      const diff = touchStart - e.clientY;
      const duration = Date.now() - touchStartTime;
      const velocity = Math.abs(diff) / duration;
      const threshold = 50;
      const velocityThreshold = 0.5;

      if (Math.abs(diff) > threshold || velocity > velocityThreshold) {
        if (diff > 0) {
          if (menuPosition === 'minimized') setMenuPosition('center');
          else if (menuPosition === 'center') setMenuPosition('full');
        } else {
          if (menuPosition === 'full') setMenuPosition('center');
          else if (menuPosition === 'center') setMenuPosition('minimized');
        }
      }

      setTouchStart(null);
      setTouchStartTime(null);
      setDragOffset(0);
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMenuSelect = (menu: string) => {
    setSelectedMenu(menu);
    const { firstCategory, firstSubcategory } = getFirstCategoryAndSubcategory(menu);
    setActiveCategory(firstCategory);
    setActiveSubcategory(firstSubcategory);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    const subcategories = categorySubcategories[cat] || [];
    setActiveSubcategory(subcategories[0] || '');
  };

  const addToCart = (item: MenuItem) => {
    setOrderItems(prev => {
      const existingIndex = prev.findIndex(i => i.name === item.name && !i.modifiers?.length);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + 1 };
        return updated;
      }
      return [...prev, { id: Date.now(), qty: 1, name: item.name, price: item.price }];
    });
  };

  const addToCartWithModifiers = (item: { name: string; price: number }, qty: number, modifiers: string[]) => {
    setOrderItems(prev => [...prev, {
      id: Date.now(),
      qty,
      name: item.name,
      price: item.price,
      modifiers: modifiers.length > 0 ? modifiers : undefined
    }]);
    setCustomizationDialogOpen(false);
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
  };

  const handleInlineAddToCart = (item: { name: string; price: number }, qty: number, modifiers: string[], notes: string, totalPrice: number) => {
    setOrderItems(prev => [...prev, {
      id: Date.now(),
      qty,
      name: item.name,
      price: item.price,
      modifiers: modifiers.length > 0 ? modifiers : undefined
    }]);
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
    if (menuPosition === 'full') {
      setMenuPosition('center');
    }
  };

  const handleInlineCancel = () => {
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
    if (menuPosition === 'full') {
      setMenuPosition('center');
    }
  };

  const removeFromCart = (id: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemOrderType = (id: number, type: string) => {
    setOrderItems(prev => prev.map(item => item.id === id ? { ...item, itemOrderType: type } : item));
  };

  const openCustomizationDialog = (item: MenuItem, index: number) => {
    setSelectedItemForCustomization(item);
    setSelectedItemImage(foodImages[index % foodImages.length]);
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowInlineCustomization(true);
      setMenuPosition('full');
    } else {
      setCustomizationDialogOpen(true);
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setGuestName("");
    setGuestPhone("");
    setOrderNotes("");
    setOrderNumber(Math.floor(Math.random() * 900) + 100);
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = 0;
  const serviceCharge = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + tax + serviceCharge - discount;
  const chargeAmount = total;
  const chargeLabel = "";

  return (
    <div className="flex flex-col h-[100dvh] md:flex-row bg-black overflow-hidden">
      {/* Mobile Order Panel - Top on mobile */}
      <div className={`flex md:hidden flex-col flex-shrink-0 bg-neutral-900 rounded-b-[20px] overflow-hidden ${isOrderPanelExpanded ? 'h-[55vh]' : 'h-auto max-h-[280px]'} transition-all duration-300`}>
        {/* Order Number Badge - Prominent for Food Truck */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-2">
            <span className="text-black font-bold text-2xl">#{orderNumber}</span>
            <span className="text-black/70 text-sm">Order</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black font-medium">{orderItems.reduce((sum, i) => sum + i.qty, 0)} items</span>
          </div>
        </div>

        {/* Guest Info */}
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-xs">
            <div className="relative flex-1">
              <input
                ref={mobileGuestInputRef}
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="CUSTOMER NAME"
                className="bg-transparent outline-none placeholder:text-[#808080] w-full min-w-0 font-medium text-[#808080]"
              />
              {showGuestDropdown && filteredGuests.length > 0 && (
                <div ref={mobileGuestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map(guest => (
                    <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                        {guest.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex items-center gap-0.5 flex-shrink-0">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input
                ref={mobilePhoneInputRef}
                type="tel"
                inputMode="tel"
                value={formatPhoneNumber(guestPhone)}
                onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="(XXX) XXX-XXXX"
                className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 text-[#808080] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Order Type Row */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-black px-3 py-1.5 rounded-full transition-colors">
                  {orderType} <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px] z-50">
                {orderTypes.map(type => (
                  <DropdownMenuItem key={type} onClick={() => setOrderType(type)} className="text-white hover:bg-neutral-700 cursor-pointer">
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <img src={runnerIcon} alt="Runner" className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-neutral-700 transition-colors">
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 min-w-[160px] p-1 z-50">
                <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                  <img src={noTaxIcon} alt="" className="w-3.5 h-3.5" />
                  No Tax
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                  <img src={discountIcon} alt="" className="w-3.5 h-3.5" />
                  Discount
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                  <img src={giftCardIcon} alt="" className="w-3.5 h-3.5" />
                  Gift Card
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Custom Item
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                  <img src={cashRegisterIcon} alt="" className="w-3.5 h-3.5" />
                  Open Register
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
          {orderItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center pb-2">
              <img src={emptyOrderIcon} alt="Empty order" className="w-12 h-12 opacity-50 mb-2" />
              <span className="text-muted-foreground text-xs">Add items to order</span>
            </div>
          ) : (
            <ScrollArea className={`h-full ${isOrderPanelExpanded ? 'flex-1' : 'max-h-[78px]'}`}>
              <div className="px-1.5 py-0.5 space-y-0.5">
                {orderItems.map(item => (
                  <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)} itemOrderType={item.itemOrderType || "Pick Up"} onOrderTypeChange={(type) => updateItemOrderType(item.id, type)} isOpen={activeSwipedItemId === item.id} onSwipeStart={() => setActiveSwipedItemId(item.id)}>
                    <div className="flex items-center justify-between bg-neutral-800 rounded px-1.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded border border-white/50 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                          {item.qty}
                        </span>
                        <span className="text-[11px] font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-medium text-foreground">${item.price.toFixed(2)}</span>
                    </div>
                  </SwipeableCartItem>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <div className="px-2 py-1 border-t border-sidebar-border text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Sub:</span>
              <span className="text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Tax:</span>
              <span className="text-foreground">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-foreground font-bold">Total:</span>
              <span className="text-foreground font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {orderItems.length > 0 && (
          <div className="px-2 py-2 flex items-center gap-2">
            <button onClick={clearOrder} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
              <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9C9C9' }}>
              <img src={saveIcon} alt="Save" className="w-4 h-4" />
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}>
              <img src={fireIcon} alt="Fire" className="w-4 h-4" />
              <span className="text-white font-semibold text-sm">FIRE</span>
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}>
              <span className="text-black font-semibold text-xs">
                CHARGE ${chargeAmount.toFixed(2)}
              </span>
            </button>
          </div>
        )}
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
          <div className="w-8" />
          <div className="touch-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown}>
            <img src={grabberIcon} alt="Drag to resize" className="w-10 h-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-grab" />
          </div>
          {!(showInlineCustomization && selectedItemForCustomization) && !isSearchMode && (
            <button className="w-6 h-6 p-0 border-0 bg-transparent z-10 touch-auto" onClick={e => {
              e.stopPropagation();
              setIsSearchMode(true);
              setMenuPosition('full');
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}>
              <img src={searchIcon} alt="Search" className="w-full h-full object-contain" />
            </button>
          )}
          {(showInlineCustomization && selectedItemForCustomization) || isSearchMode ? <div className="w-8" /> : null}
        </div>

        {/* Menu Content */}
        <div className={`flex flex-col gap-2 transition-all duration-300 bg-neutral-900 rounded-[12px] md:rounded-[16px] ${showInlineCustomization && selectedItemForCustomization ? 'p-0' : 'p-2 md:p-2 lg:p-3'} ${menuPosition === 'minimized' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100 overflow-hidden scrollbar-hide'}`}>
          {/* Inline Item Customization for Mobile */}
          {showInlineCustomization && selectedItemForCustomization ? (
            <div className="flex-1 flex flex-col md:hidden overflow-y-auto scrollbar-hide">
              <InlineItemCustomization item={selectedItemForCustomization} itemImage={selectedItemImage} onAddToCart={handleInlineAddToCart} onCancel={handleInlineCancel} className="h-full" />
            </div>
          ) : (
            <>
              {/* Main Categories */}
              <div className={`relative flex flex-wrap items-center gap-1 md:gap-1.5 lg:gap-2 pr-10 md:pr-12 lg:pr-14 ${isSearchMode ? 'hidden md:flex' : ''}`}>
                {/* Desktop Search Button */}
                <div className="hidden md:flex absolute top-1 right-0 z-10 items-center">
                  <button className="cursor-pointer" onClick={() => setIsDesktopSearchOpen(true)}>
                    <img src={searchIcon} alt="Search" className="w-8 h-8 lg:w-9 lg:h-9" />
                  </button>
                </div>
                {/* Menu Controls */}
                {isMenuSelectOpen ? (
                  <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 bg-sidebar-accent rounded-full pl-1 pr-0.5 md:pl-1.5 md:pr-0.5 lg:pl-2 lg:pr-0.5 h-6 md:h-8 lg:h-9">
                    <Button variant="ghost" size="icon" className="h-5 md:h-7 lg:h-8 w-5 md:w-7 lg:w-8 p-0" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
                      <img src={burgerCloseIcon} alt="Close menu" className="w-4 md:w-5 lg:w-6 h-4 md:h-5 lg:h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 md:h-7 lg:h-8 w-5 md:w-7 lg:w-8 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setHorizontalScrollMode(!horizontalScrollMode)}>
                      {horizontalScrollMode ? <img src={verticalScrollIcon} alt="All view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" /> : <img src={horizontalScrollIcon} alt="Horizontal scroll" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 md:h-7 lg:h-8 w-5 md:w-7 lg:w-8 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setThumbnailViewMode(!thumbnailViewMode)}>
                      {thumbnailViewMode ? <img src={listViewIcon} alt="List view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" /> : <img src={thumbnailViewIcon} alt="Thumbnail view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" />}
                    </Button>
                    <Select value={selectedMenu} onValueChange={handleMenuSelect}>
                      <SelectTrigger className="w-[100px] md:w-[130px] lg:w-[180px] rounded-full bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white h-5 md:h-7 lg:h-8 text-[10px] md:text-[10px] lg:text-sm">
                        <SelectValue placeholder="Select Menu" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 z-50">
                        {menuList.map(menu => (
                          <SelectItem key={menu} value={menu} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                            {menu}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" className="h-6 md:h-8 lg:h-9 w-6 md:w-8 lg:w-9 p-0 hover:bg-transparent" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
                    <img src={burgerOpenIcon} alt="Open menu" className="w-6 md:w-8 lg:w-9 h-6 md:h-8 lg:h-9" />
                  </Button>
                )}
                {/* Categories */}
                {menuCategories[selectedMenu].map(cat => (
                  <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} className={`rounded-full px-2 md:px-5 lg:px-7 h-6 md:h-8 lg:h-9 text-[10px] md:text-xs lg:text-sm whitespace-nowrap border-2 ${activeCategory === cat ? `${getCategoryBgColor(cat)} ${getCategoryHoverBgColor(cat)} text-white ${getCategoryBorderColor(cat)}` : `bg-header text-header-foreground ${getCategoryBorderColor(cat)} hover:bg-header/80`}`} onClick={() => handleCategoryChange(cat)}>
                    {cat}
                  </Button>
                ))}
              </div>

              <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

              {/* Subcategories */}
              <div className={`overflow-x-auto scrollbar-hide ${horizontalScrollMode ? '' : 'max-h-[6rem] md:max-h-[7rem] lg:max-h-[8.5rem]'} ${isSearchMode ? 'hidden md:block' : ''}`}>
                <div className={`flex gap-1 md:gap-1.5 lg:gap-2 ${horizontalScrollMode ? 'flex-row flex-nowrap' : 'flex-row flex-wrap'}`}>
                  {(categorySubcategories[activeCategory] || []).map(sub => (
                    <Button key={sub} variant="outline" className={`rounded-md px-2 md:px-4 lg:px-6 h-6 md:h-7 lg:h-8 text-[10px] md:text-[10px] lg:text-xs whitespace-nowrap border ${activeSubcategory === sub ? `bg-black ${getCategoryTextColor(activeCategory)} ${getCategoryHoverTextColor(activeCategory)} ${getCategoryBorderColor(activeCategory)} font-semibold hover:bg-black` : `bg-black text-header-foreground ${getCategoryBorderColor(activeCategory)} hover:bg-black/80`}`} onClick={() => setActiveSubcategory(sub)}>
                      {sub}
                    </Button>
                  ))}
                </div>
              </div>

              <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

              {/* Menu Items Grid */}
              <ScrollArea className="flex-1 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
                {(() => {
                  let currentItems: MenuItem[] = [];
                  
                  if (searchQuery.trim()) {
                    currentItems = getAllMenuItems(selectedMenu);
                  } else if (activeSubcategory) {
                    currentItems = getMenuItems(selectedMenu, activeCategory, activeSubcategory);
                  } else if (activeCategory) {
                    currentItems = getAllCategoryItems(selectedMenu, activeCategory);
                  } else {
                    currentItems = getAllMenuItems(selectedMenu);
                  }

                  const filteredItems = searchQuery.trim() ? currentItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : currentItems;
                  
                  return thumbnailViewMode ? (
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1 md:gap-1.5 lg:gap-2 pb-4 md:pb-0">
                      {filteredItems.map((item, index) => (
                        <div key={item.id} className="flex flex-col rounded-md overflow-hidden cursor-pointer group border border-neutral-700">
                          <div className="relative aspect-[2/1] md:aspect-square bg-neutral-800" onClick={() => openCustomizationDialog(item, index)}>
                            <img src={foodImages[index % foodImages.length]} alt={item.name} className="w-full h-full object-cover" />
                            <button onClick={e => {
                              e.stopPropagation();
                              addToCart(item);
                            }} className="absolute top-0.5 md:top-1 left-0.5 md:left-1 w-5 md:w-6 h-5 md:h-6 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center transition-colors">
                              <Plus className="w-2.5 md:w-3 h-2.5 md:h-3 text-white" strokeWidth={3} />
                            </button>
                          </div>
                          <div className="p-0.5 md:p-1 bg-neutral-900" onClick={() => openCustomizationDialog(item, index)}>
                            <span className="text-[11px] md:text-xs font-medium text-white uppercase leading-tight line-clamp-2">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-1.5 pb-4 md:pb-0">
                      {filteredItems.map((item, index) => (
                        <div key={item.id} onClick={() => openCustomizationDialog(item, index)} className="flex items-stretch bg-sidebar-accent rounded-md overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border min-h-[38px] md:min-h-[42px]">
                          <div className="flex-1 p-1.5 md:p-2" style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}>
                            <span className="float-right text-[9px] md:text-[10px] ml-1 text-white">
                              ${item.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] md:text-[11px] font-bold leading-tight uppercase text-foreground line-clamp-2">
                              {item.name}
                            </span>
                          </div>
                          <button onClick={e => {
                            e.stopPropagation();
                            addToCart(item);
                          }} className="w-6 md:w-8 text-white flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}>
                            <Plus className="w-2.5 md:w-3 h-2.5 md:h-3" strokeWidth={4} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </ScrollArea>
            </>
          )}

          {/* Desktop Search Bar */}
          {isDesktopSearchOpen && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2.5 bg-neutral-900 border-t border-neutral-700 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
                <img src={searchIcon} alt="Search" className="w-4 h-4 flex-shrink-0" />
                <input type="text" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-0.5">
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 p-0 flex-shrink-0" onClick={() => {
                setIsDesktopSearchOpen(false);
                setSearchQuery('');
              }}>
                <X className="w-4 h-4 text-white" />
              </Button>
            </div>
          )}

          {/* Mobile Search Bar */}
          {isSearchMode && (
            <div className="flex items-center gap-2 px-3 py-2.5 md:hidden bg-neutral-900 border-t border-neutral-700 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
                <img src={searchIcon} alt="Search" className="w-4 h-4 flex-shrink-0" />
                <input ref={searchInputRef} type="text" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-0.5">
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 p-0 flex-shrink-0" onClick={() => {
                setIsSearchMode(false);
                setSearchQuery('');
                setMenuPosition('center');
              }}>
                <X className="w-4 h-4 text-white" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Order (Desktop only) */}
      <div className={`hidden md:flex w-[280px] lg:w-[345px] flex-col overflow-hidden flex-shrink-0 pb-2 pr-2 ${panelLayout === 'menu-right' ? 'md:order-1' : 'md:order-2'}`}>
        {/* Order Number Header - Food Truck Style */}
        <div className="px-3 py-3 mb-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-black font-bold text-3xl">#{orderNumber}</span>
              <span className="text-black/70">Order</span>
            </div>
            <DraggablePanelHandle panelId="order" className="flex-shrink-0" />
          </div>
        </div>

        {/* Guest Info */}
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="flex items-center text-xs mb-2 gap-2">
            <div className="relative flex-1">
              <input ref={guestInputRef} type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="CUSTOMER NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-full min-w-0 font-medium text-[#808080]" />
              {showGuestDropdown && filteredGuests.length > 0 && (
                <div ref={guestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map(guest => (
                    <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                        {guest.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex items-center gap-0.5 flex-shrink-0">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input ref={phoneInputRef} type="tel" inputMode="tel" value={formatPhoneNumber(guestPhone)} onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="(XXX) XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-[#808080] text-xs" />
              {showPhoneDropdown && filteredByPhone.length > 0 && (
                <div ref={phoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredByPhone.map(guest => (
                    <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                        {guest.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-3 h-3" />
              <span className="text-white text-[10px]">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
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
        <div className="flex-1 flex flex-col rounded-lg overflow-hidden min-h-0" style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}>
          {/* Order Type & Guest Info */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-black px-3 py-1.5 rounded-full transition-colors">
                    {orderType} <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px] z-50">
                  {orderTypes.map(type => (
                    <DropdownMenuItem key={type} onClick={() => setOrderType(type)} className="text-white hover:bg-neutral-700 cursor-pointer">
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {orderItems.length > 0 && <span className="bg-sidebar-accent px-2 py-0.5 rounded text-base font-bold">{orderItems.reduce((sum, i) => sum + i.qty, 0)}</span>}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <img src={runnerIcon} alt="Runner" className="w-4 h-4" />
              <span>{guestName || "Customer"}</span>
            </div>
          </div>

          {/* Order Notes */}
          <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-2 rounded px-3 py-2" style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}>
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input type="text" placeholder="Order notes" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground outline-none" />
            </div>
          </div>

          {/* Order Items */}
          <ScrollArea className="flex-1 min-h-0 px-2">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                <span className="text-muted-foreground text-sm">Add items to order</span>
              </div>
            ) : (
              <div className="py-1 space-y-1 md:space-y-1 lg:space-y-2">
                {orderItems.map(item => (
                  <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)} itemOrderType={item.itemOrderType || "Pick Up"} onOrderTypeChange={(type) => updateItemOrderType(item.id, type)} isOpen={activeSwipedItemId === item.id} onSwipeStart={() => setActiveSwipedItemId(item.id)}>
                    <div className="p-2 md:p-1.5 lg:p-3 border border-sidebar-border rounded-md md:rounded lg:rounded-lg" style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-1.5 lg:gap-3">
                          <span className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-orange-500 text-white text-xs md:text-[10px] lg:text-xs font-medium flex items-center justify-center flex-shrink-0">
                            {item.qty}
                          </span>
                          <span className="text-sm md:text-xs lg:text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm md:text-xs lg:text-sm font-medium text-foreground">${item.price.toFixed(2)}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-1.5 md:mt-1 lg:mt-2 ml-7 md:ml-5 lg:ml-8 space-y-0.5">
                          {item.modifiers.map((mod, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs md:text-[10px] lg:text-xs text-primary">
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
          {orderItems.length > 0 && (
            <div className="p-2 border-t border-sidebar-border flex-shrink-0">
              <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
                  <span className="text-red-500">Discount: <span className="font-medium">${discount.toFixed(2)}</span></span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
                  <span className="text-foreground font-bold">Total: <span className="font-bold">${total.toFixed(2)}</span></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-2 py-2 flex items-center gap-2 flex-shrink-0">
                <button onClick={clearOrder} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                  <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
                </button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9C9C9' }}>
                  <img src={saveIcon} alt="Save" className="w-4 h-4" />
                </button>
                <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}>
                  <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                  <span className="text-white font-semibold text-sm">FIRE</span>
                </button>
                <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}>
                  <span className="text-black font-semibold text-xs">
                    CHARGE ${chargeAmount.toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Customization Dialog */}
      <ItemCustomizationDialog open={customizationDialogOpen} onOpenChange={setCustomizationDialogOpen} item={selectedItemForCustomization} itemImage={selectedItemImage} onAddToCart={addToCartWithModifiers} />
    </div>
  );
};

export default OrdersG;
