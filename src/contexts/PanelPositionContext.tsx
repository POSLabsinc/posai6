import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PanelLayout = 'menu-left' | 'menu-right';

interface PanelPositionContextType {
  panelLayout: PanelLayout;
  setPanelLayout: (layout: PanelLayout) => void;
  isPanelDragging: boolean;
  setIsPanelDragging: (dragging: boolean) => void;
  draggedPanel: 'menu' | 'order' | null;
  setDraggedPanel: (panel: 'menu' | 'order' | null) => void;
  resetPanelLayout: () => void;
  togglePanelLayout: () => void;
}

const PanelPositionContext = createContext<PanelPositionContextType | undefined>(undefined);

const STORAGE_KEY = 'panel-layout';
const DEFAULT_LAYOUT: PanelLayout = 'menu-left';

export function PanelPositionProvider({ children }: { children: ReactNode }) {
  const [panelLayout, setPanelLayoutState] = useState<PanelLayout>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'menu-left' || saved === 'menu-right') {
        return saved;
      }
    }
    return DEFAULT_LAYOUT;
  });
  
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const [draggedPanel, setDraggedPanel] = useState<'menu' | 'order' | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, panelLayout);
  }, [panelLayout]);

  const setPanelLayout = (layout: PanelLayout) => {
    setPanelLayoutState(layout);
  };

  const resetPanelLayout = () => {
    setPanelLayoutState(DEFAULT_LAYOUT);
  };

  const togglePanelLayout = () => {
    setPanelLayoutState(prev => prev === 'menu-left' ? 'menu-right' : 'menu-left');
  };

  return (
    <PanelPositionContext.Provider
      value={{
        panelLayout,
        setPanelLayout,
        isPanelDragging,
        setIsPanelDragging,
        draggedPanel,
        setDraggedPanel,
        resetPanelLayout,
        togglePanelLayout,
      }}
    >
      {children}
    </PanelPositionContext.Provider>
  );
}

export function usePanelPosition() {
  const context = useContext(PanelPositionContext);
  if (context === undefined) {
    throw new Error('usePanelPosition must be used within a PanelPositionProvider');
  }
  return context;
}
