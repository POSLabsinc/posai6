
-- PRODUCTS: remove anon full access, add authenticated read + merchant-scoped writes
DROP POLICY IF EXISTS "Anon reads products" ON public.products;
DROP POLICY IF EXISTS "Anon inserts products" ON public.products;
DROP POLICY IF EXISTS "Anon updates products" ON public.products;
DROP POLICY IF EXISTS "Anon deletes products" ON public.products;

CREATE POLICY "Authenticated read products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Merchants insert their products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);

CREATE POLICY "Merchants update their products"
  ON public.products FOR UPDATE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);

CREATE POLICY "Merchants delete their products"
  ON public.products FOR DELETE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);

-- ORDERS: drop anon, add merchant-scoped authenticated
DROP POLICY IF EXISTS "Anon reads orders" ON public.orders;
DROP POLICY IF EXISTS "Anon inserts orders" ON public.orders;
DROP POLICY IF EXISTS "Anon updates orders" ON public.orders;
DROP POLICY IF EXISTS "Anon deletes orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;

CREATE POLICY "Merchants read their orders"
  ON public.orders FOR SELECT TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants insert their orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants update their orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants delete their orders"
  ON public.orders FOR DELETE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);

-- ORDER_ITEMS: drop anon, scope via parent order
DROP POLICY IF EXISTS "Anon reads order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anon inserts order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anon updates order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anon deletes order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public delete order_items" ON public.order_items;

CREATE POLICY "Merchants read their order_items"
  ON public.order_items FOR SELECT TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants insert their order_items"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants update their order_items"
  ON public.order_items FOR UPDATE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants delete their order_items"
  ON public.order_items FOR DELETE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);

-- GUESTS: drop anon
DROP POLICY IF EXISTS "Anon reads guests" ON public.guests;
DROP POLICY IF EXISTS "Anon inserts guests" ON public.guests;
DROP POLICY IF EXISTS "Anon updates guests" ON public.guests;
DROP POLICY IF EXISTS "Anon deletes guests" ON public.guests;
DROP POLICY IF EXISTS "Public read guests" ON public.guests;
DROP POLICY IF EXISTS "Public insert guests" ON public.guests;
DROP POLICY IF EXISTS "Public update guests" ON public.guests;
DROP POLICY IF EXISTS "Public delete guests" ON public.guests;

CREATE POLICY "Merchants read their guests"
  ON public.guests FOR SELECT TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants insert their guests"
  ON public.guests FOR INSERT TO authenticated
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants update their guests"
  ON public.guests FOR UPDATE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);
CREATE POLICY "Merchants delete their guests"
  ON public.guests FOR DELETE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR merchant_id IS NULL);

-- Revoke anon grants
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.order_items FROM anon;
REVOKE ALL ON public.guests FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.guests TO service_role;
