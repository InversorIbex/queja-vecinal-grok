import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../config/env.dart';
import '../models/models.dart';
import 'demo_store.dart';
import 'geo_service.dart';

class ComplaintsRepository {
  ComplaintsRepository({required this.demoStore});

  final DemoStore demoStore;
  final _uuid = const Uuid();

  SupabaseClient? get _sb =>
      Env.isDemoMode ? null : Supabase.instance.client;

  Future<List<Complaint>> listPublic({ComplaintCategory? category}) async {
    if (Env.isDemoMode || _sb == null) {
      var list = demoStore.publicComplaints();
      if (category != null) {
        list = list.where((c) => c.category == category).toList();
      }
      return list;
    }
    var q = _sb!
        .from('complaints')
        .select()
        .inFilter('status', ['approved', 'resolved']);
    if (category != null) {
      q = q.eq('category', category.apiValue);
    }
    final rows = await q.order('created_at', ascending: false);
    return (rows as List).map((e) => Complaint.fromJson(e)).toList();
  }

  Future<Complaint?> getById(String id) async {
    if (Env.isDemoMode || _sb == null) {
      try {
        return demoStore.complaints.firstWhere((c) => c.id == id);
      } catch (_) {
        return null;
      }
    }
    final row =
        await _sb!.from('complaints').select().eq('id', id).maybeSingle();
    return row == null ? null : Complaint.fromJson(row);
  }

  Future<Complaint> create({
    required String title,
    required String description,
    required ComplaintCategory category,
    required AdminLevel adminLevel,
    required double lat,
    required double lng,
    required List<String> photos,
    required String nickname,
    String? authorId,
  }) async {
    if (Env.isDemoMode || _sb == null) {
      return demoStore.createComplaint(
        title: title,
        description: description,
        category: category,
        adminLevel: adminLevel,
        lat: lat,
        lng: lng,
        photos: photos,
        nickname: nickname,
        authorId: authorId,
      );
    }

    final payload = {
      'id': _uuid.v4(),
      'author_id': authorId,
      'anonymous_nickname': nickname,
      'title': title,
      'description': description,
      'category': category.apiValue,
      'admin_level': adminLevel.apiValue,
      'status': 'pending',
      'lat': lat,
      'lng': lng,
      'photos': photos.take(4).toList(),
    };
    final row =
        await _sb!.from('complaints').insert(payload).select().single();
    return Complaint.fromJson(row);
  }

  Future<({bool ok, String? message, double? distanceM})> vote({
    required String complaintId,
    required VoteType voteType,
    required String voterNickname,
    required GeoPosition voter,
  }) async {
    final complaint = await getById(complaintId);
    if (complaint == null) {
      return (ok: false, message: 'Queja no encontrada.', distanceM: null);
    }
    if (complaint.status != ComplaintStatus.approved &&
        complaint.status != ComplaintStatus.resolved) {
      return (
        ok: false,
        message: 'Solo se puede votar quejas aprobadas o resueltas.',
        distanceM: null
      );
    }
    final geo = assertWithin10km(voter, complaint.position, action: 'votar');
    if (!geo.ok) {
      return (ok: false, message: geo.message, distanceM: geo.distanceM);
    }

    if (Env.isDemoMode || _sb == null) {
      Vote? existing;
      for (final v in demoStore.votes) {
        if (v.complaintId == complaintId &&
            v.voterNickname == voterNickname) {
          existing = v;
          break;
        }
      }
      if (existing != null) {
        _adjustVoteCount(complaint, existing.voteType, -1);
        demoStore.votes.remove(existing);
      }
      demoStore.votes.add(Vote(
        id: _uuid.v4(),
        complaintId: complaintId,
        voterNickname: voterNickname,
        voteType: voteType,
        distanceM: geo.distanceM,
        createdAt: DateTime.now(),
      ));
      _adjustVoteCount(complaint, voteType, 1);
      return (ok: true, message: null, distanceM: geo.distanceM);
    }

    await _sb!.from('votes').upsert({
      'complaint_id': complaintId,
      'voter_nickname': voterNickname,
      'vote_type': voteType.apiValue,
      'voter_lat': voter.lat,
      'voter_lng': voter.lng,
      'distance_m': geo.distanceM,
    }, onConflict: 'complaint_id,voter_nickname');
    return (ok: true, message: null, distanceM: geo.distanceM);
  }

  void _adjustVoteCount(Complaint c, VoteType t, int delta) {
    switch (t) {
      case VoteType.real:
        c.votesReal = (c.votesReal + delta).clamp(0, 999999);
      case VoteType.fake:
        c.votesFake = (c.votesFake + delta).clamp(0, 999999);
      case VoteType.resolved:
        c.votesResolved = (c.votesResolved + delta).clamp(0, 999999);
    }
  }

  Future<List<Comment>> listComments(String complaintId) async {
    if (Env.isDemoMode || _sb == null) {
      return List.of(demoStore.comments[complaintId] ?? const []);
    }
    final rows = await _sb!
        .from('comments')
        .select()
        .eq('complaint_id', complaintId)
        .order('created_at');
    return (rows as List).map((e) => Comment.fromJson(e)).toList();
  }

  Future<({bool ok, String? message, Comment? comment})> addComment({
    required String complaintId,
    required String body,
    required String authorNickname,
    required GeoPosition author,
  }) async {
    final complaint = await getById(complaintId);
    if (complaint == null) {
      return (ok: false, message: 'Queja no encontrada.', comment: null);
    }
    final geo =
        assertWithin10km(author, complaint.position, action: 'comentar');
    if (!geo.ok) {
      return (ok: false, message: geo.message, comment: null);
    }
    final comment = Comment(
      id: _uuid.v4(),
      complaintId: complaintId,
      authorNickname: authorNickname,
      body: body.trim(),
      distanceM: geo.distanceM,
      createdAt: DateTime.now(),
    );

    if (Env.isDemoMode || _sb == null) {
      demoStore.comments.putIfAbsent(complaintId, () => []).add(comment);
      complaint.commentsCount += 1;
      return (ok: true, message: null, comment: comment);
    }

    final row = await _sb!.from('comments').insert({
      'id': comment.id,
      'complaint_id': complaintId,
      'author_nickname': authorNickname,
      'body': comment.body,
      'author_lat': author.lat,
      'author_lng': author.lng,
      'distance_m': geo.distanceM,
    }).select().single();
    return (ok: true, message: null, comment: Comment.fromJson(row));
  }

  Future<List<RankingEntry>> rankings() async {
    if (Env.isDemoMode || _sb == null) return demoStore.rankings();
    final rows = await _sb!
        .from('profiles')
        .select()
        .order('reputation_points', ascending: false)
        .limit(50);
    return (rows as List)
        .map((r) => RankingEntry(
              nickname: r['nickname'] as String,
              reputationPoints: (r['reputation_points'] as num).toInt(),
              reputationLevel: ReputationLevelX.fromLabel(
                r['reputation_level'] as String? ?? 'Novato',
              ),
              complaintsCount: 0,
            ))
        .toList();
  }
}
