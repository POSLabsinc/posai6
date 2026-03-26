
CREATE TABLE public.kds_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL UNIQUE,
  message_text text NOT NULL,
  store_id text NOT NULL DEFAULT 'default',
  terminal_id text NOT NULL DEFAULT 'default',
  terminal_name text,
  employee_id text NOT NULL DEFAULT 'default',
  employee_name text NOT NULL,
  employee_role text,
  table_id text,
  table_number text,
  linked_order_id text,
  linked_order_number integer,
  linked_order_ids jsonb DEFAULT '[]'::jsonb,
  link_type text DEFAULT 'none',
  status text NOT NULL DEFAULT 'pending',
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.kds_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kds_messages publicly readable" ON public.kds_messages FOR SELECT TO public USING (true);
CREATE POLICY "kds_messages publicly writable" ON public.kds_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "kds_messages publicly updatable" ON public.kds_messages FOR UPDATE TO public USING (true);
CREATE POLICY "kds_messages publicly deletable" ON public.kds_messages FOR DELETE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.kds_messages;
