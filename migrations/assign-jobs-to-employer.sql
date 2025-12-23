-- ==========================================
-- ASSIGN SEEDED JOBS TO EMPLOYER ACCOUNT
-- ==========================================
-- This script assigns all jobs with NULL employer_id to your employer account
-- Run this in Supabase SQL Editor
-- ==========================================

-- First, find your employer user ID
-- Replace 'YOUR_EMPLOYER_EMAIL' with your actual employer account email
DO $$
DECLARE
  v_employer_id UUID;
BEGIN
  -- Get the employer user ID from the users table where role = 'employer'
  -- If you have multiple employers, this will get the first one
  SELECT id INTO v_employer_id 
  FROM users 
  WHERE role = 'employer' 
  LIMIT 1;

  -- Update all jobs with NULL employer_id to this employer
  UPDATE job_postings 
  SET employer_id = v_employer_id 
  WHERE employer_id IS NULL;

  RAISE NOTICE 'Updated % jobs to employer_id: %', 
    (SELECT COUNT(*) FROM job_postings WHERE employer_id = v_employer_id),
    v_employer_id;
END $$;

-- Verify the update
SELECT 
  COUNT(*) as total_jobs,
  employer_id,
  (SELECT full_name FROM users WHERE id = employer_id) as employer_name
FROM job_postings
GROUP BY employer_id;
