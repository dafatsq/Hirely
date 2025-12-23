-- ==========================================
-- FIX RATING POLICY AND COMPANY DEFAULTS
-- ==========================================
-- 1. Update RLS policy to allow rating at any application status
-- 2. Ensure new companies start with 0 ratings
-- 3. Add trigger to initialize company ratings on creation
-- ==========================================

-- Drop old policy
DROP POLICY IF EXISTS "Job seekers can create ratings for accepted applications" ON public.company_ratings;

-- Create new policy allowing rating at any status (not just accepted)
CREATE POLICY "Job seekers can create ratings for their applications" ON public.company_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.job_applications
            WHERE id = application_id
            AND user_id = auth.uid()
        )
    );

-- Function to ensure new companies have default rating values
CREATE OR REPLACE FUNCTION initialize_company_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values if they are NULL
  IF NEW.average_rating IS NULL THEN
    NEW.average_rating := 0;
  END IF;
  
  IF NEW.total_ratings IS NULL THEN
    NEW.total_ratings := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize company ratings on insert
DROP TRIGGER IF EXISTS trigger_initialize_company_ratings ON public.companies;
CREATE TRIGGER trigger_initialize_company_ratings
BEFORE INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION initialize_company_ratings();

-- Update any existing companies with NULL ratings to 0
UPDATE public.companies 
SET 
  average_rating = COALESCE(average_rating, 0),
  total_ratings = COALESCE(total_ratings, 0)
WHERE average_rating IS NULL OR total_ratings IS NULL;

-- Add NOT NULL constraint to ensure data integrity going forward
ALTER TABLE public.companies 
ALTER COLUMN average_rating SET DEFAULT 0,
ALTER COLUMN average_rating SET NOT NULL,
ALTER COLUMN total_ratings SET DEFAULT 0,
ALTER COLUMN total_ratings SET NOT NULL;

COMMENT ON POLICY "Job seekers can create ratings for their applications" ON public.company_ratings 
IS 'Allows job seekers to rate companies for any application they own (not limited to accepted status)';
