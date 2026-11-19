import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'config/env.dart';
import 'providers/app_state.dart';
import 'services/auth_service.dart';
import 'services/complaints_repository.dart';
import 'services/demo_store.dart';
import 'services/geo_service.dart';
import 'services/photo_service.dart';
import 'services/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Portrait + landscape
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // assets/env/default.env = demo. Opcional: assets/env/.env (gitignored) con claves reales.
  await dotenv.load(
    fileName: 'assets/env/default.env',
    isOptional: true,
  );
  final defaults = Map<String, String>.from(dotenv.env);
  await dotenv.load(
    fileName: 'assets/env/.env',
    isOptional: true,
    mergeWith: defaults,
  );

  await initializeDateFormatting('es');

  if (!Env.isDemoMode) {
    await Supabase.initialize(
      url: Env.supabaseUrl,
      publishableKey: Env.supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }

  final demoStore = DemoStore();
  final auth = AuthService(demoStore: demoStore);
  final repo = ComplaintsRepository(demoStore: demoStore);
  final geo = GeoService();
  final photos = PhotoService();
  final push = PushService();

  final appState = AppState(
    demoStore: demoStore,
    auth: auth,
    repo: repo,
    geo: geo,
    photos: photos,
    push: push,
  );

  runApp(
    ChangeNotifierProvider(
      create: (_) {
        appState.bootstrap();
        return appState;
      },
      child: const QuejasApp(),
    ),
  );
}
