import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, ChevronDown } from 'lucide-react';

const ExpandableCategoryGridLayout = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(menuCategories[0]?.id || 'popular');

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {menuCategories.map((category) => {
          const isExpanded = expandedCategory === category.id;
          
          return (
            <div 
              key={category.id}
              className={`${isExpanded ? 'col-span-full' : ''} transition-all duration-300`}
            >
              {/* Category Card */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className={`w-full rounded-2xl overflow-hidden relative transition-all ${
                  isExpanded 
                    ? 'h-32 mb-3' 
                    : 'aspect-[4/3] hover:opacity-90'
                }`}
              >
                <img 
                  src={category.items[0]?.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className={`absolute inset-0 ${isExpanded ? 'bg-gradient-to-r from-black/80 to-black/40' : 'bg-black/50'}`} />
                <div className={`absolute inset-0 flex items-center ${isExpanded ? 'justify-start px-6' : 'justify-center'}`}>
                  <div className={isExpanded ? 'text-left' : 'text-center'}>
                    <span className={`text-white font-bold ${isExpanded ? 'text-2xl' : 'text-lg'}`}>{category.name}</span>
                    {isExpanded && (
                      <p className="text-white/60 text-sm mt-1">{category.items.length} items</p>
                    )}
                  </div>
                </div>
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Expanded Items */}
              {isExpanded && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {category.items.map((item) => (
                    <ExpandableItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ExpandableItemCard = ({ item }: { item: MenuItem }) => (
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

export default ExpandableCategoryGridLayout;
