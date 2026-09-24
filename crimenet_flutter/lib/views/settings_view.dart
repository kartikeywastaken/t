import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/intelligence_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';

class SettingsView extends StatefulWidget {
  const SettingsView({super.key});

  @override
  State<SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<SettingsView> {
  late TextEditingController _urlController;
  bool _isTesting = false;
  String? _connectionStatus;
  bool? _connectionSuccess;

  @override
  void initState() {
    super.initState();
    final intelligence = context.read<IntelligenceProvider>();
    _urlController = TextEditingController(
      text: intelligence.repository.apiClient.baseUrl,
    );
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
      _connectionStatus = null;
    });

    final intelligence = context.read<IntelligenceProvider>();
    intelligence.repository.apiClient.baseUrl = _urlController.text.trim();

    try {
      await intelligence.repository.apiClient.get('/api/cases');
      setState(() {
        _isTesting = false;
        _connectionSuccess = true;
        _connectionStatus = 'Connected successfully to backend API!';
      });
    } catch (e) {
      setState(() {
        _isTesting = false;
        _connectionSuccess = false;
        _connectionStatus = 'Backend not responding: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeProvider = context.watch<ThemeProvider>();
    final intelligence = context.watch<IntelligenceProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'System Settings',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Configure API endpoints, visual themes, data persistence, and diagnostics',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 24),

          // API Endpoint Config Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.dns_outlined,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Data & REST API Endpoint',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Specify the CrimeNet backend URL. All case, entity, intelligence, relationship, and report data is persisted by this service.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _urlController,
                          decoration: const InputDecoration(
                            labelText: 'API Base URL',
                            hintText: 'https://t-production-80a2.up.railway.app',
                            prefixIcon: Icon(Icons.link, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      FilledButton.tonalIcon(
                        onPressed: _isTesting ? null : _testConnection,
                        icon: _isTesting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.network_check, size: 18),
                        label: const Text('Test Connection'),
                      ),
                    ],
                  ),
                  if (_connectionStatus != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color:
                            (_connectionSuccess == true
                                    ? AppTheme.accentGreen
                                    : AppTheme.accentAmber)
                                .withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _connectionSuccess == true
                                ? Icons.check_circle
                                : Icons.info_outline,
                            color: _connectionSuccess == true
                                ? AppTheme.accentGreen
                                : AppTheme.accentAmber,
                            size: 18,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _connectionStatus!,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _connectionSuccess == true
                                    ? AppTheme.accentGreen
                                    : AppTheme.accentAmber,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Theme Settings Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.palette_outlined,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Interface Appearance',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Select light or dark Material 3 theme mode.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(
                        value: ThemeMode.dark,
                        icon: Icon(Icons.dark_mode_outlined),
                        label: Text('Dark Theme'),
                      ),
                      ButtonSegment(
                        value: ThemeMode.light,
                        icon: Icon(Icons.light_mode_outlined),
                        label: Text('Light Theme'),
                      ),
                      ButtonSegment(
                        value: ThemeMode.system,
                        icon: Icon(Icons.settings_suggest_outlined),
                        label: Text('System'),
                      ),
                    ],
                    selected: {themeProvider.themeMode},
                    onSelectionChanged: (set) =>
                        themeProvider.setThemeMode(set.first),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Data Reset
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Restore Seed Intelligence Data',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Replace current investigation data with the bundled starter dataset.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                  OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        await intelligence.resetData();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Default intelligence dataset restored.',
                              ),
                            ),
                          );
                        }
                      } catch (error) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Reset failed: $error')),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.restart_alt, size: 18),
                    label: const Text('Restore Defaults'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
