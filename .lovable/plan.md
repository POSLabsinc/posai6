

# Add KDS Notification Toggle to Control Center Settings

## Overview
Add a "KDS Notification" toggle in the Control Center settings under the Features section, right after the existing "Switch To Kitchen Display System" toggle. This will allow enabling/disabling notification sounds and visual alerts when new orders arrive on the KDS.

## Changes

### 1. Update ControlCenterSettings interface (`src/lib/settingsManager.ts`)
- Add `kdsNotification: boolean` to the `ControlCenterSettings` interface
- Add default value `false` in `defaultControlCenterSettings`
- Update AI intent mapping to support natural language toggling of this setting

### 2. Update ControlCenterContent (`src/components/settings/ControlCenterContent.tsx`)
- Add `kdsNotification` state initialized from settings
- Add `handleKdsNotificationChange` handler
- Add toggle row right after the "Switch To Kitchen Display System" row with label "KDS Notification" and description "Enable notification sounds and alerts when new orders arrive on the Kitchen Display System."
- Sync state in the settings-updated event listener

### 3. Wire into KDS page (future-ready)
- The KDS page (`src/pages/KDS.tsx`) can read `SettingsManager.getControlCenterSettings().kdsNotification` to conditionally play sounds/show alerts when new orders appear. No KDS page changes in this step since no audio assets or notification system exists yet — the toggle will be the configuration point.

## Technical Details
- Follows the exact same pattern as existing toggles (`switchToKDS`, `debugMode`, etc.)
- Uses localStorage via `SettingsManager` with the existing sync mechanism
- No database changes needed — uses the existing `ControlCenterSettings` localStorage pattern

