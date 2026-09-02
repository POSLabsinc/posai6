# Application Tour Video v2 — Real Working Flow

Replace the current screenshot-based tour (zoom drift + slide transitions) with a screen-recorded walkthrough of the live app, matching the reference video's style: fixed camera, real UI, real interactions, no zoom, no slide.

## What changes

- No zoom/pan drift, no push/slide transitions, no still-image overlays.
- The camera stays locked on a full-screen 1920x1080 frame the whole time.
- Every step is performed for real in the running app: fields get typed into, keypads get tapped digit by digit, panels open naturally.
- A soft cursor/tap indicator follows the interaction so the viewer can see what is being pressed.
- Screens change only because the app navigates, exactly like a live demo.

## The flow (step by step)

1. Sign In — email and password typed character by character, Sign In pressed.
2. Clock In PIN — the 4 digits pressed one at a time on the PIN pad, Continue pressed.
3. Orders — category tap, product tile tap (Buffalo Wings).
4. Modifiers — modifier sheet opens, Large and Extra Napkins tapped, Add pressed.
5. Cart / Charge — cart line lands, Charge pressed.
6. Payment — card method tapped, payment completes, PAID state shown.
7. Settings — Settings opened, a section browsed.
8. Maya AI — assistant opened, prompt typed, response appears. Final hold on the assistant.

Total target length is about 60 to 75 seconds, similar to the reference.

## How it is produced

- A Playwright script drives the live preview at 1920x1080 with realistic typing delays and click pauses, plus an injected cursor dot with a press ripple (DOM overlay, so it records with the page).
- Playwright's video recording captures the session, then ffmpeg trims the dead ends, normalises to 30fps H.264, and writes the final file.
- Output: `/mnt/documents/app-tour.mp4`.
- The Remotion project stays in the repo but is no longer used for this video; nothing in the app itself is modified.

## Notes

- Any step that cannot complete in the preview (for example a blocked payment write) will be recorded up to the last real UI state rather than faked, and called out on delivery.
