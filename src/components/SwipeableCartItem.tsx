import { useState, useRef } from "react";

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
  const swipeWidth = -144;

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
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        {/* No Price / Discount button - Gray */}
        <button
          onClick={() => onDiscount?.()}
          className="w-12 h-full flex items-center justify-center bg-[#6B6B6B] hover:bg-[#5a5a5a] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
            <path d="M9.5 7H11V11H13V7H14.5L12 4L9.5 7Z" fill="currentColor"/>
            <path d="M9.5 17H11V13H13V17H14.5L12 20L9.5 17Z" fill="currentColor"/>
            <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        
        {/* Clear button - Red */}
        <button
          onClick={onDelete}
          className="w-12 h-full flex items-center justify-center bg-[#E53935] hover:bg-[#d32f2f] transition-colors"
        >
          <span className="text-white text-xl font-bold">C</span>
        </button>
        
        {/* Fire button - Orange */}
        <button
          onClick={() => onFire?.()}
          className="w-12 h-full flex items-center justify-center bg-[#F57C00] hover:bg-[#ef6c00] transition-colors rounded-r-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
          </svg>
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
