import { useState, useRef, useEffect, useCallback } from "react";
import clearCIcon from "@/assets/icons/clear-c.png";

interface SwipeableTicketItemProps {
  children: React.ReactNode;
  onNoTax?: () => void;
  onCancel?: () => void;
  isNoTax?: boolean;
  isCancelled?: boolean;
  disabled?: boolean; // for paid/closed tickets
  isOpen?: boolean;
  onSwipeStart?: () => void;
}

const SwipeableTicketItem = ({
  children,
  onNoTax,
  onCancel,
  isNoTax = false,
  isCancelled = false,
  disabled = false,
  isOpen,
  onSwipeStart,
}: SwipeableTicketItemProps) => {
  const [internalTranslateX, setInternalTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const hasMoved = useRef(false);

  // Swipe thresholds — left reveals Cancel (right), right reveals No Tax (left)
  const rightRevealWidth = 90;  // swipe right to reveal No Tax
  const leftRevealWidth = -80;  // swipe left to reveal Cancel

  const translateX = isOpen === undefined ? internalTranslateX : (isOpen ? internalTranslateX : 0);
  const setTranslateX = (v: number) => setInternalTranslateX(v);

  // Reset when closed externally
  useEffect(() => {
    if (isOpen === false && internalTranslateX !== 0) setInternalTranslateX(0);
  }, [isOpen]);

  const snap = useCallback((current: number) => {
    if (current < leftRevealWidth / 2) return leftRevealWidth;
    if (current > rightRevealWidth / 2) return rightRevealWidth;
    return 0;
  }, [leftRevealWidth, rightRevealWidth]);

  // ── Touch ──────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isCancelled) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
    hasMoved.current = false;
    onSwipeStart?.();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled || isCancelled) return;
    const diff = e.touches[0].clientX - startX.current;
    if (Math.abs(diff) > 5) hasMoved.current = true;
    setTranslateX(Math.max(leftRevealWidth, Math.min(diff, rightRevealWidth)));
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setTranslateX(snap(translateX));
  };

  // ── Mouse ──────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isCancelled) return;
    startX.current = e.clientX;
    setIsDragging(true);
    hasMoved.current = false;
    onSwipeStart?.();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled || isCancelled) return;
    const diff = e.clientX - startX.current;
    if (Math.abs(diff) > 5) hasMoved.current = true;
    setTranslateX(Math.max(leftRevealWidth, Math.min(diff, rightRevealWidth)));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setTranslateX(snap(translateX));
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTranslateX(snap(translateX));
    }
  };

  const showNoTaxButton = translateX > 20;
  const showCancelButton = translateX < -20;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* LEFT: No Tax button (swipe right to reveal) */}
      <div
        className={`absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-150 ${
          showNoTaxButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onNoTax?.(); setTranslateX(0); }}
          className={`px-3 h-7 flex items-center justify-center rounded-full transition-colors text-[11px] font-semibold ${
            isNoTax ? 'text-black' : 'text-white'
          }`}
          style={{
            background: isNoTax
              ? 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
              : '#666666',
          }}
        >
          {isNoTax ? 'Remove No Tax' : 'No Tax'}
        </button>
      </div>

      {/* RIGHT: Cancel button (swipe left to reveal) */}
      <div
        className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-150 ${
          showCancelButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onCancel?.(); setTranslateX(0); }}
          className="w-9 h-7 flex items-center justify-center bg-red-500 rounded-full transition-colors"
        >
          <img src={clearCIcon} alt="Cancel" className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Swipeable content */}
      <div
        className="relative rounded-lg cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
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
        {/* Swipe hint bars — only when not dragging */}
        {!disabled && !isCancelled && (
          <>
            <div
              className="absolute right-0 top-0 bottom-0 w-1 bg-white/15 rounded-r-lg transition-opacity duration-200"
              style={{ opacity: translateX !== 0 ? 0 : 1 }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-1 bg-white/15 rounded-l-lg transition-opacity duration-200"
              style={{ opacity: translateX !== 0 ? 0 : 1 }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SwipeableTicketItem;
