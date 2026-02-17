import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';

const GlassPillDrawerLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex flex-col">
      {/* Pill Drawer at Top */}
      <div className="bg-white/5 backdrop-blur-xl rounded-b-3xl px-4 py-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full transition-all duration-300 whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <PillDrawerItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PillDrawerItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden hover:from-white/20 hover:to-white/10 transition-all duration-300">
    <div className="aspect-square overflow-hidden relative">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="p-3">
      <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-orange-400 font-bold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center hover:shadow-lg hover:shadow-orange-500/30 transition-all">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default GlassPillDrawerLayout;
