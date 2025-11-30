-- ==========================================
-- CREATE RPC FUNCTION TO GET AUTH USER DATA
-- ==========================================
-- Allows querying auth.users data for applicants
-- ==========================================

-- Create function to get auth user data
CREATE OR REPLACE FUNCTION get_auth_users_for_applicants(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  raw_user_meta_data jsonb
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, email, raw_user_meta_data
  FROM auth.users
  WHERE id = ANY(user_ids);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users_for_applicants(uuid[]) TO authenticated;
