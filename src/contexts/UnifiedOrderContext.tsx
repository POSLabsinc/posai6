import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useTicketOrders, UnifiedTicketOrder } from '@/hooks/use-ticket-orders';
import { TicketOrder, TicketOrderItem } from '@/data/ticketOrders';

interface UnifiedOrderContextType {
  orders: TicketOrder[];
  getAllOrders: () => TicketOrder[];
  getOrdersByTable: (tableId: string) => TicketOrder[];
  getOrderById: (id: string) => TicketOrder | undefined;
  updateOrder: (id: string, changes: Partial<TicketOrder>) => void;
  updateOrders: (updater: (prev: TicketOrder[]) => TicketOrder[]) => void;
  removeOrder: (id: string) => void;
  addOrder: (order: TicketOrder) => void;
  syncFromTransfers: () => void;
}

const UnifiedOrderContext = createContext<UnifiedOrderContextType | undefined>(undefined);

// Convert DB unified order to legacy TicketOrder shape
function toTicketOrder(u: UnifiedTicketOrder): TicketOrder {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    partySize: u.partySize,
    time: u.time,
    timer: u.timer,
    server: u.server,
    check: u.check,
    paymentType: u.paymentType,
    payments: u.payments,
    revenueCenter: u.revenueCenter,
    status: u.status,
    notes: u.notes,
    table: u.table,
    orderType: u.orderType,
    items: u.items.map(item => ({
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.seats || [],
      modifiers: item.modifiers || [],
    })),
    subtotal: u.subtotal,
    discount: u.discount,
    serviceCharge: u.serviceCharge,
    tax: u.tax,
    tip: u.tip,
    total: u.total,
    orderNumber: u.orderNumber,
    transferInfo: u.transferInfo,
  };
}

export function UnifiedOrderProvider({ children }: { children: ReactNode }) {
  const {
    orders: dbOrders,
    getOrdersByTable: dbGetByTable,
    getOrderById: dbGetById,
    updateOrder: dbUpdate,
    removeOrder: dbRemove,
    addOrder: dbAdd,
  } = useTicketOrders();

  const orders = dbOrders.map(toTicketOrder);

  const getAllOrders = useCallback(() => orders, [orders]);

  const getOrdersByTable = useCallback(
    (tableId: string) => orders.filter(o => o.table === tableId),
    [orders]
  );

  const getOrderById = useCallback(
    (id: string) => orders.find(o => o.id === id),
    [orders]
  );

  const updateOrder = useCallback((id: string, changes: Partial<TicketOrder>) => {
    const mapped: Record<string, any> = {};
    if (changes.name !== undefined) mapped.name = changes.name;
    if (changes.phone !== undefined) mapped.phone = changes.phone;
    if (changes.partySize !== undefined) mapped.partySize = changes.partySize;
    if (changes.time !== undefined) mapped.time = changes.time;
    if (changes.timer !== undefined) mapped.timer = changes.timer;
    if (changes.server !== undefined) mapped.server = changes.server;
    if (changes.check !== undefined) mapped.check = changes.check;
    if (changes.paymentType !== undefined) mapped.paymentType = changes.paymentType;
    if (changes.payments !== undefined) mapped.payments = changes.payments;
    if (changes.revenueCenter !== undefined) mapped.revenueCenter = changes.revenueCenter;
    if (changes.status !== undefined) mapped.status = changes.status;
    if (changes.notes !== undefined) mapped.notes = changes.notes;
    if (changes.table !== undefined) mapped.table = changes.table;
    if (changes.orderType !== undefined) mapped.orderType = changes.orderType;
    if (changes.subtotal !== undefined) mapped.subtotal = changes.subtotal;
    if (changes.discount !== undefined) mapped.discount = changes.discount;
    if (changes.serviceCharge !== undefined) mapped.serviceCharge = changes.serviceCharge;
    if (changes.tax !== undefined) mapped.tax = changes.tax;
    if (changes.tip !== undefined) mapped.tip = changes.tip;
    if (changes.total !== undefined) mapped.total = changes.total;
    if (changes.transferInfo !== undefined) mapped.transferInfo = changes.transferInfo;
    dbUpdate(id, mapped).catch(console.error);
  }, [dbUpdate]);

  // Legacy batch updater - applies the updater to current orders and persists diffs
  const updateOrders = useCallback((updater: (prev: TicketOrder[]) => TicketOrder[]) => {
    const currentOrders = dbOrders.map(toTicketOrder);
    const updated = updater(currentOrders);

    // Find changed orders and persist them
    for (const order of updated) {
      const original = currentOrders.find(o => o.id === order.id);
      if (!original) {
        // New order added by updater
        dbAdd({
          name: order.name,
          phone: order.phone,
          partySize: order.partySize,
          time: order.time,
          timer: order.timer,
          server: order.server,
          check: order.check,
          paymentType: order.paymentType,
          revenueCenter: order.revenueCenter,
          status: order.status,
          notes: order.notes,
          table: order.table,
          orderType: order.orderType,
          subtotal: order.subtotal,
          discount: order.discount,
          serviceCharge: order.serviceCharge,
          tax: order.tax,
          tip: order.tip,
          total: order.total,
          items: order.items,
        }).catch(console.error);
        continue;
      }
      // Check if anything changed
      const changed = JSON.stringify(order) !== JSON.stringify(original);
      if (changed) {
        dbUpdate(order.id, {
          name: order.name,
          table: order.table,
          status: order.status,
          subtotal: order.subtotal,
          discount: order.discount,
          serviceCharge: order.serviceCharge,
          tax: order.tax,
          tip: order.tip,
          total: order.total,
          transferInfo: order.transferInfo,
        }).catch(console.error);
      }
    }

    // Find removed orders
    for (const original of currentOrders) {
      if (!updated.some(o => o.id === original.id)) {
        dbRemove(original.id).catch(console.error);
      }
    }
  }, [dbOrders, dbUpdate, dbAdd, dbRemove]);

  const removeOrder = useCallback((id: string) => {
    dbRemove(id).catch(console.error);
  }, [dbRemove]);

  const addOrder = useCallback((order: TicketOrder) => {
    dbAdd({
      name: order.name,
      phone: order.phone,
      partySize: order.partySize,
      time: order.time,
      timer: order.timer,
      server: order.server,
      check: order.check,
      paymentType: order.paymentType,
      revenueCenter: order.revenueCenter,
      status: order.status,
      notes: order.notes,
      table: order.table,
      orderType: order.orderType,
      subtotal: order.subtotal,
      discount: order.discount,
      serviceCharge: order.serviceCharge,
      tax: order.tax,
      tip: order.tip,
      total: order.total,
      items: order.items,
    }).catch(console.error);
  }, [dbAdd]);

  // No-op - transfers are now handled via direct DB mutations
  const syncFromTransfers = useCallback(() => {}, []);

  return (
    <UnifiedOrderContext.Provider value={{
      orders,
      getAllOrders,
      getOrdersByTable,
      getOrderById,
      updateOrder,
      updateOrders,
      removeOrder,
      addOrder,
      syncFromTransfers,
    }}>
      {children}
    </UnifiedOrderContext.Provider>
  );
}

export function useUnifiedOrders() {
  const context = useContext(UnifiedOrderContext);
  if (!context) {
    throw new Error('useUnifiedOrders must be used within a UnifiedOrderProvider');
  }
  return context;
}

/** Safe version that returns null instead of throwing when used outside provider */
export function useUnifiedOrdersSafe() {
  return useContext(UnifiedOrderContext);
}
