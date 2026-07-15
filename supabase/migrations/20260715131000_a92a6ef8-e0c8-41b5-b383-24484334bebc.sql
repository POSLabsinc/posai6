
-- categories: remove anon full CRUD, add merchant-scoped authenticated policies
DROP POLICY IF EXISTS "Anon deletes categories" ON public.categories;
DROP POLICY IF EXISTS "Anon inserts categories" ON public.categories;
DROP POLICY IF EXISTS "Anon reads categories" ON public.categories;
DROP POLICY IF EXISTS "Anon updates categories" ON public.categories;
REVOKE ALL ON public.categories FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
CREATE POLICY "Merchants read their categories" ON public.categories FOR SELECT TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants insert their categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants update their categories" ON public.categories FOR UPDATE TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid())) WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants delete their categories" ON public.categories FOR DELETE TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid()));

-- discounts
DROP POLICY IF EXISTS "Anon deletes discounts" ON public.discounts;
DROP POLICY IF EXISTS "Anon inserts discounts" ON public.discounts;
DROP POLICY IF EXISTS "Anon reads discounts" ON public.discounts;
DROP POLICY IF EXISTS "Anon updates discounts" ON public.discounts;
REVOKE ALL ON public.discounts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
CREATE POLICY "Merchants read their discounts" ON public.discounts FOR SELECT TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants insert their discounts" ON public.discounts FOR INSERT TO authenticated WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants update their discounts" ON public.discounts FOR UPDATE TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid())) WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants delete their discounts" ON public.discounts FOR DELETE TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid()));

-- employees
DROP POLICY IF EXISTS "Anon deletes employees" ON public.employees;
DROP POLICY IF EXISTS "Anon inserts employees" ON public.employees;
DROP POLICY IF EXISTS "Anon reads employees" ON public.employees;
DROP POLICY IF EXISTS "Anon updates employees" ON public.employees;
REVOKE ALL ON public.employees FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
CREATE POLICY "Merchants read their employees" ON public.employees FOR SELECT TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants insert their employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants update their employees" ON public.employees FOR UPDATE TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid())) WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchants delete their employees" ON public.employees FOR DELETE TO authenticated USING (merchant_id = public.get_user_merchant_id(auth.uid()));
