-- QuejasVecinales — categorías ampliadas + rol super_admin + banned
-- Ejecutar tras 001_init.sql (y opcional 002_seed_demo.sql)

-- ─── Perfiles: super_admin + banned ───────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'super_admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS profiles_banned_idx ON public.profiles (banned)
  WHERE banned = true;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email)
  WHERE email IS NOT NULL;

-- ─── Categorías ampliadas (mantiene originales) ───────
ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS complaints_category_check;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_category_check
  CHECK (category IN (
    'baches_carreteras',
    'mobiliario_urbano',
    'parques_jardines',
    'limpieza',
    'iluminacion',
    'senales',
    'agua_alcantarillado',
    'ruido',
    'animales_plagas',
    'transporte_publico',
    'accesibilidad',
    'obras_andamios',
    'contenedores',
    'grafitis_vandalismo',
    'aparcamiento_semaforos',
    'contaminacion',
    'seguridad_ciudadana',
    'playas_costa',
    'otros'
  ));

-- ─── RLS: admin y super_admin ─────────────────────────
DROP POLICY IF EXISTS complaints_select_public ON public.complaints;
CREATE POLICY complaints_select_public ON public.complaints FOR SELECT USING (
  status IN ('approved', 'resolved')
  OR author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS complaints_admin_update ON public.complaints;
CREATE POLICY complaints_admin_update ON public.complaints FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
  OR author_id = auth.uid()
);

DROP POLICY IF EXISTS complaints_admin_delete ON public.complaints;
CREATE POLICY complaints_admin_delete ON public.complaints FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS reports_admin ON public.reports;
CREATE POLICY reports_admin ON public.reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
);

-- Comentarios: super_admin / admin pueden borrar
DROP POLICY IF EXISTS comments_admin_delete ON public.comments;
CREATE POLICY comments_admin_delete ON public.comments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
);

-- Perfiles: super_admin puede actualizar cualquier perfil (ban / rol)
DROP POLICY IF EXISTS profiles_super_admin_update ON public.profiles;
CREATE POLICY profiles_super_admin_update ON public.profiles FOR UPDATE USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Helper: marcar SUPER_ADMIN por email (documentado; sin secretos)
-- Ejemplo tras crear el usuario en Auth:
--   UPDATE public.profiles SET role = 'super_admin'
--   WHERE email = lower('tu@email.com');
-- O al vincular con auth.users:
CREATE OR REPLACE FUNCTION public.promote_super_admin_by_email(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET role = 'super_admin', updated_at = now()
  FROM auth.users u
  WHERE p.id = u.id
    AND lower(u.email) = lower(target_email);
END;
$$;

COMMENT ON FUNCTION public.promote_super_admin_by_email(TEXT) IS
  'Promueve a super_admin el perfil cuyo auth.users.email coincide. Usar con SUPER_ADMIN_EMAIL.';
