// Demo menu data for different business types

export interface DemoModifier {
  id: string;
  name: string;
  price: number;
  default?: boolean;
}

export interface DemoModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  modifiers: DemoModifier[];
}

export interface DemoMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  popular?: boolean;
  modifierGroups?: DemoModifierGroup[];
}

export interface DemoCategory {
  id: string;
  name: string;
  icon?: string;
  items: DemoMenuItem[];
}

export interface DemoMenuData {
  businessName: string;
  categories: DemoCategory[];
}

// Restaurant Demo Data - Full-service dining
export const restaurantDemoData: DemoMenuData = {
  businessName: "The Rustic Table",
  categories: [
    {
      id: "appetizers",
      name: "Appetizers",
      items: [
        {
          id: "r-app-1",
          name: "Crispy Calamari",
          description: "Lightly breaded with marinara and lemon aioli",
          price: 14.99,
          popular: true,
          modifierGroups: [
            {
              id: "sauce",
              name: "Extra Sauce",
              required: false,
              multiSelect: true,
              modifiers: [
                { id: "marinara", name: "Extra Marinara", price: 0.50 },
                { id: "aioli", name: "Extra Lemon Aioli", price: 0.50 },
                { id: "spicy", name: "Spicy Mayo", price: 0.75 },
              ],
            },
          ],
        },
        {
          id: "r-app-2",
          name: "Bruschetta Trio",
          description: "Classic tomato, mushroom, and olive tapenade",
          price: 12.99,
        },
        {
          id: "r-app-3",
          name: "French Onion Soup",
          description: "Gruyère cheese crust, caramelized onions",
          price: 9.99,
          popular: true,
        },
        {
          id: "r-app-4",
          name: "Spinach Artichoke Dip",
          description: "Served with warm pita chips",
          price: 11.99,
        },
      ],
    },
    {
      id: "salads",
      name: "Salads",
      items: [
        {
          id: "r-sal-1",
          name: "Caesar Salad",
          description: "Romaine, parmesan, croutons, house dressing",
          price: 10.99,
          modifierGroups: [
            {
              id: "protein",
              name: "Add Protein",
              required: false,
              multiSelect: false,
              modifiers: [
                { id: "chicken", name: "Grilled Chicken", price: 5.00 },
                { id: "salmon", name: "Grilled Salmon", price: 8.00 },
                { id: "shrimp", name: "Grilled Shrimp", price: 7.00 },
              ],
            },
          ],
        },
        {
          id: "r-sal-2",
          name: "House Salad",
          description: "Mixed greens, cherry tomatoes, cucumber, balsamic",
          price: 8.99,
        },
        {
          id: "r-sal-3",
          name: "Wedge Salad",
          description: "Iceberg, bacon, tomato, gorgonzola crumbles",
          price: 11.99,
        },
      ],
    },
    {
      id: "entrees",
      name: "Entrées",
      items: [
        {
          id: "r-ent-1",
          name: "Filet Mignon",
          description: "8oz center cut, herb butter, asparagus, potato",
          price: 42.99,
          popular: true,
          modifierGroups: [
            {
              id: "temp",
              name: "Temperature",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "rare", name: "Rare", price: 0 },
                { id: "mr", name: "Medium Rare", price: 0, default: true },
                { id: "med", name: "Medium", price: 0 },
                { id: "mw", name: "Medium Well", price: 0 },
                { id: "well", name: "Well Done", price: 0 },
              ],
            },
            {
              id: "sides",
              name: "Side Substitution",
              required: false,
              multiSelect: false,
              modifiers: [
                { id: "fries", name: "Swap to Truffle Fries", price: 3.00 },
                { id: "salad", name: "Swap to Side Salad", price: 0 },
              ],
            },
          ],
        },
        {
          id: "r-ent-2",
          name: "Pan-Seared Salmon",
          description: "Atlantic salmon, lemon dill sauce, rice pilaf",
          price: 28.99,
          popular: true,
        },
        {
          id: "r-ent-3",
          name: "Chicken Parmesan",
          description: "Breaded cutlet, marinara, mozzarella, linguine",
          price: 24.99,
        },
        {
          id: "r-ent-4",
          name: "Lobster Ravioli",
          description: "House-made pasta, lobster cream sauce, chives",
          price: 32.99,
        },
        {
          id: "r-ent-5",
          name: "NY Strip Steak",
          description: "12oz prime cut, peppercorn sauce, vegetables",
          price: 38.99,
          modifierGroups: [
            {
              id: "temp",
              name: "Temperature",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "rare", name: "Rare", price: 0 },
                { id: "mr", name: "Medium Rare", price: 0, default: true },
                { id: "med", name: "Medium", price: 0 },
                { id: "mw", name: "Medium Well", price: 0 },
                { id: "well", name: "Well Done", price: 0 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "sides",
      name: "Sides",
      items: [
        { id: "r-side-1", name: "Truffle Fries", description: "Parmesan, truffle oil, herbs", price: 8.99 },
        { id: "r-side-2", name: "Grilled Asparagus", description: "Olive oil, lemon zest", price: 7.99 },
        { id: "r-side-3", name: "Mashed Potatoes", description: "Creamy garlic butter", price: 6.99 },
        { id: "r-side-4", name: "Mac & Cheese", description: "Four cheese blend, breadcrumb crust", price: 9.99 },
      ],
    },
    {
      id: "desserts",
      name: "Desserts",
      items: [
        { id: "r-des-1", name: "Crème Brûlée", description: "Vanilla bean, caramelized sugar", price: 9.99, popular: true },
        { id: "r-des-2", name: "Chocolate Lava Cake", description: "Warm center, vanilla ice cream", price: 10.99 },
        { id: "r-des-3", name: "Tiramisu", description: "Espresso-soaked ladyfingers, mascarpone", price: 9.99 },
        { id: "r-des-4", name: "NY Cheesecake", description: "Berry compote, whipped cream", price: 8.99 },
      ],
    },
    {
      id: "beverages",
      name: "Beverages",
      items: [
        { id: "r-bev-1", name: "Soft Drinks", description: "Coke, Diet Coke, Sprite, Ginger Ale", price: 3.49 },
        { id: "r-bev-2", name: "Fresh Lemonade", description: "House-squeezed, mint", price: 4.99 },
        { id: "r-bev-3", name: "Iced Tea", description: "Unsweetened or sweet", price: 3.49 },
        { id: "r-bev-4", name: "Espresso", description: "Double shot", price: 3.99 },
        { id: "r-bev-5", name: "Cappuccino", description: "Espresso, steamed milk foam", price: 5.49 },
      ],
    },
  ],
};

// Café Demo Data - Quick-service counter ordering
export const cafeDemoData: DemoMenuData = {
  businessName: "Morning Bloom Café",
  categories: [
    {
      id: "coffee",
      name: "Coffee",
      items: [
        {
          id: "c-cof-1",
          name: "Drip Coffee",
          description: "Fresh brewed house blend",
          price: 2.99,
          modifierGroups: [
            {
              id: "size",
              name: "Size",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "small", name: "Small (12oz)", price: 0, default: true },
                { id: "medium", name: "Medium (16oz)", price: 0.75 },
                { id: "large", name: "Large (20oz)", price: 1.25 },
              ],
            },
          ],
        },
        {
          id: "c-cof-2",
          name: "Latte",
          description: "Espresso with steamed milk",
          price: 4.99,
          popular: true,
          modifierGroups: [
            {
              id: "size",
              name: "Size",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "small", name: "Small (12oz)", price: 0, default: true },
                { id: "medium", name: "Medium (16oz)", price: 0.75 },
                { id: "large", name: "Large (20oz)", price: 1.25 },
              ],
            },
            {
              id: "milk",
              name: "Milk Choice",
              required: false,
              multiSelect: false,
              modifiers: [
                { id: "oat", name: "Oat Milk", price: 0.80 },
                { id: "almond", name: "Almond Milk", price: 0.80 },
                { id: "soy", name: "Soy Milk", price: 0.60 },
                { id: "skim", name: "Skim Milk", price: 0 },
              ],
            },
            {
              id: "extras",
              name: "Add-Ons",
              required: false,
              multiSelect: true,
              modifiers: [
                { id: "vanilla", name: "Vanilla Syrup", price: 0.75 },
                { id: "caramel", name: "Caramel Syrup", price: 0.75 },
                { id: "hazelnut", name: "Hazelnut Syrup", price: 0.75 },
                { id: "shot", name: "Extra Shot", price: 1.00 },
              ],
            },
          ],
        },
        {
          id: "c-cof-3",
          name: "Cappuccino",
          description: "Espresso with thick milk foam",
          price: 4.49,
          modifierGroups: [
            {
              id: "size",
              name: "Size",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "small", name: "Small (8oz)", price: 0, default: true },
                { id: "medium", name: "Medium (12oz)", price: 0.75 },
              ],
            },
          ],
        },
        {
          id: "c-cof-4",
          name: "Americano",
          description: "Espresso with hot water",
          price: 3.49,
        },
        {
          id: "c-cof-5",
          name: "Cold Brew",
          description: "Slow-steeped 20 hours, smooth & bold",
          price: 4.49,
          popular: true,
        },
        {
          id: "c-cof-6",
          name: "Mocha",
          description: "Espresso, chocolate, steamed milk, whipped cream",
          price: 5.49,
        },
      ],
    },
    {
      id: "tea",
      name: "Tea",
      items: [
        { id: "c-tea-1", name: "Earl Grey", description: "Bergamot black tea", price: 3.49 },
        { id: "c-tea-2", name: "Green Tea", description: "Japanese sencha", price: 3.49 },
        { id: "c-tea-3", name: "Chai Latte", description: "Spiced black tea, steamed milk", price: 4.99, popular: true },
        { id: "c-tea-4", name: "Matcha Latte", description: "Ceremonial grade matcha, milk", price: 5.49 },
        { id: "c-tea-5", name: "Herbal Infusion", description: "Chamomile, peppermint, or hibiscus", price: 3.49 },
      ],
    },
    {
      id: "pastries",
      name: "Pastries",
      items: [
        { id: "c-pas-1", name: "Croissant", description: "Butter, flaky, baked fresh", price: 3.99, popular: true },
        { id: "c-pas-2", name: "Chocolate Croissant", description: "Dark chocolate filled", price: 4.49 },
        { id: "c-pas-3", name: "Blueberry Muffin", description: "Fresh blueberries, streusel top", price: 3.99 },
        { id: "c-pas-4", name: "Cinnamon Roll", description: "Cream cheese frosting", price: 4.99, popular: true },
        { id: "c-pas-5", name: "Scone", description: "Choice of blueberry or cranberry orange", price: 3.49 },
        { id: "c-pas-6", name: "Danish", description: "Cheese or fruit filled", price: 3.99 },
      ],
    },
    {
      id: "breakfast",
      name: "Breakfast",
      items: [
        {
          id: "c-brk-1",
          name: "Avocado Toast",
          description: "Sourdough, smashed avocado, everything seasoning",
          price: 9.99,
          popular: true,
          modifierGroups: [
            {
              id: "add",
              name: "Add-Ons",
              required: false,
              multiSelect: true,
              modifiers: [
                { id: "egg", name: "Poached Egg", price: 2.00 },
                { id: "bacon", name: "Bacon Crumbles", price: 2.50 },
                { id: "feta", name: "Feta Cheese", price: 1.50 },
              ],
            },
          ],
        },
        {
          id: "c-brk-2",
          name: "Breakfast Sandwich",
          description: "Egg, cheese, choice of meat on brioche",
          price: 8.99,
          modifierGroups: [
            {
              id: "meat",
              name: "Protein",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "bacon", name: "Bacon", price: 0, default: true },
                { id: "sausage", name: "Sausage Patty", price: 0 },
                { id: "ham", name: "Ham", price: 0 },
                { id: "none", name: "No Meat (Veggie)", price: -1.00 },
              ],
            },
          ],
        },
        {
          id: "c-brk-3",
          name: "Açaí Bowl",
          description: "Açaí blend, granola, banana, berries, honey",
          price: 11.99,
        },
        {
          id: "c-brk-4",
          name: "Overnight Oats",
          description: "Oats, chia, almond milk, maple, berries",
          price: 7.99,
        },
      ],
    },
    {
      id: "lunch",
      name: "Lunch",
      items: [
        {
          id: "c-lun-1",
          name: "Turkey Club Panini",
          description: "Turkey, bacon, avocado, swiss, chipotle aioli",
          price: 12.99,
          popular: true,
        },
        {
          id: "c-lun-2",
          name: "Caprese Sandwich",
          description: "Fresh mozzarella, tomato, basil, balsamic glaze",
          price: 10.99,
        },
        {
          id: "c-lun-3",
          name: "Chicken Salad Wrap",
          description: "House chicken salad, greens, cranberries",
          price: 11.99,
        },
        {
          id: "c-lun-4",
          name: "Soup of the Day",
          description: "Chef's seasonal selection with bread",
          price: 6.99,
        },
        {
          id: "c-lun-5",
          name: "Grain Bowl",
          description: "Quinoa, roasted vegetables, tahini dressing",
          price: 12.99,
        },
      ],
    },
    {
      id: "sweets",
      name: "Sweets",
      items: [
        { id: "c-swt-1", name: "Chocolate Chip Cookie", description: "Warm, gooey, house-baked", price: 2.99 },
        { id: "c-swt-2", name: "Brownie", description: "Fudgy dark chocolate", price: 3.99 },
        { id: "c-swt-3", name: "Lemon Bar", description: "Shortbread crust, tangy lemon curd", price: 3.49 },
        { id: "c-swt-4", name: "Cheesecake Slice", description: "NY style, berry topping", price: 5.99 },
      ],
    },
  ],
};

