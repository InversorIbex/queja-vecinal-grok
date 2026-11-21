-- Solo para una base creada con 001_init.sql (id UUID).
-- El Supabase de este proyecto ya tiene `complaints` con id entero y `author_alias`.
-- La app habla con esa tabla directamente: no ejecutes este archivo allí.

ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS category_detail TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS provincia TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS comunidad TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS mailbox_key TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS reporter_email TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS email_error TEXT;

UPDATE public.complaints
SET tracking_code = 'QV-' || upper(substr(replace(id::text, '-', ''), 1, 6))
WHERE tracking_code IS NULL OR tracking_code = '';

CREATE UNIQUE INDEX IF NOT EXISTS complaints_tracking_code_idx
  ON public.complaints (tracking_code);

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.complaints'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%baches_carreteras%'
  LOOP
    EXECUTE format('ALTER TABLE public.complaints DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_category_check CHECK (category IN (
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
  ));

CREATE TABLE IF NOT EXISTS public.complaint_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS complaint_events_complaint_idx
  ON public.complaint_events (complaint_id, created_at);

CREATE TABLE IF NOT EXISTS public.admin_mailboxes (
  mailbox_key TEXT PRIMARY KEY,
  admin_level TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  email TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_mailboxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select ON public.complaint_events;
CREATE POLICY events_select ON public.complaint_events FOR SELECT USING (true);
