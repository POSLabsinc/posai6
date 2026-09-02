# Application Tour Video - Live Screen Recording

A real screen recording of the running Point of Sale app, same style as the CFD video: fixed camera, no zoom, no slide transitions, no screenshots. Every screen change happens because the app actually navigates. A soft touch indicator with a press ripple shows each tap.

## Flow captured, step by step

1. Sign In - email and password typed character by character, Sign In pressed.
2. Clock In PIN - the 4 digits pressed one at a time on the PIN pad, Continue pressed.
3. New Order - order type / guest selected, Orders screen opens.
4. Select Product - category tapped, product tile tapped.
5. Modifiers - modifier sheet opens, two options tapped, Add pressed.
6. Cart and Charge - the line lands in the cart, Charge pressed.
7. Payment - payment method tapped, payment completes, PAID state shown.
8. Receipt - receipt dialog opens, receipt options shown, dialog closed.
9. Settings - Settings opened, a section browsed.
10. Maya AI - AI Integration opened, a prompt typed, response appears. Final hold here.

Target length is roughly 70 to 90 seconds.

## Motion and look

- Camera locked on a full 1920x1080 frame for the whole video. No zoom, no pan, no slide, no fade-to-black.
- Touch effect: a translucent circular finger press with an expanding ripple, drawn as an overlay inside the page so it records naturally with the UI.
- Pacing: realistic typing speed, a short pause after each tap so the viewer can read the screen state.
- Silent video, no captions or marketing text, screens only.

## How it is produced

- A Playwright script drives the live preview at 1920x1080 with human-like typing and click delays, injecting the cursor/ripple overlay into the DOM.
- Playwright video recording captures the session; ffmpeg trims dead ends and normalises to 30fps H.264.
- Output written to `/mnt/documents/app-tour.mp4`.
- No application source files are modified. The Remotion project stays in the repo but is not used for this render.

## Notes

- If a step cannot complete in the preview (for example a blocked payment or receipt write), it is recorded up to the last real UI state rather than faked, and called out on delivery.
