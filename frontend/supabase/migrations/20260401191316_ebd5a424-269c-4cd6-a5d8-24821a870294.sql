
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderador', 'membro');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  whatsapp_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'membro',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'users',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Member-group relationship (many-to-many)
CREATE TABLE public.member_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);
ALTER TABLE public.member_groups ENABLE ROW LEVEL SECURITY;

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_general BOOLEAN NOT NULL DEFAULT true,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Devotionals table
CREATE TABLE public.devotionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_devotionals_updated_at BEFORE UPDATE ON public.devotionals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table (direct + group chat)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (recipient_id IS NOT NULL OR group_id IS NOT NULL)
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'membro');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: everyone can view, users edit own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: viewable by authenticated, managed by admins
CREATE POLICY "Roles viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Groups: viewable by all authenticated
CREATE POLICY "Groups viewable by authenticated" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage groups" ON public.groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Member groups
CREATE POLICY "Member groups viewable by authenticated" ON public.member_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join groups" ON public.member_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.member_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage member groups" ON public.member_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Events: general visible to all, group events to group members
CREATE POLICY "General events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (
  is_general = true OR
  EXISTS (SELECT 1 FROM public.member_groups WHERE user_id = auth.uid() AND group_id = events.group_id) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Event RSVPs
CREATE POLICY "RSVPs viewable by authenticated" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own RSVPs" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVPs" ON public.event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVPs" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Devotionals: published visible to all authenticated
CREATE POLICY "Published devotionals viewable" ON public.devotionals FOR SELECT TO authenticated USING (
  status = 'published' OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage devotionals" ON public.devotionals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR
  recipient_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.member_groups WHERE user_id = auth.uid() AND group_id = messages.group_id)
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Seed default groups
INSERT INTO public.groups (name, description, icon) VALUES
  ('Louvor', 'Ministério de louvor e adoração', 'music'),
  ('Mídia', 'Equipe de mídia e comunicação', 'camera'),
  ('Acolhimento', 'Equipe de acolhimento e recepção', 'heart'),
  ('Mulheres', 'Grupo de mulheres', 'users'),
  ('Homens', 'Grupo de homens', 'users'),
  ('Voluntários', 'Equipe de voluntários', 'hand-helping');
