# Refine the Ploy header and left navigation

## Scope
Update only `/ploy-pos/orders`. Keep all destinations, labels, actions, page structure, order content, and non-Ploy screens unchanged.

## Header
- Restyle the header to match the supplied Ploy reference: warm off-white surface, fine neutral bottom divider, near-black primary text, muted secondary text, and restrained coral accents.
- Use the Ploy typography treatment with compact Inter UI text, medium weights, and consistent sizing across the staff, service, status, and time controls.
- Remove remaining dark or mismatched icon fills and normalize header icon buttons to quiet transparent or light-neutral circular states.
- Preserve every existing header action and its current position.

## Left navigation
- Replace the generic Lucide interpretations for Dashboard, New Order, Table Order, Tickets, and Settings with a coordinated Ploy-style outline icon set based on the reference shapes.
- Standardize icon size, line weight, rounded joins, inactive warm-gray color, and terracotta active color.
- Keep the selected New Order tile white and raised, with no dark border.
- Retain the slim edge indicator on hover without shifting the rail.
- Move the e/version logo into a dedicated bottom slot so it stays anchored at the bottom of the vertical rail.
- Keep the restaurant logo and utility controls in their existing top areas.

## Tooltips
- Change all left-navigation tooltips to a light surface with near-black text, a fine neutral border, and a subtle shadow.
- Apply the same light treatment to drag and lock tooltips.

## Technical approach
- Add Ploy-specific icon components and layout hooks in the existing sidebar while preserving the original icon assets for every other route.
- Keep all visual values in the scoped Ploy theme tokens and stylesheet.
- Avoid broad selectors that could affect `/orders`, `/ploy-pos`, or Settings.

## Verification
- Compare the header and rail at the current 1138×742 viewport.
- Check the five requested icons, active state, hover line, light tooltips, and bottom-anchored e logo.
- Check mobile behavior, navigation, tooltips, overflow, and console errors.
- Confirm `/orders` and `/ploy-pos` remain visually unchanged.
