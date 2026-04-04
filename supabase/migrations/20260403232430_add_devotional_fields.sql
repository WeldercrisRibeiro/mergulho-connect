-- Add exploration fields to devotionals
ALTER TABLE public.devotionals 
ADD COLUMN expiration_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update RLS for is_active and expiration_date
-- The SELECT policy for regular users should now check these fields
DROP POLICY IF EXISTS "Published devotionals viewable" ON public.devotionals;

CREATE POLICY "Published devotionals viewable" ON public.devotionals 
FOR SELECT TO authenticated 
USING (
  (status = 'published' AND is_active = true AND (expiration_date IS NULL OR expiration_date > now())) 
  OR public.has_role(auth.uid(), 'admin')
);
