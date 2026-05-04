## Update QR Code Copy on Activation Screen

Update two pieces of static copy related to the "Scan this QR code" section on the Login/Activation screen.

### Changes

**1. `src/pages/Login.tsx`** — replace QR description (appears twice, lines 1266 and 7564)

- From: `Point your phone or tablet camera at the QR code.`
- To: `Scan the QR code below using your mobile or tablet camera.`

**2. `src/components/DeviceSetupTutorialOverlay.tsx`** — update the help bullet (line 24) shown when the user clicks the (i) Info icon next to "Option 1"

- From: `Open the camera app on your phone or tablet and point it at the QR code displayed on this screen.`
- To: `Open the camera app on your phone or tablet and scan the QR code displayed on this screen.`

No other UI, layout, or logic changes. Heading "Scan this QR code" stays the same.

> Tip: simple text edits like these can be made instantly for free using **Visual Edits** (pencil icon at the bottom-left of the chat box) — just click the text on the preview and retype.
