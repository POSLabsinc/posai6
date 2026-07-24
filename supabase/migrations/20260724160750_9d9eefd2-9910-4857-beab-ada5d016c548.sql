
DROP POLICY IF EXISTS "Public can view merchants" ON public.merchants;
DROP POLICY IF EXISTS "Anyone can view merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants viewable by everyone" ON public.merchants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.merchants;
REVOKE ALL ON public.merchants FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchants TO authenticated;
CREATE POLICY "Merchants can view own record"
ON public.merchants FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'customer_success') OR public.has_role(auth.uid(), 'support'));

DROP POLICY IF EXISTS "Public can view resellers" ON public.resellers;
DROP POLICY IF EXISTS "Anyone can view resellers" ON public.resellers;
DROP POLICY IF EXISTS "Resellers viewable by everyone" ON public.resellers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.resellers;
REVOKE ALL ON public.resellers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resellers TO authenticated;
CREATE POLICY "Admins can view resellers"
ON public.resellers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'customer_success') OR public.has_role(auth.uid(), 'support'));

DROP POLICY IF EXISTS "Public can view stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can update stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can delete stores" ON public.stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.stores;
DROP POLICY IF EXISTS "Enable update for all users" ON public.stores;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.stores;
REVOKE ALL ON public.stores FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
CREATE POLICY "Merchants manage their stores"
ON public.stores FOR ALL TO authenticated
USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'customer_success'))
WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
