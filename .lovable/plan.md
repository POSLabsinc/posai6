

# Fix: Table 1 Should Default to "Available", Only Change on Active Transfer

## Problem
The `useEffect` added in `TableOrder.tsx` runs on component mount and reads `pos-table-transfers` from localStorage. If there is any stale transfer data from a previous session, Table 1 immediately shows as "Ordering" even though no transfer was performed in the current session.

## Solution

### File: `src/pages/TableOrder.tsx`

Replace the current mount-only `useEffect` (lines 1188-1204) with a **storage event listener** approach:

1. Remove the `useEffect(() => { ... }, [])` that runs on mount
2. Add a `useEffect` that listens for a **custom event** (`pos-transfer-updated`) dispatched by the transfer logic
3. Only update the table status when that event fires (meaning a transfer just happened in this session)

### File: `src/pages/TransferOrders.tsx`

After writing to `localStorage` in `persistTransferData` (around line 383), dispatch a custom event so `TableOrder.tsx` can react:

```
localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(existing));
window.dispatchEvent(new Event('pos-transfer-updated'));
```

### Updated useEffect in TableOrder.tsx

```
useEffect(() => {
  const handleTransferUpdate = () => {
    const transferData = localStorage.getItem('pos-table-transfers');
    if (!transferData) return;
    try {
      const transfers = JSON.parse(transferData);
      const tablesWithTransfers = Object.keys(transfers)
        .filter(id => transfers[id]?.length > 0);
      if (tablesWithTransfers.length > 0) {
        setTablePositions(prev => prev.map(table => {
          if (table.status === 'Available' && tablesWithTransfers.includes(table.id)) {
            return { ...table, status: 'Ordering', time: '0M', guests: 1 };
          }
          return table;
        }));
      }
    } catch (e) { /* ignore */ }
  };

  window.addEventListener('pos-transfer-updated', handleTransferUpdate);
  return () => window.removeEventListener('pos-transfer-updated', handleTransferUpdate);
}, []);
```

## Expected Result
- On page load, Table 1 shows as "Available" (default)
- When you perform a transfer to Table 1, the custom event fires
- Table 1 immediately updates to "Ordering" on the floor plan
- Clicking Table 1 navigates to the details page showing the transferred order

