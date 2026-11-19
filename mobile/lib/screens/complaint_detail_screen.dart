import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../config/constants.dart';
import '../config/env.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../providers/app_state.dart';
import '../widgets/geofence_map.dart';

class ComplaintDetailScreen extends StatefulWidget {
  const ComplaintDetailScreen({super.key, required this.complaintId});

  final String complaintId;

  @override
  State<ComplaintDetailScreen> createState() => _ComplaintDetailScreenState();
}

class _ComplaintDetailScreenState extends State<ComplaintDetailScreen> {
  Complaint? _complaint;
  List<Comment> _comments = [];
  final _commentCtrl = TextEditingController();
  bool _loading = true;
  String? _gateMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final state = context.read<AppState>();
    final c = await state.repo.getById(widget.complaintId);
    final comments =
        c == null ? <Comment>[] : await state.repo.listComments(c.id);
    if (!mounted) return;
    setState(() {
      _complaint = c;
      _comments = comments;
      _loading = false;
      if (c != null && !state.isNear(c)) {
        final d = state.distanceTo(c);
        _gateMessage = d == null
            ? 'Necesitas ubicación para votar o comentar.'
            : 'Estás a ${(d / 1000).toStringAsFixed(1)} km. Debes estar a ≤10 km para votar o comentar.';
      } else {
        _gateMessage = null;
      }
    });
  }

  Future<void> _vote(VoteType type) async {
    final c = _complaint;
    if (c == null) return;
    final err = await context.read<AppState>().vote(c, type);
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Voto «${type.label}» registrado')),
      );
      await _load();
    }
  }

  Future<void> _sendComment() async {
    final c = _complaint;
    final body = _commentCtrl.text.trim();
    if (c == null || body.isEmpty) return;
    final err = await context.read<AppState>().comment(c, body);
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    } else {
      _commentCtrl.clear();
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final c = _complaint;
    if (c == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Queja no encontrada')),
      );
    }

    final near = state.isNear(c);
    final followed = state.followed.contains(c.id);
    final cat = categories[c.category]!;

    return Scaffold(
      appBar: AppBar(
        title: Text(c.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: followed ? 'Dejar de seguir' : 'Seguir',
            onPressed: () => state.toggleFollow(c.id),
            icon: Icon(followed ? Icons.bookmark : Icons.bookmark_border),
          ),
          IconButton(
            tooltip: 'Compartir',
            onPressed: () {
              final url = 'https://${Env.appLinkHost}/quejas/${c.id}';
              Share.share('${c.title}\n$url\n— $appName');
            },
            icon: const Icon(Icons.share_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Chip(
                label: Text(cat.label),
                backgroundColor: Color(cat.color).withOpacity(0.15),
              ),
              const SizedBox(width: 8),
              Chip(label: Text(statusLabels[c.status]!)),
            ],
          ),
          const SizedBox(height: 8),
          Text(c.description, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 8),
          Text(
            '${c.anonymousNickname} · ${adminLevels[c.adminLevel]}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          GeofenceMap(
            center: c.position,
            showGeofence: true,
            height: 220,
            markers: [
              ComplaintMapMarker(
                lat: c.lat,
                lng: c.lng,
                resolved: c.status == ComplaintStatus.resolved,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Radio 10 km alrededor de la queja. Tu distancia: '
            '${state.distanceTo(c) == null ? '—' : '${(state.distanceTo(c)! / 1000).toStringAsFixed(1)} km'}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 20),
          Text('Votar', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          if (_gateMessage != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: QvColors.alert.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_gateMessage!, style: const TextStyle(color: QvColors.alert)),
            ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              FilledButton.tonal(
                onPressed: near ? () => _vote(VoteType.real) : null,
                child: Text('Real (${c.votesReal})'),
              ),
              FilledButton.tonal(
                onPressed: near ? () => _vote(VoteType.fake) : null,
                child: Text('Falsa (${c.votesFake})'),
              ),
              FilledButton.tonal(
                onPressed: near ? () => _vote(VoteType.resolved) : null,
                child: Text('Resuelta (${c.votesResolved})'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Comentarios (${_comments.length})',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          for (final cm in _comments)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(cm.authorNickname),
              subtitle: Text(cm.body),
              trailing: Text('${cm.distanceM.round()} m'),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _commentCtrl,
                  enabled: near,
                  decoration: InputDecoration(
                    hintText: near
                        ? 'Escribe un comentario…'
                        : 'Acércate a ≤10 km para comentar',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: near ? _sendComment : null,
                icon: const Icon(Icons.send),
              ),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
