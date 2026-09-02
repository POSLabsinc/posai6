# Application Tour Video v3 - Correct Sign In, Clock In, Smooth Cuts

Re-record the tour so it opens on the real eatOS sign-in screen, shows a proper Clock In action on the PIN pad, and plays as one smooth take with no white flashes between screens.

## What changes

1. **Sign-in screen**
   Record the actual hosted sign-in page at `https://posaionboarding.lovable.app/eatos/signup/dark/sq` (the dark eatOS layout in the reference image: product panel on the left, "Sign in" with Email or Mobile Number, Password, Sign in button, QR code / Magic link row). Email and password are typed character by character, then Sign in is pressed. The recording then continues into the local preview for the rest of the flow, cut so the join is invisible.

2. **No white patches / white flash**
   - Force a dark page background on the recording context so any paint gap renders dark instead of white.
   - Wait for fonts, images and the first stable frame before each screen change, so no half-painted white panel is captured.
   - Cross-cut between segments on matching dark frames instead of hard cuts.

3. **Clock In on the number pad**
   The PIN pad action button reads **Clock In** instead of Enter/Continue, and the video shows the full clock-in flow: PIN digits tapped one at a time, Clock In pressed, clock-in confirmation state, then into the POS.

4. **Smoothness**
   - Constant 30fps, no dropped frames, ffmpeg re-encode with a fixed frame rate and CRF 18.
   - Slightly longer settle pauses after each tap so screens read cleanly.
   - Same soft cursor with press ripple, fixed camera, no zoom, no slides.

## Flow (unchanged apart from the above)

Sign In (hosted eatOS screen) -> Clock In PIN pad -> New Order / order type -> guest details -> product -> modifiers -> Charge -> Card payment -> PAID -> Receipt -> Settings -> AI Integration (Maya AI).

## Technical notes

- One app source change: the clock-in PIN pad button label becomes "Clock In" (`src/components/ClockInOverlay.tsx`, currently "Continue"). Everything else is recording-side only.
- Playwright records at 1920x1080 with `--force-dark` style injection (`html,body{background:#0b0b0c}`) and `page.wait_for_load_state("networkidle")` plus a font-ready check before each capture point.
- Two recorded segments (hosted sign-in, local app) concatenated with ffmpeg `concat` on identical codec/fps settings, trimmed at dark frames.
- Output overwrites `/mnt/documents/app-tour.mp4`.
