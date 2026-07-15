## Goal

The scanner flagged that **all pricing, tax, discount, gratuity, and "mark as paid" logic runs in the browser**. A malicious user can edit a single number in the dev tools and pay $0.01 for a $200 ticket, or mark unpaid orders as paid. The fix is to make the browser strictly a *display + intent* layer and move every money-affecting calculation behind an edge function that the client cannot bypass.

The good news: your database already has the right tables (`orders`, `order_items`, `products`, `taxes`, `discounts`, `service_charges`, `gratuity_settings`, `payment_methods`, `ticket_orders`, `ticket_order_items`, `vouchers`, `cash_drawer_sessions`, `cash_transactions`). So this is mostly about *what computes the numbers*, not new schema.

## What is wrong today (in plain language)

1. **Totals are trusted from the client.** The browser sums line items, applies tax/discount/service charge/tip, and sends the final number to the database. Anyone can change that number in flight.
2. **"Paid" is a client decision.** Tapping a payment method in `LiquidGlassCheckout` writes `status: PAID` directly from the browser, with no verification that money actually moved.
3. **Discounts and comps have no server check.** A 100% comp or a manager-approved discount is enforced only by the UI flow.
4. **Refunds, voids, and reopens** are direct DB writes from the client.
5. **Cash drawer reconciliation** (opening float, cash in/out, drop, expected vs actual) is computed in the browser and written as the final truth.

## What we will build (high level)

A small set of edge functions that own all money math, plus tightened RLS so the anon key can no longer write to money-bearing columns.

```text
 Browser (UI)                       Edge Functions (trusted)              Database
 ────────────                       ───────────────────────              ────────
 Add product to order      ───►   add-order-item    ───►   recompute order totals from products table
 Apply discount/comp       ───►   apply-discount    ───►   validate discount rules, manager PIN, write
 Apply service charge/tip  ───►   apply-charges     ───►   validate against settings, write
 Tap "Charge"              ───►   start-payment     ───►   lock order, return server-computed total
 Tender (cash/card/etc)    ───►   capture-payment   ───►   record payment, mark PAID only when balance = 0
 Refund / void / reopen    ───►   refund-order      ───►   manager auth, write payment + status
 Open / close drawer       ───►   cash-session      ───►   compute expected from server-side ledger
```

The UI keeps showing the same numbers, but every number now comes from the server response, not from `useState`.

## Step-by-step rollout

This is intentionally staged so the POS keeps working at every step.

### Phase 1: Lock down the database (no UI change)

- Drop all `Anon insert/update/delete` policies on `orders`, `order_items`, `ticket_orders`, `ticket_order_items`, `cash_transactions`, `cash_drops`, `cash_drawer_sessions`.
- Replace with policies that only allow `service_role` (the role used by edge functions) to write.
- Keep anon `SELECT` for the columns the POS needs to render (id, status, totals, line items), so screens still load.
- Add a database trigger that recomputes `subtotal`, `tax_total`, `discount_total`, `total`, `balance_due` from `order_items` whenever a row changes, so even direct service-role writes cannot store inconsistent totals.

### Phase 2: Order math edge functions

Create `order-mutations` (one function, several actions) that owns:

- `add_item`, `update_item_quantity`, `remove_item`, `void_item`
- `apply_discount` (validates the discount row from `discounts`, checks `requires_manager_pin`, accepts a PIN verified server-side)
- `apply_service_charge`, `set_gratuity`, `set_tip`
- `change_order_type`, `assign_guest`, `transfer_seat`

Each action: reads the order, recomputes totals from current `products`/`taxes`/`discounts`/`service_charges`/`gratuity_settings`, writes the new state, returns the canonical order. The UI replaces all local arithmetic with a single call and re-renders from the response.

### Phase 3: Payment finalization

Create `capture-payment`:

- Input: `order_id`, `payment_method_id`, `amount`, optional `tip`, optional `tendered`, optional `manager_pin`.
- Server re-fetches the order, re-validates the balance due, refuses to mark `PAID` until `sum(payments) >= total`.
- For cash: records the tender, computes change server-side, links to the open `cash_drawer_session`.
- For card/voucher/external: writes the payment row with a `provider_reference` field. (Real card capture is a separate provider integration; this function just makes the *finalization* server-authoritative.)
- For vouchers: deducts `remaining_balance` from `vouchers` atomically.
- Returns the updated order and a `paid_at` timestamp.

