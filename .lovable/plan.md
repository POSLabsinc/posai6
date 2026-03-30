

## Plan: Add "Sign in with Link" to Company Device Manual Activation

### What Changes

The company device manual activation screen (the screen that says "This device is not yet linked to a business. Choose how to activate it.") currently only shows one primary option: **Activate with Code**. We will add a second option: **Sign in with Link**, directly below "Activate with Code."

### Technical Details

**File: `src/pages/Login.tsx`** (around lines 3302-3304)

- After the "Activate with Code" button and before the closing `</motion.div>` of the primary options section, add a new button for "Sign in with Link"
- The button sets `activationMethod` to `"link"` on click, reusing the existing `activationMethod === "link"` sub-screen (line 2012) which already handles the full magic link flow with email/phone toggle, send link, and confirmation
- Style the button consistently with the "Activate with Code" button, using a `Link2` icon with a distinct color (e.g., blue/violet tones)

No new components, routes, or logic needed. The existing magic link sub-screen already works for company device context.

