-- Fix missing jobseeker user in public.users table
-- This user exists in auth.users but not in public.users

-- First, let's sync ALL users from auth.users to public.users
INSERT INTO public.users (id, email, full_name, role, avatar_url, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    SPLIT_PART(au.email, '@', 1)
  ) as full_name,
  COALESCE(au.raw_user_meta_data->>'role', 'jobseeker') as role,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

-- Verify the fix
SELECT id, email, full_name, role FROM public.users 
WHERE id = 'd2042724-bf9f-408a-9137-76bf80bfb892';
