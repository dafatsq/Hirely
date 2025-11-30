-- ==========================================
-- FIX USER ROLE REGISTRATION
-- ==========================================
-- Run this in Supabase SQL Editor
-- Creates trigger to sync auth.users metadata to public.users
-- ==========================================

-- Create or replace function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'jobseeker')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    role = COALESCE(EXCLUDED.role, public.users.role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (copies metadata to users table for anyone missing role)
INSERT INTO public.users (id, full_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'jobseeker')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(EXCLUDED.role, public.users.role),
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

-- Update existing users who have NULL role
UPDATE public.users pu
SET role = COALESCE(au.raw_user_meta_data->>'role', 'jobseeker')
FROM auth.users au
WHERE pu.id = au.id AND pu.role IS NULL;
