import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/constants.dart';
import '../config/env.dart';
import '../models/models.dart';
import '../services/auth_service.dart';
import '../services/complaints_repository.dart';
import '../services/demo_store.dart';
import '../services/geo_service.dart';
import '../services/photo_service.dart';
import '../services/push_service.dart';
import '../services/reputation.dart';

class AppState extends ChangeNotifier {
  AppState({
    required this.demoStore,
    required this.auth,
    required this.repo,
    required this.geo,
    required this.photos,
    required this.push,
  });

  final DemoStore demoStore;
  final AuthService auth;
  final ComplaintsRepository repo;
  final GeoService geo;
  final PhotoService photos;
  final PushService push;

  static const _onboardingKey = 'qv_onboarding_done';

  bool ready = false;
  bool onboardingDone = false;
  bool demoMode = true;
  String nickname = 'Vecino_0000';
  Profile? profile;
  GeoPosition? userPosition;
  List<Complaint> complaints = [];
  Set<String> followed = {};
  ComplaintCategory? filterCategory;
  String? error;
  ThemeModePreference themeMode = ThemeModePreference.system;

  Future<void> bootstrap() async {
    demoMode = Env.isDemoMode;
    final prefs = await SharedPreferences.getInstance();
    onboardingDone = prefs.getBool(_onboardingKey) ?? false;
    nickname = await auth.ensureNickname();
    followed = await auth.loadFollowed();

    if (!demoMode) {
      try {
        await auth.signInAnonymously();
      } catch (e) {
        debugPrint('Auth anónima: $e');
      }
    }

    profile = await auth.currentProfile() ??
        (demoMode
            ? demoStore.localProfile
            : Profile(
                id: 'local',
                nickname: nickname,
                createdAt: DateTime.now(),
                reputationPoints: 0,
                reputationLevel: ReputationLevel.novato,
              ));
    nickname = profile!.nickname;

    try {
      userPosition = await geo.getCurrentPosition();
    } catch (_) {
      userPosition = demoCenter;
    }

    await push.init();
    await refreshComplaints();
    ready = true;
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
    onboardingDone = true;
    notifyListeners();
  }

  Future<void> refreshComplaints() async {
    try {
      complaints = await repo.listPublic(category: filterCategory);
      error = null;
    } catch (e) {
      error = 'No se pudieron cargar las quejas: $e';
    }
    notifyListeners();
  }

  void setFilter(ComplaintCategory? c) {
    filterCategory = c;
    refreshComplaints();
  }

  Future<void> refreshLocation() async {
    userPosition = await geo.getCurrentPosition();
    notifyListeners();
  }

  bool isNear(Complaint c) {
    final pos = userPosition;
    if (pos == null) return false;
    return within10km(pos, c.position);
  }

  double? distanceTo(Complaint c) {
    final pos = userPosition;
    if (pos == null) return null;
    return haversineMeters(pos, c.position);
  }

  Future<Complaint> createComplaint({
    required String title,
    required String description,
    required ComplaintCategory category,
    required AdminLevel adminLevel,
    required List<String> photoUrls,
    GeoPosition? pin,
  }) async {
    final device = userPosition ?? await geo.getCurrentPosition();
    userPosition = device;
    final chosen = pin ?? device;
    final res = await repo.create(
      title: title,
      description: description,
      category: category,
      adminLevel: adminLevel,
      pin: chosen,
      device: device,
      photos: photoUrls,
      nickname: nickname,
      authorId: auth.currentUser?.id,
    );
    if (!res.ok || res.complaint == null) {
      throw Exception(res.message ?? 'No se pudo crear la queja');
    }
    await refreshComplaints();
    return res.complaint!;
  }

  Future<String?> vote(Complaint c, VoteType type) async {
    final pos = userPosition ?? await geo.getCurrentPosition();
    userPosition = pos;
    final res = await repo.vote(
      complaintId: c.id,
      voteType: type,
      voterNickname: nickname,
      voter: pos,
    );
    if (!res.ok) return res.message;
    if (profile != null) {
      profile = await auth.bumpPoints(
        profile!,
        type == VoteType.real
            ? pointsVoteReal
            : type == VoteType.fake
                ? pointsVoteFake
                : pointsComment,
      );
    }
    await refreshComplaints();
    return null;
  }

  Future<String?> comment(Complaint c, String body) async {
    final pos = userPosition ?? await geo.getCurrentPosition();
    userPosition = pos;
    final res = await repo.addComment(
      complaintId: c.id,
      body: body,
      authorNickname: nickname,
      author: pos,
    );
    if (!res.ok) return res.message;
    if (profile != null) {
      profile = await auth.bumpPoints(profile!, pointsComment);
    }
    notifyListeners();
    return null;
  }

  Future<void> toggleFollow(String complaintId) async {
    if (followed.contains(complaintId)) {
      followed.remove(complaintId);
    } else {
      followed.add(complaintId);
    }
    await auth.saveFollowed(followed);
    notifyListeners();
  }

  Future<void> setPushEnabled(bool enabled) async {
    await push.setEnabled(enabled);
    if (profile != null) {
      profile = profile!.copyWith(pushEnabled: enabled);
    }
    notifyListeners();
  }

  Future<void> updateNickname(String nick) async {
    nickname = nick;
    await auth.setNickname(nick);
    if (profile != null) {
      profile = profile!.copyWith(nickname: nick);
    }
    notifyListeners();
  }

  void setThemeMode(ThemeModePreference mode) {
    themeMode = mode;
    notifyListeners();
  }

  ({ReputationLevel current, ReputationLevel? next, int remaining, double progress})
      get reputationProgress =>
          nextLevelInfo(profile?.reputationPoints ?? 0);
}

enum ThemeModePreference { system, light, dark }
