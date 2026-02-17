import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AppContextType {
  restartApp: () => void;
  isRestarting: boolean;
  newOrdersCount: number;
  setNewOrdersCount: (count: number) => void;
  pendingTicketsCount: number;
  setPendingTicketsCount: (count: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, onRestart }: { children: ReactNode; onRestart: () => void }) {
  const [isRestarting, setIsRestarting] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(3); // Demo: start with some pending tickets

  const restartApp = useCallback(() => {
    setIsRestarting(true);
    // Clear session to trigger login flow
    localStorage.removeItem("pos_session");
    // Trigger restart callback
    onRestart();
    setIsRestarting(false);
  }, [onRestart]);

  return (
    <AppContext.Provider value={{ restartApp, isRestarting, newOrdersCount, setNewOrdersCount, pendingTicketsCount, setPendingTicketsCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
