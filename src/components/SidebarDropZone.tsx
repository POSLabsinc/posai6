import { useState } from 'react';
import { useSidebarPosition, SidebarPosition } from '@/contexts/SidebarPositionContext';

interface DropZoneProps {
  position: SidebarPosition;
}

function DropZone({ position }: DropZoneProps) {
  const { setPosition, setIsDragging, position: currentPosition } = useSidebarPosition();
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = () => {
    setIsHovered(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    setPosition(position);
    setIsDragging(false);
  };

  if (currentPosition === position) return null;

  const positionStyles: Record<SidebarPosition, string> = {
    left: 'left-0 top-0 bottom-0 w-20',
    right: 'right-0 top-0 bottom-0 w-20',
    top: 'top-0 left-0 right-0 h-20',
    bottom: 'bottom-0 left-0 right-0 h-20',
  };

  const indicatorStyles: Record<SidebarPosition, string> = {
    left: 'left-0 top-0 bottom-0 w-1',
    right: 'right-0 top-0 bottom-0 w-1',
    top: 'top-0 left-0 right-0 h-1',
    bottom: 'bottom-0 left-0 right-0 h-1',
  };

  return (
    <div
      className={`fixed ${positionStyles[position]} z-[100] transition-all duration-200`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual indicator */}
      <div
        className={`absolute ${indicatorStyles[position]} transition-all duration-200 ${
          isHovered 
            ? 'bg-gradient-to-r from-orange-500 to-amber-400 opacity-100' 
            : 'bg-white/20 opacity-0'
        }`}
      />
      {/* Glow effect when hovered */}
      {isHovered && (
        <div 
          className={`absolute ${positionStyles[position]} bg-gradient-to-${
            position === 'left' ? 'r' : position === 'right' ? 'l' : position === 'top' ? 'b' : 't'
          } from-orange-500/30 to-transparent pointer-events-none`}
        />
      )}
    </div>
  );
}

export function SidebarDropZones() {
  const { isDragging } = useSidebarPosition();

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <div className="pointer-events-auto">
        <DropZone position="left" />
        <DropZone position="right" />
        <DropZone position="top" />
        <DropZone position="bottom" />
      </div>
    </div>
  );
}
