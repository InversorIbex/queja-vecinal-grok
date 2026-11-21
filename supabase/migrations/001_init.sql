-- QuejasVecinales — schema inicial (Postgres + PostGIS)
-- Ejecutar en Supabase SQL Editor o via supabase db push

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reputation_points INTEGER NOT NULL DEFAULT 0,
  reputation_level TEXT NOT NULL DEFAULT 'Novato',
  avatar_url TEXT,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  push_subscription JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quejas
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  anonymous_nickname TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  category TEXT NOT NULL CHECK (category IN (
    'baches_carreteras',
    'aceras',
    'mobiliario_urbano',
    'parques_jardines',
    'arbolado',
    'limpieza',
    'residuos',
    'iluminacion',
    'senales',
    'agua_saneamiento',
    'ruido',
    'animales',
    'vandalismo',
    'transporte',
    'sanidad',
    'educacion',
    'servicios_sociales',
    'medio_ambiente',
    'carreteras_provinciales',
    'carreteras_autonomicas',
    'carreteras_estatales',
    'costas',
    'otros'
  )),
  category_detail TEXT,
  admin_level TEXT NOT NULL CHECK (admin_level IN (
    'ayuntamiento',
    'provincia',
    'comunidad',
    'estado'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'resolved'
  )),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  photos TEXT[] NOT NULL DEFAULT '{}',
  tracking_code TEXT,
  municipio TEXT,
  provincia TEXT,
  comunidad TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  mailbox_key TEXT,
  reporter_email TEXT,
  email_status TEXT NOT NULL DEFAULT 'none',
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  votes_real INTEGER NOT NULL DEFAULT 0,
  votes_fake INTEGER NOT NULL DEFAULT 0,
  votes_resolved INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS complaints_location_idx ON public.complaints USING GIST (location);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON public.complaints (status);
CREATE INDEX IF NOT EXISTS complaints_category_idx ON public.complaints (category);
CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON public.complaints (created_at DESC);

-- Votos (un usuario / nick por queja)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  voter_nickname TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('real', 'fake', 'resolved')),
  voter_lat DOUBLE PRECISION NOT NULL,
  voter_lng DOUBLE PRECISION NOT NULL,
  distance_m DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (complaint_id, voter_nickname)
);

-- Comentarios
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_nickname TEXT NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 2 AND 1000),
  author_lat DOUBLE PRECISION NOT NULL,
  author_lng DOUBLE PRECISION NOT NULL,
  distance_m DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_complaint_idx ON public.comments (complaint_id, created_at);

-- Reportes de abuso
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_nickname TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (complaint_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

INSERT INTO public.badges (id, name, description, icon, min_points) VALUES
  ('primer_paso', 'Primer paso', 'Publicaste tu primera queja aprobada', 'footprints', 10),
  ('ojo_vecinal', 'Ojo vecinal', '10 votos Real útiles', 'eye', 50),
  ('voz_barrio', 'Voz del barrio', '25 comentarios cercanos', 'message-circle', 100),
  ('experto', 'Experto Vecinal', 'Alcanzaste el nivel máximo', 'award', 500)
ON CONFLICT (id) DO NOTHING;

-- Función: distancia Haversine/PostGIS en metros
CREATE OR REPLACE FUNCTION public.distance_meters(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  );
$$;

-- Validar geofence 10 km
CREATE OR REPLACE FUNCTION public.within_10km(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
) RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.distance_meters(lat1, lng1, lat2, lng2) <= 10000;
$$;

-- Contadores de votos
CREATE OR REPLACE FUNCTION public.refresh_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.complaints c SET
    votes_real = (SELECT COUNT(*) FROM public.votes v WHERE v.complaint_id = COALESCE(NEW.complaint_id, OLD.complaint_id) AND v.vote_type = 'real'),
    votes_fake = (SELECT COUNT(*) FROM public.votes v WHERE v.complaint_id = COALESCE(NEW.complaint_id, OLD.complaint_id) AND v.vote_type = 'fake'),
    votes_resolved = (SELECT COUNT(*) FROM public.votes v WHERE v.complaint_id = COALESCE(NEW.complaint_id, OLD.complaint_id) AND v.vote_type = 'resolved'),
    updated_at = now()
  WHERE c.id = COALESCE(NEW.complaint_id, OLD.complaint_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS votes_refresh_counts ON public.votes;
CREATE TRIGGER votes_refresh_counts
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.refresh_vote_counts();

CREATE OR REPLACE FUNCTION public.refresh_comment_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.complaints c SET
    comments_count = (SELECT COUNT(*) FROM public.comments cm WHERE cm.complaint_id = COALESCE(NEW.complaint_id, OLD.complaint_id)),
    updated_at = now()
  WHERE c.id = COALESCE(NEW.complaint_id, OLD.complaint_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS comments_refresh_counts ON public.comments;
CREATE TRIGGER comments_refresh_counts
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.refresh_comment_counts();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Complaints: público ve approved/resolved; autor ve las suyas; admin todo
CREATE POLICY complaints_select_public ON public.complaints FOR SELECT USING (
  status IN ('approved', 'resolved')
  OR author_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY complaints_insert ON public.complaints FOR INSERT WITH CHECK (true);

CREATE POLICY complaints_admin_update ON public.complaints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  OR author_id = auth.uid()
);

CREATE POLICY complaints_admin_delete ON public.complaints FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY votes_select ON public.votes FOR SELECT USING (true);
CREATE POLICY votes_insert ON public.votes FOR INSERT WITH CHECK (true);

CREATE POLICY comments_select ON public.comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON public.comments FOR INSERT WITH CHECK (true);

CREATE POLICY reports_insert ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY reports_admin ON public.reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY notifications_own ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY badges_select ON public.badges FOR SELECT USING (true);
CREATE POLICY user_badges_select ON public.user_badges FOR SELECT USING (true);
