-- Seed demo (opcional). No requiere auth.users reales para datos públicos de mapa.
-- En producción, las quejas reales llegan vía API; este seed es para demos locales
-- si usas tablas sin FK a auth. Para Supabase real, omite o adapta author_id = NULL.

-- Nota: si profiles exige FK a auth.users, las quejas seed van sin author_id.
