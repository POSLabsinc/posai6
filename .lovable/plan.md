## Problem

On the Revenue selection screen, the back button navigates to `/onboarding/app/signup/profile`, which is not a registered route in `src/App.tsx`. That triggers the catch-all NotFound page (404).

The actual previous step in the flow is the Verify screen (`OnboardingAppSignupVerify.tsx`), which is the screen that navigates forward to `/onboarding/app/signup/revenue`.

## Fix

In `src/pages/OnboardingAppSignupRevenue.tsx` (line 33), change the back button target from `/onboarding/app/signup/profile` to `/onboarding/app/signup/verify` so it returns to the correct prior step.

No other changes required.