
## Fix: Table Icon Not Displaying in Order Summary Panel

### Problem
The order summary panel imports `table-order.png` for the table icon, but this file appears to be broken or incompatible. The Tickets module successfully uses `table-order-2.svg` for the same purpose. The result is a broken square icon next to "TABLE 1".

### Solution
Update the import in `src/pages/Orders.tsx` to use the working SVG icon (`table-order-2.svg`) instead of the broken PNG (`table-order.png`).

---

### Technical Details

**File: `src/pages/Orders.tsx`**

1. **Change the import** (line 70):
   - From: `import tableOrderIcon from "@/assets/icons/table-order.png";`
   - To: `import tableOrderIcon from "@/assets/icons/table-order-2.svg";`

2. **Remove the `invert` class** from the icon's `<img>` tag (line 6972), since the SVG is already white-on-transparent and doesn't need CSS inversion. The current class `"w-4 h-4 invert"` should remain as-is if the SVG needs it, or be tested -- the Tickets module does not apply `invert` to this icon, so it may need to be removed.

This is a one-line import change that aligns the Orders module with the Tickets module's working icon.
