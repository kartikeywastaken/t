import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/case_model.dart';
import '../providers/auth_provider.dart';
import '../providers/intelligence_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/activity_chart.dart';
import '../widgets/stat_kpi_card.dart';

class DashboardView extends StatelessWidget {
  final ValueChanged<int> onNavigateTab;

  const DashboardView({super.key, required this.onNavigateTab});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final intelligence = context.watch<IntelligenceProvider>();
    final isDark = theme.brightness == Brightness.dark;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 1050;

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header & Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_getGreeting()}, ${auth.profile.displayName}',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Here's what's happening with your cases today.",
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(
                              alpha: 0.6,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF132320)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: AppTheme.accentGreen.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.accentGreen,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Intelligence system operational',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: isDark
                                ? const Color(0xFF34D399)
                                : const Color(0xFF047857),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // KPI Stats Grid (4 Cards)
              LayoutBuilder(
                builder: (context, gridConstraints) {
                  if (gridConstraints.maxWidth < 700) {
                    return GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 1.6,
                      children: _buildKpiCards(intelligence),
                    );
                  }
                  return Row(
                    children: _buildKpiCards(intelligence).map((c) {
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          child: c,
                        ),
                      );
                    }).toList(),
                  );
                },
              ),

              const SizedBox(height: 28),

              // Consolidated Main 2-Column Content Layout
              if (isWide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Column (Operational Flow: Cases & Flags)
                    Expanded(
                      flex: 6,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildRecentCasesCard(context, intelligence),
                          const SizedBox(height: 24),
                          _buildAnalyticalFlagsCard(context, intelligence),
                        ],
                      ),
                    ),
                    const SizedBox(width: 24),
                    // Right Column (Intelligence Visuals: Network & Activity)
                    Expanded(
                      flex: 5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildConsolidatedNetworkOverviewCard(
                            context,
                            intelligence,
                          ),
                          const SizedBox(height: 24),
                          ActivityChart(records: intelligence.intelligence),
                        ],
                      ),
                    ),
                  ],
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildRecentCasesCard(context, intelligence),
                    const SizedBox(height: 20),
                    _buildConsolidatedNetworkOverviewCard(
                      context,
                      intelligence,
                    ),
                    const SizedBox(height: 20),
                    _buildAnalyticalFlagsCard(context, intelligence),
                    const SizedBox(height: 20),
                    ActivityChart(records: intelligence.intelligence),
                  ],
                ),
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildKpiCards(IntelligenceProvider intelligence) {
    return [
      StatKpiCard(
        title: 'Total Cases',
        value: '${intelligence.totalCasesCount}',
        subtitle: 'Persisted records',
        icon: Icons.folder_outlined,
        accentColor: AppTheme.primaryBlue,
      ),
      StatKpiCard(
        title: 'Active Investigations',
        value: '${intelligence.activeCasesCount}',
        subtitle: 'In progress',
        icon: Icons.radar_outlined,
        accentColor: AppTheme.accentPurple,
      ),
      StatKpiCard(
        title: 'Entities Found',
        value: '${intelligence.entitiesCount}',
        subtitle: 'Identified',
        icon: Icons.hub_outlined,
        accentColor: AppTheme.accentCyan,
      ),
      StatKpiCard(
        title: 'Flagged Connections',
        value: '${intelligence.flaggedConnectionsCount}',
        subtitle: 'Review required',
        icon: Icons.warning_amber_rounded,
        accentColor: AppTheme.accentAmber,
      ),
    ];
  }

  Widget _buildRecentCasesCard(
    BuildContext context,
    IntelligenceProvider intelligence,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final cases = intelligence.cases.take(4).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Recent Cases',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Latest intelligence investigations',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: () => onNavigateTab(1), // Go to Cases Tab
                  icon: const Icon(Icons.arrow_forward, size: 14),
                  iconAlignment: IconAlignment.end,
                  label: const Text('View all'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),

            // Table Header
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 80,
                    child: Text(
                      'CASE ID',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.5,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'TITLE',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.5,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 100,
                    child: Text(
                      'STATUS',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.5,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 60,
                    child: Text(
                      'UPDATED',
                      textAlign: TextAlign.end,
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Rows
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: cases.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final c = cases[index];
                final statusColor = _getStatusColor(c.status);

                return InkWell(
                  onTap: () => _showCaseDetailsDialog(context, c),
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 8,
                    ),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 80,
                          child: Text(
                            c.id,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryBlue,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            c.title,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        SizedBox(
                          width: 100,
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(
                                  alpha: isDark ? 0.2 : 0.1,
                                ),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color: statusColor.withValues(alpha: 0.4),
                                ),
                              ),
                              child: Text(
                                c.status.replaceAll('-', ' ').toUpperCase(),
                                style: theme.textTheme.labelSmall?.copyWith(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: statusColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 60,
                          child: Text(
                            c.updated,
                            textAlign: TextAlign.end,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withValues(
                                alpha: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConsolidatedNetworkOverviewCard(
    BuildContext context,
    IntelligenceProvider intelligence,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final entityCounts = intelligence.entityTypeCounts;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Network Overview',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Current relationship & entity breakdown',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: () => onNavigateTab(3), // Go to Network tab
                  icon: const Icon(Icons.arrow_forward, size: 14),
                  iconAlignment: IconAlignment.end,
                  label: const Text('View details'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Mini Network Metrics Strip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF161F30)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMetricCol(
                    theme,
                    'Total Nodes',
                    '${intelligence.networkNodes}',
                  ),
                  Container(height: 24, width: 1, color: theme.dividerColor),
                  _buildMetricCol(
                    theme,
                    'Total Links',
                    '${intelligence.networkLinks}',
                  ),
                  Container(height: 24, width: 1, color: theme.dividerColor),
                  _buildMetricCol(
                    theme,
                    'Density',
                    intelligence.networkDensity,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Consolidated Entity Types Breakdown (replaces separate duplicate box)
            Text(
              'IDENTIFIED ENTITY DISTRIBUTION',
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 12),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildEntityChip(
                  theme,
                  'Persons',
                  entityCounts['Person'] ?? 0,
                  AppTheme.accentCyan,
                  Icons.person_outline,
                ),
                _buildEntityChip(
                  theme,
                  'Organizations',
                  entityCounts['Organization'] ?? 0,
                  AppTheme.accentPurple,
                  Icons.business_outlined,
                ),
                _buildEntityChip(
                  theme,
                  'Locations',
                  entityCounts['Location'] ?? 0,
                  AppTheme.accentGreen,
                  Icons.place_outlined,
                ),
                _buildEntityChip(
                  theme,
                  'Phones',
                  entityCounts['Phone'] ?? 0,
                  AppTheme.accentAmber,
                  Icons.phone_outlined,
                ),
                _buildEntityChip(
                  theme,
                  'Vehicles',
                  entityCounts['Vehicle'] ?? 0,
                  AppTheme.primaryBlue,
                  Icons.directions_car_outlined,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCol(ThemeData theme, String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }

  Widget _buildEntityChip(
    ThemeData theme,
    String label,
    int count,
    Color color,
    IconData icon,
  ) {
    final isDark = theme.brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.12 : 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$count',
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticalFlagsCard(
    BuildContext context,
    IntelligenceProvider intelligence,
  ) {
    final theme = Theme.of(context);
    final flags = intelligence.flags;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Priority Analytical Flags',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Patterns requiring investigator review',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.accentAmber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${flags.length} ALERTS',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppTheme.accentAmber,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: flags.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final f = flags[index];
                final color = _getSeverityColor(f.severity);

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: color.withValues(alpha: 0.3)),
                    color: color.withValues(alpha: 0.05),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.warning_amber_rounded,
                          size: 16,
                          color: color,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              f.title,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              f.description,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface.withValues(
                                  alpha: 0.7,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          f.severity,
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: color,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    final s = status.toLowerCase();
    if (s.contains('active')) return AppTheme.primaryBlue;
    if (s.contains('investigation') || s.contains('review')) {
      return AppTheme.accentAmber;
    }
    if (s.contains('closed')) return Colors.grey;
    return AppTheme.accentPurple;
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return AppTheme.accentRed;
      case 'MEDIUM':
        return AppTheme.accentAmber;
      case 'REVIEW':
      case 'LOW':
      default:
        return AppTheme.accentCyan;
    }
  }

  void _showCaseDetailsDialog(BuildContext context, CaseModel c) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Text(
              c.id,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryBlue,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(c.title)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Status: ${c.status.toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                Text('Priority: ${c.priority.toUpperCase()}'),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Summary:',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(c.summary),
            const SizedBox(height: 12),
            Text('Linked Entities: ${c.entityCount}'),
            Text('Last Updated: ${c.updated}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
