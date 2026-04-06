

## Plan: Fix Context-Aware AI Suggestions Per Settings Tab

### Problem
The Header's AI icon always navigates to `/settings/ai-assistant` route with a one-time context from `location.state`. This means:
- Context is set once and never updates when switching tabs
- Sidebar tab clicks navigate away from the AI assistant entirely
- The Settings page already has a working inline AI chat mode (`showAIChat`) that dynamically derives context from the current pathname, but the Header bypasses it

### Solution
Instead of navigating to a separate `/settings/ai-assistant` route from the Header, trigger the Settings page's inline AI chat mode when the user is on any settings page. This reuses the existing `getContentForRoute` logic that already maps pathnames to correct context.

### Changes

**1. Store AI chat state globally** (new approach)
- Use a lightweight global event or a shared ref/context so the Header can tell the Settings page to open its inline AI chat
- Option: Use a custom event `open-settings-ai-chat` that the Settings page listens for

**2. Edit `src/components/Header.tsx`**
- When on a `/settings/*` path (but not `/settings/ai-assistant`), dispatch a custom event instead of navigating
- For non-settings paths, keep current navigation behavior

**3. Edit `src/pages/Settings.tsx`**
- Listen for the custom event and call `setShowAIChat(true)` when received
- The existing `getContentForRoute` already derives the correct context from `location.pathname` (lines 274-285), so suggestions will automatically match the active tab

**4. Edit `src/pages/Settings.tsx` - `getContentForRoute`**
- Add missing `account` context mapping (currently missing from lines 274-285, but exists in the Header and `contextChipsMap`)

### How It Works After Fix
1. User is on `/settings/system` and clicks AI icon in Header
2. Header dispatches `open-settings-ai-chat` event
3. Settings page receives event, sets `showAIChat = true`
4. `getContentForRoute` sees `pathname = /settings/system`, sets `aiContext = 'system'`
5. AI assistant shows system-specific suggestions
6. User clicks "Payments" in sidebar - navigates to `/settings/payments`, `showAIChat` resets
7. User clicks AI icon again - now shows payments suggestions

### Technical Details
- Custom DOM event pattern keeps components decoupled without adding a new context provider
- No new dependencies needed
- Existing `contextChipsMap` already has all tab mappings (system, menu, payments, workforce, account, etc.)

