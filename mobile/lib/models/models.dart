enum UserRole { user, admin, superAdmin }

enum ComplaintStatus { pending, approved, rejected, resolved }

/// Sincronizado con web `COMPLAINT_CATEGORY_VALUES` / SQL CHECK.
enum ComplaintCategory {
  bachesCarreteras,
  mobiliarioUrbano,
  parquesJardines,
  limpieza,
  iluminacion,
  senales,
  aguaAlcantarillado,
  ruido,
  animalesPlagas,
  transportePublico,
  accesibilidad,
  obrasAndamios,
  contenedores,
  grafitisVandalismo,
  aparcamientoSemaforos,
  contaminacion,
  seguridadCiudadana,
  playasCosta,
  otros,
}

enum AdminLevel { ayuntamiento, provincia, comunidad, estado }

enum VoteType { real, fake, resolved }

enum ReputationLevel {
  novato,
  vecinoActivo,
  vigilante,
  referente,
  expertoVecinal,
}

extension ComplaintCategoryX on ComplaintCategory {
  String get apiValue => switch (this) {
        ComplaintCategory.bachesCarreteras => 'baches_carreteras',
        ComplaintCategory.mobiliarioUrbano => 'mobiliario_urbano',
        ComplaintCategory.parquesJardines => 'parques_jardines',
        ComplaintCategory.limpieza => 'limpieza',
        ComplaintCategory.iluminacion => 'iluminacion',
        ComplaintCategory.senales => 'senales',
        ComplaintCategory.aguaAlcantarillado => 'agua_alcantarillado',
        ComplaintCategory.ruido => 'ruido',
        ComplaintCategory.animalesPlagas => 'animales_plagas',
        ComplaintCategory.transportePublico => 'transporte_publico',
        ComplaintCategory.accesibilidad => 'accesibilidad',
        ComplaintCategory.obrasAndamios => 'obras_andamios',
        ComplaintCategory.contenedores => 'contenedores',
        ComplaintCategory.grafitisVandalismo => 'grafitis_vandalismo',
        ComplaintCategory.aparcamientoSemaforos => 'aparcamiento_semaforos',
        ComplaintCategory.contaminacion => 'contaminacion',
        ComplaintCategory.seguridadCiudadana => 'seguridad_ciudadana',
        ComplaintCategory.playasCosta => 'playas_costa',
        ComplaintCategory.otros => 'otros',
      };

  static ComplaintCategory fromApi(String v) => switch (v) {
        'baches_carreteras' => ComplaintCategory.bachesCarreteras,
        'mobiliario_urbano' => ComplaintCategory.mobiliarioUrbano,
        'parques_jardines' => ComplaintCategory.parquesJardines,
        'limpieza' => ComplaintCategory.limpieza,
        'iluminacion' => ComplaintCategory.iluminacion,
        'senales' => ComplaintCategory.senales,
        'agua_alcantarillado' => ComplaintCategory.aguaAlcantarillado,
        'ruido' => ComplaintCategory.ruido,
        'animales_plagas' => ComplaintCategory.animalesPlagas,
        'transporte_publico' => ComplaintCategory.transportePublico,
        'accesibilidad' => ComplaintCategory.accesibilidad,
        'obras_andamios' => ComplaintCategory.obrasAndamios,
        'contenedores' => ComplaintCategory.contenedores,
        'grafitis_vandalismo' => ComplaintCategory.grafitisVandalismo,
        'aparcamiento_semaforos' => ComplaintCategory.aparcamientoSemaforos,
        'contaminacion' => ComplaintCategory.contaminacion,
        'seguridad_ciudadana' => ComplaintCategory.seguridadCiudadana,
        'playas_costa' => ComplaintCategory.playasCosta,
        _ => ComplaintCategory.otros,
      };
}

extension AdminLevelX on AdminLevel {
  String get apiValue => name;
  static AdminLevel fromApi(String v) =>
      AdminLevel.values.firstWhere((e) => e.name == v, orElse: () => AdminLevel.ayuntamiento);
}

