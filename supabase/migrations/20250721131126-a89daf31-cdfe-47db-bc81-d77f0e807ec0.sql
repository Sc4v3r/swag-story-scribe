-- Add status field to profiles table to track user status
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted'));

-- Create index for performance
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Update RLS policies to respect user status
CREATE POLICY "Blocked users cannot update profiles" 
ON public.profiles 
FOR UPDATE 
USING (status != 'blocked' AND auth.uid() = user_id);

-- Admins can view all profiles regardless of status
CREATE POLICY "Admins can view all profiles including blocked" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR (status = 'active' AND true));