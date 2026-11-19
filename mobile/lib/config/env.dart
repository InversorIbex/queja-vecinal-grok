import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  Env._();

  static String get supabaseUrl => dotenv.env['SUPABASE_URL']?.trim() ?? '';
  static String get supabaseAnonKey =>
      dotenv.env['SUPABASE_ANON_KEY']?.trim() ?? '';
  static String get cloudinaryCloudName =>
      dotenv.env['CLOUDINARY_CLOUD_NAME']?.trim() ?? '';
  static String get cloudinaryUploadPreset =>
      dotenv.env['CLOUDINARY_UPLOAD_PRESET']?.trim() ?? '';
  static String get appLinkHost =>
      dotenv.env['APP_LINK_HOST']?.trim().isNotEmpty == true
          ? dotenv.env['APP_LINK_HOST']!.trim()
          : 'quejasvecinales.app';
  static bool get fcmEnabled =>
      (dotenv.env['FCM_ENABLED'] ?? 'false').toLowerCase() == 'true';

  static bool get isDemoMode {
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) return true;
    if (supabaseUrl.contains('YOUR_PROJECT')) return true;
    if (supabaseAnonKey == 'your_anon_key' ||
        supabaseAnonKey == 'your_publishable_or_anon_key') {
      return true;
    }
    return false;
  }

  static bool get hasCloudinary =>
      cloudinaryCloudName.isNotEmpty && cloudinaryUploadPreset.isNotEmpty;
}
