import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_navigation_rail.dart';
import '../widgets/app_top_bar.dart';
import 'dashboard_view.dart';
import 'cases_view.dart';
import 'intelligence_hub_view.dart';
import 'network_analysis_view.dart';
import 'entities_view.dart';
import 'reports_view.dart';
import 'settings_view.dart';
import 'profile_view.dart';

class MainShellView extends StatefulWidget {
  const MainShellView({super.key});

  @override
  State<MainShellView> createState() => _MainShellViewState();
}

class _MainShellViewState extends State<MainShellView> {
  int _selectedTab = 0;
  bool _isSidebarCollapsed = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();

    final views = [
      DashboardView(
        onNavigateTab: (index) => setState(() => _selectedTab = index),
      ),
      const CasesView(),
      const IntelligenceHubView(),
      const NetworkAnalysisView(),
      const EntitiesView(),
      const ReportsView(),
      const SettingsView(),
      const ProfileView(),
    ];

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          AppNavigationRail(
            selectedIndex: _selectedTab,
            onDestinationSelected: (index) =>
                setState(() => _selectedTab = index),
            onLogout: () => auth.logout(),
            isCollapsed: _isSidebarCollapsed,
            onToggleCollapse: () =>
                setState(() => _isSidebarCollapsed = !_isSidebarCollapsed),
          ),

          // Main Screen
          Expanded(
            child: Column(
              children: [
                AppTopBar(onProfileTap: () => setState(() => _selectedTab = 7)),
                Expanded(
                  child: IndexedStack(index: _selectedTab, children: views),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
