import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

interface SidebarPositionContextType {
  position: SidebarPosition;
  setPosition: (pos: SidebarPosition) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const SidebarPositionContext = createContext<SidebarPositionContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-position';

export function SidebarPositionProvider({ children }: { children: ReactNode }) {
  const [position, setPositionState] = useState<SidebarPosition>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as SidebarPosition) || 'left';
  });
  const [isDragging, setIsDragging] = useState(false);

  const setPosition = (pos: SidebarPosition) => {
    setPositionState(pos);
    localStorage.setItem(STORAGE_KEY, pos);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  return (
    <SidebarPositionContext.Provider value={{ position, setPosition, isDragging, setIsDragging }}>
      {children}
    </SidebarPositionContext.Provider>
  );
}

export function useSidebarPosition() {
  const context = useContext(SidebarPositionContext);
  if (!context) {
    throw new Error('useSidebarPosition must be used within a SidebarPositionProvider');
  }
  return context;
}
