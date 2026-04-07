

## Plan: Settings Module Quick-Navigation Buttons

### Problem
When the user types "settings" or "go to settings", the AI returns a text list of settings modules. The user wants these modules to appear as tappable buttons (like the order quick-action buttons) that directly navigate to the relevant settings page.

### Implementation

**Modify `src/components/settings/AISettingsContent.tsx`:**

1. **Add a settings navigation map** - Define a constant mapping settings module labels to their navigation paths:
   - "Menu" -> `/settings/menu`
   - "Products" -> `/settings/menu/products`
   - "Categories" -> `/settings/menu/categories`
   - "Modifiers" -> `/settings/menu/modifiers`
   - "Add-ons" -> `/settings/menu/add-ons`
   - "Discounts" -> `/settings/payments/discounts`
   - "Taxes" -> `/settings/payments/taxes`
   - "Gratuity" -> `/settings/payments/gratuity`
   - "Service Charge" -> `/settings/payments/service-charge`
   - "Appearance" -> `/settings/system/appearance`
   - "Control Center" -> `/settings/system/control-center`
   - "Checkout Options" -> `/settings/payments/checkout-options`

2. **Update the quick-reply click handler** - In the existing button onClick handler (around line 1782), add a check: if the reply label matches a key in the settings navigation map, call `onNavigate?.(path)` or `navigate(path)` directly instead of sending it as a message.

3. **Add settings-intent detection** - Similar to the order-intent detection, detect when the user asks about settings/navigation (e.g., "settings", "go to settings", "show me settings") and inject a welcome message with quickReplies containing all the settings module labels so they appear as buttons immediately.

### Files to Modify
- `src/components/settings/AISettingsContent.tsx` - Add settings nav map, update quick-reply handler, add settings-intent detection with auto-injected module buttons

