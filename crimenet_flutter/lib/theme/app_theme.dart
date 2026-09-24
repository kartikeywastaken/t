import 'package:flutter/material.dart';

class AppTheme {
  // Primary branding colors
  static const Color primaryBlue = Color(0xFF1D4ED8); // Material Blue 700
  static const Color accentCyan = Color(0xFF0EA5E9); // Sky 500
  static const Color accentPurple = Color(0xFF8B5CF6); // Violet 500
  static const Color accentAmber = Color(0xFFF59E0B); // Amber 500
  static const Color accentGreen = Color(0xFF10B981); // Emerald 500
  static const Color accentRed = Color(0xFFEF4444); // Rose 500

  // Light Theme
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryBlue,
      brightness: Brightness.light,
      primary: primaryBlue,
      surface: const Color(0xFFF8FAFC),
      onSurface: const Color(0xFF0F172A),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFFF1F5F9),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
        color: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF0F172A),
        surfaceTintColor: Colors.transparent,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE2E8F0),
        thickness: 1,
      ),
    );
  }

  // Dark Theme
  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryBlue,
      brightness: Brightness.dark,
      primary: const Color(0xFF3B82F6),
      surface: const Color(0xFF111827),
      onSurface: const Color(0xFFF9FAFB),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFF0B0F19),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFF1F2937), width: 1),
        ),
        color: const Color(0xFF131B2E),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: Color(0xFF111827),
        foregroundColor: Color(0xFFF9FAFB),
        surfaceTintColor: Colors.transparent,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFF1F2937),
        thickness: 1,
      ),
    );
  }
}
