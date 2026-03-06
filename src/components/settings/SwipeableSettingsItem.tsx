import { useState, useRef } from "react";
import { Archive, Pencil } from "lucide-react";

interface SwipeableSettingsItemProps {
  children: React.ReactNode;
  onTap: () => void;
  onArchive: () => void;
  onEdit?: () => void;
  isArchived?: boolean;
}

const SwipeableSettingsItem = ({ 
  children, 
  onTap, 
  onArchive,
  onEdit,
  isArchived = false
}: SwipeableSettingsItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startTarget = useRef<EventTarget | null>(null);
  const currentX = useRef(0);
  const hasMoved = useRef(false);

  // Width for action buttons on right side (swipe left to reveal)
  const swipeWidth = onEdit ? -112 : -56;

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const interactive = target.closest('button[role="switch"], [data-stop-tap]');
    return !!interactive;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startTarget.current = e.target;
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
      if (!isInteractiveTarget(startTarget.current)) {
        onTap();
      }
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
    startTarget.current = e.target;
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
      if (!isInteractiveTarget(startTarget.current)) {
        onTap();
      }
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
          {/* Edit button */}
          {onEdit && (
            <button
              onClick={() => handleAction(onEdit)}
              className="w-14 h-full flex items-center justify-center bg-blue-600 transition-colors active:opacity-70"
            >
              <Pencil className="w-5 h-5 text-white" />
            </button>
          )}
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
        className="relative bg-neutral-800/60 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          touchAction: "pan-y",
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

export default SwipeableSettingsItem;
