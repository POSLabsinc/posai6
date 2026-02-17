import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';

const CardBasedGridLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Category Cards Row */}
      <div className="flex gap-3 mb-4 overflow-x-auto scrollbar-hide pb-2">
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-shrink-0 w-28 h-20 rounded-2xl overflow-hidden relative transition-all ${
              selectedCategory === category.id
                ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black'
                : 'hover:opacity-80'
            }`}
          >
            <img 
              src={category.items[0]?.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-medium text-sm">{category.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <CardGridItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CardGridItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-neutral-800/80 rounded-2xl overflow-hidden hover:bg-neutral-700/80 transition-all">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-3">
      <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-orange-400 font-bold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default CardBasedGridLayout;
