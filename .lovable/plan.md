## Goal
Add a new `/onboarding` route to the POS app that reuses the exact visual pattern of the existing "Welcome to Point of Sale" entry screen, with a title, subtitle badge, and two action cards.

## Reference
The existing welcome screen lives in `src/pages/Login.tsx` (lines 893-964). It uses:
- Full-screen `fixed inset-0 login-bg` container with `gradient-mesh opacity-30` background overlay
- Centered column layout: `flex flex-col items-center justify-center overflow-hidden`
- Logo: `src/assets/icons/posai-logo.png` (imported as `eatosLogo` in Login.tsx)
- Heading: `text-2xl md:text-3xl font-bold text-foreground mb-2`
- Subheading: `text-sm text-foreground/40 mb-10`
- Card grid: `grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl`
- Card style: `flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left`
- Icon container: `w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0`
- Icon: `w-5 h-5 text-foreground/50`
- Card title: `text-sm font-semibold text-foreground`
- Card subtitle: `text-xs text-foreground/40 mt-0.5`
- Entrance animations via `framer-motion`

## Changes

### 1. New page: `src/pages/Onboarding.tsx`
Create a single page component that clones the welcome-screen layout exactly:
- **Container**: `fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden` with `gradient-mesh opacity-30` absolute overlay
- **Logo**: reuse `posai-logo.png`, `w-28 h-auto mb-6`, animated fade-in/scale
- **Title**: "Welcome to POSAI POS" — same heading style
- **Subtitle badge**: "Demo only — not shown in production" styled as a small muted pill using `text-foreground/40` (the dimmest text colour already in the theme) with a subtle border/background (`bg-foreground/[0.04] border border-foreground/[0.08] rounded-full px-3 py-1 text-xs`)
- **Card grid**: same `grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl`
- **Card 1 — Via website**
  - Icon: `Globe` from `lucide-react`
  - Title: "Via website"
  - Subtitle: "Already signed up on eatos.com or signing up now"
  - On tap: `navigate('/onboarding/web')`
- **Card 2 — Via App Store / Play Store**
  - Icon: `Smartphone` from `lucide-react`
  - Title: "Via App Store / Play Store"
  - Subtitle: "Downloaded the app and setting up for the first time"
  - On tap: `navigate('/onboarding/app')`
- All colours, typography, spacing, border-radius, and hover states must match the reference exactly.

### 2. New placeholder pages
Create minimal placeholder pages so the card navigations resolve:
- `src/pages/OnboardingWeb.tsx`
- `src/pages/OnboardingApp.tsx`
Each can be a simple centred "Coming soon" text using the same full-screen background pattern, or a minimal placeholder that does not introduce new styles.

### 3. Route registration in `src/App.tsx`
Add three new lazy-loaded routes inside `<Routes>`, placed after the existing `/login` route:
- `<Route path="/onboarding" element={<Onboarding />} />`
- `<Route path="/onboarding/web" element={<OnboardingWeb />} />`
- `<Route path="/onboarding/app" element={<OnboardingApp />} />`
Import the lazy wrappers at the top of the file following the existing pattern.

### 4. Layout auth-route treatment in `src/components/Layout.tsx`
Update the `isAuthRoute` check so `/onboarding` and its children render without the standard Layout chrome (no Header, Sidebar, BottomNavigation, ClockInOverlay). Change the exact-path check to a path-prefix check that covers `/login`, `/signup`, `/clock-in`, and `/onboarding`.

## Constraints
- Do not modify the existing `/login` page, its routes, or any other existing screen/component.
- Do not add new colour values, hex codes, or Tailwind arbitrary values not already present in the project.
- Do not change `AppearanceContext`, theme tokens, or `tailwind.config.ts`.
- Reuse existing logo asset (`posai-logo.png`) and Lucide icons (`Globe`, `Smartphone`).