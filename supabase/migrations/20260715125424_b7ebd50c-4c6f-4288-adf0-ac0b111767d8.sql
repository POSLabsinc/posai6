
-- Scope cash tables to the requesting user's merchant

-- cash_drawer_sessions
DROP POLICY IF EXISTS "Authenticated users can delete cash_drawer_sessions" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "Authenticated users can read cash_drawer_sessions" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "Authenticated users can update cash_drawer_sessions" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert cash_drawer_sessions" ON public.cash_drawer_sessions;

CREATE POLICY "Merchant users read own cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR SELECT TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Merchant users insert own cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR INSERT TO authenticated
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchant users update own cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR UPDATE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()))
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchant users delete own cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR DELETE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()));

-- cash_drops
DROP POLICY IF EXISTS "cash_drops publicly writable" ON public.cash_drops;
DROP POLICY IF EXISTS "cash_drops publicly readable" ON public.cash_drops;
DROP POLICY IF EXISTS "cash_drops publicly updatable" ON public.cash_drops;
DROP POLICY IF EXISTS "cash_drops publicly deletable" ON public.cash_drops;

REVOKE ALL ON public.cash_drops FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_drops TO authenticated;
GRANT ALL ON public.cash_drops TO service_role;

CREATE POLICY "Merchant users read own cash_drops"
  ON public.cash_drops FOR SELECT TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Merchant users insert own cash_drops"
  ON public.cash_drops FOR INSERT TO authenticated
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchant users update own cash_drops"
  ON public.cash_drops FOR UPDATE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()))
  WITH CHECK (merchant_id = public.get_user_merchant_id(auth.uid()));
CREATE POLICY "Merchant users delete own cash_drops"
  ON public.cash_drops FOR DELETE TO authenticated
  USING (merchant_id = public.get_user_merchant_id(auth.uid()));

-- cash_transactions (scoped via parent session's merchant_id)
DROP POLICY IF EXISTS "cash_transactions publicly readable" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions publicly deletable" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions publicly updatable" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions publicly writable" ON public.cash_transactions;

REVOKE ALL ON public.cash_transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_transactions TO authenticated;
GRANT ALL ON public.cash_transactions TO service_role;

CREATE POLICY "Merchant users read own cash_transactions"
  ON public.cash_transactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_drawer_sessions s
      WHERE s.id = cash_transactions.session_id
        AND (s.merchant_id = public.get_user_merchant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role))
    )
  );
CREATE POLICY "Merchant users insert own cash_transactions"
  ON public.cash_transactions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cash_drawer_sessions s
      WHERE s.id = cash_transactions.session_id
        AND s.merchant_id = public.get_user_merchant_id(auth.uid())
    )
  );
CREATE POLICY "Merchant users update own cash_transactions"
  ON public.cash_transactions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_drawer_sessions s
      WHERE s.id = cash_transactions.session_id
        AND s.merchant_id = public.get_user_merchant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cash_drawer_sessions s
      WHERE s.id = cash_transactions.session_id
        AND s.merchant_id = public.get_user_merchant_id(auth.uid())
    )
  );
CREATE POLICY "Merchant users delete own cash_transactions"
  ON public.cash_transactions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_drawer_sessions s
      WHERE s.id = cash_transactions.session_id
        AND s.merchant_id = public.get_user_merchant_id(auth.uid())
    )
  );
