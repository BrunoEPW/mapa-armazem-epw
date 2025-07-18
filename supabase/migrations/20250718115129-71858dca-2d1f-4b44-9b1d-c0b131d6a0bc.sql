-- Create a test admin user for initial access
-- This is safe to run multiple times (will only insert if email doesn't exist)
DO $$
BEGIN
  -- Only create if no profiles exist yet
  IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
    -- Note: This creates a profile entry that will be linked when a user signs up
    -- The actual auth user must be created through the sign-up flow
    INSERT INTO public.profiles (
      user_id, 
      email, 
      name, 
      role
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- Placeholder UUID, will be updated on first login
      'admin@example.com',
      'Admin User',
      'admin'
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;