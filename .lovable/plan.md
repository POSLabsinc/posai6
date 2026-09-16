# Restore Ploy More Menu Icons

## Goal
Make the Gift Card, Service Charge, Add Guest, and Reopen Check actions clearly visible and visually consistent in the cart's More menu on `/ploy-pos/orders` only.

## Confirmed current state
- Gift Card already uses a visible outline icon in the Ploy variant.
- Service Charge, Add Guest, and Reopen Check still use legacy light artwork intended for dark surfaces, which disappears against the Ploy menu's light background.
- The supplied reference currently redirects to its sign-in page, so the established Ploy order design and its accessible typography remain the visual reference.

## Changes
- Replace the four menu artworks with functional thin-outline icons:
  - Gift Card: gift card or gift symbol.
  - Service Charge: receipt or percentage-with-fee symbol.
  - Add Guest: person with plus symbol.
  - Reopen Check: receipt with a reopening arrow.
- Apply the existing Ploy icon treatment: 14px optical size, rounded strokes, warm-gray default color, and terracotta interaction state.
- Standardize all More menu labels to Inter, consistent size and medium weight, near-black text, and the existing row spacing.
- Keep every label, action, order, and workflow unchanged.
- Preserve the original icon artwork and styling on `/orders` and all non-Ploy routes.

## Verification
- Open the cart More menu at desktop and mobile widths.
- Confirm all four icons are visible, recognizable, aligned, and stylistically consistent with the other menu actions.
- Confirm each action still opens its existing flow and that no overflow or console errors appear.
