

## Plan: Context-Aware AI Assistant Suggestions Based on Active Settings Tab

### Problem
The AI assistant already has context-based suggestion chips defined for most sidebar tabs (system, payments, menu, etc.), but two things need fixing:
1. **Missing `workforce` context chips** - no suggestion chips defined for the Workforce tab
2. **Header AI icon doesn't pass context** - clicking the AI icon from the header navigates to `/settings/ai-assistant` without passing the current settings context, so suggestions default to generic ones
3. The context mapping needs to work seamlessly so that when the AI assistant opens from any settings screen, it shows relevant suggestions for that tab

### What Changes

**1. Add missing context chip sets** (`src/components/settings/AISettingsContent.tsx`)
- Add `workforceSuggestionChips` array with relevant prompts (e.g., "View employees", "Manage shifts", "Time tracking settings", "Roles and permissions")
- Add `accountSuggestionChips` for the Account tab (e.g., "Personal info", "Restaurant info", "Security settings")
- Register both in `contextChipsMap`

**2. Fix Header AI icon to use in-page AI chat instead of route navigation** (`src/components/Header.tsx`)
- When on a `/settings/*` route, clicking the AI icon should trigger `showAIChat` state in the Settings page rather than navigating to `/settings/ai-assistant`
- This ensures the context (current pathname) is used to pick the right suggestion chips
- For non-settings pages, keep existing behavior (navigate to `/settings/ai-assistant`)

**3. Alternatively, pass context via route state** (`src/components/Header.tsx` + `src/components/routes/AISettingsRoute.tsx`)
- Simpler approach: When on settings pages, the Header AI icon navigates to `/settings/ai-assistant` with the current context as route state
- The `AISettingsRoute` already reads `context` from `location.state` and passes it to `AISettingsContent`
- Just need to derive the context from the current pathname in the Header and pass it

### Recommended Approach (Option 3 - simpler)

**File: `src/components/Header.tsx`** (line ~232)
- Derive settings context from `location.pathname` (same logic as in `Settings.tsx` lines 274-285)
- Pass it as route state: `navigate('/settings/ai-assistant', { state: { context } })`

**File: `src/components/settings/AISettingsContent.tsx`**
- Add `workforceSuggestionChips` and `accountSuggestionChips` arrays
- Add entries to `contextChipsMap` for `workforce` and `account`

### Technical Details
- The `contextChipsMap` already handles: menu, system, payments, end-of-day, guest-book, support, network, hardware, notifications, reports
- Need to add: workforce, account
- Manual typing in the chat will continue to work for any settings action regardless of which tab suggestions are shown - the edge function handles all settings operations

