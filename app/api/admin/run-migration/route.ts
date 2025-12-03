import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Simple password check (you should use a proper admin check in production)
    if (password !== process.env.ADMIN_MIGRATION_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Run migration SQL
    const migrationSQL = `
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
    `

    // Execute the migration
    const { error } = await adminClient.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migration executed successfully' 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
