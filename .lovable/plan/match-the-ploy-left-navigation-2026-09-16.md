# Match the Ploy left navigation

## Scope
Update only the left navigation shown on `/ploy-pos/orders`. Keep the existing destinations, icon order, tooltips, drag and lock behavior, page layout, header, catalog, and order panel unchanged.

## Visual changes
- Match the attached in-app reference with a narrow warm-cream navigation rail and a subtle right divider.
- Remove the current floating white card treatment, outer shadow, and oversized rounded container from the rail.
- Place the restaurant logo in a distinct top area with the same compact proportions and separation shown in the reference.
- Style inactive navigation icons as clean muted gray symbols with transparent backgrounds and no outlines.
- Style only the current route as a raised white rounded tile with the Ploy terracotta icon treatment, subtle border, and restrained shadow.
- Restyle the drag and lock controls so they blend into the same rail rather than appearing as dark controls.
- Preserve the existing icon assets and functionality unless an asset cannot reproduce the reference cleanly; in that case, use the closest existing line icon without changing its destination.
- Keep the navigation isolated to the Ploy order route so `/orders`, `/ploy-pos`, and all other pages remain unchanged.

## Technical approach
- Add explicit Ploy-specific hooks to the existing sidebar where needed instead of relying on image filenames or broad CSS matching.
- Apply the rail dimensions, surfaces, icon states, and separators through the existing Ploy theme stylesheet.
- Do not alter stored sidebar position or application data.

## Verification
- Compare the result against the attached navigation reference at the current 1138×698 viewport.
- Check desktop and mobile behavior, active and inactive states, tooltips, drag and lock controls, and route navigation.
- Confirm there is no overflow, clipping, dark leftover styling, or console error.
- Confirm the original `/orders` navigation and the Ploy Dashboard remain visually unchanged.
