import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../providers/app_state.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    (
      title: 'Tu barrio, tu voz',
      body:
          'Reporta problemas públicos — baches, farolas, basura — sin registro obligatorio. Anónimo por defecto.',
      icon: Icons.campaign_outlined,
      accent: QvColors.trust,
    ),
    (
      title: 'Regla de los 10 km',
      body:
          'Solo puedes crear, votar o comentar si estás a ≤10 km del lugar. Así evitamos spam y mantenemos la voz local.',
      icon: Icons.radar_outlined,
      accent: QvColors.alert,
    ),
    (
      title: 'Reputación vecinal',
      body:
          'Gana puntos al reportar y participar. Sube de Novato a Experto Vecinal y desbloquea badges.',
      icon: Icons.emoji_events_outlined,
      accent: QvColors.resolved,
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _pages.length - 1;
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).scaffoldBackgroundColor,
              _pages[_page].accent.withOpacity(0.12),
              Theme.of(context).scaffoldBackgroundColor,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    appName,
                    style: Theme.of(context).textTheme.displayMedium,
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) {
                    final p = _pages[i];
                    return Padding(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0.85, end: 1),
                            duration: const Duration(milliseconds: 500),
                            curve: Curves.easeOutBack,
                            builder: (_, v, child) =>
                                Transform.scale(scale: v, child: child),
                            child: Icon(p.icon, size: 72, color: p.accent),
                          ),
                          const SizedBox(height: 28),
                          Text(p.title,
                              style: Theme.of(context).textTheme.displayMedium),
                          const SizedBox(height: 12),
                          Text(
                            p.body,
                            style: Theme.of(context)
                                .textTheme
                                .bodyLarge
                                ?.copyWith(height: 1.45),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Row(
                  children: [
                    Row(
                      children: List.generate(
                        _pages.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.only(right: 6),
                          width: i == _page ? 22 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: i == _page
                                ? _pages[_page].accent
                                : Colors.grey.withOpacity(0.35),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                    const Spacer(),
                    FilledButton(
                      onPressed: () async {
                        if (!isLast) {
                          _controller.nextPage(
                            duration: const Duration(milliseconds: 320),
                            curve: Curves.easeOutCubic,
                          );
                          return;
                        }
                        await context.read<AppState>().completeOnboarding();
                      },
                      child: Text(isLast ? 'Empezar' : 'Siguiente'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
