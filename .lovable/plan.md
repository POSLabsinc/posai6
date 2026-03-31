

## Plan: Create Standalone Clock In Screen Component

### What You Get

A single self-contained file (`StandaloneClockInScreen.tsx`) with all CSS embedded as a `<style>` tag, zero custom dependencies. Only requires `react`, `date-fns`, `lucide-react`, and `framer-motion` as peer dependencies (all common libraries).

### What Is Included

The standalone component replicates the **core Clock In screen** visual design:

1. **Full-screen overlay** with dark blurred background
2. **Left panel** (desktop): Date, large animated clock, weather, location
3. **Right panel**: PIN entry with 4-dot indicator, 3D skeuomorphic keypad (1-9, C, 0, ENTER)
4. **Action buttons**: Clock Out (red), Break (gray), Clock In (green)
5. **Bottom row**: Fingerprint icon, Revenue Center selector dropdown, Face ID icon, LOGOUT button
6. **Clock In Summary screen**: Success checkmark, time/revenue center/job type cards, "Enter POS" button
7. **Clock Out Summary screen**: Total hours, break time, shift duration cards
8. **Mobile layout**: Compact single-column version with inline date/time header
9. **Keyboard support**: Physical keyboard input for PIN digits, backspace, enter, escape

### What Is Removed (to eliminate dependencies)

- Mood check-in flow (emotions, tags, anonymous toggle) - removed entirely
- Fingerprint/Face ID authentication modals - buttons remain but show alerts
- PIN lockout/manager PIN flow - simplified to basic error message
- Employee database lookup - replaced with hardcoded demo employees
- Settings manager integration - replaced with inline defaults
- Custom SVG icon imports - replaced with unicode/lucide equivalents
- AppleAlertDialog - replaced with native confirm()
- React Router navigation - replaced with callback props
- `useIsMobile` hook - replaced with inline `window.innerWidth` check

### Embedded CSS

All `keypad-btn-3d` variants (normal, enter, clock-in, clock-out, break, dark, revenue, outlined) and `keypad-bounce` animation will be injected via a `<style>` tag inside the component.

### Props Interface

```typescript
interface StandaloneClockInScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterPOS: () => void;
  onLogout?: () => void;
}
```

### Demo Data

- PIN `1234` maps to "Sarah Johnson" (Server, Bartender)
- PIN `5678` maps to "Mike Chen" (Manager)
- PIN `0000` maps to "Alex Rivera" (Host)

### File to Create

- `src/components/StandaloneClockInScreen.tsx` - single file, ~800 lines, copy-paste ready

### Technical Details

- All CSS is scoped via a `<style>` block injected on mount using `useEffect`
- Uses `date-fns` for formatting (format, differenceInMinutes)
- Uses `framer-motion` for AnimatePresence transitions
- Uses `lucide-react` for icons (Sun, Fingerprint, ScanFace, ChevronDown, Check, Clock, MapPin, Briefcase, X, Timer, LogOut, Coffee, ArrowLeft)
- Montserrat font import included in the style block
- Revenue center dropdown with animated open/close
- Responsive: detects mobile via `window.innerWidth < 768` with resize listener