extension ComplaintStatusX on ComplaintStatus {
  String get apiValue => name;
  static ComplaintStatus fromApi(String v) =>
      ComplaintStatus.values.firstWhere((e) => e.name == v, orElse: () => ComplaintStatus.pending);
}

extension VoteTypeX on VoteType {
  String get apiValue => name;
  String get label => switch (this) {
        VoteType.real => 'Real',
        VoteType.fake => 'Falsa',
        VoteType.resolved => 'Resuelta',
      };
  static VoteType fromApi(String v) =>
      VoteType.values.firstWhere((e) => e.name == v, orElse: () => VoteType.real);
}

extension ReputationLevelX on ReputationLevel {
  String get label => switch (this) {
        ReputationLevel.novato => 'Novato',
        ReputationLevel.vecinoActivo => 'Vecino Activo',
        ReputationLevel.vigilante => 'Vigilante',
        ReputationLevel.referente => 'Referente',
        ReputationLevel.expertoVecinal => 'Experto Vecinal',
      };

  static ReputationLevel fromLabel(String v) => switch (v) {
        'Vecino Activo' => ReputationLevel.vecinoActivo,
        'Vigilante' => ReputationLevel.vigilante,
        'Referente' => ReputationLevel.referente,
        'Experto Vecinal' => ReputationLevel.expertoVecinal,
        _ => ReputationLevel.novato,
      };
}

extension UserRoleX on UserRole {
  String get apiValue => switch (this) {
        UserRole.user => 'user',
        UserRole.admin => 'admin',
        UserRole.superAdmin => 'super_admin',
      };

  static UserRole fromApi(String? v) => switch (v) {
        'admin' => UserRole.admin,
        'super_admin' => UserRole.superAdmin,
        _ => UserRole.user,
      };
}

class GeoPosition {
  const GeoPosition({required this.lat, required this.lng, this.accuracy});
  final double lat;
  final double lng;
  final double? accuracy;

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng};
}

class Profile {
  const Profile({
    required this.id,
    required this.nickname,
    this.email,
    this.role = UserRole.user,
    this.banned = false,
    this.reputationPoints = 0,
    this.reputationLevel = ReputationLevel.novato,
    this.avatarUrl,
    this.pushEnabled = false,
    required this.createdAt,
  });

  final String id;
  final String nickname;
  final String? email;
  final UserRole role;
  final bool banned;
  final int reputationPoints;
  final ReputationLevel reputationLevel;
  final String? avatarUrl;
  final bool pushEnabled;
  final DateTime createdAt;

  factory Profile.fromJson(Map<String, dynamic> j) => Profile(
        id: j['id'] as String,
        nickname: j['nickname'] as String,
        email: j['email'] as String?,
        role: UserRoleX.fromApi(j['role'] as String?),
        banned: j['banned'] as bool? ?? false,
        reputationPoints: (j['reputation_points'] as num?)?.toInt() ?? 0,
        reputationLevel: ReputationLevelX.fromLabel(
          j['reputation_level'] as String? ?? 'Novato',
        ),
        avatarUrl: j['avatar_url'] as String?,
        pushEnabled: j['push_enabled'] as bool? ?? false,
        createdAt: DateTime.parse(j['created_at'] as String),
      );

  Profile copyWith({
    String? nickname,
    int? reputationPoints,
    ReputationLevel? reputationLevel,
    bool? pushEnabled,
    bool? banned,
  }) =>
      Profile(
        id: id,
        nickname: nickname ?? this.nickname,
        email: email,
        role: role,
        banned: banned ?? this.banned,
        reputationPoints: reputationPoints ?? this.reputationPoints,
        reputationLevel: reputationLevel ?? this.reputationLevel,
        avatarUrl: avatarUrl,
        pushEnabled: pushEnabled ?? this.pushEnabled,
        createdAt: createdAt,
      );
}

class Complaint {
  Complaint({
    required this.id,
    this.authorId,
    required this.anonymousNickname,
    required this.title,
    required this.description,
    required this.category,
    required this.adminLevel,
    required this.status,
    required this.lat,
    required this.lng,
    this.photos = const [],
    this.votesReal = 0,
    this.votesFake = 0,
    this.votesResolved = 0,
    this.commentsCount = 0,
    required this.createdAt,
    required this.updatedAt,
    this.moderatedAt,
  });

