# Fix four Ploy cart panel issues

All changes are scoped to the Ploy ordering screen only. No labels, actions, or layout positions change.

## 1. "No Sale" shows in a different colour

Cause: the "No Sale" button was never tagged as a Ploy pill like "Custom Item", "Discount", and "No Tax", so it misses the white/ink pill styling. It is also the last button in its row, which makes a separate serif/accent rule apply to its text.

Fix: tag it as a Ploy pill so it matches the other three exactly (white surface, neutral border, near-black text, muted outline icon), and tighten the serif rule so it no longer catches this row.

## 2. Font style and weight differ inside the More options column

Cause: only Gift Card, Service Charge, Add Guest, and Reopen Check were given Ploy typography. Transfer Check, Sell Voucher, Create Deposit, Redeem Deposit, and Merge were left with the original dark-theme styling, and a broad serif rule reaches some of their text.

Fix: apply the same Ploy treatment to every action in the column so all labels share one font, size, weight, and colour, and all icons share one outline style, size, and muted colour.

## 3. Empty cart icon is not visible

Cause: the empty state uses white artwork made for the dark theme at 50 percent opacity, so it disappears on the white cart card.

Fix: on the Ploy screen render a thin outline empty-order icon in the muted warm grey used elsewhere, keeping the same size, position, and the "Let's create an order" text. Other routes keep the original artwork.

## 4. Tinted container visible between the cart and the More column

Cause: the actions column sits in a translucent grey container with an inner glow from the dark theme, and the surrounding wrapper still shows page background between the two panels.

Fix: give the actions column the same white card, 1px neutral border, 14px radius, and subtle shadow as the cart card, remove the grey tint and inner glow, and normalise the spacing between the two panels so the seam reads as clean whitespace rather than a coloured strip.

## Technical notes

- `src/pages/Orders.tsx`: add `data-ploy-order-pill` to the No Sale button; add `data-ploy-more-action` plus conditional lucide icons to the remaining side-panel actions; add a Ploy-only empty-cart icon branch for both the desktop and mobile empty states.
- `src/pages/PloyPosTheme.css`: scope the `button:last-child span` serif rule away from the pill row; add a rule for the actions column container (white surface, border, radius, shadow, no inset glow); extend the existing `[data-ploy-more-action]` label and icon rules to cover all actions; add the empty-state icon rule.
- Verify with Playwright at desktop 1280x1800 and mobile 390x844, and confirm `/orders` is unchanged.
