I found the cause: the current signup flow still starts at `/onboarding/app/signup/lookup`, then reaches `account`, then `verify`, then `business-type`. So after tapping Create account, the app can still appear to be on the restaurant lookup path because lookup remains the entry point and account only preserves `place`, not the newer onboarding context.

Plan:
1. Update `/onboarding/app/signup-signin` signup navigation so new signup enters `/onboarding/app/signup/account` first, not `/onboarding/app/signup/lookup`, if that is where Create account is launched from.
2. Update `OnboardingAppSignupAccount` to preserve all incoming onboarding state when navigating to `/onboarding/app/signup/verify`, instead of passing only `place`, `email`, `country`, `demo`, and `intent`.
3. Update account back navigation to return to the previous onboarding step when available, keeping changes scoped to `/onboarding` only.
4. Verify in browser that tapping Create account leads to `/onboarding/app/signup/verify`, OTP verification leads to `/onboarding/app/signup/business-type`, then selected business type leads to the matching lookup screen.