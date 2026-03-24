

## Plan: Adjust AI Panel Top Position

The AI panel currently starts at `top-0` (very top of the menu container). It should start lower — aligned with the "Order Type" box area in the order panel, which sits below the header/action buttons row.

### Change

**File: `src/pages/Orders.tsx` (line 2681)**

Update the AI overlay div from `top-0 h-full` to a top offset that skips the header area. The order panel header (with Order #, action buttons like No Tax/No Sale/Gift) is roughly 90-100px tall. Setting `top-[100px]` and changing height to `bottom-0` will align the AI panel's top edge with the Order Type field area.

```
// Before
absolute top-0 ... z-40 h-full

// After  
absolute top-[100px] bottom-0 ... z-40
```

This single line change positions the AI panel to start at the same vertical level as the Order Type section in the order panel.

