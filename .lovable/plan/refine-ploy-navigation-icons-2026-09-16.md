# Refine Ploy navigation icons

## Scope
Update only the left navigation on `/ploy-pos/orders`. Keep the rail dimensions, tile sizes, spacing, destinations, tooltips, hover line, logo placement, and all other pages unchanged.

## Changes
- Increase the Dashboard, New Order, Table Order, Tickets, and Settings icons from their current 22px size to 25px for clearer visibility.
- Replace the current Settings symbol, which resembles a theme or brightness control, with a recognizable thin-outline gear icon.
- Match the new gear to the other Ploy navigation icons using the same rounded stroke treatment, inactive warm-gray color, and terracotta active color.
- Preserve the raised white selected tile and prevent the larger icons from shifting or resizing the navigation layout.

## Verification
- Check `/ploy-pos/orders` at the current desktop size and on mobile.
- Confirm all five icons are visibly larger, centered, and consistent in stroke weight.
- Confirm Settings reads clearly as a gear, hover and selected states still work, and no clipping or layout movement occurs.
- Confirm `/orders`, `/ploy-pos`, and other pages remain unchanged.
