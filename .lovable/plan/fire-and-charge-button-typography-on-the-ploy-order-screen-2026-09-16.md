# Fire and Charge button typography on the Ploy order screen

Match the two cart footer buttons to the Ploy reference styling once products are in the cart.

## What changes

- FIRE button: terracotta fill, white label in the Ploy UI typeface, bold, uppercase, slightly widened letter spacing, with the flame mark in white beside it.
- CHARGE button: terracotta fill, near-black label in the Ploy editorial serif so the amount reads like the other large numbers on the screen (currently it uses a silver/white gradient fill with a sans label).
- Both keep their current size, position, rounding, spacing, wording and behaviour. Applies to the desktop cart footer and the mobile cart footer.

## Scope

Only the Ploy order route. The standard order screen and every other route keep their existing look.

## Technical notes

- `src/pages/Orders.tsx`: add `data-ploy-fire-action` and `data-ploy-charge-action` markers to the Fire and Charge buttons in both the desktop (~line 2536) and mobile (~line 3982) footers, applied only when `isPloyTheme` is true, so non-Ploy rendering is untouched.
- `src/pages/PloyPosTheme.css`: scoped rules under `.ploy-pos-theme .ploy-order-page`
  - Fire button: `background: var(--ploy-accent)`, no gradient; label Inter 700, 13px, `text-transform: uppercase`, `letter-spacing: 0.06em`, `#ffffff`; icon filtered to white.
  - Charge button: `background: var(--ploy-accent)`, label `"Source Serif 4", Georgia, serif`, 600, 14px, color `#1e1b18`, no uppercase transform.
  - Both: `box-shadow: none`, existing pill radius preserved; hover slightly darkens the terracotta.
  - Add exclusions so the existing serif `button:last-child` rule does not double-apply to the Fire label.
- Verify with Playwright at 1138x742 and 390x844 with a product in the cart; confirm `/orders` is unchanged.
