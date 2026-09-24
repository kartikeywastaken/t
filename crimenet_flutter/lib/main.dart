import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/intelligence_provider.dart';
import 'providers/theme_provider.dart';
import 'services/intelligence_repo.dart';
import 'theme/app_theme.dart';
import 'views/login_view.dart';
import 'views/main_shell_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final repository = IntelligenceRepository();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        Provider<IntelligenceRepository>.value(value: repository),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(repository: repository),
        ),
        ChangeNotifierProvider(
          create: (_) => IntelligenceProvider(repository: repository),
        ),
      ],
      child: const CrimeNetApp(),
    ),
  );
}

class CrimeNetApp extends StatelessWidget {
  const CrimeNetApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final authProvider = context.watch<AuthProvider>();

    return MaterialApp(
      title: 'CrimeNet Intelligence Platform',
      debugShowCheckedModeBanner: false,
      themeMode: themeProvider.themeMode,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: authProvider.isAuthenticated
          ? const MainShellView()
          : LoginView(onLoginSuccess: () {}),
    );
  }
}
