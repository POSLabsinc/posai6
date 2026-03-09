

## Problem

The "Add Item" buttons in the Tickets module (Desktop dropdown, Tablet button, Mobile button) have no `onClick` handler — they're non-functional. When tapped on Unpaid/Ordering tickets, they should navigate to the New Order screen with the ticket's existing data pre-filled, allowing the user to add new products and recalculate totals.

## Plan

### 1. Import `useNavigate` in `src/pages/Tickets.tsx`
Add `import { useNavigate } from "react-router-dom";` and call `const navigate = useNavigate();` inside the component.

### 2. Create `handleAddProduct` handler
```tsx
const handleAddProduct = () => {
  if (!selectedGuest) return;
  navigate(`/orders?orderId=${selectedGuest.id}&tableId=${selectedGuest.table}&mode=addItem`);
};
```
This uses the same URL pattern already supported by `Orders.tsx` (`addItem` mode), which pre-populates guest name, phone, notes, order type, and existing products in the cart.

### 3. Wire the three "Add Item" buttons

- **Desktop** (~line 2277): Add `onClick={handleAddProduct}` to the dropdown menu item
- **Tablet** (~line 3411): Add `onClick={handleAddProduct}` to the button
- **Mobile** (~line 4291): Add `onClick={handleAddProduct}` to the button

All three buttons already have the correct visibility guard (`!(selectedGuest.status === "PAID" || selectedGuest.paid)`), so they only appear for Unpaid/Ordering tickets.

### 4. Rename labels
Change "Add Item" to "Add Product" per terminology standards on all three buttons.

### Result
Tapping "Add Product" on an Unpaid/Ordering ticket navigates to the New Order screen with the ticket's existing products pre-filled in the order section. The user can then add new products, and totals recalculate automatically (existing `addItem` mode logic in Orders.tsx handles this).

