import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../providers/app_state.dart';
import 'auth_screen.dart';
import 'complaint_detail_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final profile = state.profile;
    final progress = state.reputationProgress;
    final followed = state.complaints
        .where((c) => state.followed.contains(c.id))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        actions: [
          IconButton(
            tooltip: 'Cuenta',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AuthScreen()),
            ),
            icon: const Icon(Icons.login),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(appName, style: Theme.of(context).textTheme.displayMedium),
          const SizedBox(height: 4),
          Text(appTagline, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 20),
          Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: QvColors.trust.withOpacity(0.15),
                  child: Text(
                  () {
                    final n = profile?.nickname ?? state.nickname;
                    return n.isNotEmpty ? n[0].toUpperCase() : '?';
                  }(),
                  style: const TextStyle(
                    fontSize: 28,
                    color: QvColors.trust,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile?.nickname ?? state.nickname,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      progress.current.label,
                      style: const TextStyle(
                        color: QvColors.trust,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text('${profile?.reputationPoints ?? 0} puntos'),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (progress.next != null) ...[
            Text(
              'Siguiente: ${progress.next!.label} (${progress.remaining} pts)',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress.progress / 100,
                minHeight: 10,
                color: QvColors.resolved,
                backgroundColor: QvColors.mist,
              ),
            ),
          ] else
            const Text('¡Nivel máximo: Experto Vecinal!'),
          const SizedBox(height: 24),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Notificaciones push'),
            subtitle: Text(state.push.statusMessage),
            value: profile?.pushEnabled ?? false,
            onChanged: (v) => state.setPushEnabled(v),
          ),
          const Divider(),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Tema'),
            subtitle: Text(switch (state.themeMode) {
              ThemeModePreference.system => 'Sistema',
              ThemeModePreference.light => 'Claro',
              ThemeModePreference.dark => 'Oscuro',
            }),
            trailing: SegmentedButton<ThemeModePreference>(
              segments: const [
                ButtonSegment(
                  value: ThemeModePreference.system,
                  icon: Icon(Icons.brightness_auto, size: 18),
                ),
                ButtonSegment(
                  value: ThemeModePreference.light,
                  icon: Icon(Icons.light_mode, size: 18),
                ),
                ButtonSegment(
                  value: ThemeModePreference.dark,
                  icon: Icon(Icons.dark_mode, size: 18),
                ),
              ],
              selected: {state.themeMode},
              onSelectionChanged: (s) => state.setThemeMode(s.first),
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: state.nickname,
            decoration: const InputDecoration(
              labelText: 'Apodo',
              border: OutlineInputBorder(),
              helperText: 'Se usa en votos y comentarios anónimos',
            ),
            onFieldSubmitted: (v) {
              if (v.trim().length >= 3) state.updateNickname(v.trim());
            },
          ),
          const SizedBox(height: 24),
          Text('Quejas que sigues',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          if (followed.isEmpty)
            const Text('Aún no sigues ninguna queja.')
          else
            ...followed.map(
              (c) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(c.title),
                subtitle: Text(statusLabels[c.status]!),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ComplaintDetailScreen(complaintId: c.id),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 24),
          FutureBuilder(
            future: state.repo.rankings(),
            builder: (context, snap) {
              if (!snap.hasData) {
                return const SizedBox.shrink();
              }
              final ranks = snap.data!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Rankings',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  for (var i = 0; i < ranks.take(5).length; i++)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(child: Text('${i + 1}')),
                      title: Text(ranks[i].nickname),
                      subtitle: Text(ranks[i].reputationLevel.label),
                      trailing: Text('${ranks[i].reputationPoints} pts'),
                    ),
                ],
              );
            },
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
