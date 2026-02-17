import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { ChevronDown, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const GlassAccordionLayout = () => {
  const [openCategories, setOpenCategories] = useState<string[]>([menuCategories[0]?.id || 'popular']);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {menuCategories.map((category) => (
        <Collapsible 
          key={category.id} 
          open={openCategories.includes(category.id)}
          onOpenChange={() => toggleCategory(category.id)}
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{category.name}</span>
                <span className="text-white/50 text-sm">({category.items.length})</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-white/60 transition-transform duration-300 ${
                openCategories.includes(category.id) ? 'rotate-180' : ''
              }`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {category.items.map((item) => (
                  <AccordionItemCard key={item.id} item={item} />
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
};

const AccordionItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all">
    <div className="aspect-[4/3] overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-2.5">
      <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-1">
        <span className="text-orange-400 font-semibold text-sm">${item.price.toFixed(2)}</span>
        <button className="w-6 h-6 rounded-full bg-orange-500/80 flex items-center justify-center hover:bg-orange-500 transition-colors">
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default GlassAccordionLayout;
