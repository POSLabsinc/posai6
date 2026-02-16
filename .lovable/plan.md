

# Fix: Table Status Not Updating After Transfer Navigation

## Problem
The custom event `pos-transfer-updated` is dispatched in `TransferOrders.tsx` while the user is on the transfer page. By the time the user navigates back to `/tableorder` (the floor plan), `TableOrder` mounts fresh and the event has already been fired and missed. The event listener approach only works if both components are mounted simultaneously, which they are not.

## Solution: Hybrid Approach with Session Flag

Use `sessionStorage` to set a one-time "transfer just happened" flag. On mount, `TableOrder.tsx` checks this flag, updates table statuses, then clears it. This ensures:
- On a fresh browser session (no flag), T1 stays "Available"
- Right after a transfer, the flag exists, T1 updates to "Ordering", and the flag is cleared

### File 1: `src/pages/TransferOrders.tsx`

After persisting transfer data, also set a session flag:

```
localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(existing));
sessionStorage.setItem('pos-transfer-just-happened', 'true');
window.dispatchEvent(new Event('pos-transfer-updated'));
```

### File 2: `src/pages/TableOrder.tsx`

Update the `useEffect` to:
1. On mount, check `sessionStorage` for the flag -- if set, read transfers from `localStorage`, update table statuses, then clear the flag
2. Also keep the event listener for edge cases where both components are mounted

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

  // Check if a transfer just happened (across navigation)
  if (sessionStorage.getItem('pos-transfer-just-happened') === 'true') {
    sessionStorage.removeItem('pos-transfer-just-happened');
    handleTransferUpdate();
  }

  // Also listen for real-time events (same-page updates)
  window.addEventListener('pos-transfer-updated', handleTransferUpdate);
  return () => window.removeEventListener('pos-transfer-updated', handleTransferUpdate);
}, []);
```

## Why This Works
- `sessionStorage` persists across navigations within the same tab but clears when the tab/browser closes
- The flag is set when a transfer happens, consumed once on mount, then cleared -- no stale data
- Fresh page loads or new sessions won't have the flag, so T1 stays "Available" by default

## Expected Result
- On page load (fresh session): Table 1 shows "Available"
- Transfer Order #1 to Table 1, navigate back to floor plan: Table 1 shows "Ordering"
- Close browser, reopen: Table 1 shows "Available" again (clean slate)
