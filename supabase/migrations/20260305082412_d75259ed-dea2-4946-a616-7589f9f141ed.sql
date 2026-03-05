
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  preview TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'system',
  bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer TEXT,
  has_update BOOLEAN NOT NULL DEFAULT false,
  time TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT 'POS',
  version_date TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read/write (no auth in this POS app)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to notifications"
  ON public.notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Seed some sample notifications
INSERT INTO public.notifications (title, preview, headline, body, category, bullets, has_update, time, version, version_date, is_read) VALUES
('POS AI 6.0 Released', 'New features and improvements available', 'POS AI 6.0 — Major Update', 'We are excited to announce the release of POS AI 6.0 with significant improvements across the platform.', 'system', '[{"label":"AI Settings Assistant:","text":"Chat with AI to manage your POS settings"},{"label":"Enhanced Notifications:","text":"Real-time notification system with filters and categories"},{"label":"Weather Alerts:","text":"Automatic weather-based notifications for your location"}]'::jsonb, true, '9:00 AM', 'POS AI 6.0', 'Mar 4, 2026', false),
('New Order Received', 'Order #1042 from Sarah Johnson', 'New Order Received', 'A new order (#1042) has been placed by Sarah Johnson. Please review and accept the order.', 'system', '[]'::jsonb, false, '8:45 AM', 'POS', 'Mar 5, 2026', false),
('Order Accepted', 'Order #1041 – Accepted', 'Order Accepted', 'Order #1041 status has been updated to "Accepted".', 'system', '[]'::jsonb, false, '8:30 AM', 'POS', 'Mar 5, 2026', true),
('System Maintenance', 'Scheduled maintenance tonight at 2 AM', 'Scheduled System Maintenance', 'The system will undergo scheduled maintenance tonight from 2:00 AM to 3:00 AM. All services will be temporarily unavailable during this window.', 'system', '[]'::jsonb, false, '7:00 AM', 'POS', 'Mar 5, 2026', false);
