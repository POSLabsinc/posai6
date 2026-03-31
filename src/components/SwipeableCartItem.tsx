import { useState, useRef, useEffect, useCallback } from "react";
import clearCIcon from "@/assets/icons/clear-c.png";
import fireVectorIcon from "@/assets/icons/fire-vector.png";
import noTaxIcon from "@/assets/icons/no-tax.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Minus, Plus } from "lucide-react";

interface SwipeableCartItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onFire?: () => void;
  onNoTax?: () => void;
  onOrderTypeChange?: (type: string) => void;
  itemOrderType?: string;
  isNoTax?: boolean;
  isFired?: boolean;
  isOpen?: boolean;
  onSwipeStart?: () => void;
  onRefire?: (quantity: number) => void;
  itemQuantity?: number;
  showFire?: boolean;
  showOrderType?: boolean;
}

const ORDER_TYPES = [
  "DINE IN",
  "TAKE OUT",
  "DELIVERY",
  "BANQUET",
  "DRIVE THRU",
  "CURB SIDE",
  "SCHEDULED",
  "PHONE-IN",
  "CUSTOM"
];

const LONG_PRESS_DURATION = 500; // 500ms for long press

const SwipeableCartItem = ({ 
  children, 
  onDelete, 
  onFire, 
  onNoTax,
  onOrderTypeChange,
  itemOrderType = "Dine In",
  isNoTax = false,
  isFired = false,
  isOpen,
  onSwipeStart,
  onRefire,
  itemQuantity = 1
}: SwipeableCartItemProps) => {
  const [internalTranslateX, setInternalTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showRefireControls, setShowRefireControls] = useState(false);
  const [refireQuantity, setRefireQuantity] = useState(1);
  const [isSelected, setIsSelected] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);
  
  // Use controlled state if provided, otherwise use internal state
  const translateX = isOpen === undefined ? internalTranslateX : (isOpen ? internalTranslateX : 0);
  const setTranslateX = (value: number) => {
    setInternalTranslateX(value);
  };
  
  // Reset when isOpen becomes false externally
  useEffect(() => {
    if (isOpen === false && internalTranslateX !== 0) {
      setInternalTranslateX(0);
    }
  }, [isOpen]);

  // Clear long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleLongPress = useCallback(() => {
    if (!hasMoved.current) {
      setShowRefireControls(true);
      setIsSelected(true);
      setRefireQuantity(1);
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startLongPressTimer = useCallback(() => {
    clearLongPressTimer();
    hasMoved.current = false;
    longPressTimer.current = setTimeout(handleLongPress, LONG_PRESS_DURATION);
  }, [clearLongPressTimer, handleLongPress]);

  // Width for buttons on each side - responsive values
  const rightSwipeWidth = -80; // 2 buttons on right (swipe left to reveal) - reduced for tablet
  const leftSwipeWidth = 130; // buttons on left (swipe right to reveal) - reduced for tablet

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
    hasMoved.current = false;
    startLongPressTimer();
    onSwipeStart?.();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // If moved more than 5px, cancel long press
    if (Math.abs(diff) > 5) {
      hasMoved.current = true;
      clearLongPressTimer();
    }
    
    // Allow swipe in both directions
    setTranslateX(Math.max(rightSwipeWidth, Math.min(diff, leftSwipeWidth)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    clearLongPressTimer();
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
    hasMoved.current = false;
    startLongPressTimer();
    onSwipeStart?.();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    
    // If moved more than 5px, cancel long press
    if (Math.abs(diff) > 5) {
      hasMoved.current = true;
      clearLongPressTimer();
    }
    
    setTranslateX(Math.max(rightSwipeWidth, Math.min(diff, leftSwipeWidth)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    clearLongPressTimer();
    if (translateX < rightSwipeWidth / 2) {
      setTranslateX(rightSwipeWidth);
    } else if (translateX > leftSwipeWidth / 2) {
      setTranslateX(leftSwipeWidth);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    clearLongPressTimer();
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

  const handleQuantityDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRefireQuantity(prev => Math.max(1, prev - 1));
  };

  const handleQuantityIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRefireQuantity(prev => prev + 1);
  };

  const handleCheckboxToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSelected) {
      setIsSelected(false);
      setShowRefireControls(false);
    } else {
      setIsSelected(true);
    }
  };

  // Check if buttons should be visible based on swipe position
  const showLeftButtons = translateX > 20;
  const showRightButtons = translateX < -20;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left side action buttons (revealed when swiping right) */}
      <div 
        className={`absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 py-1 transition-opacity duration-150 ${
          showLeftButtons ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* No Tax button */}
        <button
          onClick={() => onNoTax?.()}
          className={`px-2 h-6 flex items-center justify-center rounded-full transition-colors text-[10px] font-medium ${
            isNoTax ? 'text-black' : 'text-white'
          }`}
          style={{ 
            background: isNoTax 
              ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' 
              : '#666666' 
          }}
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
      <div 
        className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 py-1 transition-opacity duration-150 ${
          showRightButtons ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Clear button - Red */}
        <button
          onClick={onDelete}
          className="w-9 h-6 flex items-center justify-center bg-red-500 rounded-full transition-colors"
        >
          <img src={clearCIcon} alt="Clear" className="w-3 h-3" />
        </button>
        
        {/* Fire button - Orange gradient, changes when fired */}
        <button
          onClick={() => onFire?.()}
          className={`w-9 h-6 flex items-center justify-center rounded-full transition-colors ${
            isFired ? 'ring-2 ring-orange-400' : ''
          }`}
          style={{ 
            background: isFired 
              ? 'linear-gradient(180deg, #FF5E00 0%, #CC4A00 100%)' 
              : 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' 
          }}
        >
          <img src={fireVectorIcon} alt="Fire" className={`w-3 h-3 ${isFired ? 'animate-pulse' : ''}`} />
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

      {/* Refire quantity controls - shown below item after long press */}
      {showRefireControls && (
        <div className="flex items-center gap-2 mt-1 pl-1 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={handleCheckboxToggle}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              isSelected 
                ? 'bg-white border-white' 
                : 'bg-transparent border-neutral-500'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          {isSelected && (
            <div 
              className="flex items-center rounded-full h-7 px-1"
              style={{ background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)' }}
            >
              <button
                onClick={handleQuantityDecrease}
                className="w-6 h-6 flex items-center justify-center text-[#FF6B35] hover:text-[#FF8555] transition-colors disabled:opacity-50"
                disabled={refireQuantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-white text-sm font-medium">{refireQuantity}</span>
              <button
                onClick={handleQuantityIncrease}
                className="w-6 h-6 flex items-center justify-center text-white hover:text-neutral-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SwipeableCartItem;
