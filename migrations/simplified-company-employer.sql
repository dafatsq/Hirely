-- ==========================================
-- SIMPLIFIED COMPANY-EMPLOYER RELATIONSHIP
-- ==========================================
-- Multiple employers can be part of one company
-- No verification needed
-- ==========================================

-- Add company_id to users table (for employers)
-- This allows multiple employers to belong to the same company
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Drop the old policies first before dropping the column
DROP POLICY IF EXISTS "Employers can insert their own company" ON companies;
DROP POLICY IF EXISTS "Employers can update their own company" ON companies;

-- Remove the employer_id column from companies if it exists
ALTER TABLE companies
DROP COLUMN IF EXISTS employer_id CASCADE;

-- Remove verification requirement
ALTER TABLE companies
ALTER COLUMN verified SET DEFAULT true;

-- Update existing companies to be verified
UPDATE companies SET verified = true WHERE verified = false;

-- Drop the old triggers and functions if they exist
DROP TRIGGER IF EXISTS enforce_job_company_match ON job_postings;
DROP TRIGGER IF EXISTS sync_company_to_user ON companies;
DROP FUNCTION IF EXISTS check_job_posting_company();
DROP FUNCTION IF EXISTS sync_employer_company();

-- Create function to ensure employers can only post jobs for their company
CREATE OR REPLACE FUNCTION check_employer_company_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the employer belongs to the company they're posting for
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.employer_id 
    AND company_id = NEW.company_id
    AND role = 'employer'
  ) THEN
    RAISE EXCEPTION 'You can only post jobs for your company';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_employer_company_match
BEFORE INSERT OR UPDATE ON job_postings
FOR EACH ROW
EXECUTE FUNCTION check_employer_company_match();

-- Update RLS policies for companies
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON companies;
DROP POLICY IF EXISTS "Employers can insert their own company" ON companies;
DROP POLICY IF EXISTS "Employers can update their own company" ON companies;

CREATE POLICY "Companies are viewable by everyone"
ON companies FOR SELECT
USING (true);

CREATE POLICY "Any employer can create a company"
ON companies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'employer'
  )
);

CREATE POLICY "Employers can update their company"
ON companies FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND company_id = companies.id
    AND role = 'employer'
  )
);

COMMENT ON COLUMN users.company_id IS 'For employers: references their company. Multiple employers can belong to the same company.';
