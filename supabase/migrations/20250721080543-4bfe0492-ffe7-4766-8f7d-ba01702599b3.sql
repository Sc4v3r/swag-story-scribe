-- Create an admin user account
-- Note: This creates the profile and role, but the actual auth user will be created via the signup process
-- Admin credentials will be: admin@storyhub.com / AdminPass123!

-- First, let's ensure we can create users programmatically by inserting a test admin profile
-- The auth user will be created when they sign up with these credentials
INSERT INTO public.profiles (id, user_id, display_name, email, department, business_vertical)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System Administrator',
  'admin@storyhub.com',
  'IT',
  'Technology'
) ON CONFLICT (user_id) DO NOTHING;

-- Create admin role for the admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update the handle_new_user function to automatically make the admin email an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign admin role if this is the admin email, otherwise assign user role
  IF NEW.email = 'admin@storyhub.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;