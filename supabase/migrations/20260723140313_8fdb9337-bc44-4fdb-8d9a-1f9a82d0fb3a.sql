
-- Restrict kds_messages, loyalty_points, and menus to authenticated users only

-- kds_messages
REVOKE ALL ON public.kds_messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kds_messages TO authenticated;
GRANT ALL ON public.kds_messages TO service_role;
ALTER TABLE public.kds_messages ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='kds_messages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.kds_messages', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated can read kds_messages" ON public.kds_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert kds_messages" ON public.kds_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update kds_messages" ON public.kds_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete kds_messages" ON public.kds_messages FOR DELETE TO authenticated USING (true);

-- loyalty_points
REVOKE ALL ON public.loyalty_points FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='loyalty_points' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.loyalty_points', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated can read loyalty_points" ON public.loyalty_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert loyalty_points" ON public.loyalty_points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update loyalty_points" ON public.loyalty_points FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete loyalty_points" ON public.loyalty_points FOR DELETE TO authenticated USING (true);

-- menus
REVOKE ALL ON public.menus FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT ALL ON public.menus TO service_role;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='menus' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.menus', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated can read menus" ON public.menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert menus" ON public.menus FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update menus" ON public.menus FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete menus" ON public.menus FOR DELETE TO authenticated USING (true);
