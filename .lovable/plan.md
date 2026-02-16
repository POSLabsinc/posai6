

# Fix: Don't Show Virtual "Order #12" on Source Table After Partial Transfer

## Problem
After partially transferring items from Table 2, the source table (T2) incorrectly displays a new virtual ticket "Order #12" containing the transferred items. This virtual order should only appear on the **destination** table, not the source.

## Root Cause
In `src/pages/TableOrderDetails.tsx` (line 462), the `virtualTransferOrder` logic creates a new order whenever `transferType === 'partial'` and transferred items exist. However, it does not check whether the current table is the **source** or the **destination** of the transfer. Since the URL contains `transferFrom=T2` and the current table is also T2, the virtual order incorrectly appears on the source table.

## Solution

### File: `src/pages/TableOrderDetails.tsx`

Add a guard condition to the `virtualTransferOrder` logic (around line 462) to skip creating the virtual order when the current table is the **source** of the transfer.

The current table is the source when `transferredFromTable === tableId`. In that case, the virtual order should not be created.

**Change at line 462:**
```
// Before (creates virtual order on ANY table with partial transfer params):
if (transferType === 'partial' && transferredOrderId && transferredItemNames.length > 0) {

// After (only create on destination table, not the source):
if (transferType === 'partial' && transferredOrderId && transferredItemNames.length > 0 && transferredFromTable !== tableId) {
```

This single condition addition ensures:
- Source table (T2): No virtual order is created -- the existing order just shows transferred items with strikethrough
- Destination table (T3): The virtual order is created as expected, showing the received items

