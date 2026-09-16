# Editorial New Order Experience

Create a separate, fully functional New Order experience at **`/orders-editorial`** using the uploaded Point of Sale AI design system. The current `/orders` page and all existing design variants will remain unchanged.

## Design foundation

- Scope the new route to the document's warm editorial light theme: cream canvas, warm navigation surfaces, white controls, ink text, coral primary actions, terracotta selection, and green only for success.
- Apply the specified typography roles: Georgia for editorial headings, Inter for body copy, Montserrat for controls, and JetBrains Mono for order IDs and short operational labels.
- Use the documented 4px spacing scale, 12px controls, 16px operational cards, thin borders, restrained shadows, pill workflow buttons, circular icon controls, and 120ms to 240ms motion.
- Keep all new colors and effects in route-scoped semantic tokens so the existing dark application remains visually untouched.

## New Order workspace

- Build a responsive operational layout with a compact order header, searchable category navigation, a product browser, and a persistent cart rail.
- Load products and categories from the existing database-backed menu sources rather than embedding product names or prices in the page.
- Provide clear loading, empty, unavailable, validation, and populated states without visible scrollbars.
- Preserve fast Point of Sale interactions: one tap opens a product, and common cart actions remain within one or two taps.

## Product view and modifiers

- Add a new editorial product detail drawer for product image, description, price, quantity, required modifier groups, optional add-ons, Product Notes, and order placement.
- Reuse the existing product customization service and typed results so modifier and product information remain data-driven.
- Support adding a configured Product to the cart, reopening it for review or editing, quantity changes, and removal.
- Keep open-price and unavailable-product behavior explicit and accessible.

## Cart and order summary

- Show Product count, order ID, order type, elapsed time, subtotal, discounts or service charges when present, tax, and total.
- Use divided rows instead of nested cards, with a dedicated empty-cart state and visible disabled-action reasons.
- Preserve guest and order-type requirements before payment.
- Keep existing `/orders` cart state and data structures separate so this route cannot alter the established screen's presentation.

## Payment flow

- Add an editorial payment view within the new route, styled from the document rather than reusing the existing dark payment presentation.
- Present the amount due, payment methods, cash tender controls where applicable, card processing state, success state, and receipt choices.
- Route payment completion through the existing order and ticket operations, retaining structured amounts and current status rules.
- Include safe loading, declined, retry, and completed states, with **PAID** reserved for finalized orders.

## Responsive and accessibility validation

- Desktop: product workspace plus a 320px to 380px cart rail.
- Tablet: retain side-by-side operation where space permits, then use an accessible cart drawer.
- Mobile: compact header, horizontally accessible categories, full-width product and cart layers, and 44px minimum touch targets.
- Verify keyboard focus, tooltips for icon-only actions, reduced motion, text wrapping, contrast, no overlap, and the complete Product to cart to payment to receipt flow.

## Technical boundaries

- Add new route-specific page, components, styles, and typed view models before registering the lazy route in the application router.
- Reuse existing backend hooks and services for menu, product customization, orders, tickets, settings, and calculations.
- Do not modify the visual implementation of `/orders`, existing order variants, existing product dialogs, or existing payment dialogs.
- The uploaded document exceeds the parser's 50-page extraction limit, but its complete foundations, component dimensions, responsive rules, state matrix, elevation system, and motion specification were available in the extracted portion and will govern this route.
