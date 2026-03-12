

# Plan: Clean Up Categories & Make Product Customization Fully Database-Driven

## Current State

- **79 active categories** in the database, 30 of which have zero products
- **Modifiers** in ItemCustomizationDialog are hardcoded mock arrays (`itemModifiers`, `addOnsByItemId`, `defaultAddOns`)
- **Product info** (allergens, ingredients, nutritional info, description) is hardcoded/mocked in `renderProductInfoView()`
- Modifier groups and add-ons tables exist (`modifier_groups`, `modifiers`, `add_ons`, `product_modifier_groups`, `product_add_ons`) but are not wired into the customization dialog

## What Will Change

### 1. Database Cleanup — Trim to 10 Categories Per Menu

- Delete all 30 empty categories (no products) from `categories` table
- Remove excess `menu_categories` links so each menu has max 10 categories
- Ensure Grilled Menu and Weekend get proper category assignments (currently 0 and 2)

### 2. Schema Migration — Add Product Detail Columns

Add new columns to the `products` table:

```text
products
├── allergens        text[]     (e.g. ['Gluten','Eggs','Milk'])
├── ingredients      text[]     (e.g. ['Chicken Patty','Brioche Bun'])
├── calories         integer    (e.g. 520)
├── protein          text       (e.g. '28g')
├── carbs            text       (e.g. '42g')
├── fat              text       (e.g. '24g')
└── (existing: description, image_url already present)
```

### 3. Seed Product Data

Populate allergens, ingredients, and nutritional info for existing products with realistic sample data.

### 4. Wire ItemCustomizationDialog to Database

Replace all hardcoded data in `ItemCustomizationDialog.tsx`:

- **Modifiers**: Fetch from `product_modifier_groups` → `modifier_groups` → `modifiers` for the selected product. Fall back to all active modifier groups if none assigned.
- **Add-ons**: Fetch from `product_add_ons` → `add_ons` for the selected product. Fall back to all active add-ons if none assigned.
- **Product Info**: Use product's `description`, `allergens`, `ingredients`, `calories`, `protein`, `carbs`, `fat` from the database instead of mock data.

### 5. Code Changes

| File | Change |
|---|---|
| `src/components/ItemCustomizationDialog.tsx` | Remove hardcoded `itemModifiers`, `addOnsByItemId`, `defaultAddOns`, mock allergens/ingredients/nutritional. Add `useEffect` to fetch product modifiers, add-ons, and product details from database. |
| `src/services/productService.ts` | Add `fetchProductCustomization(productId)` function that returns modifiers, add-ons, and product info in one call. |

### 6. Final Category Distribution (10 per menu)

Each menu will have exactly 10 well-organized categories with products assigned.

