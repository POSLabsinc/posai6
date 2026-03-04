
CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  initials TEXT DEFAULT '',
  avatar_bg TEXT DEFAULT '#6B7280',
  loyalty TEXT DEFAULT '',
  since TEXT DEFAULT '',
  birthday TEXT DEFAULT '',
  anniversary TEXT DEFAULT '',
  vehicle TEXT DEFAULT '',
  allergies TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes_general TEXT DEFAULT '',
  notes_special_relation TEXT DEFAULT '',
  notes_seating_preferences TEXT DEFAULT '',
  notes_special_note TEXT DEFAULT '',
  notes_allergies TEXT DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read/write for now (no auth required for POS terminal)
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to guests" ON public.guests
  FOR ALL USING (true) WITH CHECK (true);
