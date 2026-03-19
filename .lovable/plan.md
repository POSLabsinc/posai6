

## Plan: Show POS Terminal/Device Name on KDS Messages

### What Changes
Instead of the static "Kitchen Message" banner on KDS message cards, display the source terminal/device name — e.g., **"Message from POS 1"** or **"Message from Bar Terminal"**.

### How It Will Look

**Current:**
```text
┌─────────────────────────────────┐
│ 📢 KITCHEN MESSAGE    10:30 AM │
│ From: John · Order #23 · T2    │
│ Rush this order                 │
└─────────────────────────────────┘
```

**New:**
```text
┌─────────────────────────────────┐
│ 📢 MESSAGE FROM POS 1  10:30AM │
│ From: John · Order #23 · T2    │
│ Rush this order                 │
└─────────────────────────────────┘
```

### Implementation

**1. Store a terminal/device name in settings** (`localStorage`)
- Add a "POS Terminal Name" field in device settings (e.g., "POS 1", "Bar Terminal", "Drive-Thru")
- Default to "POS" if not configured

**2. Include terminal name in message payload** (`MessageKitchenDialog.tsx`)
- Replace hardcoded `terminal_id: "default"` with the configured terminal name
- Add a `terminal_name` field to the message payload

**3. Display terminal name on KDS** (`KDS.tsx` + `KDSMessages.tsx`)
- Replace "Kitchen Message" with `Message from {terminal_name}`
- Falls back to "Kitchen Message" if no terminal name is set
- Update both the side panel cards and inline order card message banners

### Files to Modify
- `src/components/MessageKitchenDialog.tsx` — read terminal name from settings, include in payload
- `src/pages/KDS.tsx` — display `terminal_name` in message banners (3 locations)
- `src/pages/KDSMessages.tsx` — display `terminal_name` in message cards (2 locations)
- Settings page (terminal name config field) — if a settings field for device name already exists, use it; otherwise add one

