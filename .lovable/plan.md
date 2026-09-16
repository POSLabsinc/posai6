# Correct the Ploy New Order Theme

## Goal
Rebuild the visual treatment of `/ploy-pos/orders` so it reads as the supplied Ploy interface while preserving the existing New Order layout, live data, and workflows. The original `/orders` page will remain unchanged.

## Visual system
- Replace the approximate palette with the document's exact colors: `#faf6f0` canvas, `#f3eee7` navigation and grouped surfaces, `#ffffff` lifted controls, `#1c1c1c` ink, `#fa9483` primary actions, `#a44c44` selected emphasis, and `#6f8f6b` success states.
- Apply the documented type roles rather than one font everywhere: Montserrat for navigation and controls, Inter for supporting text, Georgia only for intentional display or total values, and JetBrains Mono for short operational labels.
- Use thin neutral borders, restrained shadows, 12px controls, 16px maximum panel radii, circular icon controls, and compact operational spacing.

## New Order page corrections
- Give the isolated route explicit Ploy styling hooks instead of relying on broad overrides of dark utility classes.
- Restyle the existing top bar and left navigation to the warm Ploy shell, with clear dividers, white selected navigation, ink icons, and restrained terracotta emphasis.
- Restyle search, category controls, product tiles, prices, add controls, guest details, quick actions, order type, cart panel, totals, and payment actions as one consistent light system.
- Keep the current screen structure and feature placement intact. This is a theme correction, not a workflow or information architecture redesign.
- Ensure empty, selected, disabled, open-price, held-order, modifier, payment, and receipt states remain readable in the light theme.
- Keep all existing product, modifier, guest, order, payment, and receipt behavior connected to live data.

## Isolation
- Apply the corrected styling only under `/ploy-pos/orders` and its dialogs or overlays.
- Do not alter `/orders`, Dashboard, database behavior, payment logic, or shared business rules.
- Avoid CSS selectors tied to incidental inline color strings, which caused the current inconsistent result.

## Verification
- Compare the completed page against both attached screenshots and the design-system values.
- Test at 1280 × 800, 1024 × 768, and a mobile viewport.
- Exercise product selection, modifiers, cart updates, payment, and receipt views.
- Confirm no white-on-white text, dark-theme remnants, horizontal overflow, or console errors.
- Confirm `/orders` retains its existing appearance.
