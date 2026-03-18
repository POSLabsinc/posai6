

## Analysis: Old UI vs New Order Module

After comparing the uploaded screenshots against the current `Orders.tsx` (9,828 lines), here is the feature gap analysis.

### Already Present in New Module
All of these features from the old UI exist in the current code:
- Menu navigation with categories and subcategories
- Product grid (list view + thumbnail view)
- Order type tabs (Dine-In, Takeout, Delivery)
- Guest Name and Phone inputs with search/autocomplete
- Right sidebar actions: Custom Item, Gift Card, Service Charge, Add Guest, Open Orders, Allergy, Merge, Reopen Check
- Discount dialog (fetched from database)
- No Tax / No VAT confirmation dialog
- Custom Item panel with numpad and keyboard
- Gift Card dialog with numpad
- Service Charge selection dialog
- Add New Guest form
- Guest Information panel (name, email, phone, notes)
- Search functionality
- Menu selector with view modes (grid, list, thumbnail, horizontal scroll)

### Missing Features

**1. Inventory Count Badges on Product Cards**
The old UI shows circled numbers (8, 14, 11, 13, 10) on product cards indicating available inventory/stock count. The current module has no inventory tracking or display on the product grid.

- **Scope**: Add an `inventory_count` (or `stock_count`) column to the `products` table. Display a small badge on each product card showing the count. Products with 0 stock show an "OUT OF STOCK" overlay.

**2. "OUT OF STOCK" Badge on Products**
The old UI shows a red "OUT OF STOCK" circle badge on unavailable products. The current module has no stock status indicator.

- **Scope**: Use the inventory count (above) or a boolean `is_available` flag. Render a red badge overlay and optionally disable the add-to-cart button for out-of-stock items.

**3. Dynamic "ARRIVED AT" Timestamp**
The old UI shows "ARRIVED AT 10:44 AM" dynamically in the order header. The current module hardcodes "12:30 PM".

- **Scope**: Replace the hardcoded time with a dynamic timestamp captured when the order session begins (e.g., `new Date()` formatted to locale time).

**4. Menu Back/Forward Navigation Arrows**
The old UI (screenshot 1) shows `←` and `→` arrow buttons next to the menu name for navigating between menus. The current module uses a dropdown `Select` for menu switching but lacks the sequential arrow navigation.

- **Scope**: Add prev/next buttons that cycle through `menuList` entries, updating `selectedMenu` accordingly.

### Implementation Plan

1. **Database migration**: Add `stock_count` (integer, nullable, default null) and `is_available` (boolean, default true) columns to the `products` table.

2. **Product grid UI updates** (`Orders.tsx`):
   - In both list view and thumbnail view, render a stock count badge (small circle with number) when `stock_count` is not null and > 0.
   - Render "OUT OF STOCK" red badge and dim the card when `is_available` is false or `stock_count` is 0.
   - Prevent adding out-of-stock items to cart.

3. **Dynamic arrival time**: Replace the hardcoded `12:30 PM` with a state variable `arrivalTime` set to `new Date()` when the order session starts, formatted via `toLocaleTimeString`.

4. **Menu arrow navigation**: Add two small arrow buttons (`ChevronLeft`, `ChevronRight`) beside the menu selector that call `handleMenuSelect` with the previous/next menu in `menuList`.

### Files to Edit
- **Database migration**: Add columns to `products` table
- **`src/pages/Orders.tsx`**: Product grid badges, arrival time, menu arrows

