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
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {/* No Price / Discount button - Gray circular */}
        <button
          onClick={() => onDiscount?.()}
          className="w-10 h-10 flex items-center justify-center bg-[#6B6B6B] rounded-full transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.5 6V8.5M11.5 15.5V18M8.5 9.5L10 11M13 13L14.5 14.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7 17L17 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M11.5 8.5C12.5 8.5 13.5 9 13.5 10C13.5 11 12.5 11.5 11.5 11.5H9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.5 11.5H12C13 11.5 14 12 14 13C14 14 13 14.5 12 14.5H11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Clear button - Red circular */}
        <button
          onClick={onDelete}
          className="w-10 h-10 flex items-center justify-center bg-[#E53935] rounded-full transition-colors"
        >
          <span className="text-white text-lg font-bold">C</span>
        </button>
        
        {/* Fire button - Orange circular */}
        <button
          onClick={() => onFire?.()}
          className="w-10 h-10 flex items-center justify-center bg-[#F57C00] rounded-full transition-colors"
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
