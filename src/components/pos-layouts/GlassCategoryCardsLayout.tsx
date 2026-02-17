import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, ArrowLeft } from 'lucide-react';

const GlassCategoryCardsLayout = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);

  if (selectedCategory && currentCategory) {
    return (
      <div className="h-full flex flex-col p-4">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Categories</span>
        </button>

        {/* Category Title */}
        <h2 className="text-2xl font-bold text-white mb-4">{currentCategory.name}</h2>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentCategory.items.map((item) => (
              <CategoryItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl hover:bg-white/15 transition-all"
          >
            {/* Category Preview Image */}
            <img 
              src={category.items[0]?.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg">{category.name}</h3>
              <p className="text-white/60 text-sm">{category.items.length} items</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const CategoryItemCard = ({ item }: { item: MenuItem }) => (
  <div className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-white/15 transition-all">
    <div className="aspect-square overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-3">
      <h3 className="text-white font-medium truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-orange-400 font-bold">${item.price.toFixed(2)}</span>
        <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default GlassCategoryCardsLayout;
