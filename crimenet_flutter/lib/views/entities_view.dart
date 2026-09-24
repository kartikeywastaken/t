import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/entity_model.dart';
import '../providers/intelligence_provider.dart';
import '../theme/app_theme.dart';

class EntitiesView extends StatefulWidget {
  const EntitiesView({super.key});

  @override
  State<EntitiesView> createState() => _EntitiesViewState();
}

class _EntitiesViewState extends State<EntitiesView> {
  String _selectedType = 'All';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final intelligence = context.watch<IntelligenceProvider>();
    final isDark = theme.brightness == Brightness.dark;

    final entities = intelligence.filteredEntities.where((e) {
      if (_selectedType == 'All') return true;
      return e.type.toLowerCase() == _selectedType.toLowerCase();
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Entity Directory',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tracked persons of interest, organizations, phone numbers, and locations',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
              FilledButton.icon(
                onPressed: () => _showAddEntityDialog(context, intelligence),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Entity'),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Type filter chips
          Wrap(
            spacing: 8,
            children: [
              _buildTypeChip('All Types', 'All'),
              _buildTypeChip('Persons', 'Person'),
              _buildTypeChip('Organizations', 'Organization'),
              _buildTypeChip('Locations', 'Location'),
              _buildTypeChip('Phones', 'Phone'),
            ],
          ),

          const SizedBox(height: 20),

          LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth > 950
                  ? 3
                  : (constraints.maxWidth > 650 ? 2 : 1);
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: entities.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  mainAxisExtent: 180,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemBuilder: (context, index) {
                  final entity = entities[index];
                  final riskColor = _getRiskColor(entity.risk);

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
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
                                  color: theme.colorScheme.primary.withValues(
                                    alpha: isDark ? 0.2 : 0.1,
                                  ),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  entity.id,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: riskColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '${entity.risk.toUpperCase()} RISK',
                                  style: TextStyle(
                                    color: riskColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            entity.name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            entity.type,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withValues(
                                alpha: 0.6,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Expanded(
                            child: Text(
                              entity.details.isEmpty
                                  ? 'No notes available'
                                  : entity.details,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface.withValues(
                                  alpha: 0.7,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                'Cases: ',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  entity.cases.join(', '),
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: AppTheme.primaryBlue,
                                  ),
                                  overflow: TextOverflow.ellipsis,
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

  Widget _buildTypeChip(String label, String type) {
    final isSelected = _selectedType == type;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedType = type),
    );
  }

  Color _getRiskColor(String risk) {
    switch (risk.toLowerCase()) {
      case 'critical':
      case 'high':
        return AppTheme.accentRed;
      case 'medium':
        return AppTheme.accentAmber;
      default:
        return AppTheme.accentGreen;
    }
  }

  void _showAddEntityDialog(
    BuildContext context,
    IntelligenceProvider intelligence,
  ) {
    final nameController = TextEditingController();
    final detailsController = TextEditingController();
    String type = 'Person';
    String risk = 'Medium';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add Identified Entity'),
          content: SizedBox(
            width: 400,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Entity Name / Identifier',
                    hintText: 'e.g. Victor Sterling, Apex Logistics',
                  ),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  decoration: const InputDecoration(labelText: 'Entity Type'),
                  items: const [
                    DropdownMenuItem(value: 'Person', child: Text('Person')),
                    DropdownMenuItem(
                      value: 'Organization',
                      child: Text('Organization'),
                    ),
                    DropdownMenuItem(
                      value: 'Location',
                      child: Text('Location'),
                    ),
                    DropdownMenuItem(
                      value: 'Phone',
                      child: Text('Phone Number'),
                    ),
                    DropdownMenuItem(value: 'Vehicle', child: Text('Vehicle')),
                  ],
                  onChanged: (v) => setDialogState(() => type = v ?? 'Person'),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: risk,
                  decoration: const InputDecoration(
                    labelText: 'Risk Assessment',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'Critical',
                      child: Text('Critical'),
                    ),
                    DropdownMenuItem(value: 'High', child: Text('High')),
                    DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                    DropdownMenuItem(value: 'Low', child: Text('Low')),
                  ],
                  onChanged: (v) => setDialogState(() => risk = v ?? 'Medium'),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: detailsController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Intelligence Notes',
                    hintText: 'Suspected role, known affiliations...',
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
                if (nameController.text.trim().isNotEmpty) {
                  intelligence.addEntity(
                    EntityModel(
                      id: 'ENT-00${intelligence.entities.length + 1}',
                      name: nameController.text.trim(),
                      type: type,
                      risk: risk,
                      cases: ['CR-001'],
                      details: detailsController.text.trim(),
                    ),
                  );
                  Navigator.pop(context);
                }
              },
              child: const Text('Add Entity'),
            ),
          ],
        ),
      ),
    );
  }
}
