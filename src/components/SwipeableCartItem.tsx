import { useState, useRef } from "react";
import moneyOffIcon from "@/assets/icons/money-off.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import fireVectorIcon from "@/assets/icons/fire-vector.png";

interface SwipeableCartItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onDiscount?: () => void;
  onFire?: () => void;
}

const SwipeableCartItem = ({ children, onDelete, onDiscount, onFire }: SwipeableCartItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  // Width for 3 buttons
  const swipeWidth = -168;

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
      setTranslateX(Math.max(diff, swipeWidth));
    } else {
      setTranslateX(Math.min(diff, 0));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to open or closed position
    if (translateX < swipeWidth / 2) {
      setTranslateX(swipeWidth);
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
      setTranslateX(Math.max(diff, swipeWidth));
    } else {
      setTranslateX(Math.min(diff, 0));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (translateX < swipeWidth / 2) {
      setTranslateX(swipeWidth);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (translateX < swipeWidth / 2) {
        setTranslateX(swipeWidth);
      } else {
        setTranslateX(0);
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons behind */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 py-1">
        {/* No Price / Discount button - Gray circular */}
        <button
          onClick={() => onDiscount?.()}
          className="w-12 h-8 flex items-center justify-center bg-[#6B6B6B] rounded-full transition-colors"
        >
          <img src={moneyOffIcon} alt="Discount" className="w-5 h-5 invert" />
        </button>
        
        {/* Clear button - Red circular */}
        <button
          onClick={onDelete}
          className="w-12 h-8 flex items-center justify-center bg-[#E53935] rounded-full transition-colors"
        >
          <img src={clearCIcon} alt="Clear" className="w-4 h-4" />
        </button>
        
        {/* Fire button - Orange circular */}
        <button
          onClick={() => onFire?.()}
          className="w-12 h-8 flex items-center justify-center bg-[#F57C00] rounded-full transition-colors"
        >
          <img src={fireVectorIcon} alt="Fire" className="w-4 h-4" />
        </button>
      </div>

      {/* Swipeable content */}
      <div
        className="relative bg-sidebar-accent transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing rounded-lg"
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
        {/* Swipe hint bar - hides when swiping */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/20 rounded-r-lg transition-opacity duration-200"
          style={{ opacity: translateX < 0 ? 0 : 1 }}
        />
      </div>
    </div>
  );
};

export default SwipeableCartItem;
