import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/case_model.dart';
import '../providers/intelligence_provider.dart';
import '../theme/app_theme.dart';

class CasesView extends StatefulWidget {
  const CasesView({super.key});

  @override
  State<CasesView> createState() => _CasesViewState();
}

class _CasesViewState extends State<CasesView> {
  String _selectedStatus = 'all';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final intelligence = context.watch<IntelligenceProvider>();
    final isDark = theme.brightness == Brightness.dark;

    final cases = intelligence.cases.where((c) {
      if (_selectedStatus == 'all') return true;
      return c.status.toLowerCase().contains(_selectedStatus);
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & New Case Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Case Management',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Active and archived criminal network intelligence cases',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
              FilledButton.icon(
                onPressed: () => _showNewCaseDialog(context, intelligence),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New Case'),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Filter chips
          Wrap(
            spacing: 8,
            children: [
              _buildFilterChip('All Cases', 'all', intelligence.cases.length),
              _buildFilterChip(
                'Active',
                'active',
                intelligence.cases.where((c) => c.status == 'active').length,
              ),
              _buildFilterChip(
                'Under Investigation',
                'investigation',
                intelligence.cases
                    .where((c) => c.status.contains('investigation'))
                    .length,
              ),
              _buildFilterChip(
                'Closed',
                'closed',
                intelligence.cases.where((c) => c.status == 'closed').length,
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Cases Grid
          LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth > 900 ? 2 : 1;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: cases.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  mainAxisExtent: 175,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemBuilder: (context, index) {
                  final c = cases[index];
                  final statusColor = _getStatusColor(c.status);
                  final priorityColor = _getPriorityColor(c.priority);

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryBlue.withValues(
                                    alpha: isDark ? 0.2 : 0.1,
                                  ),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  c.id,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.primaryBlue,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: priorityColor.withValues(
                                        alpha: 0.15,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      c.priority.toUpperCase(),
                                      style: TextStyle(
                                        color: priorityColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(
                                        alpha: 0.15,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      c.status
                                          .replaceAll('-', ' ')
                                          .toUpperCase(),
                                      style: TextStyle(
                                        color: statusColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            c.title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Expanded(
                            child: Text(
                              c.summary,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface.withValues(
                                  alpha: 0.7,
                                ),
                              ),
                            ),
                          ),
                          const Divider(height: 1),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.hub_outlined,
                                    size: 14,
                                    color: theme.colorScheme.primary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${c.entityCount} Linked Entities',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                'Updated ${c.updated}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurface.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, int count) {
    final isSelected = _selectedStatus == value;
    return ChoiceChip(
      label: Text('$label ($count)'),
      selected: isSelected,
      onSelected: (_) {
        setState(() => _selectedStatus = value);
      },
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

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return AppTheme.accentRed;
      case 'medium':
        return AppTheme.accentAmber;
      default:
        return AppTheme.accentGreen;
    }
  }

  void _showNewCaseDialog(
    BuildContext context,
    IntelligenceProvider intelligence,
  ) {
    final titleController = TextEditingController();
    final summaryController = TextEditingController();
    String priority = 'high';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Create New Case'),
          content: SizedBox(
            width: 420,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Case Title',
                    hintText: 'e.g. Operation Northern Corridor',
                  ),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: priority,
                  decoration: const InputDecoration(
                    labelText: 'Priority Level',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'critical',
                      child: Text('Critical'),
                    ),
                    DropdownMenuItem(value: 'high', child: Text('High')),
                    DropdownMenuItem(value: 'medium', child: Text('Medium')),
                    DropdownMenuItem(value: 'low', child: Text('Low')),
                  ],
                  onChanged: (v) =>
                      setDialogState(() => priority = v ?? 'high'),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: summaryController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Investigation Summary',
                    hintText: 'Describe key context and lead details...',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (titleController.text.trim().isNotEmpty) {
                  intelligence.addCase(
                    CaseModel(
                      id: 'CR-00${intelligence.cases.length + 1}',
                      title: titleController.text.trim(),
                      status: 'active',
                      priority: priority,
                      summary: summaryController.text.trim(),
                      entityCount: 1,
                      updated: 'Just now',
                    ),
                  );
                  Navigator.pop(context);
                }
              },
              child: const Text('Create Case'),
            ),
          ],
        ),
      ),
    );
  }
}
