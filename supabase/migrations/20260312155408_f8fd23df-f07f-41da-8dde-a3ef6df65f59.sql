
-- Create default_modifiers table
CREATE TABLE public.default_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Normal',
  archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Add-On',
  archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  display_name TEXT DEFAULT '',
  selected_add_ons JSONB DEFAULT '[]'::jsonb,
  selected_modifiers JSONB DEFAULT '[]'::jsonb,
  selected_default_modifiers JSONB DEFAULT '[]'::jsonb,
  modifier_group_position INTEGER DEFAULT 0,
  has_max_selections BOOLEAN NOT NULL DEFAULT false,
  max_selections INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timed_pricing_rules table
CREATE TABLE public.timed_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'happy_hour',
  start_time TEXT NOT NULL DEFAULT '4:00 PM',
  end_time TEXT NOT NULL DEFAULT '6:00 PM',
  adjustment NUMERIC NOT NULL DEFAULT 0,
  days TEXT[] NOT NULL DEFAULT '{}'::text[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.default_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timed_pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for default_modifiers
CREATE POLICY "default_modifiers publicly readable" ON public.default_modifiers FOR SELECT TO public USING (true);
CREATE POLICY "default_modifiers publicly writable" ON public.default_modifiers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "default_modifiers publicly updatable" ON public.default_modifiers FOR UPDATE TO public USING (true);
CREATE POLICY "default_modifiers publicly deletable" ON public.default_modifiers FOR DELETE TO public USING (true);

-- RLS policies for groups
CREATE POLICY "groups publicly readable" ON public.groups FOR SELECT TO public USING (true);
CREATE POLICY "groups publicly writable" ON public.groups FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "groups publicly updatable" ON public.groups FOR UPDATE TO public USING (true);
CREATE POLICY "groups publicly deletable" ON public.groups FOR DELETE TO public USING (true);

-- RLS policies for timed_pricing_rules
CREATE POLICY "timed_pricing_rules publicly readable" ON public.timed_pricing_rules FOR SELECT TO public USING (true);
CREATE POLICY "timed_pricing_rules publicly writable" ON public.timed_pricing_rules FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "timed_pricing_rules publicly updatable" ON public.timed_pricing_rules FOR UPDATE TO public USING (true);
CREATE POLICY "timed_pricing_rules publicly deletable" ON public.timed_pricing_rules FOR DELETE TO public USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_default_modifiers_updated_at BEFORE UPDATE ON public.default_modifiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timed_pricing_rules_updated_at BEFORE UPDATE ON public.timed_pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
