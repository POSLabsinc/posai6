# Restore Ploy order and cart icons

## Goal
Make every order-type icon and cart action icon clearly visible on `/ploy-pos/orders`, using a consistent Ploy-style outline system while preserving all current labels, positions, sizes, and actions.

## Current issue
- The order-type selector and its menu use white-filled image artwork originally designed for dark surfaces.
- The cart actions for Custom Product, Discount, No Tax, and No Sale also use white-filled artwork.
- On the Ploy theme's white controls, these icons have insufficient contrast and appear missing.

## Changes
1. Replace the Ploy order-type artwork with coordinated thin outline icons that match each function:
   - Dine In: table or dining icon
   - Take Out: takeaway bag
   - Delivery: delivery vehicle
   - Banquet: event or serving icon
   - Drive Thru: car
   - Curb Side: pickup package
   - Scheduled: calendar with time
   - Phone-In: phone
   - Custom: configurable shapes
2. Replace the top cart action artwork with functional outline icons:
   - Custom Product: plus
   - Discount: percent or discount badge
   - No Tax: receipt or tax symbol with a slash
   - No Sale: cash register
   - More: vertical dots, changing to close when the side panel is open
3. Style all icons with Ploy's rounded line caps, consistent stroke weight, and muted warm-gray color on neutral controls. Use terracotta only for selected or active states.
4. Apply the new icon treatment only to the Ploy order screen. Keep the existing artwork and behavior unchanged on all other order routes.
5. Check the selector, dropdown menu, and cart action row on desktop and mobile for visibility, alignment, correct active states, and unchanged interactions.

## Technical details
- Use semantic React icon components instead of filters on white raster or filled SVG assets.
- Add Ploy-specific rendering hooks to the existing order-type and cart action controls.
- Keep color and stroke styling in the scoped Ploy theme stylesheet using its existing semantic tokens.
