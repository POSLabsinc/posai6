## Goal

Bring every signup screen's landscape layout in line with `OnboardingAppSignupLookup`: a left "Marketing & promotional content" skeleton panel and a right panel that mirrors the mobile flow (back button, title, subtitle, body, actions).

## Scope (all 11 signup screens)

1. OnboardingAppSignupAccount
2. OnboardingAppSignupMode
3. OnboardingAppSignupModeDetail
4. OnboardingAppSignupModeFullService
5. OnboardingAppSignupModeQuickService
6. OnboardingAppSignupModeStandard
7. OnboardingAppSignupRevenue
8. OnboardingAppSignupVerify
9. OnboardingAppSignupTrial
10. OnboardingAppSignupUpgrade
11. OnboardingAppSignupDemo
12. OnboardingAppSignupSignin
13. OnboardingAppSignupManual

(Lookup already done, used as reference.)

## Implementation approach

### 1. Extract a shared marketing panel

Create `src/components/onboarding/MarketingPanel.tsx` that renders the same skeleton block currently inlined in Lookup:

- Dashed-bordered square using `LookupPlaceholder` image with "Coming Soon" overlay
- Heading: "Marketing & promotional content"
- Subtext: per-screen contextual caption via a `caption` prop (falls back to a generic line)
- Optional `eyebrow` prop for a small screen label (e.g. "Account preview", "Mode preview")

Refactor `OnboardingAppSignupLookup.tsx` to consume this shared component so styling stays in one place.

### 2. Per-screen captions

| Screen | Eyebrow | Caption |
|---|---|---|
| Account | Account preview | Sets up the owner profile, contact details, and primary login. |
| Mode | Service mode preview | Choose how your venue serves guests: full, quick, or standard. |
| ModeDetail | Mode details preview | Refines table count, service flow, and staff structure. |
| ModeFullService | Full service preview | Configures dine-in tables, servers, and course-paced ordering. |
| ModeQuickService | Quick service preview | Optimizes counter ordering, pickup, and high-volume throughput. |
| ModeStandard | Standard preview | Balanced setup for hybrid table and counter service. |
| Revenue | Revenue preview | Calibrates pricing tier and feature mix to your sales volume. |
| Verify | Verification preview | One-time code confirms your email or phone before continuing. |
| Trial | Trial preview | Activates the free trial with full Point of Sale features. |
| Upgrade | Plan preview | Compares plans and unlocks advanced modules. |
| Demo | Demo preview | Loads a sample venue so you can explore Point of Sale instantly. |
| Signin | Sign in preview | Returning users authenticate by device code, link, or demo. |
| Manual | Manual entry preview | Enter restaurant details when Google listing isn't available. |

### 3. Landscape layout per screen

For each screen's existing `if (isLandscape)` block, replace the body with the same two-column shell used in Lookup:

```text
+---------------------------+--------------------------------+
| MarketingPanel (45%)      | Right panel (55%, flex col)    |
|                           |   backBtn                      |
|                           |   title                        |
|                           |   subtitle                     |
|                           |   <mobile body, scroll area>   |
|                           |   primary actions / footer     |
+---------------------------+--------------------------------+
```

Right panel uses `px-6 py-6 flex-1 min-h-0` with the same paddings/safe-area handling as Lookup. The internal element order (back > title > subtitle > body > actions) must match the screen's mobile order exactly. No business logic, validation, navigation, or copy changes.

### 4. Constraints

- No em dashes anywhere.
- Reuse existing JSX fragments (backBtn, title, subtitle, actions) where the screen already defines them; otherwise extract them locally for reuse between portrait and landscape.
- Keep portrait/mobile layouts untouched.
- No new images generated (reuse `lookup-placeholder.png`) to stay credit-efficient.
- Use `useIsLandscape` (already imported on every target screen).

### 5. Verification

After edits, run the dev build (auto) and spot-check 3 screens (Account, Mode, Verify) in landscape via Playwright screenshots at 1280x800 to confirm the split layout and captions render correctly.
