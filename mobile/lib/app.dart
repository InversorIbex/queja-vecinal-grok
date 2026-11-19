import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/theme.dart';
import 'providers/app_state.dart';
import 'screens/complaint_detail_screen.dart';
import 'screens/home_shell.dart';
import 'screens/onboarding_screen.dart';

class QuejasApp extends StatefulWidget {
  const QuejasApp({super.key});

  @override
  State<QuejasApp> createState() => _QuejasAppState();
}

class _QuejasAppState extends State<QuejasApp> {
  final _navKey = GlobalKey<NavigatorState>();
  StreamSubscription<Uri>? _linkSub;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    final appLinks = AppLinks();
    try {
      final initial = await appLinks.getInitialLink();
      if (initial != null) _handleUri(initial);
    } catch (_) {}
    _linkSub = appLinks.uriLinkStream.listen(_handleUri);
  }

  void _handleUri(Uri uri) {
    // quejasvecinales://quejas/<id>  o  https://host/quejas/<id>
    final segments = uri.pathSegments;
    String? id;
    if (uri.host == 'quejas' && segments.isNotEmpty) {
      id = segments.first;
    } else if (segments.length >= 2 && segments[0] == 'quejas') {
      id = segments[1];
    } else if (segments.length == 1 && uri.scheme == 'quejasvecinales') {
      id = segments.first;
    }
    if (id == null || id.isEmpty) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _navKey.currentState?.push(
        MaterialPageRoute(
          builder: (_) => ComplaintDetailScreen(complaintId: id!),
        ),
      );
    });
  }

  @override
  void dispose() {
    _linkSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final themeMode = switch (state.themeMode) {
      ThemeModePreference.light => ThemeMode.light,
      ThemeModePreference.dark => ThemeMode.dark,
      ThemeModePreference.system => ThemeMode.system,
    };

    return MaterialApp(
      title: 'QuejasVecinales',
      debugShowCheckedModeBanner: false,
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      themeMode: themeMode,
      navigatorKey: _navKey,
      home: !state.ready
          ? const _Splash()
          : !state.onboardingDone
              ? const OnboardingScreen()
              : const HomeShell(),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0B5FFF), Color(0xFF0B1220)],
          ),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'QuejasVecinales',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 16),
              CircularProgressIndicator(color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
