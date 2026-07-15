## Diagnosis

The Orders screen is mixing two different menu systems:

1. **Backend menus and categories are flat**
   - `menus`, `menu_categories`, `categories`, and `products` are loading from the backend.
   - The backend does not currently store subcategory hierarchy, only category links.

2. **Orders expects subcategories from local device storage**
   - `Orders.tsx` builds subcategories from `getDynamicCategorySubcategories()`.
   - That function only reads `localStorage` key `categories-settings`.
   - If the authenticated account, browser, or workspace does not have that local storage data, subcategories are empty even though backend categories and products exist.

3. **The product grid depends on subcategory selection**
   - Subcategory chips are filtered out unless `dynamicMenuItems[selectedMenu][activeCategory][sub]` has products.
   - Backend products are currently placed under the parent category key, not reliably under subcategory keys.
   - Result: categories may appear but subcategories and products can disappear or feel inconsistent when selecting menus.

4. **Menu state can point to stale values**
   - `useMenuNavigation` defaults to `BAR MENU`, but the live backend menus are names like `Add This`, `Grilled Menu`, `Weekend`, `LE DINER MENU`, etc.
   - It eventually updates, but active category and subcategory synchronization is fragile.

## Fix plan

### 1. Make backend data the source of truth for Orders
Update `useSupabaseMenus` to return richer menu data:

- Enabled, non-archived menus.
- Categories linked to each menu.
- Category IDs and names, not just names.
- Product counts per category so Orders can avoid hiding valid categories.

### 2. Stop requiring localStorage for subcategories
In `Orders.tsx`, build a safe navigation structure from backend categories:

- If a category has backend subcategories in the future, use them.
- If no backend subcategories exist today, treat the parent category as its own selectable group.
- Example: `Appetizers` should render as both the category and the fallback subcategory container, so products assigned to `Appetizers` always show.

### 3. Fix product grouping
Update `dynamicMenuItems` so backend products are grouped consistently:

- Products assigned to `category_id` should appear under that category.
- If no child subcategory exists, place products under the parent category key.
- Do not depend on `getCategoryProducts()` unless local category settings actually exist.
- Keep existing hardcoded fallback menu data as fallback only.

### 4. Fix menu/category/subcategory synchronization
Update `useMenuNavigation` so when menus or categories load:

- The first available backend menu is selected.
- The first category with products is selected when possible.
- The first valid subcategory or fallback parent bucket is selected.
- If the selected menu changes, stale category/subcategory values are cleared immediately.

### 5. Improve empty states for debugging and staff clarity
On the Orders screen:

- If a selected menu has no linked categories, show a simple empty state instead of a blank section.
- If a category has no products, show a short empty state in the product grid.
- Do not hide all navigation silently.

### 6. Validate with an authenticated session
After implementation:

- Open Orders while authenticated.
- Select `Grilled Menu`, `Weekend`, and `LE DINER MENU`.
- Confirm category chips render.
- Confirm subcategory/fallback chips render.
- Confirm product cards render for selected categories.
- Confirm no backend permission errors appear in network logs.

## Technical changes

Files to update:

- `src/hooks/useSupabaseMenus.ts`
  - Return menu/category metadata and category product counts.

- `src/hooks/useMenuNavigation.ts`
  - Make active menu/category/subcategory state resilient to async backend data.

- `src/pages/Orders.tsx`
  - Build category/subcategory/product maps from backend data first.
  - Use localStorage category hierarchy only as optional enhancement.
  - Add clear empty states instead of blank rendering.

## Security note

There are still active backend security findings unrelated to the menu rendering issue, covering publicly writable financial configuration, employee shift/store assignment data, and guest feedback access. These should be fixed after the Orders rendering fix, but they are separate from the category/subcategory bug and should be handled carefully because they change data access rules.