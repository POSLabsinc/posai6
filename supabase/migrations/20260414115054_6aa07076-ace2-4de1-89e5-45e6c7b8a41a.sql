CREATE TRIGGER update_ticket_orders_updated_at
BEFORE UPDATE ON public.ticket_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();