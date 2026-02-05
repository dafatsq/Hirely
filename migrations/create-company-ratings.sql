-- ==========================================
-- COMPANY RATINGS SYSTEM
-- ==========================================
-- Allows job seekers to rate companies they've worked with
-- Only available for accepted applications
-- ==========================================

-- Create company_ratings table
CREATE TABLE IF NOT EXISTS public.company_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    work_life_balance INTEGER CHECK (work_life_balance >= 1 AND work_life_balance <= 5),
    salary_benefits INTEGER CHECK (salary_benefits >= 1 AND salary_benefits <= 5),
    job_security INTEGER CHECK (job_security >= 1 AND job_security <= 5),
    management INTEGER CHECK (management >= 1 AND management <= 5),
    culture INTEGER CHECK (culture >= 1 AND culture <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(application_id) -- One rating per application
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_ratings_company_id ON public.company_ratings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ratings_user_id ON public.company_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ratings_application_id ON public.company_ratings(application_id);

-- Add average rating column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Function to update company average rating
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update company average rating and total count
  UPDATE public.companies
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.company_ratings
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.company_ratings
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    )
  WHERE id = COALESCE(NEW.company_id, OLD.company_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update company rating on insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_company_rating ON public.company_ratings;
CREATE TRIGGER trigger_update_company_rating
AFTER INSERT OR UPDATE OR DELETE ON public.company_ratings
FOR EACH ROW
EXECUTE FUNCTION update_company_rating();

-- Enable RLS
ALTER TABLE public.company_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view company ratings" ON public.company_ratings
    FOR SELECT USING (true);

CREATE POLICY "Job seekers can create ratings for accepted applications" ON public.company_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.job_applications
            WHERE id = application_id
            AND user_id = auth.uid()
            AND status = 'accepted'
        )
    );

CREATE POLICY "Users can update their own ratings" ON public.company_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.company_ratings
    FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.company_ratings IS 'Company ratings and reviews from job seekers who were accepted';
