# Application Tour Video (Login to Maya AI)

A rendered 1920x1080 MP4, about 45 seconds, built from real screenshots of the live product. No captions, no subtitles, no marketing text: screens only, with smooth transitions and a realistic touch effect at each interaction point.

## Flow shown in the video

1. Login: the dark sign-in screen from the onboarding link, exactly as-is
2. Select Product: Orders screen, tap on a product tile
3. Add Modifiers: modifier screen, tap two modifier options
4. Payment: checkout screen, tap the charge/pay action
5. Settings: settings interface with a slow drift across the panels
6. Maya AI: AI Integration screen with a subtle glow emphasis as it appears

## How the screens are captured

- Login frames come from https://posaionboarding.lovable.app/eatos/signup/dark/sq
- All other frames come from the live app preview: Orders, the modifier sheet, checkout, Settings, and the Maya AI section under Settings > System > AI Integration
- Each step is captured as a before-tap and after-tap pair so the video shows the real UI reacting, never a redrawn or redesigned version of it

## Motion design

- Touch effect: a soft circular finger press with an expanding ripple, landing on the exact pixel coordinate of the real control
- Transitions: consistent push/fade between steps, no fade-to-black
- Camera: slow scale and pan drift within each step so nothing feels static
- Maya AI: extra emphasis with a short vignette pull-in and a soft accent glow around the panel
- Pacing: roughly 7 to 8 seconds per step, Payment and Maya AI held slightly longer

## Technical notes

- Playwright drives the login URL and the local preview to capture PNG frames plus the click coordinates for each interaction
- Remotion project under `remotion/` renders the composition; all motion is frame based (`interpolate` / `spring`), scenes split into one file per step
- Output written to `/mnt/documents/app-tour.mp4` at 1920x1080, 30fps
- Silent video (no soundtrack), since no narration or captions were requested
- No application source files are modified; the tour is built from screenshots only

## Security work included in this pass

Alongside the video, three database access issues are fixed so business and order data is no longer readable by unauthenticated visitors:

- `merchants`, `brands`, `resellers`: remove public read of contact and revenue data, restrict to signed-in owners/admins
- `stores`: remove public create/read/update/delete, restrict to signed-in merchant-scoped users
- `ticket_orders` and `ticket_order_items`: remove public access to guest and payment data, restrict to signed-in merchant-scoped users
