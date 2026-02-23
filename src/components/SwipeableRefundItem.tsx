import { useState, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface ModifierItem {
  text: string;
  type: 'add' | 'remove' | 'default' | 'side';
  price?: number;
}

interface SwipeableRefundItemProps {
  children: React.ReactNode;
  onRefund: () => void;
  label?: string;
  isModifier?: boolean;
  disabled?: boolean;
  embedded?: boolean;
  containerClassName?: string; // Override default rounding on outer container (e.g. 'rounded-t-xl' for cards with connected modifiers)
}

const SwipeableRefundItem = ({ 
  children, 
  onRefund, 
  label = "Refund",
  isModifier = false,
  disabled = false,
  embedded = false,
  containerClassName
}: SwipeableRefundItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Swipe width - reveals refund button
  const swipeWidth = isModifier ? -70 : -90;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.stopPropagation();
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    currentX.current = e.touches[0].clientX;
    const diffX = currentX.current - startX.current;
    const diffY = e.touches[0].clientY - startY.current;
    
    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }
    
    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      e.stopPropagation();
      // Only allow left swipe (negative values)
      const newTranslate = Math.max(swipeWidth, Math.min(diffX, 0));
      setTranslateX(newTranslate);
    }
  }, [isDragging, disabled, swipeWidth]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setIsDragging(false);
    isHorizontalSwipe.current = null;
    
    // Snap to open or closed position
    if (translateX < swipeWidth / 2) {
      setTranslateX(swipeWidth);
    } else {
      setTranslateX(0);
    }
  }, [translateX, swipeWidth, disabled]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    startX.current = e.clientX;
    setIsDragging(true);
  }, [disabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    e.stopPropagation();
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    setTranslateX(Math.max(swipeWidth, Math.min(diff, 0)));
  }, [isDragging, disabled, swipeWidth]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setIsDragging(false);
    if (translateX < swipeWidth / 2) {
      setTranslateX(swipeWidth);
    } else {
      setTranslateX(0);
    }
  }, [translateX, swipeWidth, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging && !disabled) {
      setIsDragging(false);
      if (translateX < swipeWidth / 2) {
        setTranslateX(swipeWidth);
      } else {
        setTranslateX(0);
      }
    }
  }, [isDragging, translateX, swipeWidth, disabled]);

  const handleRefundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRefund();
    setTranslateX(0);
    toast({
      title: isModifier ? "Modifier Refund Initiated" : "Item Refund Initiated",
      description: `${label} has been queued for refund`,
    });
  };

  if (disabled) {
    return <>{children}</>;
  }

  const outerRounding = containerClassName || (isModifier || embedded ? '' : 'rounded-xl');

  return (
    <div className={`relative overflow-hidden ${outerRounding}`}>
      {/* Refund action button - positioned behind the content, revealed when swiping left */}
      <div 
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center"
        style={{ 
          opacity: translateX < 0 ? 1 : 0,
          transition: 'opacity 0.15s ease-out'
        }}
      >
        <button
          onClick={handleRefundClick}
          className={`flex items-center justify-center rounded-full transition-all active:scale-95 font-medium text-white ${
            isModifier 
              ? 'px-2.5 h-6 text-[10px]' 
              : 'px-3 h-7 text-xs'
          }`}
          style={{ 
            background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)",
          }}
        >
          Refund
        </button>
      </div>

      {/* Swipeable content */}
      <div
        className={`relative transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing ${
          isModifier || embedded ? '' : 'bg-[#1B1C20] rounded-xl'
        }`}
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
        {/* Swipe indicator - red vertical bar at the edge */}
        <div 
          className={`absolute top-0 bottom-0 bg-destructive/80 transition-opacity duration-200 ${
            isModifier ? 'right-0 w-1 rounded-full' : 'right-0 w-1.5 rounded-r-xl'
          }`}
          style={{ opacity: translateX === 0 ? 1 : 0 }}
        />
      </div>
    </div>
  );
};

// Helper component for rendering swipeable modifier rows
interface SwipeableModifierProps {
  modifier: ModifierItem;
  index: number;
  isLast: boolean;
  onRefund: (modifier: ModifierItem, index: number) => void;
  formatPrice: (price: number) => string;
  isRefunded?: boolean;
}

export const SwipeableModifier = ({ 
  modifier, 
  index, 
  isLast, 
  onRefund,
  formatPrice,
  isRefunded = false
}: SwipeableModifierProps) => {
  let prefix = '•';
  if (modifier.type === 'remove') prefix = '-';
  else if (modifier.type === 'add') prefix = '+';
  
  // Only add-ons with price are swipeable for refund (and not already refunded)
  const isSwipeable = modifier.type === 'add' && modifier.price && modifier.price > 0 && !isRefunded;

  const modifierContent = (
    <div className={`flex items-center text-xs h-5 ${isRefunded ? 'opacity-50' : ''}`}>
      {/* Tree connector */}
      <div className="relative w-4 h-full flex-shrink-0">
        {/* Vertical line - extends from top to bottom (or middle for last item) */}
        <div 
          className="absolute left-0 w-px bg-white/30"
          style={{ 
            top: index === 0 ? '0' : '-2px',
            height: isLast ? '50%' : 'calc(100% + 2px)'
          }}
        />
        {/* Horizontal connector - from vertical line to text */}
        <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
      </div>
      {/* Prefix and modifier text */}
      <div className="flex items-center flex-1 min-w-0 bg-transparent">
        <span className="mr-1.5 text-white/40 w-2 text-center flex-shrink-0">{prefix}</span>
        <span className={`truncate ${isRefunded ? 'line-through text-white/40' : modifier.type === 'remove' ? 'text-white/40' : 'text-white/50'}`}>
          {modifier.text}
        </span>
        {modifier.price && modifier.price > 0 && (
          <span className={`ml-auto pl-2 flex-shrink-0 ${isRefunded ? 'line-through text-white/40' : 'text-white/60'}`}>
            {formatPrice(modifier.price)}
          </span>
        )}
      </div>
    </div>
  );

  // Wrap swipeable add-ons with SwipeableRefundItem (only if not refunded)
  if (isSwipeable) {
    return (
      <SwipeableRefundItem
        onRefund={() => onRefund(modifier, index)}
        label={modifier.text}
        isModifier={true}
      >
        {modifierContent}
      </SwipeableRefundItem>
    );
  }

  return modifierContent;
};

export default SwipeableRefundItem;
