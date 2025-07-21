-- Comprehensive Security Fixes Migration

-- 1. Fix Critical Privilege Escalation Vulnerability
-- Update user_roles policies to prevent self-privilege escalation
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- New secure policies for user_roles table
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Secure Database Functions - Fix search_path vulnerabilities
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Remove hardcoded admin user and update handle_new_user function
DELETE FROM public.profiles WHERE email = 'admin@storyhub.com';
DELETE FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Update handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default user role (no automatic admin assignment)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 4. Restrict Anonymous Access - Update policies to require authentication
-- Update profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Stories can remain public for reading, but restrict modifications
DROP POLICY IF EXISTS "Everyone can view stories" ON public.stories;
CREATE POLICY "Public can view stories" 
ON public.stories 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Restrict other story operations to authenticated users only
DROP POLICY IF EXISTS "Authors can update their own stories" ON public.stories;
DROP POLICY IF EXISTS "Authors can delete their own stories" ON public.stories;

CREATE POLICY "Authors can update their own stories" 
ON public.stories 
FOR UPDATE 
TO authenticated
USING ((auth.uid() = author_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authors can delete their own stories" 
ON public.stories 
FOR DELETE 
TO authenticated
USING ((auth.uid() = author_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Update story_tags policies  
DROP POLICY IF EXISTS "Everyone can view story tags" ON public.story_tags;
CREATE POLICY "Public can view story tags" 
ON public.story_tags 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Update tags policies
DROP POLICY IF EXISTS "Everyone can view tags" ON public.tags;
CREATE POLICY "Public can view tags" 
ON public.tags 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 5. Add audit logging table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'ROLE_GRANTED', 'user_roles', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'ROLE_REVOKED', 'user_roles', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role change auditing
CREATE TRIGGER audit_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- 6. Add content validation constraints
ALTER TABLE public.stories 
ADD CONSTRAINT story_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200);

ALTER TABLE public.stories 
ADD CONSTRAINT story_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 50000);

-- 7. Create function for secure admin user creation
CREATE OR REPLACE FUNCTION public.create_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only existing admins can create new admins
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only admins can create admin users';
  END IF;
  
  -- Add admin role to specified user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, table_name, new_values)
  VALUES (auth.uid(), 'ADMIN_CREATED', 'user_roles', jsonb_build_object('target_user_id', _user_id));
  
  RETURN true;
END;
$$;