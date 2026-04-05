
-- Add status to volunteers table
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Create volunteer_schedules table
CREATE TABLE IF NOT EXISTS public.volunteer_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  volunteer_id uuid REFERENCES public.volunteers(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  role_function text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volunteer_schedules ENABLE ROW LEVEL SECURITY;

-- Admins manage schedules
CREATE POLICY "Admins manage volunteer schedules" ON public.volunteer_schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated can view schedules
CREATE POLICY "Authenticated view volunteer schedules" ON public.volunteer_schedules
  FOR SELECT TO authenticated
  USING (true);

-- Create devotionals storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('devotionals', 'devotionals', true)
ON CONFLICT (id) DO NOTHING;

-- Create event-banners storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for devotionals bucket
CREATE POLICY "Admin upload devotionals" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'devotionals' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read devotionals" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'devotionals');

CREATE POLICY "Admin delete devotionals" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'devotionals' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for event-banners bucket
CREATE POLICY "Admin upload event banners" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read event banners" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'event-banners');

CREATE POLICY "Admin delete event banners" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'::app_role));
