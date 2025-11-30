-- ==========================================
-- FIX COMPANY REPORTS STATUS CONSTRAINT
-- Update the check constraint to allow new status values
-- ==========================================

-- Drop the old status constraint that only allowed old values
ALTER TABLE public.company_reports 
DROP CONSTRAINT IF EXISTS company_reports_status_check;

-- Add new constraint with updated status values
-- Old values: 'pending', 'under_review', 'resolved', 'dismissed'
-- New values: 'open', 'in_progress', 'closed', 'rejected'
ALTER TABLE public.company_reports 
ADD CONSTRAINT company_reports_status_check 
CHECK (status IN ('open', 'in_progress', 'closed', 'rejected'));

-- Verify the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.company_reports'::regclass
  AND conname = 'company_reports_status_check';
