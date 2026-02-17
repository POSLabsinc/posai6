import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, Utensils } from 'lucide-react';

const FoodTruckSidebarLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex">
      {/* Food Truck Style Sidebar */}
      <div className="w-20 md:w-24 flex-shrink-0 bg-gradient-to-b from-orange-600 to-orange-700 flex flex-col items-center py-4 gap-2">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <Utensils className="w-6 h-6 text-white" />
        </div>
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              selectedCategory === category.id
                ? 'bg-white text-orange-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="text-[10px] md:text-xs font-medium text-center leading-tight px-1 truncate w-full">
              {category.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-white text-xl font-bold mb-4">{currentCategory?.name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <FoodTruckItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FoodTruckItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-3 bg-white">
      <h3 className="text-gray-800 font-semibold text-sm truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-orange-600 font-bold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default FoodTruckSidebarLayout;
