import { useState, useRef } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";

interface SwipeableGuestItemProps {
  children: React.ReactNode;
  onTap: () => void;
  onArchive: () => void;
  onRemove?: () => void;
  isArchived?: boolean;
}

const SwipeableGuestItem = ({
  children,
  onTap,
  onArchive,
  onRemove,
  isArchived = false,
}: SwipeableGuestItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const hasMoved = useRef(false);

  // When archived with remove option, show two buttons (144px), otherwise one (72px)
  const showDualActions = isArchived && !!onRemove;
  const swipeWidth = showDualActions ? -144 : -72;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (Math.abs(diff) > 5) hasMoved.current = true;
    setTranslateX(Math.max(swipeWidth, Math.min(diff, 0)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if (Math.abs(diff) > 5) hasMoved.current = true;
    setTranslateX(Math.max(swipeWidth, Math.min(diff, 0)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  const isRevealed = translateX < 0;
  const ArchiveIcon = isArchived ? ArchiveRestore : Archive;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {isRevealed && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <button
            onClick={() => handleAction(onArchive)}
            className="w-[72px] h-full flex items-center justify-center bg-neutral-600 transition-colors active:opacity-70"
            aria-label={isArchived ? "Restore" : "Archive"}
          >
            <ArchiveIcon className="w-5 h-5 text-white" />
          </button>
          {showDualActions && onRemove && (
            <button
              onClick={() => handleAction(onRemove)}
              className="w-[72px] h-full flex items-center justify-center bg-destructive transition-colors active:opacity-70"
              aria-label="Remove"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      )}

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

export default SwipeableGuestItem;
