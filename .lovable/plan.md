
# Update Dashboard Order Cards to Match TableOrderDetails Styling

## Overview
Update the order tabs/cards on the Dashboard page to match the visual styling from the TableOrderDetails page while keeping the customer name + table name display (which is unique to Dashboard since it shows orders from multiple tables).

---

## Current vs Target Comparison

| Aspect | Dashboard (Current) | TableOrderDetails (Target) |
|--------|---------------------|---------------------------|
| Background | `#2A2A2A` | `#1B1C20` |
| Border | `border-white/10` | `border-neutral-700` |
| Row 1 Column 1 | Name · Table (45%) | Name (45%) |
| Row 1 Column 2 | Server (35%) | Server (35%) |
| Row 1 Column 3 | Status (20%) | Status (20%) |
| Row 2 | Party info + Timer \| Empty \| Total | Same |
| Row 3 | Revenue Center \| Payment Status \| Tip | Same |
| Order Number Box | `bg-neutral-800`, `#1A1A1A` | `#1A1A1A` with border |
| Selected Border | `border-white` | `border-white` |

---

## Implementation Steps

### Step 1: Update Order Card Container Styling

Change the outer container from:
```typescript
// Current
style={{ background: "#2A2A2A" }}
className="border border-white/10"
```

To match TableOrderDetails:
```typescript
// New
style={{ backgroundColor: '#1B1C20' }}
className="border-neutral-700 hover:border-neutral-600"
```

### Step 2: Update Order Number Box Border

Add the `border border-white/20` styling to match TableOrderDetails:
```typescript
// Current
<div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" 
  style={{ background: '#1A1A1A' }}>
```

This is already correct - just needs verification.

### Step 3: Use formatTableName for Table Display

Update the Name · Table display to use the `formatTableName` utility for consistent formatting:
```typescript
// Current
<span className="text-white font-medium truncate">{order.guest} · {order.table}</span>

// New
<span className="text-white font-medium truncate">{order.guest} · {formatTableName(order.table)}</span>
```

### Step 4: Update Unselected Border Color

Change from `border-white/10` to `border-neutral-700` for consistency:
```typescript
// Current
className={`rounded-xl cursor-pointer transition-all overflow-hidden ${
  selectedOrder?.id === order.id 
    ? "border border-white" 
    : "border border-white/10"
}`}

// New
className={`rounded-xl cursor-pointer transition-all overflow-hidden border ${
  selectedOrder?.id === order.id 
    ? "border-white" 
    : "border-neutral-700 hover:border-neutral-600"
}`}
```

### Step 5: Apply Same Changes to Mobile Layout

Update the mobile layout (lines 4978-5025) with the same styling changes:
- Background color: `#1B1C20`
- Border styling: `border-neutral-700`
- Use `formatTableName(order.table)` for table display

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Update order card container background, border colors, and add formatTableName usage |

---

## Code Changes Summary

1. **Container background**: Change from `#2A2A2A` to `#1B1C20`
2. **Border classes**: Change from `border-white/10` to `border-neutral-700 hover:border-neutral-600`
3. **Table name formatting**: Apply `formatTableName(order.table)` in both mobile and desktop layouts
4. **Keep Name · Table format**: Dashboard needs table name since it shows orders from multiple tables

---

## Visual Result

The order cards will have:
- Darker background matching TableOrderDetails (`#1B1C20`)
- Subtle gray border (`border-neutral-700`) instead of white-tinted
- Hover state with slightly lighter border (`hover:border-neutral-600`)
- Consistent table name format (e.g., "Martin Alex · Table 2" instead of "Martin Alex · T2")
- Same layout structure with action buttons on the right

---

## Testing Checklist
- Order cards display with updated background color
- Border color matches TableOrderDetails styling
- Table names display as "Table X" format using formatTableName
- Selected order shows white border
- Unselected orders show neutral-700 border with hover state
- Mobile layout has same styling updates
- All functionality (click, actions) remains working
