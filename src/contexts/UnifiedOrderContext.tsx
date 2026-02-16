import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ticketOrders as seedTicketOrders, TicketOrder, TicketOrderItem } from '@/data/ticketOrders';

// localStorage keys
const UNIFIED_STORAGE_KEY = 'pos-unified-orders';
const TRANSFER_STORAGE_KEY = 'pos-table-transfers';

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

export function UnifiedOrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<TicketOrder[]>(() => {
    try {
      const stored = localStorage.getItem(UNIFIED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TicketOrder[];
        // Merge any new seed orders that might have been added
        const storedIds = new Set(parsed.map(o => o.id));
        const newSeeds = seedTicketOrders.filter(o => !storedIds.has(o.id));
        return [...parsed, ...newSeeds];
      }
    } catch { /* fall through */ }
    return [...seedTicketOrders];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  // Sync transfers from TableOrderDetails localStorage into ticket orders
  const syncFromTransfers = useCallback(() => {
    try {
      const transferData = JSON.parse(localStorage.getItem(TRANSFER_STORAGE_KEY) || '{}');
      if (!transferData || Object.keys(transferData).length === 0) return;

      setOrders(prev => {
        let updated = [...prev];

        for (const [targetTable, transfers] of Object.entries(transferData)) {
          if (!Array.isArray(transfers)) continue;
          for (const transfer of transfers as any[]) {
            const { sourceOrderId, sourceTable, transferType, items, sourceOrderName, sourceServer, sourcePhone, sourcePartySize, sourceRevenueCenter, sourceOrderType, sourceNotes, targetOrderId } = transfer;

            // Match source order by name + table (IDs differ between orders.ts and ticketOrders.ts)
            const matchSource = (o: TicketOrder) => o.name === sourceOrderName && o.table === sourceTable;

            if (transferType === 'full') {
              const existsInOrders = updated.some(matchSource);
              if (existsInOrders) {
                updated = updated.map(o => matchSource(o) ? { ...o, table: targetTable } : o);
              }
            } else if (transferType === 'partial') {
              const transferredItemNames = (items || []).map((i: any) => i.name);
              
              // Update source order - remove transferred items
              updated = updated.map(o => {
                if (matchSource(o)) {
                  const remainingItems = o.items.filter(item => !transferredItemNames.includes(item.name));
                  const newSubtotal = remainingItems.reduce((s, item) => s + item.price * item.qty, 0);
                  const ratio = o.subtotal > 0 ? newSubtotal / o.subtotal : 0;
                  return {
                    ...o,
                    items: remainingItems,
                    subtotal: +newSubtotal.toFixed(2),
                    discount: +(o.discount * ratio).toFixed(2),
                    serviceCharge: +(o.serviceCharge * ratio).toFixed(2),
                    tax: +(o.tax * ratio).toFixed(2),
                    total: +(newSubtotal + (o.serviceCharge * ratio) + (o.tax * ratio) - (o.discount * ratio)).toFixed(2),
                  };
                }
                return o;
              });

              // If targeting a specific existing order, add items to it
              if (targetOrderId) {
                updated = updated.map(o => {
                  if (o.id === targetOrderId) {
                    const transferredItems: TicketOrderItem[] = (items || []).map((i: any) => ({
                      name: i.name,
                      qty: i.qty,
                      price: i.price,
                      modifiers: i.modifiers || [],
                      seats: i.seats || [],
                    }));
                    const newItems = [...o.items, ...transferredItems];
                    const newSubtotal = newItems.reduce((s, item) => s + item.price * item.qty, 0);
                    return {
                      ...o,
                      items: newItems,
                      subtotal: +newSubtotal.toFixed(2),
                      serviceCharge: +(newSubtotal * 0.05).toFixed(2),
                      tax: +(newSubtotal * 0.0735).toFixed(2),
                      total: +(newSubtotal + newSubtotal * 0.05 + newSubtotal * 0.0735 - o.discount).toFixed(2),
                    };
                  }
                  return o;
                });
              }
            }
          }
        }

        return updated;
      });
    } catch { /* ignore */ }
  }, []);

  // Listen for transfer events from TableOrderDetails
  useEffect(() => {
    const handleTransferUpdate = () => {
      syncFromTransfers();
    };

    window.addEventListener('pos-transfer-updated', handleTransferUpdate);
    // Also sync on mount
    syncFromTransfers();

    return () => {
      window.removeEventListener('pos-transfer-updated', handleTransferUpdate);
    };
  }, [syncFromTransfers]);

  const getAllOrders = useCallback(() => orders, [orders]);

  const getOrdersByTable = useCallback((tableId: string) => {
    return orders.filter(o => o.table === tableId);
  }, [orders]);

  const getOrderById = useCallback((id: string) => {
    return orders.find(o => o.id === id);
  }, [orders]);

  const updateOrder = useCallback((id: string, changes: Partial<TicketOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
  }, []);

  const updateOrders = useCallback((updater: (prev: TicketOrder[]) => TicketOrder[]) => {
    setOrders(updater);
  }, []);

  const removeOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  }, []);

  const addOrder = useCallback((order: TicketOrder) => {
    setOrders(prev => {
      // Don't add if already exists
      if (prev.some(o => o.id === order.id)) return prev;
      return [...prev, order];
    });
  }, []);

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
