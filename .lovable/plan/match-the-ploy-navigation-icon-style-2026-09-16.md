# Match the Ploy navigation icon style

## Scope
Update only the icons in the left navigation on `/ploy-pos/orders`. Keep the rail size, icon order, destinations, active route, spacing, tooltips, drag and lock behavior, and all page content unchanged.

## Icon treatment
- Replace the legacy mixed PNG icons on the Ploy route with a consistent outlined icon set matching the reference.
- Use simple geometric symbols, approximately 22–24px, with uniform stroke width, rounded line caps, and no filled or embossed details.
- Map each existing destination to the closest reference-style symbol without adding, removing, or reordering navigation options.
- Keep inactive icons muted gray with transparent backgrounds.
- Keep the current Orders icon terracotta inside the existing raised white active tile.
- Keep the restaurant logo unchanged.
- Restyle the drag and lock symbols to the same line weight and visual scale as the navigation icons.
- Leave the original `/orders` navigation icons and every non-Ploy route unchanged.

## Technical approach
- Add a Ploy-only icon mapping inside the existing sidebar while retaining the current icon assets for all other routes.
- Use the existing icon library so every Ploy symbol shares consistent geometry and rendering.
- Retain accessible labels and existing links.

## Verification
- Compare the updated rail against the attached reference at the current viewport.
- Confirm consistent icon size, stroke, color, centering, and active-state rendering.
- Confirm navigation and tooltips still work, with no clipping, overflow, or console errors.
- Confirm `/orders` and `/ploy-pos` remain unchanged.
