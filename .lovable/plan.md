

# Show Direct Order Details in Payment Dialog Sidebar

## Overview
When processing payment for direct orders from the New Order screen, the Payment Dialog sidebar should display relevant order information instead of table-specific details. Currently, the sidebar shows hardcoded values and table-centric UI that doesn't apply to direct orders.

---

## Current vs Desired Behavior

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE (Direct Order)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Guest Name         (555) 123-4567              [LIVE TIME]     │    │
│  │                                                                  │    │
│  │                     👤 SERVER   ← Hardcoded "SERVER" text       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Missing: Order Type, Order Number, Actual Server Name, Order Time      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    DESIRED STATE (Direct Order)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Guest Name         (555) 123-4567              8:30 PM         │    │
│  │                                                                  │    │
│  │  ┌──────────┐   ┌─────────────┐   ┌────────────────────┐       │    │
│  │  │ TAKE OUT │   │ ORDER #123  │   │ 👤 MIA JONES       │       │    │
│  │  └──────────┘   └─────────────┘   └────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Shows: Order Type Badge, Order Number, Server Name, Order Time         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Extend the PaymentDialogOrderDetails Interface

Add new optional fields to support direct order information:

**File:** `src/components/PaymentDialog.tsx` (lines 24-31)

```typescript
export interface PaymentDialogOrderDetails {
  guest?: string;
  phone?: string;
  table?: string;
  check?: number | string;
  partySize?: number;        // Number of guests at the table
  orderType?: string;        // NEW: "DINE IN", "TAKE OUT", "DELIVERY", etc.
  orderNumber?: number | string;  // NEW: Order number for display
  serverName?: string;       // NEW: Actual server name
  orderTime?: string;        // NEW: Time order was created (formatted string)
  items: PaymentDialogOrderItem[];
}
```

### Step 2: Update Orders.tsx to Pass New Fields

Add order creation time tracking and pass new fields to PaymentDialog:

**File:** `src/pages/Orders.tsx`

1. Add state for order creation time (after line 6141):
```typescript
const [orderCreatedTime, setOrderCreatedTime] = useState<string>(() => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
});
```

2. Update PaymentDialog invocation (lines 8878-8892):
```typescript
<PaymentDialog
  open={showPaymentDialog}
  onOpenChange={setShowPaymentDialog}
  orderDetails={{
    guest: guestName || "Guest",
    phone: guestPhone ? formatPhoneNumber(guestPhone) : undefined,
    table: isTableOrder ? `T${orderNumber}` : undefined,
    check: orderNumber,
    orderType: orderType,           // NEW
    orderNumber: orderNumber,       // NEW
    serverName: "Mia Jones",        // NEW (can be made dynamic later)
    orderTime: orderCreatedTime,    // NEW
    items: orderItems.map(item => ({
      id: item.id,
      qty: item.qty,
      name: item.name,
      price: item.price
    }))
  }}
  // ... rest of props
/>
```

### Step 3: Update PaymentDialog Sidebar Header

Modify the sidebar to show direct order info when `partySize` is not present:

**File:** `src/components/PaymentDialog.tsx` (lines 4752-4790)

**Row 1: Update time display** - Use `orderDetails.orderTime` when available, fallback to live time:
```typescript
<span className="text-neutral-300 text-xs">
  {orderDetails.orderTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
</span>
```

**Row 2: Conditional rendering for direct orders**:
```typescript
{/* Row 2: Table/Order Type, Order Number, Server */}
<div className="flex items-center justify-between mt-3">
  {/* For table orders: show TABLE badge */}
  {orderDetails.table && (
    <span className="text-white text-[10px] font-medium px-2 py-1 rounded" 
      style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
      TABLE {orderDetails.table}
    </span>
  )}
  
  {/* For direct orders (no table): show ORDER TYPE badge */}
  {!orderDetails.table && orderDetails.orderType && (
    <span className="text-white text-[10px] font-medium px-2 py-1 rounded" 
      style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
      {orderDetails.orderType}
    </span>
  )}
  
  {/* For table orders: show party size */}
  {orderDetails.partySize && (
    <div className="flex items-center gap-2 text-neutral-300">
      <Users className="w-3 h-3" />
      <span className="text-xs">{orderDetails.partySize}</span>
    </div>
  )}
  
  {/* For direct orders: show order number */}
  {!orderDetails.partySize && orderDetails.orderNumber && (
    <span className="text-white text-[10px] font-medium px-2 py-1 rounded" 
      style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
      ORDER #{orderDetails.orderNumber}
    </span>
  )}
  
  {/* Server name - use actual name if provided */}
  <div className="flex items-center gap-1.5 text-neutral-300">
    <User className="w-3 h-3" />
    <span className="text-xs">{orderDetails.serverName || "SERVER"}</span>
  </div>
</div>
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Extend interface, update sidebar header rendering |
| `src/pages/Orders.tsx` | Add order time state, pass new fields to PaymentDialog |

### New Interface Fields

| Field | Type | Purpose |
|-------|------|---------|
| `orderType` | `string?` | Display order type badge (DINE IN, TAKE OUT, etc.) |
| `orderNumber` | `number \| string?` | Display order number |
| `serverName` | `string?` | Display actual server name instead of "SERVER" |
| `orderTime` | `string?` | Display order creation time instead of live time |

---

## Visual Comparison

| Element | Table Order | Direct Order |
|---------|-------------|--------------|
| Row 1 Left | Guest Name | Guest Name |
| Row 1 Center | Phone Number | Phone Number |
| Row 1 Right | Order Time | Order Time |
| Row 2 Left | TABLE T2 badge | TAKE OUT badge |
| Row 2 Center | Party Size (4 guests) | ORDER #123 |
| Row 2 Right | Server Name | Server Name |

---

## Testing Checklist
- Open Payment Dialog from New Order screen → Shows order type, order number, server name
- Open Payment Dialog from Table Order screen → Shows table badge, party size (existing behavior)
- Order time displays the actual creation time, not live updating time
- Server name displays "Mia Jones" instead of hardcoded "SERVER"
- All existing payment flows continue to work correctly

