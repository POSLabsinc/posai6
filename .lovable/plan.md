

# Plan: Context-Aware AI Assistant for Menu Settings

Add auto-welcome messages and sub-menu suggestion chips for the **Menu** link and all its sub-pages, matching the existing pattern used for System and Payments.

## Changes

### 1. Add Menu sub-route suggestion chips (`AISettingsContent.tsx`)
Create chip arrays for each Menu sub-page:
- **menu-products**: "Add product", "View all products", "Archive a product", "Search products"
- **menu-categories**: "Add category", "View categories", "Reorder categories", "Assign products"
- **menu-modifiers**: "Add modifier", "View modifiers", "Edit modifier groups", "Set required modifiers"
- **menu-add-ons**: "Add add-on", "View add-ons", "Set pricing", "Assign to products"
- **menu-default-modifiers**: "View defaults", "Set default modifiers", "Reset defaults"
- **menu-groups**: "Add group", "View groups", "Assign products to group"
- **menu-menus**: "Add menu", "View menus", "Enable/disable menu", "Assign categories"

Register all in `contextChipsMap`.

### 2. Add Menu welcome entries (`AISettingsContent.tsx`)
Add to `contextWelcomeMap`:
- `menu`: title "Menu", description about managing product catalog, children list matching SETTINGS_HIERARCHY
- `menu-products`: title "Products", description about managing products
- `menu-categories`: title "Categories", description about organizing products
- `menu-modifiers`: title "Modifiers", description about product customizations
- `menu-add-ons`: title "Add-ons", description about extra options
- `menu-default-modifiers`: title "Default Modifiers", description
- `menu-groups`: title "Groups", description
- `menu-menus`: title "Menus", description about menu schedules and visibility

### Files Modified
1. **`src/components/settings/AISettingsContent.tsx`** - Add chip arrays, contextChipsMap entries, and contextWelcomeMap entries

No changes needed in `Settings.tsx` since the `getAiContext` function already handles `menu` and its sub-routes via `parentMap`.

