import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, Flame } from 'lucide-react';

const FloatingTabBarLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex flex-col">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <FloatingTabItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Floating Tab Bar */}
      <div className="sticky bottom-0 px-4 pb-4">
        <div className="bg-black/60 backdrop-blur-2xl rounded-full px-2 py-2 flex gap-1 overflow-x-auto scrollbar-hide mx-auto max-w-fit">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {category.id === 'popular' && <Flame className="w-4 h-4" />}
              <span className="font-medium text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const FloatingTabItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden hover:bg-white/15 transition-all duration-300">
    {item.popular && (
      <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <Flame className="w-3 h-3" /> Popular
      </div>
    )}
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    </div>
    <div className="p-4">
      <h3 className="text-white font-semibold truncate">{item.name}</h3>
      <p className="text-white/50 text-sm truncate mt-1">{item.description}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-orange-400 font-bold text-lg">${item.price.toFixed(2)}</span>
        <button className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default FloatingTabBarLayout;
