
# Plan: Move Sign Up / Sign In / Onboarding Into a Separate Project

The new project will own the entire entry experience for POS AI across web, iOS (App Store), and Android (Play Store). This POS project stays focused on the actual point-of-sale workspace and is entered only after a user is already authenticated.

## What the new project will contain

- Landing / welcome screen ("Welcome to Point of Sale", New User vs Existing User tabs)
- Sign Up flow (email/phone, 6-digit OTP auto-verify, device name step)
- Sign In flow (Activate with Code, Sign in with Link, Try Demo Mode)
- Device activation + pairing screens (QR code, posai.com/pair)
- Onboarding (AI-driven multi-phase, "POSAI Checking", tutorial spotlight)
- Clock-in pinpad entry (handoff target after auth)
- Marketing-style public pages needed for App Store / Play Store listings: Home, Privacy Policy, Terms, Support, Account Deletion (required by Apple/Google)
- Capacitor wrapper so the same project ships as iOS + Android app builds

## What stays in this POS project

- All POS functionality (tickets, tables, KDS, payments, settings, reports)
- A thin "auth guard" at the app shell that redirects unauthenticated users to the new auth project
- A `/handoff` route that accepts the session/token from the auth project and stores it locally

## Architecture

```text
   ┌─────────────────────────┐        ┌──────────────────────────┐
   │  POSAI Auth (new)       │        │  POSAI POS (this project)│
   │  Web + iOS + Android    │        │  Web + tablet POS        │
   │                         │        │                          │
   │  - Landing              │        │  - Workspace             │
   │  - Sign Up / Sign In    │ ─────▶ │  - Tickets / Tables      │
   │  - OTP / Device pair    │ token  │  - Payments / KDS        │
   │  - Onboarding           │        │  - Settings / Reports    │
   │  - Clock-in pinpad      │        │                          │
   │                         │        │                          │
   │  Own Lovable Cloud      │        │  Own Lovable Cloud       │
   └─────────────────────────┘        └──────────────────────────┘
```

Because you chose a separate backend, the auth project will have its own users table. The POS project will treat the auth project as an identity provider: after sign-in, the auth project redirects to a POS handoff URL with a short-lived signed token, and the POS project exchanges it via an edge function for a local session record.

## Steps

1. Create a new blank Lovable project named `posai-auth` with Lovable Cloud enabled (own backend).
2. From the new project, use cross-project `@mentions` against this POS project to pull only the auth/onboarding source: `src/pages/auth/**`, `src/pages/onboarding/**`, sign-in/sign-up components, OTP input, phone input, device activation screens, splash/landing, and shared design tokens (`index.css`, `tailwind.config.ts`, Montserrat setup, liquid-glass utilities, logo assets).
3. In the new project, rebuild Lovable Cloud auth from scratch (email/password + Google by default per Cloud auth rules), recreate any auth-related edge functions (OTP issue/verify, device pairing), and add a `POST /issue-handoff-token` edge function that mints a short-lived signed JWT after successful sign-in.
4. Add the public marketing/legal pages required for store submissions: Home, Privacy Policy, Terms of Service, Support / Contact, and Account Deletion request flow.
5. Wrap the new project with Capacitor (appName `posai-auth`, appId reserved for store builds) so the same codebase ships to App Store and Play Store. Web build serves the website.
6. In this POS project, add a `/handoff` route + edge function that accepts the signed token from the auth project, verifies it, and creates a local session; redirect unauthenticated users to the auth project's sign-in URL with a `return_to` parameter.
7. Remove the auth/onboarding screens from this POS project once the redirect handoff is verified end to end on web, iOS simulator, and Android emulator.
8. Update documentation: which project owns sign-up, where users are created, how store submissions are built from the auth project, and how the POS project consumes the handoff token.

## Notes and trade-offs

- Separate backend means existing POS users are not automatically present in the new auth project. If you want existing users to keep working, we will need a one-time migration (export from this project's `auth.users` + profiles, import into the new project) before flipping the redirect. Tell me if you want that included and I will add it.
- Capacitor store submissions still require you to run `npx cap sync` and build in Xcode / Android Studio locally; Lovable cannot publish to App Store / Play Store directly.
- The earlier `scripts/setup-backend.mjs` recovery script can be reused inside the new auth project to recreate its own schema/functions in any future remix.

## Technical details

- Handoff token: HS256 JWT, 60-second TTL, payload `{ sub, email, device_id, iat, exp, aud: "posai-pos" }`, signed with a shared secret stored as `POSAI_HANDOFF_SECRET` in both projects' edge function secrets.
- Auth project redirect: `https://pos.<domain>/handoff?token=...&return_to=...`.
- POS project guard: top-level route component checks Lovable Cloud session; if absent, `window.location.replace("https://auth.<domain>/?return_to=" + encodeURIComponent(currentUrl))`.
- Edge functions to add in auth project: `issue-handoff-token`, `verify-device-code`, `send-otp`, `verify-otp`, `request-account-deletion`.
- Edge function to add in POS project: `exchange-handoff-token` (verifies JWT, sets Lovable Cloud session cookie).
- Shared design tokens copied as-is to keep visual parity (Montserrat, liquid glass, dark theme HSL 220 15% 11%, 14px root, no em dashes).
