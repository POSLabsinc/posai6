import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import grabberIcon from "@/assets/icons/grabber.png";

interface OrganizeCategoriesContentProps {
  categories: string[];
  onBack: (reorderedCategories: string[]) => void;
}

const OrganizeCategoriesContent = ({ categories, onBack }: OrganizeCategoriesContentProps) => {
  const [orderedCategories, setOrderedCategories] = useState<string[]>(categories);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...orderedCategories];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      setOrderedCategories(newOrder);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTouchStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const categoryItem = elements.find(el => el.getAttribute('data-category-index'));
    
    if (categoryItem) {
      const index = parseInt(categoryItem.getAttribute('data-category-index') || '-1', 10);
      if (index !== -1 && index !== draggedIndex) {
        setDragOverIndex(index);
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...orderedCategories];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      setOrderedCategories(newOrder);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleBack = () => {
    onBack(orderedCategories);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-center py-4 px-4 relative">
        <button
          onClick={handleBack}
          className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Organize Categories</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Instructions */}
        <div className="mb-4 px-1">
          <span className="text-neutral-500 text-sm">Drag and drop to reorder categories</span>
        </div>

        {/* Categories List */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {orderedCategories.map((category, index) => (
            <div
              key={`${category}-${index}`}
              data-category-index={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={() => handleTouchStart(index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`
                flex items-center gap-3 py-4 px-4 cursor-grab active:cursor-grabbing transition-all
                ${draggedIndex === index ? "opacity-50 bg-neutral-700/50" : ""}
                ${dragOverIndex === index ? "border-t-2 border-primary" : ""}
              `}
            >
              <img 
                src={grabberIcon} 
                alt="Drag handle" 
                className="w-5 h-5 opacity-50 pointer-events-none"
              />
              <span className="text-foreground text-base font-medium flex-1">{category}</span>
              <span className="text-neutral-500 text-sm">{index + 1}</span>
            </div>
          ))}
        </div>

        {orderedCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-neutral-500 text-base">No categories selected</span>
            <span className="text-neutral-600 text-sm mt-1">Select categories first to organize them</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizeCategoriesContent;
