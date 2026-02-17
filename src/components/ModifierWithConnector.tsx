import { useState } from "react";

interface ModifierItem {
  text: string;
  type?: 'add' | 'remove' | 'default' | 'side';
  price?: number;
}

interface ModifierWithConnectorProps {
  modifier: string | ModifierItem;
  index: number;
  isLast: boolean;
  formatPrice?: (price: number) => string;
  size?: 'sm' | 'xs';
}

// Single modifier row with elbow connector
export const ModifierWithConnector = ({
  modifier,
  index,
  isLast,
  formatPrice = (p) => `$${p.toFixed(2)}`,
  size = 'xs'
}: ModifierWithConnectorProps) => {
  // Handle both string and object modifiers
  const isObject = typeof modifier === 'object';
  const text = isObject ? modifier.text : modifier;
  const type = isObject ? modifier.type : 'default';
  const price = isObject ? modifier.price : undefined;

  // Get prefix based on type
  let prefix = '•';
  if (type === 'remove' || text.startsWith('-') || text.startsWith('No ')) prefix = '-';
  else if (type === 'add' || text.startsWith('+') || text.startsWith('Add ') || text.startsWith('W/')) prefix = '+';
  else if (type === 'side' || text.startsWith('Side:')) prefix = '•';

  const textSizeClass = size === 'sm' ? 'text-sm' : 'text-xs';
  const heightClass = size === 'sm' ? 'h-6' : 'h-5';

  return (
    <div className={`flex items-center ${textSizeClass} ${heightClass}`}>
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
      <div className="flex items-center flex-1 min-w-0">
        <span className="mr-1.5 text-white/40 w-2 text-center flex-shrink-0">{prefix}</span>
        <span className={`truncate ${type === 'remove' ? 'text-white/40' : 'text-white/50'}`}>
          {text}
        </span>
        {price && price > 0 && (
          <span className="ml-auto pl-2 text-white/60 flex-shrink-0">{formatPrice(price)}</span>
        )}
      </div>
    </div>
  );
};

interface SimpleModifierTreeProps {
  modifiers: (string | ModifierItem)[];
  formatPrice?: (price: number) => string;
  size?: 'sm' | 'xs';
  className?: string;
  defaultExpanded?: boolean;
}

// Simple modifier tree with elbow connectors and expand/collapse
export const SimpleModifierTree = ({
  modifiers,
  formatPrice,
  size = 'xs',
  className = '',
  defaultExpanded = true
}: SimpleModifierTreeProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!modifiers || modifiers.length === 0) return null;

  const maxVisible = 2;
  const hasMore = modifiers.length > maxVisible;
  const visibleModifiers = isExpanded ? modifiers : modifiers.slice(0, maxVisible);
  const remainingCount = modifiers.length - maxVisible;

  const textSizeClass = size === 'sm' ? 'text-sm' : 'text-xs';
  const heightClass = size === 'sm' ? 'h-6' : 'h-5';

  return (
    <div className={`mt-1.5 ml-1 ${className}`}>
      {visibleModifiers.map((mod, i) => (
        <ModifierWithConnector
          key={i}
          modifier={mod}
          index={i}
          isLast={isExpanded ? i === modifiers.length - 1 : (i === visibleModifiers.length - 1 && !hasMore)}
          formatPrice={formatPrice}
          size={size}
        />
      ))}
      {/* Expand/Collapse toggle */}
      {hasMore && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center ${textSizeClass} ${heightClass} text-white/50 hover:text-white/70 transition-colors`}
        >
          <div className="relative w-4 h-full flex-shrink-0">
            <div className="absolute left-0 w-px bg-white/30" style={{ top: '-2px', height: '50%' }} />
            <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
          </div>
          <span className="ml-1.5">
            {isExpanded ? 'Show less' : `Show more (+${remainingCount})`}
          </span>
        </button>
      )}
    </div>
  );
};

export default SimpleModifierTree;
