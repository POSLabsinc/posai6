
-- Add loyalty & tracking columns to guests
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS loyalty_points_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_date timestamptz,
  ADD COLUMN IF NOT EXISTS order_count integer NOT NULL DEFAULT 0;

-- Create loyalty_points transaction history table
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  points integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'earned',
  description text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing pattern)
CREATE POLICY "loyalty_points publicly readable" ON public.loyalty_points FOR SELECT TO public USING (true);
CREATE POLICY "loyalty_points publicly writable" ON public.loyalty_points FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "loyalty_points publicly updatable" ON public.loyalty_points FOR UPDATE TO public USING (true);
CREATE POLICY "loyalty_points publicly deletable" ON public.loyalty_points FOR DELETE TO public USING (true);
