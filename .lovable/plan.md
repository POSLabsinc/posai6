Add an empty-state placeholder to the `/onboarding/app/signup/lookup` screen, shown only when the search input is empty and no results are rendered.

## What to add

In `src/pages/OnboardingAppSignupLookup.tsx`, inside the results area (below the search input), when `query.trim() === ""` and there are no results, render:

1. A rounded-square glass tile (approx 96x96, rounded-2xl) containing a storefront icon (`Store` from lucide-react) in the existing muted/primary token color already used in the project.
2. Heading: "Start typing to find your restaurant" (two lines on mobile, centered, existing heading token).
3. Subtext: "We'll pull your name, address, and business type automatically." (centered, muted token).

Vertically centered in the available space between the search bar and the bottom "My restaurant isn't on Google yet" link.

## Constraints

- Portrait and landscape both supported using the existing `isLandscape` logic already in the file.
- No new colors, hex values, or fonts. Reuse existing tokens (`text-foreground`, `text-muted-foreground`, `bg-card`/glass utility already used elsewhere on this screen).
- No apostrophe rewrite needed beyond standard `'` (no em dashes).
- Only this file changes. No routing, no logic changes to search/fetch.
