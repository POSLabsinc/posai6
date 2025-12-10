import { useState, useRef } from "react";
import clearCIcon from "@/assets/icons/clear-c.png";
import fireVectorIcon from "@/assets/icons/fire-vector.png";
import noTaxIcon from "@/assets/icons/no-tax.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface SwipeableCartItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onFire?: () => void;
  onNoTax?: () => void;
  onOrderTypeChange?: (type: string) => void;
  itemOrderType?: string;
}

const ORDER_TYPES = [
  "Dine In",
  "TAKE OUT",
  "DELIVERY",
  "BANQUET",
  "DRIVE THRU",
  "CURB SIDE",
  "SCHEDULED",
  "PHONE-IN",
  "CUSTOM"
];

const SwipeableCartItem = ({ 
  children, 
  onDelete, 
  onFire, 
  onNoTax,
  onOrderTypeChange,
  itemOrderType = "Dine In"
}: SwipeableCartItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  // Width for buttons on each side - responsive values
  const rightSwipeWidth = -80; // 2 buttons on right (swipe left to reveal) - reduced for tablet
  const leftSwipeWidth = 130; // buttons on left (swipe right to reveal) - reduced for tablet

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Allow swipe in both directions
    setTranslateX(Math.max(rightSwipeWidth, Math.min(diff, leftSwipeWidth)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to open or closed position
    if (translateX < rightSwipeWidth / 2) {
      setTranslateX(rightSwipeWidth);
    } else if (translateX > leftSwipeWidth / 2) {
      setTranslateX(leftSwipeWidth);
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
    setTranslateX(Math.max(rightSwipeWidth, Math.min(diff, leftSwipeWidth)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (translateX < rightSwipeWidth / 2) {
      setTranslateX(rightSwipeWidth);
    } else if (translateX > leftSwipeWidth / 2) {
      setTranslateX(leftSwipeWidth);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (translateX < rightSwipeWidth / 2) {
        setTranslateX(rightSwipeWidth);
      } else if (translateX > leftSwipeWidth / 2) {
        setTranslateX(leftSwipeWidth);
      } else {
        setTranslateX(0);
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left side action buttons (revealed when swiping right) */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 py-1">
        {/* No Tax button */}
        <button
          onClick={() => onNoTax?.()}
          className="px-2 h-6 flex items-center justify-center rounded-full transition-colors text-[10px] font-medium text-white"
          style={{ backgroundColor: '#666666' }}
        >
          No Tax
        </button>
        
        {/* Order Type Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="px-2 h-6 flex items-center gap-0.5 rounded-full transition-colors text-[10px] font-medium text-black"
              style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
            >
              {itemOrderType}
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="bg-neutral-800 border-neutral-700 z-50 min-w-[100px]"
            align="start"
          >
            {ORDER_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onOrderTypeChange?.(type)}
                className="text-white hover:bg-neutral-700 cursor-pointer text-xs"
              >
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side action buttons (revealed when swiping left) */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 py-1">
        {/* Clear button - Red */}
        <button
          onClick={onDelete}
          className="w-9 h-6 flex items-center justify-center bg-red-500 rounded-full transition-colors"
        >
          <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
        </button>
        
        {/* Fire button - Orange gradient */}
        <button
          onClick={() => onFire?.()}
          className="w-9 h-6 flex items-center justify-center rounded-full transition-colors"
          style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
        >
          <img src={fireVectorIcon} alt="Fire" className="w-3 h-3" />
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
        {/* Swipe hint bars */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/20 rounded-r-lg transition-opacity duration-200"
          style={{ opacity: translateX !== 0 ? 0 : 1 }}
        />
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 rounded-l-lg transition-opacity duration-200"
          style={{ opacity: translateX !== 0 ? 0 : 1 }}
        />
      </div>
    </div>
  );
};

export default SwipeableCartItem;
