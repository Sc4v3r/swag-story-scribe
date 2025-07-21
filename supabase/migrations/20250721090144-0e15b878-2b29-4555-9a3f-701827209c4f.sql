-- Create admin user profile and role
-- Insert a profile for the admin user (you'll need to sign up with this email first)
INSERT INTO profiles (user_id, display_name, email, department) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'System Administrator', 
  'admin@company.com', 
  'IT Security'
) ON CONFLICT (user_id) DO NOTHING;

-- Create admin role for this user
INSERT INTO user_roles (user_id, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin'::app_role
) ON CONFLICT (user_id, role) DO NOTHING;