// Food Truck Demo Data - Streamlined mobile menu
export const foodTruckDemoData: DemoMenuData = {
  businessName: "Street Eats Co.",
  categories: [
    {
      id: "tacos",
      name: "Tacos",
      items: [
        {
          id: "ft-tac-1",
          name: "Carne Asada Taco",
          description: "Grilled steak, onions, cilantro, salsa verde",
          price: 4.99,
          popular: true,
          modifierGroups: [
            {
              id: "extras",
              name: "Add-Ons",
              required: false,
              multiSelect: true,
              modifiers: [
                { id: "cheese", name: "Extra Cheese", price: 0.75 },
                { id: "guac", name: "Guacamole", price: 1.50 },
                { id: "cream", name: "Sour Cream", price: 0.50 },
              ],
            },
            {
              id: "spice",
              name: "Spice Level",
              required: false,
              multiSelect: false,
              modifiers: [
                { id: "mild", name: "Mild", price: 0 },
                { id: "medium", name: "Medium", price: 0 },
                { id: "hot", name: "Hot", price: 0 },
                { id: "fire", name: "Extra Hot 🔥", price: 0 },
              ],
            },
          ],
        },
        {
          id: "ft-tac-2",
          name: "Carnitas Taco",
          description: "Slow-roasted pork, pickled onions, lime",
          price: 4.49,
          popular: true,
        },
        {
          id: "ft-tac-3",
          name: "Chicken Taco",
          description: "Grilled chicken, pico de gallo, queso fresco",
          price: 4.49,
        },
        {
          id: "ft-tac-4",
          name: "Fish Taco",
          description: "Beer-battered cod, cabbage slaw, chipotle crema",
          price: 5.49,
          popular: true,
        },
        {
          id: "ft-tac-5",
          name: "Veggie Taco",
          description: "Grilled peppers, black beans, corn, cotija",
          price: 3.99,
        },
      ],
    },
    {
      id: "burritos",
      name: "Burritos",
      items: [
        {
          id: "ft-bur-1",
          name: "Classic Burrito",
          description: "Choice of protein, rice, beans, cheese, salsa",
          price: 10.99,
          popular: true,
          modifierGroups: [
            {
              id: "protein",
              name: "Protein",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "steak", name: "Carne Asada", price: 0, default: true },
                { id: "carnitas", name: "Carnitas", price: 0 },
                { id: "chicken", name: "Chicken", price: 0 },
                { id: "veggie", name: "Veggie (No Meat)", price: -1.00 },
              ],
            },
            {
              id: "rice",
              name: "Rice",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "white", name: "Cilantro Lime Rice", price: 0, default: true },
                { id: "brown", name: "Brown Rice", price: 0 },
                { id: "none", name: "No Rice", price: 0 },
              ],
            },
            {
              id: "beans",
              name: "Beans",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "black", name: "Black Beans", price: 0, default: true },
                { id: "pinto", name: "Pinto Beans", price: 0 },
                { id: "none", name: "No Beans", price: 0 },
              ],
            },
          ],
        },
        {
          id: "ft-bur-2",
          name: "California Burrito",
          description: "Carne asada, fries, cheese, guac, sour cream",
          price: 12.99,
          popular: true,
        },
        {
          id: "ft-bur-3",
          name: "Breakfast Burrito",
          description: "Eggs, chorizo, potatoes, cheese, salsa",
          price: 9.99,
        },
      ],
    },
    {
      id: "bowls",
      name: "Bowls",
      items: [
        {
          id: "ft-bow-1",
          name: "Burrito Bowl",
          description: "All burrito fixings, no tortilla",
          price: 10.99,
          modifierGroups: [
            {
              id: "protein",
              name: "Protein",
              required: true,
              multiSelect: false,
              modifiers: [
                { id: "steak", name: "Carne Asada", price: 0, default: true },
                { id: "carnitas", name: "Carnitas", price: 0 },
                { id: "chicken", name: "Chicken", price: 0 },
                { id: "veggie", name: "Veggie", price: -1.00 },
              ],
            },
          ],
        },
        {
          id: "ft-bow-2",
          name: "Street Corn Bowl",
          description: "Elote corn, rice, cotija, lime crema, chili",
          price: 8.99,
        },
      ],
    },
    {
      id: "sides",
      name: "Sides",
      items: [
        { id: "ft-sid-1", name: "Chips & Guac", description: "Fresh guacamole, house chips", price: 5.99, popular: true },
        { id: "ft-sid-2", name: "Chips & Salsa", description: "House salsa roja and verde", price: 3.99 },
        { id: "ft-sid-3", name: "Elote", description: "Grilled corn, mayo, cotija, chili, lime", price: 4.99 },
        { id: "ft-sid-4", name: "Rice & Beans", description: "Cilantro lime rice, black beans", price: 3.99 },
        { id: "ft-sid-5", name: "Loaded Nachos", description: "Chips, cheese, protein, toppings", price: 9.99 },
      ],
    },
    {
      id: "drinks",
      name: "Drinks",
      items: [
        { id: "ft-drk-1", name: "Horchata", description: "Creamy cinnamon rice drink", price: 3.99, popular: true },
        { id: "ft-drk-2", name: "Jamaica", description: "Hibiscus iced tea", price: 3.49 },
        { id: "ft-drk-3", name: "Mexican Coke", description: "Glass bottle, cane sugar", price: 3.49 },
        { id: "ft-drk-4", name: "Jarritos", description: "Assorted flavors", price: 2.99 },
        { id: "ft-drk-5", name: "Bottled Water", description: "Cold", price: 1.99 },
      ],
    },
    {
      id: "combos",
      name: "Combos",
      items: [
        {
          id: "ft-cmb-1",
          name: "Taco Trio",
          description: "Any 3 tacos + chips & salsa + drink",
          price: 16.99,
          popular: true,
        },
        {
          id: "ft-cmb-2",
          name: "Burrito Combo",
          description: "Any burrito + chips & guac + drink",
          price: 17.99,
        },
        {
          id: "ft-cmb-3",
          name: "Family Pack",
          description: "10 tacos, large chips, guac, salsa, 4 drinks",
          price: 49.99,
        },
      ],
    },
  ],
};

// Helper function to get demo data by business type
export const getDemoDataByBusinessType = (businessType: string): DemoMenuData => {
  switch (businessType) {
    case "restaurant":
      return restaurantDemoData;
    case "cafe":
      return cafeDemoData;
    case "food-truck":
      return foodTruckDemoData;
    default:
      return restaurantDemoData;
  }
};

// Get all categories flat list for a business type
export const getDemoCategoriesFlat = (businessType: string): string[] => {
  const data = getDemoDataByBusinessType(businessType);
  return data.categories.map(cat => cat.name);
};

// Get all items for a specific category
export const getDemoItemsByCategory = (businessType: string, categoryId: string): DemoMenuItem[] => {
  const data = getDemoDataByBusinessType(businessType);
  const category = data.categories.find(cat => cat.id === categoryId);
  return category?.items || [];
};

// Get popular items for quick access
export const getDemoPopularItems = (businessType: string): DemoMenuItem[] => {
  const data = getDemoDataByBusinessType(businessType);
  const popularItems: DemoMenuItem[] = [];
  
  data.categories.forEach(category => {
    category.items.forEach(item => {
      if (item.popular) {
        popularItems.push(item);
      }
    });
  });
  
  return popularItems;
};
