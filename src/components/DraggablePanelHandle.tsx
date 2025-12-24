import React from 'react';
import { usePanelPosition } from '@/contexts/PanelPositionContext';
import { GripVertical } from 'lucide-react';

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
        flex items-center justify-center
        w-5 h-5 rounded
        opacity-40 hover:opacity-80
        hover:bg-white/5
        transition-all duration-200
        ${className}
      `}
      title="Drag to swap panels"
    >
      <GripVertical className="w-3.5 h-3.5 text-white/70" />
    </div>
  );
}
