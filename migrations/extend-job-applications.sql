-- ==========================================
-- EXTEND JOB_APPLICATIONS TABLE
-- ==========================================
-- Run this in Supabase SQL Editor
-- Adds columns for full application data
-- ==========================================

-- Add new columns to job_applications table
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS expected_salary BIGINT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS screening_answers JSONB DEFAULT '[]'::jsonb;

-- Create employer read policy for job_applications
-- Allows employers to view applications for jobs they posted
CREATE POLICY "Employers can view applications for their jobs"
  ON job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.employer_id = auth.uid()
    )
  );

-- Create employer update policy for application status
CREATE POLICY "Employers can update application status for their jobs"
  ON job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.employer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.employer_id = auth.uid()
    )
  );

-- Create storage bucket for resumes if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own resumes
CREATE POLICY "Users can read their own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow employers to read resumes of applicants to their jobs
CREATE POLICY "Employers can read applicant resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      WHERE jp.employer_id = auth.uid()
      AND ja.resume_url LIKE '%' || name || '%'
    )
  );
