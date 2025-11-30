-- ==========================================
-- EMERGENCY FIX - SYNC ALL USER DATA NOW
-- ==========================================
-- Force sync all user data immediately
-- ==========================================

-- First, make sure email column exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Force update ALL users right now
UPDATE public.users pu
SET 
  full_name = COALESCE(
    NULLIF(pu.full_name, ''),  -- Keep existing if not empty
    au.raw_user_meta_data->>'full_name',  -- Try metadata
    SPLIT_PART(au.email, '@', 1)  -- Fallback to email username
  ),
  email = au.email
FROM auth.users au
WHERE pu.id = au.id;

-- Show what we got
SELECT id, full_name, email, role FROM public.users;
