import { useState, useCallback } from 'react';
import { useSidebarPosition, SidebarPosition } from '@/contexts/SidebarPositionContext';

interface DropZoneProps {
  position: SidebarPosition;
}

function DropZone({ position }: DropZoneProps) {
  const { setPosition, setIsDragging, position: currentPosition } = useSidebarPosition();
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsHovered(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set hovered to false if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsHovered(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    setPosition(position);
    setIsDragging(false);
  }, [position, setPosition, setIsDragging]);

  if (currentPosition === position) return null;

  const positionStyles: Record<SidebarPosition, string> = {
    left: 'left-0 top-0 bottom-0 w-24',
    right: 'right-0 top-0 bottom-0 w-24',
    top: 'top-0 left-0 right-0 h-24',
    bottom: 'bottom-0 left-0 right-0 h-24',
  };

  const indicatorStyles: Record<SidebarPosition, string> = {
    left: 'left-0 top-0 bottom-0 w-2',
    right: 'right-0 top-0 bottom-0 w-2',
    top: 'top-0 left-0 right-0 h-2',
    bottom: 'bottom-0 left-0 right-0 h-2',
  };

  const gradientDirection: Record<SidebarPosition, string> = {
    left: 'to-r',
    right: 'to-l',
    top: 'to-b',
    bottom: 'to-t',
  };

  return (
    <div
      className={`fixed ${positionStyles[position]} z-[100] transition-all duration-200`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual indicator line */}
      <div
        className={`absolute ${indicatorStyles[position]} transition-all duration-200 ${
          isHovered 
            ? 'bg-gradient-to-r from-orange-500 to-amber-400 opacity-100' 
            : 'bg-white/30 opacity-50'
        }`}
      />
      {/* Glow effect */}
      <div 
        className={`absolute inset-0 bg-gradient-${gradientDirection[position]} transition-opacity duration-200 ${
          isHovered 
            ? 'from-orange-500/40 to-transparent opacity-100' 
            : 'from-white/10 to-transparent opacity-30'
        }`}
      />
      {/* Label */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-50'}`}>
        <span className={`text-xs font-medium px-2 py-1 rounded bg-black/50 text-white capitalize`}>
          {position}
        </span>
      </div>
    </div>
  );
}

export function SidebarDropZones() {
  const { isDragging } = useSidebarPosition();

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[99]">
      <DropZone position="left" />
      <DropZone position="right" />
      <DropZone position="top" />
      <DropZone position="bottom" />
    </div>
  );
}
