-- Enable RLS on tables missing it
ALTER TABLE public.landing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- landing_photos: public read, admin manage
CREATE POLICY "Landing photos viewable by everyone"
  ON public.landing_photos FOR SELECT
  TO public
  USING (true);
CREATE POLICY "Admins can manage landing photos"
  ON public.landing_photos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- landing_testimonials: public read, admin manage
CREATE POLICY "Landing testimonials viewable by everyone"
  ON public.landing_testimonials FOR SELECT
  TO public
  USING (true);
CREATE POLICY "Admins can manage landing testimonials"
  ON public.landing_testimonials FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- contact_messages: anyone can insert, admins can read
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  TO public
  WITH CHECK (true);
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- site_settings: public read, admin manage
CREATE POLICY "Site settings viewable by everyone"
  ON public.site_settings FOR SELECT
  TO public
  USING (true);
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));