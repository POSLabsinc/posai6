
# Split Check Tickets for Dashboard Page

## Overview
This plan adds hierarchical split check ticket display to the Dashboard page, matching the functionality already implemented in TableOrderDetails. When an order has a split configuration, sub-tickets (individual checks) will appear below the main order card, allowing users to pay, view receipts, and manage individual checks.

## Current State Analysis

### TableOrderDetails Implementation
- Uses `renderSplitCheckCard()` function to render split check sub-tickets below main order cards
- Supports mobile, tablet, and desktop layouts
- Displays check letter (A, B, C...), individual totals, and payment status
- Has interactive Pay/Receipt buttons on each sub-ticket
- Tracks split configurations via:
  1. `SessionOrderContext` for session-based orders
  2. `staticSplitConfigs` in localStorage for static/seeded orders

### Dashboard Current State
- Uses `DashboardOrder` interface which does NOT include `splitConfiguration`
- Renders orders in a flat list without sub-ticket hierarchy
- Does not access `SessionOrderContext` for session orders
- Has separate order panel for viewing/editing selected order details

## Implementation Tasks

### 1. Extend DashboardOrder Interface
**File:** `src/data/orders.ts`

Add `splitConfiguration` field to the `DashboardOrder` interface:
```typescript
export interface DashboardOrder {
  // ... existing fields ...
  splitConfiguration?: SplitConfiguration;
}
```

Update `toDashboardOrder()` function to pass through split configuration when converting orders.

### 2. Add SessionOrderContext to Dashboard
**File:** `src/pages/Dashboard.tsx`

- Import `useSessionOrders` hook and `SplitConfiguration`, `SplitCheck` types
- Merge session orders with static orders (similar to TableOrderDetails approach)
- Access split configurations from both session orders and localStorage

### 3. Create renderSplitCheckCard Function for Dashboard
**File:** `src/pages/Dashboard.tsx`

Implement a `renderSplitCheckCard()` function similar to TableOrderDetails:
- Accept parent order, check index, check data, and layout type
- Render sub-tickets with:
  - Order ID + check letter (e.g., "1A", "1B")
  - Customer name + Check identifier
  - Check total
  - Payment status (Paid/Unpaid)
  - Action buttons (Pay for unpaid, Receipt for paid)
- Support mobile and desktop layouts
- Use 45%/35%/20% column ratio for desktop
- Apply indentation (`ml-4`) for visual hierarchy

### 4. Update Order List Rendering
**File:** `src/pages/Dashboard.tsx`

Modify the orders list rendering to:
- Wrap each order in a container div with `space-y-2` for consistent gaps
- After rendering main order card, check for `splitConfiguration`
- If splits exist, map through `checks` array and render sub-tickets
- Apply consistent 8px gap between main ticket and sub-tickets

### 5. Add Split Check Selection State
**File:** `src/pages/Dashboard.tsx`

Add state management for split check interactions:
```typescript
const [selectedSplitCheck, setSelectedSplitCheck] = useState<{
  orderId: number;
  checkId: string;
} | null>(null);
```

Add handler function:
```typescript
const handleSplitCheckClick = (order: DashboardOrder, check: SplitCheck) => {
  setSelectedSplitCheck({ orderId: order.id, checkId: check.checkId });
  // Construct virtual order for payment processing
};
```

### 6. Update Order Panel for Split Checks
**File:** `src/pages/Dashboard.tsx`

When a split check is selected:
- Show only items belonging to that check in the order panel
- Display check-specific total
- Update Charge button to show check total
- Enable payment dialog for individual check payment

### 7. Import Required Icons and Assets
**File:** `src/pages/Dashboard.tsx`

Add imports for:
- `BadgeDollarSign` from lucide-react (for Pay button)
- Any additional icons used in sub-ticket rendering

---

## Technical Details

### Split Check Card Structure (Desktop)
```
+--------------------------------------------------+
| [1]    | Name · Check A | Server | UNPAID        |
| [A]    | Party 4, 8PM | Timer  |        $45.00  |
|        | Revenue Center | Pending | $0.00 | [PAY]|
+--------------------------------------------------+
```

### Split Check Card Structure (Mobile)
```
+----------------------------------+
| [1A] | Name · Check A · T2       |
|      | Server           UNPAID   |
|      | Party 4, 8PM     $45.00   |
|      | Main             Unpaid   |
+----------------------------------+
```

### Data Flow
1. Dashboard loads orders from `getDashboardOrders()` + `SessionOrderContext`
2. Each order is checked for `splitConfiguration`
3. If present, sub-tickets are rendered using split check data
4. Clicking sub-ticket opens payment for that specific check
5. Payment completion updates check status to 'paid'

### State Synchronization
- Split configurations from session orders are already persisted via `SessionOrderContext`
- Static order splits use localStorage key: `pos-tableorder-static-splits`
- Dashboard reads from same localStorage key for consistency across pages

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/orders.ts` | Add `splitConfiguration` to `DashboardOrder` interface and `toDashboardOrder()` function |
| `src/pages/Dashboard.tsx` | Add SessionOrderContext, split check rendering, selection state, and order panel updates |

## Testing Checklist
- [ ] Split checks appear below parent orders on Dashboard
- [ ] Clicking sub-ticket selects it and shows correct items in order panel
- [ ] Pay button triggers payment dialog for individual check
- [ ] Receipt button appears for paid checks
- [ ] Mobile layout displays correctly
- [ ] Desktop 45/35/20 layout matches TableOrderDetails
- [ ] Consistent 8px spacing between tickets
- [ ] Status colors match (green for paid, appropriate color for unpaid)
