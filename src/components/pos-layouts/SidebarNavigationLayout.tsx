import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';

const SidebarNavigationLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 bg-white/5 backdrop-blur-xl rounded-2xl p-3 space-y-1 overflow-y-auto">
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-orange-500 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="font-medium text-sm">{category.name}</span>
            <span className="text-xs opacity-60 ml-2">({category.items.length})</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <SidebarItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const SidebarItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-white/15 transition-all">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-3">
      <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
      <p className="text-white/50 text-xs truncate mt-0.5">{item.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-orange-400 font-semibold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default SidebarNavigationLayout;
