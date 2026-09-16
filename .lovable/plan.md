# Match Ploy left navigation icons

## Scope
Update only the left navigation displayed on `/ploy-pos/orders`. Keep the rail size, spacing, logo, destinations, tooltips, drag and lock behavior, and page content unchanged.

## Visual changes
- Replace the current mixed image icons for Dashboard, New Order, Table Order, Tickets, and Settings with a coordinated set of thin outline icons matching the Ploy reference.
- Use muted warm gray for inactive icons, with consistent stroke weight and optical size.
- Keep the current route visually selected using the existing raised white tile and terracotta icon treatment.
- On icon hover, show a short dark rounded vertical line at the outer edge of the navigation rail, matching the reference screenshot.
- Keep the existing tooltip visible on hover and avoid adding text labels inside the rail.
- Ensure hover and selected states do not introduce black borders, dark fills, or layout movement.

## Technical approach
- Add Ploy-only icon rendering for the five requested destinations while retaining the existing icons on all other routes.
- Add an explicit styling hook for the hover indicator instead of relying on image filenames or broad selectors.
- Apply icon color, stroke, active state, and hover indicator through the route-scoped Ploy stylesheet.

## Verification
- Check `/ploy-pos/orders` at the current 1138×742 viewport and on mobile.
- Confirm all five icons match in weight, size, and muted color.
- Confirm the edge line appears only while hovering a navigation icon, tooltips still work, and the layout does not shift.
- Confirm the active New Order state remains clear and no controls are clipped.
- Confirm `/orders`, `/ploy-pos`, and all other pages retain their current navigation icons and styling.
