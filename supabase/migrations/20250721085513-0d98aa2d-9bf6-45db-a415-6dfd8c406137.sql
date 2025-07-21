-- Update the profiles RLS policy to allow public read access to display names
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

CREATE POLICY "Public can view profile display info" 
ON profiles 
FOR SELECT 
USING (true);