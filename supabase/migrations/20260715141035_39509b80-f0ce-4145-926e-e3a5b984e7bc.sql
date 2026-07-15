-- Harden public operational settings tables that were previously open to the public role.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'closing_time_extensions',
    'taxes',
    'service_charges',
    'gratuity_settings',
    'checkout_options',
    'payment_methods',
    'user_preferences'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || ' publicly readable', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || ' publicly writable', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || ' publicly updatable', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || ' publicly deletable', tbl);

    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', tbl || ' authenticated readable', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', tbl || ' authenticated writable', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', tbl || ' authenticated updatable', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)', tbl || ' authenticated deletable', tbl);
  END LOOP;
END $$;

-- Harden write_offs separately because it already has merchant_id ownership data.
DROP POLICY IF EXISTS "write_offs publicly readable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs publicly writable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs publicly deletable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs publicly updatable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs authenticated readable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs authenticated writable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs authenticated updatable" ON public.write_offs;
DROP POLICY IF EXISTS "write_offs authenticated deletable" ON public.write_offs;
REVOKE ALL ON public.write_offs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.write_offs TO authenticated;
GRANT ALL ON public.write_offs TO service_role;
CREATE POLICY "write_offs merchant readable" ON public.write_offs
  FOR SELECT TO authenticated
  USING (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "write_offs merchant writable" ON public.write_offs
  FOR INSERT TO authenticated
  WITH CHECK (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "write_offs merchant updatable" ON public.write_offs
  FOR UPDATE TO authenticated
  USING (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()))
  WITH CHECK (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "write_offs merchant deletable" ON public.write_offs
  FOR DELETE TO authenticated
  USING (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()));

-- Harden employee shift and store assignment data.
DROP POLICY IF EXISTS "employee_shifts publicly readable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts publicly writable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts publicly updatable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts publicly deletable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts merchant readable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts merchant writable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts merchant updatable" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts merchant deletable" ON public.employee_shifts;
REVOKE ALL ON public.employee_shifts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_shifts TO authenticated;
GRANT ALL ON public.employee_shifts TO service_role;
CREATE POLICY "employee_shifts merchant readable" ON public.employee_shifts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_shifts.employee_id
      AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
  ));
CREATE POLICY "employee_shifts merchant writable" ON public.employee_shifts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_shifts.employee_id
      AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
  ));
CREATE POLICY "employee_shifts merchant updatable" ON public.employee_shifts
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_shifts.employee_id
      AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_shifts.employee_id
      AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
  ));
CREATE POLICY "employee_shifts merchant deletable" ON public.employee_shifts
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_shifts.employee_id
      AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
  ));

DROP POLICY IF EXISTS "employee_stores publicly readable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores publicly writable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores publicly updatable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores publicly deletable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores merchant readable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores merchant writable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores merchant updatable" ON public.employee_stores;
DROP POLICY IF EXISTS "employee_stores merchant deletable" ON public.employee_stores;
REVOKE ALL ON public.employee_stores FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_stores TO authenticated;
GRANT ALL ON public.employee_stores TO service_role;
CREATE POLICY "employee_stores merchant readable" ON public.employee_stores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_stores.employee_id
        AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = employee_stores.store_id
        AND (s.merchant_id IS NULL OR s.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
  );
CREATE POLICY "employee_stores merchant writable" ON public.employee_stores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_stores.employee_id
        AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = employee_stores.store_id
        AND (s.merchant_id IS NULL OR s.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
  );
CREATE POLICY "employee_stores merchant updatable" ON public.employee_stores
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_stores.employee_id
        AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = employee_stores.store_id
        AND (s.merchant_id IS NULL OR s.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_stores.employee_id
        AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = employee_stores.store_id
        AND (s.merchant_id IS NULL OR s.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
  );
CREATE POLICY "employee_stores merchant deletable" ON public.employee_stores
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_stores.employee_id
        AND (e.merchant_id IS NULL OR e.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = employee_stores.store_id
        AND (s.merchant_id IS NULL OR s.merchant_id = public.get_user_merchant_id(auth.uid()))
    )
  );

-- Remove anonymous CRUD from guest feedback and scope signed-in access by merchant.
DROP POLICY IF EXISTS "Anon reads guest_feedback" ON public.guest_feedback;
DROP POLICY IF EXISTS "Anon inserts guest_feedback" ON public.guest_feedback;
DROP POLICY IF EXISTS "Anon updates guest_feedback" ON public.guest_feedback;
DROP POLICY IF EXISTS "Anon deletes guest_feedback" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback merchant readable" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback merchant writable" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback merchant updatable" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback merchant deletable" ON public.guest_feedback;
REVOKE ALL ON public.guest_feedback FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_feedback TO authenticated;
GRANT ALL ON public.guest_feedback TO service_role;
CREATE POLICY "guest_feedback merchant readable" ON public.guest_feedback
  FOR SELECT TO authenticated
  USING (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "guest_feedback merchant writable" ON public.guest_feedback
  FOR INSERT TO authenticated
  WITH CHECK (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "guest_feedback merchant updatable" ON public.guest_feedback
  FOR UPDATE TO authenticated
  USING (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "guest_feedback merchant deletable" ON public.guest_feedback
  FOR DELETE TO authenticated
  USING (merchant_id IS NULL OR merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));