
-- Extend events table with new fields for courses/conferences
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'simple';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS speakers text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pix_key text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pix_qrcode_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS map_url text;

-- Volunteers table
CREATE TABLE public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  availability text,
  interest_area text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view volunteers" ON public.volunteers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can volunteer" ON public.volunteers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own volunteer" ON public.volunteers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own volunteer" ON public.volunteers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage volunteers" ON public.volunteers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Event registrations table
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view registrations" ON public.event_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage registrations" ON public.event_registrations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Event reports table (post-event metrics)
CREATE TABLE public.event_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  report_type text NOT NULL DEFAULT 'culto',
  total_attendees integer DEFAULT 0,
  children_count integer DEFAULT 0,
  monitors_count integer DEFAULT 0,
  total_offerings numeric DEFAULT 0,
  tithers jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reports" ON public.event_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view reports" ON public.event_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
