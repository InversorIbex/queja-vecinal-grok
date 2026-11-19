-- Privacidad de ubicación: nunca GPS exacto del vecino.
-- complaints.lat/lng = pin público ofuscado (~10 km radio / ~20 km diámetro).
-- votes/comments: dejan de persistir coordenadas del dispositivo.

COMMENT ON COLUMN public.complaints.lat IS
  'Pin público ofuscado (radio ~10 km). Nunca es el GPS exacto del autor.';
COMMENT ON COLUMN public.complaints.lng IS
  'Pin público ofuscado (radio ~10 km). Nunca es el GPS exacto del autor.';

-- Quitar coords exactas de votos / comentarios (solo se guardaba distance_m).
ALTER TABLE public.votes
  DROP COLUMN IF EXISTS voter_lat,
  DROP COLUMN IF EXISTS voter_lng;

ALTER TABLE public.comments
  DROP COLUMN IF EXISTS author_lat,
  DROP COLUMN IF EXISTS author_lng;

-- Re-ofuscar filas existentes: punto aleatorio uniforme en disco de 10 km.
-- Así datos previos tampoco exponen GPS exacto.
UPDATE public.complaints AS c
SET
  lat = ST_Y(p.geom::geometry),
  lng = ST_X(p.geom::geometry),
  updated_at = now()
FROM (
  SELECT
    id,
    ST_Project(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      sqrt(random()) * 10000.0,
      random() * 2 * pi()
    ) AS geom
  FROM public.complaints
) AS p
WHERE c.id = p.id;
