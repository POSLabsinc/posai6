# Ploy-Inspired Point of Sale Theme

## Goal
Create an isolated Point of Sale experience that preserves the current Dashboard and New Order interface, content, controls, and behavior while applying the visual language from the supplied Ploy reference and the earlier design document.

Existing Dashboard, New Order, header, navigation, and routes will remain visually and functionally unchanged.

## New routes
- `/ploy-pos` for the themed Dashboard
- `/ploy-pos/orders` for the themed New Order screen
- Navigation inside this themed experience will keep users within these new routes.

## Visual direction
- Warm cream page surfaces, white controls, near-black text, fine neutral borders, and coral primary accents based on the reference.
- Editorial serif typography for prominent page titles, with compact sans-serif typography for controls and operational information.
- Match the reference's restrained shadows, lighter visual weight, thin dividers, compact spacing, and rounded controls.
- Apply the theme consistently to the header, left navigation, Dashboard, New Order, product panels, cart, dialogs, and responsive navigation.
- Preserve all existing element positions, labels, information hierarchy, interactions, and workflows. This is a visual theme change only.

## Implementation
1. Add a dedicated themed shell for the two new routes, including themed versions of the current header, left navigation, and mobile navigation.
2. Reuse the current Dashboard and New Order business logic and live data rather than creating disconnected copies or sample data.
3. Add a route-scoped theme stylesheet and semantic theme tokens so no visual changes leak into existing screens.
4. Add a small route-aware theme boundary where shared controls need themed variants, without changing their appearance on current routes.
5. Ensure Dashboard and New Order navigation, product selection, modifiers, cart actions, payment, receipt, notifications, profile controls, and settings links continue working as they do now.
6. Preserve the existing responsive layouts and apply the new styling across desktop, tablet, and mobile.

## Verification
- Compare the two new screens against the reference styling at desktop and mobile sizes.
- Confirm the existing `/` and `/orders` screens are unchanged.
- Exercise the themed flow from Dashboard to New Order, product selection, modifiers, cart, payment, and receipt.
- Check for overflow, clipped text, visible scrollbars, missing icons, console errors, and broken navigation.

## Boundaries
- No database or payment-processing changes.
- No hardcoded product, order, staff, price, or merchant data.
- No redesign or rearrangement of the current Point of Sale interface.
- No changes to existing route visuals.
