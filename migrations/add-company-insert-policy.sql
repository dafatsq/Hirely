-- ==========================================
-- ADD COMPANY INSERT POLICY
-- Allow employers to create companies
-- ==========================================

-- Add policy for employers to insert companies
CREATE POLICY "employers_insert_companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'employer'
  )
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;
