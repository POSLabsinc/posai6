
-- Phase 1: Add guest_id foreign key columns to orders, reservations, guest_feedback
ALTER TABLE public.orders ADD COLUMN guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL;
ALTER TABLE public.reservations ADD COLUMN guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL;
ALTER TABLE public.guest_feedback ADD COLUMN guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_orders_guest_id ON public.orders(guest_id);
CREATE INDEX idx_reservations_guest_id ON public.reservations(guest_id);
CREATE INDEX idx_guest_feedback_guest_id ON public.guest_feedback(guest_id);

-- Phase 2: Backfill existing data from name matches
UPDATE public.orders SET guest_id = g.id FROM public.guests g WHERE orders.customer_name = g.name AND orders.guest_id IS NULL;
UPDATE public.reservations SET guest_id = g.id FROM public.guests g WHERE reservations.guest_name = g.name AND reservations.guest_id IS NULL;
UPDATE public.guest_feedback SET guest_id = g.id FROM public.guests g WHERE guest_feedback.guest_name = g.name AND guest_feedback.guest_id IS NULL;
