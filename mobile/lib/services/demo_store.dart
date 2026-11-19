import 'package:uuid/uuid.dart';

import '../models/models.dart';

/// Misma semilla que la web (`src/lib/demo-data.ts`) para sincronía conceptual en modo demo.
class DemoStore {
  DemoStore() {
    _seed();
  }

  final _uuid = const Uuid();
  final List<Complaint> complaints = [];
  final List<Vote> votes = [];
  final Map<String, List<Comment>> comments = {};
  final Set<String> followed = {};
  late Profile localProfile;

  void _seed() {
    final now = DateTime.now();
    localProfile = Profile(
      id: 'demo-local',
      nickname: _randomNick(),
      reputationPoints: 42,
      reputationLevel: ReputationLevel.novato,
      pushEnabled: false,
      createdAt: now.subtract(const Duration(days: 30)),
    );

    complaints.addAll([
      Complaint(
        id: 'demo-1',
        anonymousNickname: 'Vecino_4821',
        title: 'Bache peligroso en Calle Mayor',
        description:
            'Hay un bache profundo junto al paso de peatones que ya ha dañado varias ruedas. Urge reparación.',
        category: ComplaintCategory.bachesCarreteras,
        adminLevel: AdminLevel.ayuntamiento,
        status: ComplaintStatus.approved,
        lat: 40.4165,
        lng: -3.7042,
        votesReal: 24,
        votesFake: 1,
        votesResolved: 2,
        commentsCount: 5,
        createdAt: now.subtract(const Duration(days: 3)),
        updatedAt: now.subtract(const Duration(days: 2)),
      ),
      Complaint(
        id: 'demo-2',
        anonymousNickname: 'Vecino_1190',
        title: 'Farola apagada en Plaza del Sol',
        description:
            'La farola del extremo norte lleva más de una semana sin luz. Zona muy oscura por la noche.',
        category: ComplaintCategory.iluminacion,
        adminLevel: AdminLevel.ayuntamiento,
        status: ComplaintStatus.approved,
        lat: 40.4198,
        lng: -3.7015,
        votesReal: 18,
        commentsCount: 3,
        createdAt: now.subtract(const Duration(days: 5)),
        updatedAt: now.subtract(const Duration(days: 4)),
      ),
      Complaint(
        id: 'demo-3',
        anonymousNickname: 'Vecino_7733',
        title: 'Contenedores desbordados',
        description:
            'Los contenedores de orgánicos llevan días llenos y hay basura alrededor. Mal olor y plagas.',
        category: ComplaintCategory.limpieza,
        adminLevel: AdminLevel.ayuntamiento,
        status: ComplaintStatus.approved,
        lat: 40.412,
        lng: -3.7105,
        votesReal: 31,
        votesFake: 2,
        votesResolved: 1,
        commentsCount: 8,
        createdAt: now.subtract(const Duration(days: 1)),
        updatedAt: now.subtract(const Duration(days: 1)),
      ),
      Complaint(
        id: 'demo-4',
        anonymousNickname: 'Vecino_2201',
        title: 'Banco roto en el parque',
        description:
            'Uno de los bancos del parque infantil está partido y tiene clavos salidos. Riesgo para niños.',
        category: ComplaintCategory.parquesJardines,
        adminLevel: AdminLevel.ayuntamiento,
        status: ComplaintStatus.resolved,
        lat: 40.421,
        lng: -3.695,
        votesReal: 12,
        votesResolved: 15,
        commentsCount: 4,
        createdAt: now.subtract(const Duration(days: 14)),
        updatedAt: now.subtract(const Duration(days: 2)),
      ),
      Complaint(
        id: 'demo-5',
        anonymousNickname: 'Vecino_9055',
        title: 'Señal de stop ilegible',
        description:
            'La señal de stop en el cruce está muy deteriorada y casi no se ve de noche.',
        category: ComplaintCategory.senales,
        adminLevel: AdminLevel.ayuntamiento,
        status: ComplaintStatus.approved,
        lat: 40.415,
        lng: -3.698,
        votesReal: 9,
        votesFake: 1,
        commentsCount: 2,
        createdAt: now.subtract(const Duration(days: 7)),
        updatedAt: now.subtract(const Duration(days: 6)),
      ),
      Complaint(
        id: 'demo-6',
        anonymousNickname: 'Vecino_3340',
        title: 'Papelera sin tapa en avenida',
        description: 'La papelera pública perdió la tapa y el viento esparce papeles.',
        category: ComplaintCategory.mobiliarioUrbano,
        adminLevel: AdminLevel.ayuntamiento,
        status: ComplaintStatus.pending,
        lat: 40.418,
        lng: -3.707,
        createdAt: now.subtract(const Duration(hours: 6)),
        updatedAt: now.subtract(const Duration(hours: 6)),
      ),
    ]);

    comments['demo-1'] = [
      Comment(
        id: 'c1',
        complaintId: 'demo-1',
        authorNickname: 'Vecino_1102',
        body: 'Yo también pillé el bache ayer. Gracias por reportarlo.',
        distanceM: 420,
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      Comment(
        id: 'c2',
        complaintId: 'demo-1',
        authorNickname: 'Vecino_8820',
        body: 'Han marcado con pintura naranja, a ver si lo arreglan pronto.',
        distanceM: 880,
        createdAt: now.subtract(const Duration(days: 1)),
      ),
    ];
  }

  String _randomNick() {
    final n = 1000 + DateTime.now().millisecond % 9000;
    return 'Vecino_$n';
  }

  String newNickname() => _randomNick();

  Complaint createComplaint({
    required String title,
    required String description,
    required ComplaintCategory category,
    required AdminLevel adminLevel,
    required double lat,
    required double lng,
    required List<String> photos,
    required String nickname,
    String? authorId,
    String? id,
  }) {
    final c = Complaint(
      id: id ?? _uuid.v4(),
      authorId: authorId,
      anonymousNickname: nickname,
      title: title,
      description: description,
      category: category,
      adminLevel: adminLevel,
      status: ComplaintStatus.pending,
      lat: lat,
      lng: lng,
      photos: photos.take(4).toList(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    complaints.insert(0, c);
    return c;
  }

  List<Complaint> publicComplaints() => complaints
      .where((c) =>
          c.status == ComplaintStatus.approved ||
          c.status == ComplaintStatus.resolved)
      .toList()
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

  List<RankingEntry> rankings() {
    final map = <String, RankingEntry>{};
    for (final c in complaints) {
      final prev = map[c.anonymousNickname];
      if (prev == null) {
        map[c.anonymousNickname] = RankingEntry(
          nickname: c.anonymousNickname,
          reputationPoints: c.votesReal * 2 + c.commentsCount * 3,
          reputationLevel: ReputationLevel.vecinoActivo,
          complaintsCount: 1,
        );
      } else {
        map[c.anonymousNickname] = RankingEntry(
          nickname: prev.nickname,
          reputationPoints: prev.reputationPoints + 10,
          reputationLevel: prev.reputationLevel,
          complaintsCount: prev.complaintsCount + 1,
        );
      }
    }
    final list = map.values.toList()
      ..sort((a, b) => b.reputationPoints.compareTo(a.reputationPoints));
    return list;
  }
}
