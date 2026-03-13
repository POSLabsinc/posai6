
-- Add auto-incrementing order_number to ticket_orders
CREATE SEQUENCE IF NOT EXISTS ticket_orders_order_number_seq;

ALTER TABLE public.ticket_orders 
ADD COLUMN order_number integer NOT NULL DEFAULT nextval('ticket_orders_order_number_seq');

-- Backfill existing rows with sequential numbers based on created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.ticket_orders
)
UPDATE public.ticket_orders t
SET order_number = n.rn
FROM numbered n
WHERE t.id = n.id;

-- Update sequence to continue from max
SELECT setval('ticket_orders_order_number_seq', COALESCE((SELECT MAX(order_number) FROM public.ticket_orders), 0) + 1);
