-- Create work_experience table
CREATE TABLE IF NOT EXISTS work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_work_experience_user_id ON work_experience(user_id);
CREATE INDEX idx_work_experience_dates ON work_experience(start_date DESC, end_date DESC);

-- Enable RLS
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own experience
CREATE POLICY "Users can view own work experience"
  ON work_experience
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own experience
CREATE POLICY "Users can insert own work experience"
  ON work_experience
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own experience
CREATE POLICY "Users can update own work experience"
  ON work_experience
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own experience
CREATE POLICY "Users can delete own work experience"
  ON work_experience
  FOR DELETE
  USING (auth.uid() = user_id);

-- Employers can view job seeker experience (for reviewing applicants)
CREATE POLICY "Employers can view job seeker experience"
  ON work_experience
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'employer'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_work_experience_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_experience_updated_at
  BEFORE UPDATE ON work_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_work_experience_updated_at();
