import React, { useState } from 'react';
import { usePanelPosition, PanelLayout } from '@/contexts/PanelPositionContext';
import { ArrowLeftRight } from 'lucide-react';

interface DropZoneProps {
  position: 'left' | 'right';
}

function DropZone({ position }: DropZoneProps) {
  const { draggedPanel, setPanelLayout, panelLayout } = usePanelPosition();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    const panelType = e.dataTransfer.getData('panel') as 'menu' | 'order';
    
    // Determine new layout based on which panel is dropped where
    let newLayout: PanelLayout;
    if (panelType === 'menu') {
      newLayout = position === 'left' ? 'menu-left' : 'menu-right';
    } else {
      // order panel
      newLayout = position === 'left' ? 'menu-right' : 'menu-left';
    }
    
    setPanelLayout(newLayout);
  };

  // Determine if this drop zone is relevant for the current drag
  // Show left drop zone when menu is on right (or order is on left)
  // Show right drop zone when menu is on left (or order is on right)
  const isMenuOnLeft = panelLayout === 'menu-left';
  const shouldShowZone = (
    (position === 'left' && !isMenuOnLeft && draggedPanel === 'menu') ||
    (position === 'right' && isMenuOnLeft && draggedPanel === 'menu') ||
    (position === 'left' && isMenuOnLeft && draggedPanel === 'order') ||
    (position === 'right' && !isMenuOnLeft && draggedPanel === 'order')
  );

  if (!shouldShowZone) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        absolute top-0 ${position === 'left' ? 'left-0' : 'right-0'} 
        w-1/3 h-full z-40
        flex items-center justify-center
        transition-all duration-200
        ${isOver 
          ? 'bg-primary/20 border-2 border-dashed border-primary' 
          : 'bg-white/5 border-2 border-dashed border-white/20'
        }
      `}
    >
      <div className={`
        flex flex-col items-center gap-2 p-4 rounded-xl
        ${isOver ? 'bg-primary/30' : 'bg-neutral-800/80'}
        transition-all duration-200
      `}>
        <ArrowLeftRight className={`w-8 h-8 ${isOver ? 'text-primary' : 'text-white/60'}`} />
        <span className={`text-sm font-medium ${isOver ? 'text-primary' : 'text-white/60'}`}>
          Drop here
        </span>
      </div>
    </div>
  );
}

export function PanelDropZones() {
  const { isPanelDragging } = usePanelPosition();
  
  if (!isPanelDragging) return null;

  return (
    <>
      <DropZone position="left" />
      <DropZone position="right" />
    </>
  );
}
