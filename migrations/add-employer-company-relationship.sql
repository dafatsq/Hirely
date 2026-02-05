-- ==========================================
-- ADD EMPLOYER-COMPANY RELATIONSHIP
-- ==========================================
-- This creates a 1-to-1 relationship between employers and companies
-- Employers must register/create a company before posting jobs
-- ==========================================

-- Add company_id to users table (for employers)
ALTER TABLE users 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_users_company_id ON users(company_id);

-- Note: We'll add the constraint later after data is properly set up
-- For now, employers can exist without a company (they need to register one)

-- Add employer_id to companies table (reverse relationship)
ALTER TABLE companies
ADD COLUMN employer_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE;

-- Add index
CREATE INDEX idx_companies_employer_id ON companies(employer_id);

-- Ensure job_postings company_id matches the employer's company
-- This prevents employers from posting jobs for other companies
CREATE OR REPLACE FUNCTION check_job_posting_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if employer's company_id matches the job's company_id
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.employer_id 
    AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Employer can only post jobs for their own company';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_job_company_match
BEFORE INSERT OR UPDATE ON job_postings
FOR EACH ROW
EXECUTE FUNCTION check_job_posting_company();

-- Update RLS policies for companies table
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON companies;
DROP POLICY IF EXISTS "Employers can insert their own company" ON companies;
DROP POLICY IF EXISTS "Employers can update their own company" ON companies;

CREATE POLICY "Companies are viewable by everyone"
ON companies FOR SELECT
USING (true);

CREATE POLICY "Employers can insert their own company"
ON companies FOR INSERT
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own company"
ON companies FOR UPDATE
USING (auth.uid() = employer_id);

-- Function to sync user.company_id when company is created
CREATE OR REPLACE FUNCTION sync_employer_company()
RETURNS TRIGGER AS $$
BEGIN
  -- When a company is created, update the employer's company_id
  UPDATE users 
  SET company_id = NEW.id 
  WHERE id = NEW.employer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync
CREATE TRIGGER sync_company_to_user
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION sync_employer_company();

COMMENT ON COLUMN users.company_id IS 'For employers: references their company. Must be NULL for jobseekers.';
COMMENT ON COLUMN companies.employer_id IS 'The employer who owns/manages this company.';
