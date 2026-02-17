import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';

const FloatingPanelsLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Floating Category Panels */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-3 rounded-2xl backdrop-blur-xl transition-all duration-300 whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-orange-500/90 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MenuItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group relative bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    </div>
    <div className="p-3">
      <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-1">
        <span className="text-orange-400 font-semibold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default FloatingPanelsLayout;
