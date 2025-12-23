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
  hasSeenOnboarding: boolean;
  dismissOnboarding: () => void;
  resetToDefaults: () => void;
}

const SidebarPositionContext = createContext<SidebarPositionContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-position';
const LOCK_STORAGE_KEY = 'sidebar-locked';
const ONBOARDING_STORAGE_KEY = 'sidebar-onboarding-seen';

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
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return saved === 'true';
  });
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

  const dismissOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  const resetToDefaults = () => {
    setPosition('left');
    setIsLocked(false);
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
    <SidebarPositionContext.Provider value={{ 
      position, 
      setPosition, 
      isDragging, 
      setIsDragging, 
      isLocked, 
      setIsLocked, 
      isAnimating,
      hasSeenOnboarding,
      dismissOnboarding,
      resetToDefaults
    }}>
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
