

# Fix: Available Table Should Show as "Ordering" After Receiving a Full Transfer

## Problem
When you fully transfer Order #1 to Table 1 (which is marked "Available"), two things go wrong:
1. Table 1 still shows as "Available" on the floor plan instead of "Ordering"
2. Clicking Table 1 opens the guest count dropdown instead of navigating to the table details page

## Root Cause
- `TableOrder.tsx` uses `defaultTables` as the authoritative source for table status and never checks `localStorage('pos-table-transfers')` for incoming transfers
- When a table is "Available", clicking it opens the guest selector instead of navigating to `/tableorder/T1`
- The transfer data IS correctly persisted, and `TableOrderDetails.tsx` already reads it -- but the user can never reach that page because the floor plan blocks navigation

## Solution

### File: `src/pages/TableOrder.tsx`

After loading table positions from `defaultTables` / localStorage, check the `pos-table-transfers` storage for any tables that have received transfers. For those tables, override the status from "Available" to "Ordering" so they:
- Display with the correct "Ordering" visual style on the floor plan
- Navigate directly to `/tableorder/T1` on click (instead of showing the guest dropdown)

**Where to add:** In the component body, after `tablePositions` state is initialized, add a `useMemo` or `useEffect` that:

1. Reads `pos-table-transfers` from localStorage
2. Finds any table IDs that have pending transfers
3. Updates those tables' status to "Ordering" in `tablePositions`

This way, the existing `handleTableClick` logic (which navigates to table details for non-Available tables) will work automatically.

### File: `src/pages/TableOrderDetails.tsx`

No changes needed -- it already reads `pos-table-transfers` and creates virtual orders with the correct order ID and blue banner.

## Technical Details

```text
// In TableOrder.tsx, after tablePositions state initialization:

useEffect(() => {
  const transferData = localStorage.getItem('pos-table-transfers');
  if (!transferData) return;
  
  const transfers = JSON.parse(transferData);
  const tablesWithTransfers = Object.keys(transfers)
    .filter(tableId => transfers[tableId]?.length > 0);
  
  if (tablesWithTransfers.length > 0) {
    setTablePositions(prev => prev.map(table => {
      if (table.status === 'Available' && tablesWithTransfers.includes(table.id)) {
        return { ...table, status: 'Ordering', time: '0M', guests: 1 };
      }
      return table;
    }));
  }
}, []);
```

## Expected Result
- Transfer entire Order #1 from Table 2 to Table 1 (Available)
- Table 1 changes status to "Ordering" on the floor plan
- Clicking Table 1 navigates to the details page
- Table 1 details page shows Order #1 with the blue banner "Order fully transferred from Table 2 . Order #1"
