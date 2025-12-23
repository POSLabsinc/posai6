import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

interface SidebarPositionContextType {
  position: SidebarPosition;
  setPosition: (pos: SidebarPosition) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  isAnimating: boolean;
}

const SidebarPositionContext = createContext<SidebarPositionContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-position';
const LOCK_STORAGE_KEY = 'sidebar-locked';

export function SidebarPositionProvider({ children }: { children: ReactNode }) {
  const [position, setPositionState] = useState<SidebarPosition>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as SidebarPosition) || 'left';
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLockedState] = useState(() => {
    const saved = localStorage.getItem(LOCK_STORAGE_KEY);
    return saved === 'true';
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPosition = useRef(position);

  const setPosition = (pos: SidebarPosition) => {
    if (pos !== prevPosition.current) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
    setPositionState(pos);
    localStorage.setItem(STORAGE_KEY, pos);
    prevPosition.current = pos;
  };

  const setIsLocked = (locked: boolean) => {
    setIsLockedState(locked);
    localStorage.setItem(LOCK_STORAGE_KEY, String(locked));
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
    <SidebarPositionContext.Provider value={{ position, setPosition, isDragging, setIsDragging, isLocked, setIsLocked, isAnimating }}>
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
