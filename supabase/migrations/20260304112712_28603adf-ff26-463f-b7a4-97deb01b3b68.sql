
-- Add missing category column to order_items for reports grouping
ALTER TABLE public.order_items ADD COLUMN category TEXT NOT NULL DEFAULT 'Uncategorized';

-- Add refund_amount column to orders for refund tracking
ALTER TABLE public.orders ADD COLUMN refund_amount NUMERIC NOT NULL DEFAULT 0;
