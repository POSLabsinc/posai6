
-- notifications
REVOKE ALL ON public.notifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notifications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update notifications" ON public.notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete notifications" ON public.notifications FOR DELETE TO authenticated USING (true);

-- open_shifts
REVOKE ALL ON public.open_shifts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.open_shifts TO authenticated;
GRANT ALL ON public.open_shifts TO service_role;
ALTER TABLE public.open_shifts ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='open_shifts' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.open_shifts', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated read open_shifts" ON public.open_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert open_shifts" ON public.open_shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update open_shifts" ON public.open_shifts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete open_shifts" ON public.open_shifts FOR DELETE TO authenticated USING (true);

-- reservations
REVOKE ALL ON public.reservations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='reservations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reservations', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Authenticated read reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete reservations" ON public.reservations FOR DELETE TO authenticated USING (true);
