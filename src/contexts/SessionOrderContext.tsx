import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderItem } from '@/data/orders';

// Session order with cart items
export interface SessionOrder extends Order {
  sessionId: string;
  createdAt: number;
}

interface SessionOrderContextType {
  sessionOrders: SessionOrder[];
  createOrder: (tableId: string, guestCount: number, serverName?: string, guestName?: string) => SessionOrder;
  updateOrderItems: (sessionId: string, items: OrderItem[]) => void;
  updateOrderStatus: (sessionId: string, status: string) => void;
  fireOrder: (sessionId: string, checkNumber?: string) => void;
  getOrdersByTable: (tableId: string) => SessionOrder[];
  getOrderBySessionId: (sessionId: string) => SessionOrder | undefined;
  deleteOrder: (sessionId: string) => void;
  clearSessionOrders: () => void;
}

const SessionOrderContext = createContext<SessionOrderContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'pos-session-orders';

export function SessionOrderProvider({ children }: { children: ReactNode }) {
  const [sessionOrders, setSessionOrders] = useState<SessionOrder[]>(() => {
    // Load from localStorage on initial mount
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever sessionOrders change
  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionOrders));
  }, [sessionOrders]);

  const createOrder = (
    tableId: string, 
    guestCount: number, 
    serverName: string = 'Staff',
    guestName: string = 'Guest'
  ): SessionOrder => {
    const now = Date.now();
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const newOrder: SessionOrder = {
      sessionId: `session-${now}`,
      id: `S${now % 10000}`, // Short ID for display
      name: guestName,
      phone: '',
      partySize: guestCount,
      time: currentTime,
      timer: '00:00',
      server: serverName,
      check: '--',
      paymentType: '--',
      revenueCenter: 'Main',
      status: 'ORDERING',
      notes: '',
      table: tableId,
      orderType: 'Dine-In',
      items: [],
      createdAt: now
    };

    setSessionOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const updateOrderItems = (sessionId: string, items: OrderItem[]) => {
    setSessionOrders(prev => 
      prev.map(order => 
        order.sessionId === sessionId 
          ? { ...order, items } 
          : order
      )
    );
  };

  const updateOrderStatus = (sessionId: string, status: string) => {
    setSessionOrders(prev => 
      prev.map(order => 
        order.sessionId === sessionId 
          ? { ...order, status } 
          : order
      )
    );
  };

  const fireOrder = (sessionId: string, checkNumber?: string) => {
    const check = checkNumber || `${Date.now() % 100000}`;
    setSessionOrders(prev => 
      prev.map(order => 
        order.sessionId === sessionId 
          ? { 
              ...order, 
              status: 'ORDERED',
              check
            } 
          : order
      )
    );
  };

  const getOrdersByTable = (tableId: string): SessionOrder[] => {
    return sessionOrders.filter(order => order.table === tableId);
  };

  const getOrderBySessionId = (sessionId: string): SessionOrder | undefined => {
    return sessionOrders.find(order => order.sessionId === sessionId);
  };

  const deleteOrder = (sessionId: string) => {
    setSessionOrders(prev => prev.filter(order => order.sessionId !== sessionId));
  };

  const clearSessionOrders = () => {
    setSessionOrders([]);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <SessionOrderContext.Provider value={{
      sessionOrders,
      createOrder,
      updateOrderItems,
      updateOrderStatus,
      fireOrder,
      getOrdersByTable,
      getOrderBySessionId,
      deleteOrder,
      clearSessionOrders
    }}>
      {children}
    </SessionOrderContext.Provider>
  );
}

export function useSessionOrders() {
  const context = useContext(SessionOrderContext);
  if (!context) {
    throw new Error('useSessionOrders must be used within a SessionOrderProvider');
  }
  return context;
}
