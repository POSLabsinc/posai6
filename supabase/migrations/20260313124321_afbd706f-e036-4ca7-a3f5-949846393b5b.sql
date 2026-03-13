INSERT INTO public.user_roles (user_id, role)
VALUES ('df533081-1d2d-4a3f-ba3c-c24bf56da8b0', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;