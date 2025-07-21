-- Update the user role to admin for admin@pentest-stories.com
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '65b5dfc1-79d6-452c-822f-b517beb1a4f5';