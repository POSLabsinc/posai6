import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, ChevronDown, Wine } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const BarMenuCollapsibleLayout = () => {
  const [openCategories, setOpenCategories] = useState<string[]>([menuCategories[0]?.id || 'popular']);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Bar Header */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-4 flex items-center gap-3">
        <Wine className="w-6 h-6 text-amber-300" />
        <h1 className="text-amber-100 text-xl font-bold">Bar Menu</h1>
      </div>

      {/* Collapsible Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-amber-950/50 to-black">
        {menuCategories.map((category) => (
          <Collapsible 
            key={category.id} 
            open={openCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <div className="bg-amber-900/30 backdrop-blur rounded-xl overflow-hidden border border-amber-700/20">
              <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-800/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-amber-100 font-semibold">{category.name}</span>
                  <span className="text-amber-300/60 text-sm">({category.items.length})</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-amber-300/60 transition-transform duration-300 ${
                  openCategories.includes(category.id) ? 'rotate-180' : ''
                }`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {category.items.map((item) => (
                      <BarMenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

const BarMenuItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-amber-900/40 backdrop-blur rounded-xl overflow-hidden hover:bg-amber-800/40 transition-all border border-amber-700/20">
    <div className="aspect-[4/3] overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-2.5">
      <h3 className="text-amber-100 font-medium text-sm truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-amber-300 font-bold text-sm">${item.price.toFixed(2)}</span>
        <button className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center hover:bg-amber-500 transition-colors">
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default BarMenuCollapsibleLayout;
