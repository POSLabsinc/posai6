

## Plan: Remove "Admin" Branding from Sign-In Screen

The word "Admin" appears in three places that need updating:

### Changes

**1. `src/pages/Login.tsx`**
- Line ~3111: Change `"Admin Sign In"` → `"Sign In"`
- Line ~3120: Change `"Sign in with your admin credentials"` → `"Sign in with your credentials"`

**2. `src/components/DeviceSetupLayout.tsx`**
- Line ~75: Change `"Admin Access"` → `"Account Access"`
- Line ~76: Change `"Sign in with your administrator credentials to activate and manage this device."` → `"Sign in with your credentials to activate and manage this device."`

