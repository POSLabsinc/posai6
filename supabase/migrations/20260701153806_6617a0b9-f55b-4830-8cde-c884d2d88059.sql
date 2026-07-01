-- Drop anonymous policies on cash_drawer_sessions
DROP POLICY IF EXISTS "Anon reads cash_drawer_sessions" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "Anon inserts cash_drawer_sessions" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "Anon updates cash_drawer_sessions" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "Anon deletes cash_drawer_sessions" ON public.cash_drawer_sessions;

-- Allow authenticated users to manage cash drawer sessions
CREATE POLICY "Authenticated users can read cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cash_drawer_sessions"
  ON public.cash_drawer_sessions FOR DELETE TO authenticated USING (true);