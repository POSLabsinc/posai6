import { useState, useRef } from "react";
import { Archive } from "lucide-react";

interface SwipeableTaxItemProps {
  children: React.ReactNode;
  onTap: () => void;
  onArchive: () => void;
  isArchived?: boolean;
}

const SwipeableTaxItem = ({ 
  children, 
  onTap, 
  onArchive,
  isArchived = false
}: SwipeableTaxItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const hasMoved = useRef(false);

  // Width for single archive button on right side (swipe left to reveal)
  const swipeWidth = -56;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (Math.abs(diff) > 5) {
      hasMoved.current = true;
    }
    // Only allow swipe left (negative values)
    setTranslateX(Math.max(swipeWidth, Math.min(diff, 0)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If no significant movement, treat as tap
    if (!hasMoved.current && translateX === 0) {
      onTap();
      return;
    }
    // Snap to open or closed position
    if (translateX < swipeWidth / 2) {
      setTranslateX(swipeWidth);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if (Math.abs(diff) > 5) {
      hasMoved.current = true;
    }
    setTranslateX(Math.max(swipeWidth, Math.min(diff, 0)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // If no significant movement, treat as tap
    if (!hasMoved.current && translateX === 0) {
      onTap();
      return;
    }
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

  const handleAction = (action: () => void) => {
    action();
    setTranslateX(0);
  };

  // Only show buttons when swiping
  const isRevealed = translateX < 0;

  return (
    <div className="relative overflow-hidden">
      {/* Right side action buttons (revealed when swiping left) */}
      {isRevealed && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          {/* Archive button */}
          <button
            onClick={() => handleAction(onArchive)}
            className="w-14 h-full flex items-center justify-center bg-neutral-500 transition-colors active:opacity-70"
          >
            <Archive className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Swipeable content */}
      <div
        className="relative bg-transparent cursor-grab active:cursor-grabbing"
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

export default SwipeableTaxItem;
