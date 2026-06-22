## Issue

The signup flow currently jumps from Verify to Revenue to Mode. Two screens are missing in between (Verify to Type to Locations to Revenue to Mode). The Mode screen already knows how to read `restaurantType` from router state and auto-recommend Standard / Quick Service / Full Service (see `recommendFor` in `OnboardingAppSignupMode.tsx`), but no screen ever collects that value, so the auto-suggest never fires.

## Plan

### 1. New screen: Restaurant Type
File: `src/pages/OnboardingAppSignupRestaurantType.tsx`
Route: `/onboarding/app/signup/type`

Visual style matches the existing signup screens (mobile + landscape via `useIsLandscape`, MarketingPanel on tablet, back chevron top-left, Skip top-right, primary CTA at bottom).

Options (single-select, icon + label, 2-column grid on mobile):
- Cafe
- Quick Service
- Food Truck
- Bakery
- Cloud Kitchen
- Full Service
- Fine Dining
- Bar and Pub
- Food Court
- Other

Stores the choice as `restaurantType` (id) in `navigate(..., { state })`.
Back goes to `/onboarding/app/signup/verify`.
Next goes to `/onboarding/app/signup/locations`.

### 2. New screen: Location Count
File: `src/pages/OnboardingAppSignupLocations.tsx`
Route: `/onboarding/app/signup/locations`

Question: "How many locations do you operate?"
Options (single-select cards):
- 1 location
- 2 to 5
- 6 to 20
- 21 plus

Stores `locationCount` in state, passes through `restaurantType` and any prior fields.
Back goes to `/onboarding/app/signup/type`.
Next goes to `/onboarding/app/signup/revenue`.

### 3. Wire navigation

- `OnboardingAppSignupVerify.tsx`: forward navigation (line 180) changes from `/onboarding/app/signup/revenue` to `/onboarding/app/signup/type`.
- `OnboardingAppSignupRevenue.tsx`: back button (line 33) changes from `/onboarding/app/signup/verify` to `/onboarding/app/signup/locations`. Continue still goes to `/onboarding/app/signup/mode` and now forwards `restaurantType` and `locationCount` through state.
- `OnboardingAppSignupMode.tsx`: back button (line 155) stays at `/onboarding/app/signup/revenue`. No other change needed; `recommendFor(restaurantType)` already preselects the recommended mode and the screen already shows a "Recommended" badge.

### 4. Register routes in `src/App.tsx`
Add the two new routes alongside the other `signup/*` entries.

## Resulting flow

```text
Verify -> Type -> Locations -> Revenue -> Mode (preselected from Type) -> Trial
```

## Auto-suggest mapping (already in code, reused as is)

- Cafe, Quick Service, Food Truck, Bakery, Cloud Kitchen -> Quick Service
- Full Service, Fine Dining, Bar and Pub, Food Court -> Full Service
- Other -> Standard

## Out of scope

- No backend or schema changes. `restaurantType` and `locationCount` ride along in router state only, matching how `revenue` and `mode` are passed today.
- No copy or styling changes to Revenue or Mode beyond the navigation wiring above.
