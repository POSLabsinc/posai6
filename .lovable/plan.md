## Scope

Apply the same landscape two-column layout (used in signup flow) to the 6 sign-in flow screens:

1. `OnboardingAppSignin.tsx`
2. `OnboardingAppSigninForgot.tsx`
3. `OnboardingAppSigninForgotVerify.tsx`
4. `OnboardingAppSigninForgotReset.tsx`
5. `OnboardingAppSigninForgotSuccess.tsx`
6. `OnboardingAppSigninSuccess.tsx`

## Pattern (mirrors signup flow)

In each screen's existing `if (isLandscape)` block, render a two-column shell:

- Left 45%: `<MarketingPanel eyebrow="..." caption="..." />` (reuse existing `src/components/onboarding/MarketingPanel.tsx`)
- Right 55%: existing functional content (back button, title, subtitle, body, actions) stacked vertically, mirroring the mobile/portrait flow, `px-6 py-6 flex-1 min-h-0` with internal scroll

No changes to portrait/mobile layouts. No business logic, validation, routing, or copy changes inside the right column.

## Per-screen captions

| Screen | Caption |
|---|---|
| Signin | Returning users sign in with email, phone, or device code. |
| SigninForgot | Enter your email or phone to receive a reset code. |
| SigninForgotVerify | One-time code confirms your identity before resetting. |
| SigninForgotReset | Choose a new password to secure your account. |
| SigninForgotSuccess | Password updated. You can now sign in again. |
| SigninSuccess | You are signed in. Continuing to your workspace. |

Eyebrow stays consistent with signup flow ("Point of Sale" or current default in `MarketingPanel`).

## Constraints

- Reuse `MarketingPanel`, do not create new components or images.
- No em dashes anywhere.
- Keep portrait branches untouched.
- Use existing `useIsLandscape` hook.
- Smallest possible diff per file.

## Verification

Spot-check 2 screens (`Signin`, `SigninForgotVerify`) in landscape at 1280x800 via Playwright screenshot after build.
