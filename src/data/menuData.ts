// Menu data for POS Home screen
import asparagus from '@/assets/food/asparagus.jpg';
import burger from '@/assets/food/burger.jpg';
import chickenBreast from '@/assets/food/chicken-breast.jpg';
import chickenParmesan from '@/assets/food/chicken-parmesan.jpg';
import fettuccini from '@/assets/food/fettuccini.jpg';
import gnocchi from '@/assets/food/gnocchi.jpg';
import macCheese from '@/assets/food/mac-cheese.jpg';
import pancakes from '@/assets/food/pancakes.jpg';
import panini from '@/assets/food/panini.jpg';
import pasta from '@/assets/food/pasta.jpg';
import pizza from '@/assets/food/pizza.jpg';
import ravioli from '@/assets/food/ravioli.jpg';
import ribs from '@/assets/food/ribs.jpg';
import salad from '@/assets/food/salad.jpg';
import salmon from '@/assets/food/salmon.jpg';
import seafood from '@/assets/food/seafood.jpg';
import shrimp from '@/assets/food/shrimp.jpg';
import soup from '@/assets/food/soup.jpg';
import steak from '@/assets/food/steak.jpg';
import turkey from '@/assets/food/turkey.jpg';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  popular?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  items: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: 'popular',
    name: 'Popular',
    items: [
      { id: 'p1', name: 'Classic Burger', price: 14.99, image: burger, description: 'Angus beef patty with lettuce, tomato, cheese', popular: true },
      { id: 'p2', name: 'Margherita Pizza', price: 16.99, image: pizza, description: 'Fresh mozzarella, tomato, basil', popular: true },
      { id: 'p3', name: 'Grilled Salmon', price: 24.99, image: salmon, description: 'Atlantic salmon with lemon butter', popular: true },
      { id: 'p4', name: 'Ribeye Steak', price: 32.99, image: steak, description: '12oz prime ribeye, grilled to perfection', popular: true },
    ]
  },
  {
    id: 'appetizers',
    name: 'Appetizers',
    items: [
      { id: 'a1', name: 'Grilled Asparagus', price: 9.99, image: asparagus, description: 'Fresh asparagus with garlic butter' },
      { id: 'a2', name: 'Soup of the Day', price: 7.99, image: soup, description: 'Chef\'s daily selection' },
      { id: 'a3', name: 'Garden Salad', price: 8.99, image: salad, description: 'Mixed greens with house dressing' },
      { id: 'a4', name: 'Garlic Shrimp', price: 13.99, image: shrimp, description: 'Sautéed shrimp in garlic butter' },
    ]
  },
  {
    id: 'pasta',
    name: 'Pasta',
    items: [
      { id: 'pa1', name: 'Fettuccini Alfredo', price: 17.99, image: fettuccini, description: 'Creamy parmesan sauce' },
      { id: 'pa2', name: 'Spaghetti Bolognese', price: 16.99, image: pasta, description: 'Classic meat sauce' },
      { id: 'pa3', name: 'Cheese Ravioli', price: 18.99, image: ravioli, description: 'Ricotta filled with marinara' },
      { id: 'pa4', name: 'Potato Gnocchi', price: 17.99, image: gnocchi, description: 'With brown butter and sage' },
    ]
  },
  {
    id: 'mains',
    name: 'Mains',
    items: [
      { id: 'm1', name: 'Chicken Parmesan', price: 21.99, image: chickenParmesan, description: 'Breaded chicken with marinara' },
      { id: 'm2', name: 'Grilled Chicken', price: 19.99, image: chickenBreast, description: 'Herb marinated breast' },
      { id: 'm3', name: 'BBQ Ribs', price: 26.99, image: ribs, description: 'Fall-off-the-bone tender' },
      { id: 'm4', name: 'Roasted Turkey', price: 22.99, image: turkey, description: 'With cranberry sauce' },
    ]
  },
  {
    id: 'seafood',
    name: 'Seafood',
    items: [
      { id: 's1', name: 'Seafood Platter', price: 34.99, image: seafood, description: 'Chef\'s selection of fresh catches' },
      { id: 's2', name: 'Grilled Salmon', price: 24.99, image: salmon, description: 'Atlantic salmon fillet' },
      { id: 's3', name: 'Jumbo Shrimp', price: 22.99, image: shrimp, description: 'Grilled with lemon herb butter' },
    ]
  },
  {
    id: 'sandwiches',
    name: 'Sandwiches',
    items: [
      { id: 'sw1', name: 'Chicken Panini', price: 13.99, image: panini, description: 'Grilled chicken with pesto' },
      { id: 'sw2', name: 'Classic Burger', price: 14.99, image: burger, description: 'Angus beef with all fixings' },
    ]
  },
  {
    id: 'sides',
    name: 'Sides',
    items: [
      { id: 'si1', name: 'Mac & Cheese', price: 6.99, image: macCheese, description: 'Creamy and cheesy' },
      { id: 'si2', name: 'Grilled Asparagus', price: 5.99, image: asparagus, description: 'With garlic butter' },
      { id: 'si3', name: 'Side Salad', price: 4.99, image: salad, description: 'Mixed greens' },
    ]
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    items: [
      { id: 'b1', name: 'Buttermilk Pancakes', price: 11.99, image: pancakes, description: 'Stack of three with maple syrup' },
    ]
  },
];

export const getAllItems = (): MenuItem[] => {
  return menuCategories.flatMap(category => category.items);
};

export const getItemsByCategory = (categoryId: string): MenuItem[] => {
  const category = menuCategories.find(c => c.id === categoryId);
  return category?.items || [];
};
