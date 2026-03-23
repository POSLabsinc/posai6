

## Plan: Split-Screen AI Chat on Orders Page

### What Changes

When the user clicks the AI icon on the New Order screen, instead of navigating to `/settings/ai`, the screen will split into two parts: the existing order content on the left and an AI chat panel on the right.

### Implementation

**1. Create `src/components/OrderAIChatPanel.tsx`**
- A new chat panel component styled to match the app's dark theme
- Contains a header with title and close button, a message list, and an input area
- Simple chat UI with message bubbles (user/assistant)
- Placeholder AI responses for now (can be wired to a real AI backend later)

**2. Modify `src/pages/Orders.tsx`**
- Add state: `const [isAIChatOpen, setIsAIChatOpen] = useState(false)`
- Change both AI icon `onClick` handlers (mobile line ~2117, desktop line ~2385) from `navigate('/settings/ai')` to `setIsAIChatOpen(true)`
- Wrap the existing order content and the new chat panel in a flex container
- When `isAIChatOpen` is true, the order area takes ~65% width and the chat panel takes ~35% on desktop
- On mobile, the chat panel could overlay as a slide-in sheet from the right
- Use `ResizablePanelGroup` from the existing resizable component for a draggable split

**3. Layout Structure (Desktop)**
```text
┌─────────────────────────┬──────────────┐
│                         │              │
│   Orders Content        │  AI Chat     │
│   (resizable ~65%)      │  Panel       │
│                         │  (~35%)      │
│                         │              │
└─────────────────────────┴──────────────┘
```

### Files to Create/Modify
- **Create**: `src/components/OrderAIChatPanel.tsx`
- **Modify**: `src/pages/Orders.tsx` — state, onClick handlers, layout wrapping

