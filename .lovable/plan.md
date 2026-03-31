

## Plan: Reset Ticket Orders to 10 Test Tickets

### Summary

Clear all existing ticket orders from the database and the static data file, then insert exactly 10 tickets with specific distribution:

- **5 Quick Orders** (no table, orderType varies: Take Out, Delivery, etc.) - all in ORDERING status
- **3 Table 2 Orders** - 1 ORDERING (active), 2 PAID
- **2 Table 3 Orders** - 1 ORDERING (active), 1 PAID

All other tables remain available (no orders assigned).

### Changes

#### 1. Database: Delete existing and insert new records
- Run SQL via insert tool to DELETE all rows from `ticket_order_items` and `ticket_orders`
- INSERT 10 new `ticket_orders` rows with correct statuses, tables, and order types
- INSERT corresponding `ticket_order_items` for each order
- Reset the `ticket_orders_order_number_seq` sequence to start fresh

#### 2. Update static file `src/data/ticketOrders.ts`
- Replace the `ticketOrders` array with exactly 10 entries matching the DB records
- 5 quick orders (table: "--", various order types like Take Out, Delivery, Drive Thru, Curb Side, Phone-In)
- 3 T2 orders (1 ORDERING, 2 PAID with payment info)
- 2 T3 orders (1 ORDERING, 1 PAID with payment info)

### Ticket Breakdown

```text
#   Name              Table   Type         Status
1   Quick Order 1     --      Take Out     ORDERING
2   Quick Order 2     --      Delivery     ORDERING
3   Quick Order 3     --      Drive Thru   ORDERING
4   Quick Order 4     --      Curb Side    ORDERING
5   Quick Order 5     --      Phone-In     ORDERING
6   Table 2 Active    T2      Table Order  ORDERING
7   Table 2 Paid 1    T2      Table Order  PAID
8   Table 2 Paid 2    T2      Table Order  PAID
9   Table 3 Active    T3      Table Order  ORDERING
10  Table 3 Paid      T3      Table Order  PAID
```

### Technical Details
- Each order gets 2-3 realistic menu products with modifiers
- PAID orders include payment entries (Visa/Cash), check numbers, and tip amounts
- Sequence reset ensures new orders created after this start from order_number 11
- The static array serves as fallback; the DB is the source of truth via `useTicketOrders` hook

