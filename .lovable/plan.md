

## Plan: Make Open Price Products Visible in Menu Navigation

### Problem
The 3 open price products (Daily Special, Market Price Fish, Chef's Special Chicken) are in the **Specials** category in the database. While they appear in search results, they don't reliably show when browsing menus. The "Specials" category is linked to Weekend, HAPPY HOUR M/W, and Holiday Menu — the products should appear when clicking the "Specials" tab under those menus.

### Root Cause
The `dynamicMenuItems` builder in `Orders.tsx` correctly adds DB products under the "Specials" category key. However, the subcategories row for "Specials" shows 12 hardcoded subcategories (Chef's Choice, Daily Special, Seasonal, etc.) from `categorySubcategories`. Clicking any of these shows **nothing** because the DB products are keyed under `"Specials"` not under individual subcategory names. This confusing UI may lead users to think the products are missing.

Additionally, the products only appear when clicking the "Specials" category tab itself (no subcategory selected), which may not be obvious.

### Solution

**File: `src/pages/Orders.tsx`** (lines ~428-451)
- When adding DB products to `dynamicMenuItems`, also distribute them to matching subcategory keys based on product name matching (e.g., "Daily Special (Open Price)" → "Daily Special" subcategory)
- For any unmatched DB products, add them to a general/visible subcategory so they're always accessible

**File: `src/data/orderMenuData.ts`** (line 55)  
- No changes needed to the subcategory definitions — they serve as navigation aids

### Alternative Simpler Approach (Recommended)
Since these are the **only** products in the Specials category and the subcategories are just hardcoded navigation stubs with no real products behind them:

**File: `src/pages/Orders.tsx`** (lines ~382-408)
- When building `dynamicMenuItems`, if a category has DB products but no localStorage-assigned subcategory products, skip the subcategory loop entirely and place all DB products directly under the category name
- This makes the products show immediately when clicking the "Specials" tab without needing to navigate subcategories

### Technical Details
- Modify the `dynamicMenuItems` useMemo block around lines 391-425
- Add a check: if none of the subcategories have products from `getCategoryProducts()`, skip creating empty subcategory entries and let the DB product merge (lines 428-451) handle everything
- This already works correctly — the real fix is ensuring the **subcategory buttons don't mislead** users into clicking them when no products exist under those sub-keys
- Add a guard in the subcategory rendering (line 2687) to only show subcategories that actually have products in the current data structure

