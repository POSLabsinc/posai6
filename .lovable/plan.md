

## Increase AI Font Size in Device Setup Chat

Increase the AI assistant message font size and prose styling throughout the device activation chat interface for better readability.

### Changes Required

**File: `src/components/DeviceSetupAIChat.tsx`**

1. **Initial greeting bubble** (line ~718):
   - Change `text-sm` to `text-base`

2. **Message bubbles** (line ~766):
   - Change `text-sm` to `text-base`
   - Change `prose-sm` to `prose-base`

3. **Action buttons** (lines ~734, ~740):
   - Change `text-sm` to `text-base` on both "Yes, I'm New" and "No, I'm Not" buttons

4. **Loading indicator** (line ~797):
   - Change `text-xs` to `text-sm` for "Thinking..." text

### Implementation Details

````text
Before: text-sm, prose-sm, text-xs
After:  text-base, prose-base, text-sm
````

This increases readability while maintaining the professional chat appearance. The prose styling upgrade ensures markdown content (lists, paragraphs) also renders at the larger size.

