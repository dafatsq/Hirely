-- Create a computed column for searching skills as text
CREATE OR REPLACE FUNCTION skills_text(job_postings) RETURNS text AS $$
  SELECT array_to_string($1.skills, ' ')
$$ LANGUAGE SQL IMMUTABLE;
