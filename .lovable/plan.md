
# Display Split Checks Under Main Ticket in TableOrderDetails

## Overview
When an order is split, display the individual split checks as separate cards underneath the main order ticket in TableOrderDetails. Each split check shows a letter identifier (a, b, c, etc.) following the same layout as regular order cards.

---

## Reference Design Analysis

Based on the provided reference image:
- **Main Order Card**: Shows the full order (Order 13) with green border, displaying full guest info
- **Split Check Cards**: Appear below the main order, each showing:
  - Order number with suffix (e.g., "Order No 13 a", "Order No 13 b")
  - A single letter identifier ("a", "b") in place of guest name column
  - Same layout structure as main order cards
  - Individual totals for each check

---

## Technical Implementation

### 1. Extend SessionOrder Interface
**File:** `src/contexts/SessionOrderContext.tsx`

Add split configuration to the SessionOrder interface:
```typescript
export interface SplitCheck {
  checkId: string;           // "a", "b", "c", etc.
  items: OrderItem[];        // Items assigned to this check
  status: 'unpaid' | 'paid';
  total: number;
}

export interface SessionOrder extends Order {
  sessionId: string;
  createdAt: number;
  splitConfiguration?: {
    mode: 'seat' | 'evenly' | 'custom';
    numberOfChecks: number;
    checkAssignments: Record<number, number>;
    checks: SplitCheck[];
  };
}
```

Add new context functions:
- `saveSplitConfiguration(sessionId, config)` - Save split config to order
- `updateSplitCheckStatus(sessionId, checkId, status)` - Mark check as paid

### 2. Update Orders Page to Persist Split Configuration
**File:** `src/pages/Orders.tsx`

Modify the `onSaveSplit` handler:
- When split is saved, call `saveSplitConfiguration` from context
- Include item assignments and calculated totals for each check
- This persists the split state to localStorage via context

### 3. Display Split Checks in TableOrderDetails
**File:** `src/pages/TableOrderDetails.tsx`

Add rendering logic for split checks under main order card:

```text
Desktop/Tablet Layout:
┌─────────────────────────────────────────┐ ← Main Order (green border)
│ 13 │ Being Prepared │ Guest │ Timer... │
└─────────────────────────────────────────┘
    ┌─────────────────────────────────────┐ ← Split Check a (indented)
    │ 13 │ Being Prepared │ a │ Timer... │
    └─────────────────────────────────────┘
    ┌─────────────────────────────────────┐ ← Split Check b (indented)
    │ 13 │ Being Prepared │ b │ Timer... │
    └─────────────────────────────────────┘
```

For each guest order with `splitConfiguration`:
- Render the main order card (with expand/collapse toggle)
- Below it, render child cards for each split check
- Child cards show:
  - Same order number (e.g., "13")
  - Order No suffix: "Order No 13 a"
  - Check letter in place of guest name
  - Individual check totals
  - Status (paid/unpaid) per check

### 4. Order Card Structure for Split Checks
**File:** `src/pages/TableOrderDetails.tsx`

Create a reusable render function for split check cards:
```typescript
const renderSplitCheckCard = (
  parentOrder: GuestOrder,
  checkIndex: number,
  checkData: SplitCheck
) => {
  const checkLetter = String.fromCharCode(97 + checkIndex); // a, b, c...
  
  return (
    <div className="ml-4 rounded-xl border border-white/10 bg-neutral-900">
      {/* Column 1: Order Number */}
      <div className="...">
        <span className="text-lg font-bold">{parentOrder.id}</span>
      </div>
      
      {/* Column 2: Status + Order Info */}
      <div className="...">
        <span className="text-amber-400">{parentOrder.status}</span>
        <span>Order No {parentOrder.id} {checkLetter}</span>
        <span>Date, Arrived At</span>
      </div>
      
      {/* Column 3: Check Letter */}
      <div className="text-center">
        <span className="text-2xl font-bold text-white">{checkLetter}</span>
      </div>
      
      {/* Rest of columns: Timer, Server, Check, Revenue, Payment, Total, Tips */}
    </div>
  );
};
```

---

## Data Flow

```text
1. User splits order in Payment Dialog
   ↓
2. User clicks Save icon
   ↓
3. onSaveSplit callback fires with config
   ↓
4. Orders.tsx calls context.saveSplitConfiguration(sessionId, config)
   ↓
5. SessionOrderContext updates order with splitConfiguration
   ↓
6. localStorage persists the data
   ↓
7. TableOrderDetails reads session orders
   ↓
8. For orders with splitConfiguration, render child check cards
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/SessionOrderContext.tsx` | Add SplitCheck interface, saveSplitConfiguration function |
| `src/pages/Orders.tsx` | Update onSaveSplit to persist config to context |
| `src/pages/TableOrderDetails.tsx` | Add split check card rendering below main orders |

---

## UI Specifications

### Split Check Card Layout
- **Indentation**: `ml-4` (16px) from parent card
- **Background**: Same as parent (`bg-neutral-900`)
- **Border**: `border-white/10` (lighter than parent when unselected)
- **Check Identifier**: Large letter (a, b, c) displayed prominently
- **Order Number Format**: "Order No {id} {letter}" (e.g., "Order No 13 a")

### Visual Hierarchy
- Parent order card: Full width, normal styling
- Split check cards: Slightly indented, same height, connected visually
- Expand/collapse chevron on parent to show/hide split checks

### Status Colors
- Split check inherits parent order status color
- Individual paid checks show green "PAID" indicator
- Unpaid checks show default status color

---

## Mobile Considerations
- Split check cards follow same 3-row mobile layout
- Check letter replaces guest name in mobile view
- Swipe actions available on individual check cards
