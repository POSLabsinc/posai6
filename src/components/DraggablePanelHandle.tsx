import React from 'react';
import { usePanelPosition } from '@/contexts/PanelPositionContext';
import grabberIcon from '@/assets/icons/grabber.png';

interface DraggablePanelHandleProps {
  panelId: 'menu' | 'order';
  className?: string;
}

export function DraggablePanelHandle({ panelId, className = '' }: DraggablePanelHandleProps) {
  const { setIsPanelDragging, setDraggedPanel } = usePanelPosition();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('panel', panelId);
    e.dataTransfer.effectAllowed = 'move';
    setIsPanelDragging(true);
    setDraggedPanel(panelId);
    
    // Add a slight delay to allow the drag image to be set
    setTimeout(() => {
      const dragElement = e.target as HTMLElement;
      dragElement.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsPanelDragging(false);
    setDraggedPanel(null);
    const dragElement = e.target as HTMLElement;
    dragElement.style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        cursor-grab active:cursor-grabbing 
        p-1.5 rounded hover:bg-white/10 
        transition-colors
        ${className}
      `}
      title="Drag to reposition panel"
    >
      <img 
        src={grabberIcon} 
        alt="Drag to reposition" 
        className="w-4 h-1.5 opacity-60 hover:opacity-100 transition-opacity rotate-90" 
      />
    </div>
  );
}
