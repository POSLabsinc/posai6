## Root cause

The Orders screen fetches `menu_categories` with an embedded `categories(name)` join. The network call is returning:

```
401 permission denied for table categories
```

Even though I added an RLS policy allowing authenticated users to read `categories` and `menus`, the underlying Postgres table `GRANT`s were never issued to the `anon` / `authenticated` roles. Supabase's Data API (PostgREST) requires both:

1. A `GRANT SELECT` on the table to the role
2. A matching RLS policy

Without step 1, PostgREST rejects the request before RLS is even evaluated, so the join fails and no categories or subcategories render.

Confirmed via `information_schema.role_table_grants`: `categories`, `menus`, and `menu_categories` have no grants to `authenticated`, `anon`, or `service_role`.

## Fix (single migration)

Grant table-level read privileges so RLS policies can actually apply:

```sql
GRANT SELECT ON public.categories       TO authenticated, anon;
GRANT SELECT ON public.menus            TO authenticated, anon;
GRANT SELECT ON public.menu_categories  TO authenticated, anon;
GRANT ALL    ON public.categories       TO service_role;
GRANT ALL    ON public.menus            TO service_role;
GRANT ALL    ON public.menu_categories  TO service_role;
```

RLS remains enabled and existing policies stay untouched, so row-level scoping (merchant-based writes, super_admin reads) still governs which rows are visible/mutable. Grants only unlock the tables so PostgREST can even run the query.

## Verification

After the migration:
1. Reload `/orders` and confirm the network call to `menu_categories` returns 200 with rows.
2. Verify category chips (Food, Desserts, Drinks, etc.) and their subcategory chips render as in the reference screenshot.
