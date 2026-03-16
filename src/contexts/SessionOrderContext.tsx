import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderItem } from '@/data/orders';
import { useTicketOrders } from '@/hooks/use-ticket-orders';

// Split check interface for individual checks within a split order
export interface SplitCheck {
  checkId: string;
  items: OrderItem[];
  status: 'unpaid' | 'paid';
  total: number;
}

// Split configuration interface
export interface SplitConfiguration {
  mode: 'seat' | 'evenly' | 'custom';
  numberOfChecks: number;
  checkAssignments: Record<number, number>;
  checks: SplitCheck[];
}

// Session order with cart items
export interface SessionOrder extends Order {
  sessionId: string;
  createdAt: number;
  splitConfiguration?: SplitConfiguration;
}

interface SessionOrderContextType {
  sessionOrders: SessionOrder[];
  createOrder: (tableId: string, guestCount: number, serverName?: string, guestName?: string) => SessionOrder;
  getActiveOrderForTable: (tableId: string) => SessionOrder | undefined;
  updateOrderItems: (sessionId: string, items: OrderItem[]) => void;
  updateOrderStatus: (sessionId: string, status: string) => void;
  fireOrder: (sessionId: string, checkNumber?: string) => void;
  getOrdersByTable: (tableId: string) => SessionOrder[];
  getOrderBySessionId: (sessionId: string) => SessionOrder | undefined;
  deleteOrder: (sessionId: string) => void;
  clearSessionOrders: () => void;
  saveSplitConfiguration: (sessionId: string, config: SplitConfiguration) => void;
  updateSplitCheckStatus: (sessionId: string, checkId: string, status: 'unpaid' | 'paid') => void;
  clearSplitConfiguration: (sessionId: string) => void;
}

const SessionOrderContext = createContext<SessionOrderContextType | undefined>(undefined);

export function SessionOrderProvider({ children }: { children: ReactNode }) {
  const { addOrder, updateOrder, updateOrderItems: dbUpdateItems, removeOrder, orders: dbOrders } = useTicketOrders();

  // Derive session orders from DB orders that have a session_id
  const sessionOrders: SessionOrder[] = dbOrders
    .filter(o => o.sessionId)
    .map(o => ({
      sessionId: o.sessionId!,
      id: o.id,
      name: o.name,
      phone: o.phone,
      partySize: o.partySize,
      time: o.time,
      timer: o.timer,
      server: o.server,
      check: o.check,
      paymentType: o.paymentType,
      revenueCenter: o.revenueCenter,
      status: o.status,
      notes: o.notes,
      table: o.table,
      orderType: (o.orderType || 'Dine-In') as any,
      items: o.items.map(item => ({
        qty: item.qty,
        name: item.name,
        price: item.price,
        seats: item.seats || [],
        modifiers: item.modifiers || [],
        isShared: item.isShared,
      })),
      createdAt: o.createdAtDate ? o.createdAtDate.getTime() : Date.now(),
      splitConfiguration: o.splitConfiguration,
    }));

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

    const sessionId = `session-${now}`;
    const newOrder: SessionOrder = {
      sessionId,
      id: `S${now % 10000}`,
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

    // Insert into DB
    addOrder({
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
      sessionId,
      items: [],
    }).catch(console.error);

    return newOrder;
  };

  const updateOrderItemsFn = (sessionId: string, items: OrderItem[]) => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order) return;
    dbUpdateItems(order.id, items.map(item => ({
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.seats || [],
      modifiers: item.modifiers || [],
      isShared: item.isShared,
    }))).catch(console.error);
  };

  const updateOrderStatus = (sessionId: string, status: string) => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order) return;
    updateOrder(order.id, { status }).catch(console.error);
  };

  const fireOrder = (sessionId: string, checkNumber?: string) => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order) return;
    const check = checkNumber || `${Date.now() % 100000}`;
    updateOrder(order.id, { status: 'ORDERED', check }).catch(console.error);

    // Push fired order into KDS ticket queue
    if (order.items.length > 0) {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem('kds_ticket_queue') || '[]');
        if (!existing.some((t: any) => t.sessionId === sessionId)) {
          existing.push({
            sessionId: order.sessionId,
            orderNumber: parseInt(order.id.replace(/\D/g, '')) || Date.now() % 10000,
            orderType: (order.orderType || 'Dine-In').toUpperCase().replace('-', ' '),
            tableNumber: order.table || null,
            serverName: order.server || 'Staff',
            guestName: order.name || 'Guest',
            createdAt: new Date().toISOString(),
            items: order.items.map(item => ({
              qty: item.qty,
              name: item.name,
              modifiers: item.modifiers || [],
            })),
            status: 'active',
          });
          localStorage.setItem('kds_ticket_queue', JSON.stringify(existing));
        }
      } catch (e) {
        console.error('Failed to push KDS ticket:', e);
      }
    }
  };

  const getOrdersByTable = (tableId: string): SessionOrder[] => {
    return sessionOrders.filter(order => order.table === tableId);
  };

  const getOrderBySessionId = (sessionId: string): SessionOrder | undefined => {
    return sessionOrders.find(order => order.sessionId === sessionId);
  };

  const deleteOrder = (sessionId: string) => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order) return;
    removeOrder(order.id).catch(console.error);
  };

  const clearSessionOrders = () => {
    sessionOrders.forEach(order => {
      removeOrder(order.id).catch(console.error);
    });
  };

  const saveSplitConfiguration = (sessionId: string, config: SplitConfiguration) => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order) return;
    updateOrder(order.id, { splitConfiguration: config } as any).catch(console.error);
  };

  const updateSplitCheckStatus = (sessionId: string, checkId: string, status: 'unpaid' | 'paid') => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order || !order.splitConfiguration) return;
    const updatedChecks = order.splitConfiguration.checks.map(check =>
      check.checkId === checkId ? { ...check, status } : check
    );
    const updatedConfig = { ...order.splitConfiguration, checks: updatedChecks };
    updateOrder(order.id, { splitConfiguration: updatedConfig } as any).catch(console.error);
  };

  const clearSplitConfiguration = (sessionId: string) => {
    const order = sessionOrders.find(o => o.sessionId === sessionId);
    if (!order) return;
    updateOrder(order.id, { splitConfiguration: null } as any).catch(console.error);
  };

  return (
    <SessionOrderContext.Provider value={{
      sessionOrders,
      createOrder,
      updateOrderItems: updateOrderItemsFn,
      updateOrderStatus,
      fireOrder,
      getOrdersByTable,
      getOrderBySessionId,
      deleteOrder,
      clearSessionOrders,
      saveSplitConfiguration,
      updateSplitCheckStatus,
      clearSplitConfiguration
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
