

# Fix Smooth Content Transition on Answer Selection

## Problem
When clicking "Yes, I'm New" or "No, I'm Not", the entire view hard-cuts from the initial branding layout to the messages view. The `currentStep` and `messages` state update simultaneously, causing an instant swap between the two conditional branches (line 680: `currentStep === "initial" ? ... : ...`). No exit animation on the initial view, and the scroll jumps instantly via `scrollTop = scrollHeight`.

## Fix

### 1. Wrap the initial/messages conditional in `AnimatePresence` (line ~679-747)
Replace the bare conditional with `AnimatePresence mode="wait"` so the initial view fades/slides out before the messages view fades/slides in.

```tsx
<AnimatePresence mode="wait">
  {currentStep === "initial" ? (
    <motion.div key="initial" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} ...>
      {/* branding + question */}
    </motion.div>
  ) : (
    <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} ...>
      {/* messages list */}
    </motion.div>
  )}
</AnimatePresence>
```

### 2. Increase stagger delay for message animations (line ~757)
Currently messages use `delay: index * 0.08`. Increase to `index * 0.15` so they appear one-by-one more visibly rather than nearly simultaneously.

### 3. Smooth scroll instead of instant jump (line ~152)
Replace `scrollRef.current.scrollTop = scrollRef.current.scrollHeight` with:
```tsx
scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
```

### 4. Add smooth scroll CSS to the scroll container (line ~679)
Add `scroll-behavior-smooth` or inline style `scrollBehavior: 'smooth'` to the scroll div.

## Files Changed
- `src/components/DeviceSetupAIChat.tsx` — All changes in one file

