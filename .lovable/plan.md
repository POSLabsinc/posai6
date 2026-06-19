I’ll make the section label itself render as a block with an explicit very-tight line-height, instead of relying on inline span line-height. Specifically:

1. Update the section label wrapper for labels like “Guests and reservations” so the text box height is controlled by the label, not the parent grid row.
2. Change the label from inline `span` behavior to block/inline-block behavior with tight line-height (`leading-[0.85]` or equivalent), keeping natural wrapping.
3. Keep the existing compact section and row spacing unchanged except for the wrapped label line gap.
4. Verify the “GUESTS AND / RESERVATIONS” spacing visually on the mobile mode screen.