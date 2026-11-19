import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/env.dart';
import '../models/models.dart';
import 'demo_store.dart';
import 'reputation.dart';

/// Auth anónima + email/Google opcionales vía Supabase. En demo: nick local.
class AuthService {
  AuthService({required this.demoStore});

  final DemoStore demoStore;
  static const _nickKey = 'qv_nickname';
  static const _followedKey = 'qv_followed';

  SupabaseClient? get _client =>
      Env.isDemoMode ? null : Supabase.instance.client;

  Future<String> ensureNickname() async {
    final prefs = await SharedPreferences.getInstance();
    var nick = prefs.getString(_nickKey);
    if (nick == null || nick.isEmpty) {
      nick = demoStore.newNickname();
      await prefs.setString(_nickKey, nick);
    }
    return nick;
  }

  Future<void> setNickname(String nick) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_nickKey, nick);
  }

  Future<Set<String>> loadFollowed() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_followedKey)?.toSet() ?? {};
  }

  Future<void> saveFollowed(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_followedKey, ids.toList());
  }

  Future<Profile?> currentProfile() async {
    if (Env.isDemoMode) return demoStore.localProfile;

    final session = _client?.auth.currentSession;
    if (session == null) return null;

    final row = await _client!
        .from('profiles')
        .select()
        .eq('id', session.user.id)
        .maybeSingle();
    if (row == null) {
      final nick = await ensureNickname();
      final inserted = await _client!.from('profiles').upsert({
        'id': session.user.id,
        'nickname': nick,
        'role': 'user',
        'reputation_points': 0,
        'reputation_level': 'Novato',
        'push_enabled': false,
      }).select().single();
      return Profile.fromJson(inserted);
    }
    return Profile.fromJson(row);
  }

  Future<AuthResponse?> signInAnonymously() async {
    if (Env.isDemoMode) return null;
    return _client!.auth.signInAnonymously();
  }

  Future<AuthResponse?> signInWithEmail({
    required String email,
    required String password,
  }) async {
    if (Env.isDemoMode) {
      throw Exception('Configura Supabase para iniciar sesión con email.');
    }
    return _client!.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse?> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    if (Env.isDemoMode) {
      throw Exception('Configura Supabase para registrarte.');
    }
    return _client!.auth.signUp(email: email, password: password);
  }

  Future<bool> signInWithGoogle() async {
    if (Env.isDemoMode) {
      throw Exception('Configura Supabase + Google OAuth para continuar.');
    }
    return _client!.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'io.supabase.quejasvecinales://login-callback/',
    );
  }

  Future<void> signOut() async {
    if (!Env.isDemoMode) {
      await _client?.auth.signOut();
    }
  }

  Stream<AuthState>? get authStateChanges =>
      Env.isDemoMode ? null : _client?.auth.onAuthStateChange;

  User? get currentUser => Env.isDemoMode ? null : _client?.auth.currentUser;

  Future<Profile> bumpPoints(Profile profile, int delta) async {
    final points = profile.reputationPoints + delta;
    final level = levelFromPoints(points);
    if (Env.isDemoMode) {
      demoStore.localProfile = profile.copyWith(
        reputationPoints: points,
        reputationLevel: level,
      );
      return demoStore.localProfile;
    }
    final row = await _client!
        .from('profiles')
        .update({
          'reputation_points': points,
          'reputation_level': level.label,
        })
        .eq('id', profile.id)
        .select()
        .single();
    return Profile.fromJson(row);
  }
}