  final String id;
  final String? authorId;
  final String anonymousNickname;
  final String title;
  final String description;
  final ComplaintCategory category;
  final AdminLevel adminLevel;
  ComplaintStatus status;
  final double lat;
  final double lng;
  final List<String> photos;
  int votesReal;
  int votesFake;
  int votesResolved;
  int commentsCount;
  final DateTime createdAt;
  DateTime updatedAt;
  DateTime? moderatedAt;

  GeoPosition get position => GeoPosition(lat: lat, lng: lng);

  factory Complaint.fromJson(Map<String, dynamic> j) => Complaint(
        id: j['id'] as String,
        authorId: j['author_id'] as String?,
        anonymousNickname: j['anonymous_nickname'] as String,
        title: j['title'] as String,
        description: j['description'] as String,
        category: ComplaintCategoryX.fromApi(j['category'] as String),
        adminLevel: AdminLevelX.fromApi(j['admin_level'] as String),
        status: ComplaintStatusX.fromApi(j['status'] as String),
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        photos: (j['photos'] as List<dynamic>?)?.cast<String>() ?? const [],
        votesReal: (j['votes_real'] as num?)?.toInt() ?? 0,
        votesFake: (j['votes_fake'] as num?)?.toInt() ?? 0,
        votesResolved: (j['votes_resolved'] as num?)?.toInt() ?? 0,
        commentsCount: (j['comments_count'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.parse(j['created_at'] as String),
        updatedAt: DateTime.parse(j['updated_at'] as String),
        moderatedAt: j['moderated_at'] != null
            ? DateTime.parse(j['moderated_at'] as String)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'author_id': authorId,
        'anonymous_nickname': anonymousNickname,
        'title': title,
        'description': description,
        'category': category.apiValue,
        'admin_level': adminLevel.apiValue,
        'status': status.apiValue,
        'lat': lat,
        'lng': lng,
        'photos': photos,
        'votes_real': votesReal,
        'votes_fake': votesFake,
        'votes_resolved': votesResolved,
        'comments_count': commentsCount,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'moderated_at': moderatedAt?.toIso8601String(),
      };
}

class Vote {
  const Vote({
    required this.id,
    required this.complaintId,
    required this.voterNickname,
    required this.voteType,
    required this.distanceM,
    required this.createdAt,
  });

  final String id;
  final String complaintId;
  final String voterNickname;
  final VoteType voteType;
  final double distanceM;
  final DateTime createdAt;

  factory Vote.fromJson(Map<String, dynamic> j) => Vote(
        id: j['id'] as String,
        complaintId: j['complaint_id'] as String,
        voterNickname: j['voter_nickname'] as String,
        voteType: VoteTypeX.fromApi(j['vote_type'] as String),
        distanceM: (j['distance_m'] as num).toDouble(),
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

class Comment {
  const Comment({
    required this.id,
    required this.complaintId,
    required this.authorNickname,
    required this.body,
    required this.distanceM,
    required this.createdAt,
  });

  final String id;
  final String complaintId;
  final String authorNickname;
  final String body;
  final double distanceM;
  final DateTime createdAt;

  factory Comment.fromJson(Map<String, dynamic> j) => Comment(
        id: j['id'] as String,
        complaintId: j['complaint_id'] as String,
        authorNickname: j['author_nickname'] as String,
        body: j['body'] as String,
        distanceM: (j['distance_m'] as num).toDouble(),
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

class BadgeInfo {
  const BadgeInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.minPoints,
  });

  final String id;
  final String name;
  final String description;
  final String icon;
  final int minPoints;
}

class RankingEntry {
  const RankingEntry({
    required this.nickname,
    required this.reputationPoints,
    required this.reputationLevel,
    required this.complaintsCount,
  });

  final String nickname;
  final int reputationPoints;
  final ReputationLevel reputationLevel;
  final int complaintsCount;
}
