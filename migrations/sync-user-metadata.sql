-- ==========================================
-- SYNC USER METADATA TO USERS TABLE
-- ==========================================
-- Updates existing users with their metadata
-- ==========================================

-- Add email column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update all users with missing full_name from auth.users metadata
UPDATE public.users pu
SET full_name = COALESCE(au.raw_user_meta_data->>'full_name', pu.full_name),
    email = COALESCE(au.email, pu.email)
FROM auth.users au
WHERE pu.id = au.id 
AND (pu.full_name IS NULL OR pu.full_name = '' OR pu.email IS NULL);

-- Update the trigger to also sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'jobseeker')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    email = COALESCE(EXCLUDED.email, public.users.email),
    role = COALESCE(EXCLUDED.role, public.users.role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
