import { useState } from 'react';
import { menuCategories, MenuItem } from '@/data/menuData';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const CardStackLayout = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'popular');

  const currentCategory = menuCategories.find(c => c.id === selectedCategory);
  const items = currentCategory?.items || [];

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Category Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setActiveIndex(0);
            }}
            className={`px-5 py-2 rounded-full transition-all whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 3D Card Stack */}
      <div className="flex-1 flex items-center justify-center relative">
        <button 
          onClick={prevCard}
          className="absolute left-4 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div className="relative w-72 h-96">
          {items.map((item, index) => {
            const offset = index - activeIndex;
            const isActive = index === activeIndex;
            
            return (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-500 ${
                  Math.abs(offset) > 2 ? 'opacity-0 pointer-events-none' : ''
                }`}
                style={{
                  transform: `translateX(${offset * 40}px) scale(${1 - Math.abs(offset) * 0.1}) rotateY(${offset * -5}deg)`,
                  zIndex: 10 - Math.abs(offset),
                  opacity: 1 - Math.abs(offset) * 0.3,
                }}
              >
                <StackCard item={item} isActive={isActive} />
              </div>
            );
          })}
        </div>

        <button 
          onClick={nextCard}
          className="absolute right-4 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? 'bg-orange-500 w-6' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const StackCard = ({ item, isActive }: { item: MenuItem; isActive: boolean }) => (
  <div className={`w-full h-full bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl transition-shadow ${
    isActive ? 'shadow-orange-500/20' : ''
  }`}>
    <div className="h-2/3 overflow-hidden">
      <img 
        src={item.image} 
        alt={item.name}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="p-4">
      <h3 className="text-white font-bold text-lg">{item.name}</h3>
      <p className="text-white/50 text-sm mt-1 line-clamp-2">{item.description}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-orange-400 font-bold text-xl">${item.price.toFixed(2)}</span>
        <button className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  </div>
);

export default CardStackLayout;
