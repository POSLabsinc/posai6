import { useState } from "react";
import SwipeableRefundItem, { SwipeableModifier } from "@/components/SwipeableRefundItem";

// Modifier interface for rich modifier data
export interface ModifierItem {
  text: string;
  type: 'add' | 'remove' | 'default' | 'side';
  price?: number;
}

export const formatPrice = (price: number) => `$${price.toFixed(2)}`;

// Helper component to render modifier tree (non-swipeable version for desktop/tablet)
export const ModifierTree = ({ modifiers, defaultExpanded = true }: { modifiers: ModifierItem[]; defaultExpanded?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!modifiers || modifiers.length === 0) return null;
  
  const visibleModifiers = isExpanded ? modifiers : modifiers.slice(0, 2);
  const hasMore = modifiers.length > 2;
  
  return (
    <div className="mt-1.5 ml-1">
      {visibleModifiers.map((mod, i) => {
        const isLast = isExpanded ? i === modifiers.length - 1 : (i === visibleModifiers.length - 1 && !hasMore);
        // Get prefix based on type
        let prefix = '•';
        if (mod.type === 'remove') prefix = '-';
        else if (mod.type === 'add') prefix = '+';
        
        return (
          <div key={i} className="flex items-center text-xs h-5">
            {/* Tree connector */}
            <div className="relative w-4 h-full flex-shrink-0">
              {/* Vertical line - extends from top to bottom (or middle for last item) */}
              <div 
                className="absolute left-0 w-px bg-white/30"
                style={{ 
                  top: i === 0 ? '0' : '-2px',
                  height: isLast ? '50%' : 'calc(100% + 2px)'
                }}
              />
              {/* Horizontal connector - from vertical line to text */}
              <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
            </div>
            {/* Prefix and modifier text */}
            <div className="flex items-center flex-1 min-w-0">
              <span className="mr-1.5 text-white/40 w-2 text-center flex-shrink-0">{prefix}</span>
              <span className={`truncate ${mod.type === 'remove' ? 'text-white/40' : 'text-white/50'}`}>
                {mod.text}
              </span>
              {mod.price && mod.price > 0 && (
                <span className="ml-auto pl-2 text-white/60 flex-shrink-0">{formatPrice(mod.price)}</span>
              )}
            </div>
          </div>
        );
      })}
      {/* Expand/Collapse toggle */}
      {hasMore && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs h-5 text-white/50 hover:text-white/70 transition-colors"
        >
          <div className="relative w-4 h-full flex-shrink-0">
            <div className="absolute left-0 w-px bg-white/30" style={{ top: '-2px', height: '50%' }} />
            <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
          </div>
          <span className="ml-1.5">
            {isExpanded ? 'Show less' : `Show more (+${modifiers.length - 2})`}
          </span>
        </button>
      )}
    </div>
  );
};

// Swipeable modifier tree for paid tickets (desktop/tablet with expand/collapse)
export interface SwipeableModifierTreeDesktopProps {
  modifiers: ModifierItem[];
  onModifierRefund: (modifier: ModifierItem, index: number) => void;
  refundedItems?: Set<string>;
  itemIndex?: number;
  defaultExpanded?: boolean;
}

export const SwipeableModifierTreeDesktop = ({ modifiers, onModifierRefund, refundedItems, itemIndex, defaultExpanded = true }: SwipeableModifierTreeDesktopProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!modifiers || modifiers.length === 0) return null;
  
  const visibleModifiers = isExpanded ? modifiers : modifiers.slice(0, 2);
  const hasMore = modifiers.length > 2;
  
  return (
    <div className="mt-1.5">
      {visibleModifiers.map((mod, i) => {
        const actualIndex = modifiers.indexOf(mod);
        const isRefunded = refundedItems?.has(`mod-${itemIndex}-${actualIndex}-${mod.text}`) ?? false;
        const isLast = isExpanded ? i === modifiers.length - 1 : (i === visibleModifiers.length - 1 && !hasMore);
        return (
          <SwipeableModifier
            key={i}
            modifier={mod}
            index={actualIndex}
            isLast={isLast}
            onRefund={onModifierRefund}
            formatPrice={formatPrice}
            isRefunded={isRefunded}
          />
        );
      })}
      {/* Expand/Collapse toggle */}
      {hasMore && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs h-5 text-white/50 hover:text-white/70 transition-colors"
        >
          <div className="relative w-4 h-full flex-shrink-0">
            <div className="absolute left-0 w-px bg-white/30" style={{ top: '-2px', height: '50%' }} />
            <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
          </div>
          <span className="ml-1.5">
            {isExpanded ? 'Show less' : `Show more (+${modifiers.length - 2})`}
          </span>
        </button>
      )}
    </div>
  );
};

// Swipeable modifier tree for paid tickets (mobile only - with expand/collapse)
export interface SwipeableModifierTreeProps {
  modifiers: ModifierItem[];
  onModifierRefund: (modifier: ModifierItem, index: number) => void;
  refundedItems?: Set<string>;
  itemIndex?: number;
  defaultExpanded?: boolean;
}

export const SwipeableModifierTree = ({ modifiers, onModifierRefund, refundedItems, itemIndex, defaultExpanded = true }: SwipeableModifierTreeProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!modifiers || modifiers.length === 0) return null;
  
  const visibleModifiers = isExpanded ? modifiers : modifiers.slice(0, 2);
  const hasMore = modifiers.length > 2;
  
  return (
    <div className="mt-1.5">
      {visibleModifiers.map((mod, i) => {
        const actualIndex = modifiers.indexOf(mod);
        const isRefunded = refundedItems?.has(`mod-${itemIndex}-${actualIndex}-${mod.text}`) ?? false;
        const isLast = isExpanded ? i === modifiers.length - 1 : (i === visibleModifiers.length - 1 && !hasMore);
        return (
          <SwipeableModifier
            key={i}
            modifier={mod}
            index={actualIndex}
            isLast={isLast}
            onRefund={onModifierRefund}
            formatPrice={formatPrice}
            isRefunded={isRefunded}
          />
        );
      })}
      {/* Expand/Collapse toggle */}
      {hasMore && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs h-5 text-white/50 hover:text-white/70 transition-colors"
        >
          <div className="relative w-4 h-full flex-shrink-0">
            <div className="absolute left-0 w-px bg-white/30" style={{ top: '-2px', height: '50%' }} />
            <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
          </div>
          <span className="ml-1.5">
            {isExpanded ? 'Show less' : `Show more (+${modifiers.length - 2})`}
          </span>
        </button>
      )}
    </div>
  );
};
