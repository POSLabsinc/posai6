import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';

const TwoTierTabsLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  // Split categories into two rows
  const firstRowCategories = menuCategories.slice(0, 4);
  const secondRowCategories = menuCategories.slice(4);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Two-Tier Tabs */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {firstRowCategories.map((category) => (
            <TabButton 
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
        {secondRowCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {secondRowCategories.map((category) => (
              <TabButton 
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <TwoTierItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ category, isSelected, onClick }: { 
  category: { id: string; name: string; items: MenuItem[] }; 
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl backdrop-blur-xl transition-all whitespace-nowrap ${
      isSelected
        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
    }`}
  >
    {category.name}
  </button>
);

const TwoTierItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden hover:from-white/20 hover:to-white/10 transition-all">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

export default TwoTierTabsLayout;
