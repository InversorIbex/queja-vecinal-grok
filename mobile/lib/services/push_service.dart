import 'package:flutter/foundation.dart';

import '../config/env.dart';

/// Stub FCM: sin Firebase configurado no crashea; documenta el camino real.
class PushService {
  String? lastToken;
  bool initialized = false;
  String statusMessage = 'Push desactivadas (stub).';

  Future<void> init() async {
    if (!Env.fcmEnabled) {
      statusMessage =
          'FCM desactivado. Pon FCM_ENABLED=true y configura Firebase (google-services.json / GoogleService-Info.plist).';
      debugPrint('[PushService] $statusMessage');
      return;
    }

    try {
      // Importación diferida vía dynamic para no exigir firebase_options.dart.
      // Cuando el proyecto tenga FlutterFire, sustituye este bloque por:
      //   await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      //   final messaging = FirebaseMessaging.instance;
      //   await messaging.requestPermission();
      //   lastToken = await messaging.getToken();
      statusMessage =
          'FCM_ENABLED=true pero falta flutterfire configure. Usando stub de token.';
      lastToken = 'stub-fcm-token-${DateTime.now().millisecondsSinceEpoch}';
      initialized = true;
      debugPrint('[PushService] token stub: $lastToken');
    } catch (e) {
      statusMessage = 'Error al inicializar FCM: $e';
      debugPrint('[PushService] $statusMessage');
    }
  }

  Future<void> setEnabled(bool enabled) async {
    if (!enabled) {
      statusMessage = 'Notificaciones desactivadas por el usuario.';
      return;
    }
    await init();
    statusMessage = initialized
        ? 'Notificaciones listas (token: ${lastToken?.substring(0, 16)}…).'
        : statusMessage;
  }
}
