import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MorphingPanelLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Category Selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`relative px-6 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap ${
              selectedCategory === category.id
                ? 'text-white'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            {selectedCategory === category.id && (
              <motion.div 
                layoutId="morphing-bg"
                className="absolute inset-0 bg-orange-500 rounded-2xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Items with Animation */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <MorphingItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const MorphingItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-white/15 transition-all hover:scale-[1.02]">
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
        <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default MorphingPanelLayout;
