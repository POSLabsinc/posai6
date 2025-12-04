import { useState, useRef } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableCartItemProps {
  children: React.ReactNode;
  onDelete: () => void;
}

const SwipeableCartItem = ({ children, onDelete }: SwipeableCartItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Only allow swipe left (negative values)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -80));
    } else {
      setTranslateX(Math.min(diff, 0));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to open or closed position
    if (translateX < -40) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -80));
    } else {
      setTranslateX(Math.min(diff, 0));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (translateX < -40) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (translateX < -40) {
        setTranslateX(-80);
      } else {
        setTranslateX(0);
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete button behind */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-600 flex items-center justify-center">
        <button
          onClick={onDelete}
          className="w-full h-full flex items-center justify-center hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Swipeable content */}
      <div
        className="relative bg-sidebar-accent transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCartItem;
