import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Azul confianza + naranja alerta + verde resuelto. Sin púrpura genérico.
class QvColors {
  static const trust = Color(0xFF0B5FFF);
  static const trustDark = Color(0xFF0847C7);
  static const alert = Color(0xFFE85D04);
  static const resolved = Color(0xFF2A9D8F);
  static const ink = Color(0xFF0F172A);
  static const mist = Color(0xFFF1F5F9);
  static const night = Color(0xFF0B1220);
  static const nightCard = Color(0xFF152238);
}

ThemeData buildLightTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: QvColors.trust,
      primary: QvColors.trust,
      secondary: QvColors.alert,
      tertiary: QvColors.resolved,
      surface: Colors.white,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: QvColors.mist,
  );
  return base.copyWith(
    textTheme: GoogleFonts.manropeTextTheme(base.textTheme).copyWith(
      displayLarge: GoogleFonts.fraunces(
        fontWeight: FontWeight.w700,
        color: QvColors.ink,
        fontSize: 36,
      ),
      displayMedium: GoogleFonts.fraunces(
        fontWeight: FontWeight.w700,
        color: QvColors.ink,
        fontSize: 28,
      ),
      headlineMedium: GoogleFonts.fraunces(
        fontWeight: FontWeight.w600,
        color: QvColors.ink,
        fontSize: 22,
      ),
      titleLarge: GoogleFonts.fraunces(
        fontWeight: FontWeight.w600,
        color: QvColors.ink,
        fontSize: 20,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white.withOpacity(0.92),
      foregroundColor: QvColors.ink,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.fraunces(
        fontWeight: FontWeight.w700,
        fontSize: 22,
        color: QvColors.ink,
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: QvColors.alert,
      foregroundColor: Colors.white,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: QvColors.trust.withOpacity(0.12),
      labelTextStyle: WidgetStatePropertyAll(
        GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
  );
}

ThemeData buildDarkTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: QvColors.trust,
      primary: const Color(0xFF6B9BFF),
      secondary: QvColors.alert,
      tertiary: QvColors.resolved,
      surface: QvColors.nightCard,
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: QvColors.night,
  );
  return base.copyWith(
    textTheme: GoogleFonts.manropeTextTheme(base.textTheme).copyWith(
      displayLarge: GoogleFonts.fraunces(
        fontWeight: FontWeight.w700,
        color: Colors.white,
        fontSize: 36,
      ),
      displayMedium: GoogleFonts.fraunces(
        fontWeight: FontWeight.w700,
        color: Colors.white,
        fontSize: 28,
      ),
      headlineMedium: GoogleFonts.fraunces(
        fontWeight: FontWeight.w600,
        color: Colors.white,
        fontSize: 22,
      ),
      titleLarge: GoogleFonts.fraunces(
        fontWeight: FontWeight.w600,
        color: Colors.white,
        fontSize: 20,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: QvColors.night.withOpacity(0.92),
      foregroundColor: Colors.white,
      elevation: 0,
      titleTextStyle: GoogleFonts.fraunces(
        fontWeight: FontWeight.w700,
        fontSize: 22,
        color: Colors.white,
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: QvColors.alert,
      foregroundColor: Colors.white,
    ),
  );
}
