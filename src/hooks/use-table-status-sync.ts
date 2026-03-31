import { useEffect, useRef } from 'react';

interface TableInfo {
  tableNumber: string;
  status: string;
}

interface OrderInfo {
  table: string;
  status: string;
}

type UpdateFn = (tableNumber: string, changes: { status: string }) => Promise<void>;

const STATUS_MAP: Record<string, string> = {
  ORDERING: 'Ordering',
  ORDERED: 'Ordered',
  PREPARING: 'Preparing',
  READY: 'Ready',
  '1ST COURSE': 'Seated',
  UNPAID: 'Seated',
};

const FREED_STATUSES = ['PAID', 'COMPLETED', 'Completed'];

export function useTableStatusSync(
  orders: OrderInfo[],
  tables: TableInfo[],
  updateTable: UpdateFn
) {
  const lastSyncRef = useRef<string>('');

  useEffect(() => {
    if (!tables.length) return;

    // Build a map: tableNumber -> highest-priority active order status
    const tableActiveStatus: Record<string, string> = {};
    for (const order of orders) {
      if (!order.table || order.table === '--') continue;
      if (FREED_STATUSES.includes(order.status)) continue;
      // Keep the first active status found (orders are sorted by order_number desc usually)
      if (!tableActiveStatus[order.table]) {
        tableActiveStatus[order.table] = order.status;
      }
    }

    // Compute desired statuses
    const updates: { tableNumber: string; desiredStatus: string }[] = [];
    for (const table of tables) {
      const activeOrderStatus = tableActiveStatus[table.tableNumber];
      const desiredStatus = activeOrderStatus
        ? (STATUS_MAP[activeOrderStatus] || 'Ordering')
        : 'Available';

      if (table.status !== desiredStatus) {
        updates.push({ tableNumber: table.tableNumber, desiredStatus });
      }
    }

    // Deduplicate: don't re-run if same updates
    const key = updates.map(u => `${u.tableNumber}:${u.desiredStatus}`).join(',');
    if (key === lastSyncRef.current || key === '') return;
    lastSyncRef.current = key;

    // Apply updates
    for (const { tableNumber, desiredStatus } of updates) {
      updateTable(tableNumber, { status: desiredStatus }).catch(() => {});
    }
  }, [orders, tables, updateTable]);
}
