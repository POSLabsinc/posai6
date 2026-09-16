# Restore ENTER on the PIN Pad

The PIN pad currently changes its action label to **CLOCK IN** when the employee is not clocked in. This came from the application tour adjustment. The separate **Clock In** action already remains below the keypad.

## Change

- Restore the keypad action label to **ENTER** in every clock state.
- Keep the existing **Clock In**, **Clock Out**, and **Break** actions and their behavior unchanged.
- Verify `/clock-in-pin` shows **ENTER** on the keypad and that entering a PIN still continues through the existing clock-in flow.

## Technical detail

Update only the conditional label in `ClockInOverlay`. No authentication, PIN validation, or clock-state logic will change.
