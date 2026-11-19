import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/env.dart';
import '../config/theme.dart';
import '../providers/app_state.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _register = false;
  String? _message;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    final auth = context.read<AppState>().auth;
    try {
      final app = context.read<AppState>();
      if (_register) {
        await auth.signUpWithEmail(
          email: _email.text.trim(),
          password: _password.text,
        );
        _message = 'Cuenta creada. Revisa tu email si Supabase lo exige.';
      } else {
        await auth.signInWithEmail(
          email: _email.text.trim(),
          password: _password.text,
        );
        _message = 'Sesión iniciada.';
      }
      await app.bootstrap();
    } catch (e) {
      _message = '$e';
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _google() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    final auth = context.read<AppState>().auth;
    try {
      await auth.signInWithGoogle();
      _message = 'Redirigiendo a Google…';
    } catch (e) {
      _message = '$e';
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _anonymous() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    final app = context.read<AppState>();
    try {
      await app.auth.signInAnonymously();
      await app.bootstrap();
      _message = 'Sesión anónima lista.';
    } catch (e) {
      _message = '$e';
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final demo = Env.isDemoMode;
    return Scaffold(
      appBar: AppBar(title: const Text('Cuenta')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Auth opcional',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            demo
                ? 'Estás en modo demo. Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env para email/Google reales. Mientras tanto puedes usar un apodo local.'
                : 'Puedes seguir anónimo o vincular email / Google. Misma cuenta que en la web (Supabase Auth).',
          ),
          const SizedBox(height: 20),
          if (demo)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: QvColors.alert.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Modo demo activo — los botones de auth mostrarán el aviso de configuración.',
                style: TextStyle(color: QvColors.alert),
              ),
            ),
          const SizedBox(height: 16),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Contraseña',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Crear cuenta nueva'),
            value: _register,
            onChanged: (v) => setState(() => _register = v),
          ),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_register ? 'Registrarme' : 'Entrar con email'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _busy ? null : _google,
            icon: const Icon(Icons.g_mobiledata),
            label: const Text('Continuar con Google'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _busy ? null : _anonymous,
            child: const Text('Seguir con sesión anónima'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 16),
            Text(_message!),
          ],
          const SizedBox(height: 24),
          TextButton(
            onPressed: () async {
              await context.read<AppState>().auth.signOut();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sesión cerrada')),
                );
              }
            },
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
  }
}