Create `refund-order` and `void-order` with the same shape, both requiring a manager PIN verified through the existing `verify-employee-pin` function.

### Phase 4: Cash drawer integrity

Create `cash-session`:

- `open` (records opening float, writes `cash_drawer_sessions`).
- `pay_in` / `pay_out` / `cash_drop` (writes `cash_transactions` / `cash_drops`).
- `close` (computes expected = opening + cash sales + pay-ins - pay-outs - drops from the **database**, compares to counted, records variance).

The UI stops doing any of that math.

### Phase 5: Settings hardening

- `payment_methods`, `checkout_options`, `gratuity_settings`, `discounts`, `taxes`, `service_charges`: revoke anon writes. Add an `update-settings` edge function that checks for a manager role via `has_role()` before writing.
- Move the localStorage `payment-methods-state`, `checkout-options-settings`, and `pos_user_pins` reads to **DB reads on app start**, with the DB as the only source of truth. (This also closes the related `localStorage_tampering` finding.)

### Phase 6: Frontend swap

This is the biggest UI-side change but it is mechanical:

- Replace direct `supabase.from('order_items').insert/update/delete` calls with `supabase.functions.invoke('order-mutations', { body: { action, ... } })`.
- Replace the "Charge" / "Mark paid" code in `LiquidGlassCheckout`, `OrderLayoutTemplate`, `TableOrderDetails`, `Tickets`, and split-check flows with `capture-payment`.
- Remove every line that computes a price, tax, discount, tip, or total in JS; render directly from the order returned by the edge function.
- Keep optimistic UI where it's nice to have (e.g. instantly show the added line), but reconcile to the server response.

### Phase 7: Audit + verification

- Add an `order_events` audit table (already partially present as `activity_log`). Every edge function writes an event with `actor`, `device_id`, `before`, `after`.
- Manual test matrix: add item, apply 100% comp, split check, partial cash + card, refund a paid order, void an item, close a drawer with variance. Each one should be impossible to fake by editing the request body.
- Re-run the security scan to confirm `payment_client_only` clears.

## Technical notes

- **No new tables required** for Phases 1-4. The existing schema already has the columns we need (`orders.total`, `orders.balance_due`, `orders.status`, `order_items.unit_price`, etc.). We only add an `order_events` table in Phase 7.
- **Manager PIN checks** reuse the `verify-employee-pin` edge function already deployed; just add an `action: "verify_role"` branch that also returns the employee's role so payment/refund/comp can check it.
- **Edge function auth**: same pattern we just shipped (require `Authorization` / `apikey` header, validate input with strict schemas, cap array sizes).
- **Real card processing** is out of scope for closing this finding. The finding is about *who decides an order is paid*, not about whether a card was actually charged. If you also want true card capture, that's a separate Stripe/Paddle integration we can plan after.
- **Backwards compatibility**: Phases 1-5 can ship without breaking the UI if Phase 6 lands in the same release. We will keep the current code path working until each screen is swapped over, then remove the dead code in one cleanup PR.

## Effort and sequencing

Realistic estimate, in calendar terms, working incrementally:

- Phase 1 (RLS + triggers): 0.5 day
- Phase 2 (order mutations function + frontend swap): 2-3 days
- Phase 3 (payment finalization + frontend swap): 2-3 days
- Phase 4 (cash drawer): 1-2 days
- Phase 5 (settings hardening): 1 day
- Phase 6 (full frontend cleanup): 1-2 days
- Phase 7 (audit + manual test pass + re-scan): 1 day

Roughly 8-12 working days end-to-end. Each phase is independently shippable.

## What I need from you to start

1. Confirm you want to proceed and we will treat this as a multi-step engagement (one phase per turn, each phase landed and verified before the next).
2. Confirm there is no real payment processor to integrate right now (just server-authoritative "mark paid"), or tell me which processor (Stripe, Paddle, Square) so I can fold card capture into Phase 3.
3. Confirm whether `localStorage_tampering` (`pos_session`, `pos_user_pins`, `payment-methods-state`, `checkout-options-settings`) should be closed in the same engagement. Phase 5 covers the config piece; the session piece needs a small extra step (server-validated session tokens) that I can add to Phase 5 if you say yes.

Once you approve, I will start with Phase 1.