-- ==========================================
-- FIX COMPANY VERIFIED DEFAULT VALUE
-- Change default from true to false (new companies should be unverified)
-- ==========================================

-- Change the default value for verified column to false
ALTER TABLE public.companies
ALTER COLUMN verified SET DEFAULT false;

-- Verify the change
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name = 'verified';
