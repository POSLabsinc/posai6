
-- Create user_preferences table for device-specific settings
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  preference_key text NOT NULL,
  preference_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, preference_key)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Public access (POS device settings, no auth required)
CREATE POLICY "user_preferences publicly readable" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "user_preferences publicly writable" ON public.user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "user_preferences publicly updatable" ON public.user_preferences FOR UPDATE USING (true);
CREATE POLICY "user_preferences publicly deletable" ON public.user_preferences FOR DELETE USING (true);
