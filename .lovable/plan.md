# Match Fire and Charge buttons to the Ploy button style

The reference button is a soft salmon pill with near-black bold text and a matching near-black icon. Our current buttons use a darker terracotta fill with white text on Fire and serif text on Charge, so they read as a different component.

## Changes

- Fill both buttons with the Ploy salmon used on reference buttons (`#E8907E`), with a slightly deeper salmon on hover.
- Set both labels to near-black ink (`#1E1B18`), Inter, bold, so Fire and Charge read as the same button family.
- Drop the serif treatment on the Charge amount so it matches the reference label style.
- Tint the flame icon near-black instead of white so it sits on the salmon fill correctly.
- Keep uppercase on FIRE, keep both button sizes, positions, labels, and amounts exactly as they are.

## Scope

Only the Ploy order screen (`/ploy-pos/orders`) is affected. The standard order screen and every other route keep their current look.

## Technical notes

All edits in `src/pages/PloyPosTheme.css`, in the existing `[data-ploy-fire-action]` / `[data-ploy-charge-action]` rule block: change the shared background to `#E8907E` (hover `#DE7E6A`), set both span rules to Inter 700 with `color: #1E1B18`, remove the `Source Serif 4` family from the charge span, and change the fire icon filter from `brightness(0) invert(1)` to `brightness(0)`. Verify with Playwright at 1138x742 with a product in the cart, and confirm `/orders` is unchanged.
