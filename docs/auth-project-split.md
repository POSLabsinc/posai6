# Splitting Auth/Onboarding Into a Separate Project

This POS project is being split so that **sign up, sign in, OTP, device
activation, and onboarding** live in a separate Lovable project named
**`posai-auth`**. That auth project ships three ways:

- Website (browser sign-in/sign-up + marketing/legal pages)
- iOS app (App Store) via Capacitor
- Android app (Play Store) via Capacitor

This POS project becomes "what you see *after* you're signed in."

## Architecture

```
posai-auth (new)                  posai-pos (this project)
─────────────────                 ─────────────────────────
Landing / Sign Up / Sign In       /handoff route
OTP, device pair, onboarding ───► exchange-handoff-token EF
Own Lovable Cloud backend         Own Lovable Cloud backend
```

Both projects share a secret `POSAI_HANDOFF_SECRET`. The auth project mints
a short-lived JWT after a successful sign-in and redirects the browser to
`https://<pos-domain>/handoff?token=...&return_to=/`. This project verifies
the token and creates a local Cloud session.

## What's already done in THIS project

- `src/pages/Handoff.tsx` - the `/handoff` route (already registered in App.tsx)
- `supabase/functions/exchange-handoff-token/` - verifies JWT, sets session
- Requires secret: **`POSAI_HANDOFF_SECRET`** (add via Cloud secrets)

## Steps to create the new auth project

1. Dashboard, **+ New project**, name it `posai-auth`. Enable Lovable Cloud.
2. In the new project's chat, mention this project to pull source:
   ```
   @posai-pos copy these files as a starting point:
     src/pages/Onboarding*.tsx
     src/pages/Login.tsx
     src/components/onboarding/**
     src/components/auth/**
     src/index.css
     tailwind.config.ts
     src/assets/logo*
   ```
3. Enable Email/password + Google auth (Lovable Cloud default).
4. Add these edge functions in the new project:
   - `send-otp`, `verify-otp`
   - `verify-device-code`
   - `request-account-deletion` (required for App Store / Play Store)
   - `issue-handoff-token` - mints HS256 JWT after sign-in, 60s TTL,
     payload `{ sub, email, device_id, iat, exp, aud: "posai-pos" }`,
     signed with `POSAI_HANDOFF_SECRET`.
5. After successful sign-in, redirect to:
   `https://<pos-domain>/handoff?token=<jwt>&return_to=/`
6. Add public pages required by stores: Home, Privacy Policy, Terms,
   Support/Contact, Account Deletion request.
7. Wrap with Capacitor for iOS/Android builds (see the Capacitor knowledge
   in this workspace). `npx cap sync`, build in Xcode/Android Studio,
   submit to stores.

## Shared secret

Generate one strong secret and add it to BOTH projects:

```
POSAI_HANDOFF_SECRET = <64+ random chars>
```

Use it on the auth side to **sign** the JWT and on this POS side to
**verify** it.

## Removing auth from this POS project (later)

Once the auth project is live and the handoff flow is verified:

1. Replace the unauthenticated entry of this app with a redirect to
   `https://<auth-domain>/?return_to=<current-url>`.
2. Delete the `OnboardingApp*`, `OnboardingWeb*`, `Login`, and related
   pages from this project.
3. Keep `/handoff` and `exchange-handoff-token` - they are the contract.

## Notes

- Backends are separate (your choice). Users created in the auth project
  do not exist in this POS project until the first handoff. The exchange
  function will create them automatically on first sign-in via
  `auth.admin.generateLink`.
- If you need existing POS users to continue working, export them from
  this project first and import into the new auth project before flipping
  the redirect.
- `scripts/setup-backend.mjs` can be reused inside the new project for
  remix recovery.
