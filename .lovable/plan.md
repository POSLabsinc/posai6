

# Fix: App Performance Slowness

## Root Cause Analysis

The app has a **cascade refetch problem** in the order data layer. Here is what happens on every single action (e.g., tapping a button that updates an order):

1. **Mutation fires** (e.g., update order status) and calls `invalidateQueries` on success
2. **Realtime subscription detects the DB change** and calls `invalidateQueries` again
3. Each `invalidateQueries` triggers `fetchTicketOrders()` which does a **full SELECT * from ticket_orders + ticket_order_items**
4. **9 components** each call `useTicketOrders()`, and each sets up its **own realtime Supabase channel** - so the invalidation cascades multiply
5. The `UnifiedOrderContext` runs `dbOrders.map(toTicketOrder)` on **every render** without memoization
6. No optimistic updates - UI waits for the full DB round-trip before reflecting changes

Result: a single tap triggers 2-4 full database fetches across multiple subscriptions, each re-rendering the entire order tree.

## Fix Plan (4 changes, all in existing files)

### 1. Deduplicate realtime subscriptions (`use-ticket-orders.ts`)

Move the realtime channel setup to only fire **once globally** using a ref guard. Multiple hook instances share the same `queryKey`, so only one subscription is needed.

Add a module-level singleton pattern:
- Use a module-scoped variable to track if a channel is already subscribed
- Skip subscription setup if already active
- Clean up only when no consumers remain

### 2. Prevent double-invalidation on mutations (`use-ticket-orders.ts`)

When a mutation succeeds, the `onSuccess` invalidation AND the realtime listener both fire. Fix by:
- Adding a short debounce/throttle (300ms) on the realtime invalidation callback so that if a mutation just ran, the realtime event is ignored
- Keep `onSuccess` invalidation as the primary (faster) path

### 3. Memoize the order conversion (`UnifiedOrderContext.tsx`)

Currently `const orders = dbOrders.map(toTicketOrder)` runs on every render. Wrap it in `useMemo`:

```typescript
const orders = useMemo(() => dbOrders.map(toTicketOrder), [dbOrders]);
```

Also memoize `getAllOrders`, `getOrdersByTable`, and `getOrderById` properly.

### 4. Add optimistic updates for common mutations (`use-ticket-orders.ts`)

For `updateOrder`, use React Query's `onMutate` to optimistically update the cache before the DB round-trip completes:

```typescript
onMutate: async ({ id, changes }) => {
  await queryClient.cancelQueries({ queryKey: ['ticket-orders'] });
  const previous = queryClient.getQueryData(['ticket-orders']);
  queryClient.setQueryData(['ticket-orders'], (old) =>
    old.map(o => o.id === id ? { ...o, ...changes } : o)
  );
  return { previous };
},
onError: (err, vars, context) => {
  queryClient.setQueryData(['ticket-orders'], context.previous);
},
```

This makes UI updates feel instant.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/use-ticket-orders.ts` | Singleton realtime sub, debounced invalidation, optimistic updates |
| `src/contexts/UnifiedOrderContext.tsx` | Add `useMemo` for order conversion |

## Expected Result

- Single tap actions respond in under 100ms (optimistic)
- Database fetches reduced from 2-4x per action to 1x
- Only one realtime channel instead of up to 9
- No UI or design changes

