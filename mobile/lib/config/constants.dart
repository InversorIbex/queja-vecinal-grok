import '../models/models.dart';

const String appName = 'QuejasVecinales';
const String appTagline = 'Tu barrio, tu voz';
/// Radio máx. GPS ↔ pin elegido (crear / votar / comentar).
const double maxDistanceM = 10000;
/// Radio de ofuscación del pin público (~diámetro 20 km).
const double locationPrivacyRadiusM = 10000;
const int maxPhotos = 4;
const int maxPhotoBytes = 800 * 1024;

/// Madrid centro — fallback demo si no hay geolocalización.
const GeoPosition demoCenter = GeoPosition(lat: 40.4168, lng: -3.7038);

/// Misma lista que web `CATEGORIES` (labels en español).
const Map<ComplaintCategory, CategoryMeta> categories = {
  ComplaintCategory.bachesCarreteras: CategoryMeta(
    label: 'Baches y carreteras',
    color: 0xFFC2410C,
  ),
  ComplaintCategory.mobiliarioUrbano: CategoryMeta(
    label: 'Mobiliario urbano',
    color: 0xFF0369A1,
  ),
  ComplaintCategory.parquesJardines: CategoryMeta(
    label: 'Parques y jardines',
    color: 0xFF15803D,
  ),
  ComplaintCategory.limpieza: CategoryMeta(
    label: 'Limpieza',
    color: 0xFFA16207,
  ),
  ComplaintCategory.iluminacion: CategoryMeta(
    label: 'Iluminación',
    color: 0xFFCA8A04,
  ),
  ComplaintCategory.senales: CategoryMeta(
    label: 'Señales',
    color: 0xFFB91C1C,
  ),
  ComplaintCategory.aguaAlcantarillado: CategoryMeta(
    label: 'Agua y alcantarillado',
    color: 0xFF0E7490,
  ),
  ComplaintCategory.ruido: CategoryMeta(
    label: 'Ruido',
    color: 0xFF7C2D12,
  ),
  ComplaintCategory.animalesPlagas: CategoryMeta(
    label: 'Animales / plagas',
    color: 0xFF4D7C0F,
  ),
  ComplaintCategory.transportePublico: CategoryMeta(
    label: 'Transporte público',
    color: 0xFF1D4ED8,
  ),
  ComplaintCategory.accesibilidad: CategoryMeta(
    label: 'Accesibilidad',
    color: 0xFF7E22CE,
  ),
  ComplaintCategory.obrasAndamios: CategoryMeta(
    label: 'Obras y andamios',
    color: 0xFFB45309,
  ),
  ComplaintCategory.contenedores: CategoryMeta(
    label: 'Contenedores',
    color: 0xFF3F6212,
  ),
  ComplaintCategory.grafitisVandalismo: CategoryMeta(
    label: 'Grafitis / vandalismo',
    color: 0xFF9F1239,
  ),
  ComplaintCategory.aparcamientoSemaforos: CategoryMeta(
    label: 'Aparcamiento / semáforos',
    color: 0xFFC2410C,
  ),
  ComplaintCategory.contaminacion: CategoryMeta(
    label: 'Contaminación',
    color: 0xFF57534E,
  ),
  ComplaintCategory.seguridadCiudadana: CategoryMeta(
    label: 'Seguridad ciudadana',
    color: 0xFF1E3A8A,
  ),
  ComplaintCategory.playasCosta: CategoryMeta(
    label: 'Playas / costa',
    color: 0xFF0891B2,
  ),
  ComplaintCategory.otros: CategoryMeta(
    label: 'Otros',
    color: 0xFF475569,
  ),
};

const Map<AdminLevel, String> adminLevels = {
  AdminLevel.ayuntamiento: 'Ayuntamiento',
  AdminLevel.provincia: 'Provincia (Diputación)',
  AdminLevel.comunidad: 'Comunidad Autónoma',
  AdminLevel.estado: 'Estado (Gobierno de España)',
};

const Map<ComplaintStatus, String> statusLabels = {
  ComplaintStatus.pending: 'Pendiente de moderación',
  ComplaintStatus.approved: 'Aprobada',
  ComplaintStatus.rejected: 'Rechazada',
  ComplaintStatus.resolved: 'Resuelta',
};

const List<({ReputationLevel level, int min})> reputationThresholds = [
  (level: ReputationLevel.novato, min: 0),
  (level: ReputationLevel.vecinoActivo, min: 50),
  (level: ReputationLevel.vigilante, min: 150),
  (level: ReputationLevel.referente, min: 300),
  (level: ReputationLevel.expertoVecinal, min: 500),
];

const pointsComplaintApproved = 15;
const pointsVoteReal = 2;
const pointsVoteFake = 1;
const pointsComment = 3;
const pointsResolvedBonus = 10;

class CategoryMeta {
  const CategoryMeta({required this.label, required this.color});
  final String label;
  final int color;
}
