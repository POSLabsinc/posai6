# Restyle Ploy Point of Sale Orders

## Goal
Restyle only `/ploy-pos/orders` to match the Partner Console design system. Preserve every existing label, Product, price, control, workflow, and layout position.

## Visual changes
- Set the page background to warm cream `#F7F3EE`.
- Restyle the top bar, catalog, order panel, cards, inputs, menus, and dialogs as white surfaces with a `1px #EAE3DA` border, 14px radius, and the specified subtle shadow.
- Replace dark add controls and primary icon actions with terracotta `#D9694A`, white icons, and circular or pill shapes.
- Style Open Price and similar small badges with `#F7E4DD` backgrounds and `#C15738` text.
- Use `#1E1B18` for primary text, `#6F6A64` for secondary text, and `#9A948C` for tertiary text and placeholders.
- Use Inter at weights 500 to 700 for interface text, labels, Product names, and buttons.
- Load and apply Source Serif 4 regular to prices, totals, and emphasized numeric values, using muted ink except for final totals.
- Style small section labels as uppercase 10.5px, weight 700, `0.1em` letter spacing, and tertiary ink.
- Normalize visible controls and cards to 12 to 14px radii, with circular icon buttons and avatars.
- Replace heavy dividers and remaining dark blocks with thin neutral borders and white surfaces.

## Isolation and boundaries
- Apply all styling only within the existing Ploy Point of Sale order route and its portaled menus or dialogs.
- Do not change `/orders`, `/ploy-pos`, other pages, business logic, live data, or payment behavior.
- Do not rearrange, add, remove, or rename any content or controls.
- Replace fragile legacy color overrides with explicit route-scoped semantic styling hooks only where necessary.

## Technical details
- Update the scoped Ploy theme tokens and route styles.
- Add Source Serif 4 to the existing font request without changing the default font used elsewhere.
- Keep Inter as the scoped interface font and assign the serif font only to monetary and emphasized numeric elements.
- Ensure portaled dropdowns, tooltips, and dialogs inherit the same Ploy visual system while this route is active.

## Verification
- Compare the ordering screen at the current 1023 × 742 viewport and at desktop and mobile widths.
- Verify menu controls, categories, Product cards, Open Price badges, cart rows, totals, dialogs, and payment surfaces.
- Confirm no dark remnants, heavy dividers, square controls, white-on-white text, overflow, or console errors.
- Confirm `/orders` and the Ploy Dashboard remain visually unchanged.