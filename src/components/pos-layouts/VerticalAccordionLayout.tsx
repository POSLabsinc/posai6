import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const VerticalAccordionLayout = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(menuCategories[0]?.id || 'popular');

  return (
    <div className="h-full flex p-4 gap-4">
      {/* Vertical Accordion Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
        {menuCategories.map((category) => (
          <Collapsible 
            key={category.id} 
            open={openCategory === category.id}
            onOpenChange={(open) => setOpenCategory(open ? category.id : null)}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden">
              <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                <span className="text-white font-medium">{category.name}</span>
                <ChevronRight className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                  openCategory === category.id ? 'rotate-90' : ''
                }`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-1">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      className="w-full px-3 py-2 rounded-lg text-left text-white/70 text-sm hover:bg-white/10 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-orange-400 text-xs">${item.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {openCategory && menuCategories.find(c => c.id === openCategory)?.items.map((item) => (
            <VerticalAccordionItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const VerticalAccordionItemCard = ({ item }: { item: MenuItem }) => (
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
        <span className="text-orange-400 font-bold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default VerticalAccordionLayout;
