## Investigation findings

The issue is likely not the table GRANTs anymore. Effective backend permissions now allow reads on `menus`, `menu_categories`, `categories`, and `products`, and the backend has menu/category/product data.

The current failure appears to come from the Orders screen data flow:

1. `src/pages/Orders.tsx` fetches menus from the backend using `useSupabaseMenus()`.
2. It builds subcategories from `getDynamicCategorySubcategories()`, but that function only reads `categories-settings` from browser localStorage.
3. Backend categories and subcategory relationships are not used to build the subcategory row.
4. The subcategory UI filters out any subcategory unless `dynamicMenuItems[selectedMenu][activeCategory][sub]` has products.
5. If the selected menu/category comes from backend data, but localStorage does not have matching subcategory setup, the subcategory row becomes empty. This also affects product visibility because active subcategory can point to a stale or non-existent subcategory.
6. There is also a weak state sync issue: `useMenuNavigation` only resets the active category when the current category is invalid. If the category is valid but its selected subcategory is stale or empty for the new menu/category, the UI can remain blank.

## Plan to fix

1. **Add backend category hierarchy loading**
   - Create or extend a hook to fetch backend categories with `id`, `name`, `parent_id`, `sort_order`, `archived`, and enough fields to derive parent categories and subcategories.
   - Build a map of `parent category name -> child category names[]` from backend category relationships.
   - Keep the existing localStorage category map as a fallback only.

2. **Make Orders use one consistent menu source**
   - Keep `useSupabaseMenus()` for the menu list and assigned parent categories.
   - Merge backend category hierarchy with the existing static fallback in `Orders.tsx`.
   - Stop relying only on `categories-settings` localStorage for subcategories.

3. **Fix selected menu/category/subcategory synchronization**
   - Update `useMenuNavigation` so when `selectedMenu`, `activeCategory`, or the subcategory map changes, it also validates `activeSubcategory`.
   - If the current subcategory is missing or has no products, auto-select the first available subcategory for the active category.
   - If no subcategory exists, leave `activeSubcategory` empty so the screen shows all products in that category instead of a blank state.

4. **Avoid hiding all subcategories unnecessarily**
   - Adjust the subcategory rendering so backend subcategories appear even if they do not yet have products, or at minimum fall back to showing the category-level products.
   - This prevents the UI from looking broken when category setup exists but products are directly assigned to the parent category.

5. **Add safe fallbacks for empty menus**
   - If a selected menu has zero assigned categories, show an empty-state message such as “No categories assigned to this menu” instead of silently showing nothing.
   - If categories exist but no products are found, show “No products in this category” in the product grid.

6. **Verify with authenticated preview**
   - Use the injected authenticated preview session, open `/orders`, select several backend menus, and confirm:
     - menu dropdown options render,
     - categories update after selecting a menu,
     - subcategories render for selected categories,
     - products render or a clear empty state appears,
     - no permission errors appear in network or console.

## Technical files likely to change

- `src/hooks/useSupabaseMenus.ts`
- `src/hooks/useMenuNavigation.ts`
- `src/pages/Orders.tsx`

No backend schema change is planned unless verification shows an actual missing category relationship or policy problem.