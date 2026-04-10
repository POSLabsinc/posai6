

# Plan: Context-Aware AI Assistant with Auto-Welcome Messages

## What Changes
When the user opens the AI Assistant while on the System or Payments settings page (or any sub-page), the assistant will automatically display a contextual welcome message with actionable quick-reply buttons showing what can be done in that section. When a sub-menu is selected, it drills down to show further options.

## Implementation

### 1. Add auto-welcome message on context change
In `src/components/settings/AISettingsContent.tsx`, add a `useEffect` that fires when the `context` prop is set and `messages` is empty. It will inject an initial assistant message with:
- A contextual greeting (e.g., "You're in **System** settings. Here's what you can configure:")
- Quick reply buttons matching the `SETTINGS_HIERARCHY` children for that context (e.g., System shows: Appearance, Control Center, AI Integration)
- A "Go to System" navigation option

### 2. Define context-to-hierarchy mapping
Add a mapping from context strings to their hierarchy keys:
- `system` maps to `"System"` in `SETTINGS_HIERARCHY`
- `payments` maps to `"Payments"` in `SETTINGS_HIERARCHY`

This reuses the existing `SETTINGS_HIERARCHY` and `handleSettingsQuickReply` drill-down logic.

### 3. Add sub-context chips for deeper pages
Extend `contextChipsMap` with sub-route contexts (e.g., `system-appearance`, `payments-taxes`) so that when the user is on a sub-page, the AI shows relevant actions for that specific section.

Update the `aiContext` derivation in `src/pages/Settings.tsx` to produce more granular context strings for sub-routes (e.g., `/settings/payments/taxes` produces `payments-taxes`).

### 4. Add sub-route suggestion chip sets
Create new chip sets for key sub-pages:
- **Appearance**: "Change theme", "Adjust text size", "Toggle bold text", "Icon style"
- **Control Center**: "Toggle KDS", "Set auto-lock", "Force clock-in", "Debug mode"
- **Taxes**: "Add new tax", "View active taxes", "Change tax type"
- **Discounts**: "Add discount", "View active discounts", "Set PIN requirement"
- **Gratuity**: "Set tip presets", "Auto-gratuity rules", "Enable/disable tips"
- **Checkout Options**: "Toggle quick amounts", "Split check", "Signature settings"
- **Payment Methods**: "Enable/disable methods", "View active methods"

### Files Modified
1. **`src/components/settings/AISettingsContent.tsx`**
   - Add `useEffect` for auto-welcome message based on context
   - Add context-to-hierarchy mapping
   - Add sub-route suggestion chip sets to `contextChipsMap`

2. **`src/pages/Settings.tsx`**
   - Refine `aiContext` derivation to produce granular sub-route contexts

