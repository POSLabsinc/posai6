import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';

const TwoRowHorizontalTabsLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  // Split into two rows
  const midpoint = Math.ceil(menuCategories.length / 2);
  const firstRow = menuCategories.slice(0, midpoint);
  const secondRow = menuCategories.slice(midpoint);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Two Row Tabs */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 mb-4 space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {firstRow.map((category) => (
            <TabPill
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {secondRow.map((category) => (
            <TabPill
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <TwoRowItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TabPill = ({ category, isSelected, onClick }: { 
  category: { id: string; name: string }; 
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap text-sm font-medium ${
      isSelected
        ? 'bg-orange-500 text-white'
        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
    }`}
  >
    {category.name}
  </button>
);

const TwoRowItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden hover:bg-white/15 transition-all">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-2.5">
      <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-orange-400 font-semibold text-sm">${item.price.toFixed(2)}</span>
        <button className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default TwoRowHorizontalTabsLayout;
