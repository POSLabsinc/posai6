

## Plan: Hierarchical Settings Navigation Within AI Chat

### Problem
When a user selects a settings module button (e.g., "Menu") in the AI chat, it navigates to that settings page, leaving the chat. The user wants sub-options to appear as new buttons inline in the chat, allowing full drill-down without leaving the AI Assistant.

### Implementation

**Modify `src/components/settings/AISettingsContent.tsx`:**

1. **Replace flat SETTINGS_NAV_MAP with a hierarchical map** - Define a nested structure where each top-level module has children:
   - "Menu" -> children: ["Products", "Categories", "Modifiers", "Add-ons", "Default Modifiers", "Groups", "Timed Pricing", "Inventory", "Menus"]
   - "Payments" -> children: ["Discounts", "Taxes", "Gratuity", "Service Charge", "Checkout Options"]
   - "System" -> children: ["Appearance", "Control Center"]
   - "Workforce" -> children: ["Employee", "Shift", "Schedule Information"]
   - "Hardware" -> children: ["Printer", "Card Reader", "Cash Register"]
   - "Network" -> children: ["Servers", "AI Integration"]
   - "Support" -> children: ["Feedback", "Contact", "About"]
   - "Notifications" -> children: ["All Notifications"]
   - Leaf nodes (no children) keep their navigation path for final navigation

2. **Update quick-reply click handler** - When a module button is clicked:
   - If it has children: instead of navigating, inject a new assistant message with the sub-options as quickReplies (e.g., "You selected Menu. Choose a section:") plus a "Go to Menu" button to navigate directly if preferred
   - If it is a leaf node (no children): navigate to the settings page as before
   - Add a "Back" button in sub-option messages to go back to the parent level

3. **Add leaf-node navigation mapping** - Keep a flat map for final leaf nodes that trigger actual navigation (e.g., "Products" -> `/settings/menu/products`, "Gratuity" -> `/settings/payments/gratuity`)

4. **Add "Go to [Module]" direct navigation option** - Each sub-level includes a "Go to [Parent]" button that navigates to the parent module page for users who want to see the full settings UI

### Files to Modify
- `src/components/settings/AISettingsContent.tsx` - Replace flat nav map with hierarchical structure, update click handler logic

