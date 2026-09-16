# Correct the Ploy header icons

## Scope
Update only the header shown on `/ploy-pos/orders`. Keep every action, label, position, notification state, profile control, spacing, and all other routes unchanged.

## Fix Support visibility
- Replace the white raster Support artwork with a crisp outline headset icon that remains visible on the light header.
- Use the same muted warm-gray color as the other inactive header controls.
- Retain the existing circular light button, hover state, size, and Support label for accessibility.

## Match the Ploy icon language
- Replace the mismatched raster artwork for clock out, local connection, refresh, notifications, and connectivity with coordinated thin outline icons.
- Standardize optical size, rounded line caps and joins, stroke weight, muted color, and circular interaction states across the header.
- Preserve meaningful indicators, including the local connection status dot and notification count.
- Keep the colorful AI control distinct because it is a branded primary feature rather than a utility icon.
- Apply the update only when the Ploy order theme is active so the original header remains unchanged elsewhere.

## Technical details
- Use the existing icon library for recognizable utility symbols instead of filtering white PNG artwork on a light background.
- Add focused Ploy header hooks where necessary and style them through the existing scoped Ploy theme rules.
- Keep touch targets stable so replacing the artwork does not move or resize the header.

## Verification
- Check the Ploy order header at the current 1138×742 viewport and on mobile.
- Confirm Support is clearly visible and all utility icons share one consistent outline style.
- Confirm status dots, notification counts, hover states, and each existing action still work.
- Confirm there is no clipping, overflow, layout shift, or console error.
- Confirm `/orders`, `/ploy-pos`, and other pages retain their current header icons.
