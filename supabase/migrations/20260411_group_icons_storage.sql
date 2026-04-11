
-- Create group-icons bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-icons', 'group-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for group-icons bucket
-- 1. Allow public reading
CREATE POLICY "Public Read for group-icons" ON storage.objects
FOR SELECT USING (bucket_id = 'group-icons');

-- 2. Allow authenticated administrators to manage files
CREATE POLICY "Admins manage group-icons" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'group-icons' AND 
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_ccm'))
)
WITH CHECK (
  bucket_id = 'group-icons' AND 
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_ccm'))
);
