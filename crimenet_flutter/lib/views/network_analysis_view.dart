import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/entity_model.dart';
import '../providers/intelligence_provider.dart';
import '../theme/app_theme.dart';

class NetworkAnalysisView extends StatefulWidget {
  const NetworkAnalysisView({super.key});

  @override
  State<NetworkAnalysisView> createState() => _NetworkAnalysisViewState();
}

class _NetworkAnalysisViewState extends State<NetworkAnalysisView> {
  EntityModel? _selectedEntity;
  String _filterType = 'All';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final intelligence = context.watch<IntelligenceProvider>();
    final isDark = theme.brightness == Brightness.dark;

    final filteredEntities = intelligence.entities.where((e) {
      if (_filterType == 'All') return true;
      return e.type.toLowerCase() == _filterType.toLowerCase();
    }).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Network Analysis',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Multi-entity relationship graph and link cluster analysis',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  DropdownButton<String>(
                    value: _filterType,
                    items: const [
                      DropdownMenuItem(
                        value: 'All',
                        child: Text('All Entities'),
                      ),
                      DropdownMenuItem(value: 'Person', child: Text('Persons')),
                      DropdownMenuItem(
                        value: 'Organization',
                        child: Text('Organizations'),
                      ),
                      DropdownMenuItem(
                        value: 'Location',
                        child: Text('Locations'),
                      ),
                      DropdownMenuItem(value: 'Phone', child: Text('Phones')),
                    ],
                    onChanged: (v) => setState(() => _filterType = v ?? 'All'),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedEntity = null;
                      });
                    },
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Reset View'),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Main Graph + Inspector Split
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Interactive Graph Canvas
                Expanded(
                  flex: 7,
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: InteractiveViewer(
                            boundaryMargin: const EdgeInsets.all(200),
                            minScale: 0.5,
                            maxScale: 2.5,
                            child: CustomPaint(
                              painter: _NetworkGraphPainter(
                                entities: filteredEntities,
                                relationships: intelligence.relationships,
                                selectedEntity: _selectedEntity,
                                isDark: isDark,
                              ),
                              child: GestureDetector(
                                onTapUp: (details) {
                                  final hit = _findHitEntity(
                                    details.localPosition,
                                    filteredEntities,
                                  );
                                  setState(() {
                                    _selectedEntity = hit;
                                  });
                                },
                              ),
                            ),
                          ),
                        ),

                        // Overlay Stats Pill
                        Positioned(
                          top: 16,
                          left: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color:
                                  (isDark
                                          ? const Color(0xFF161F30)
                                          : Colors.white)
                                      .withValues(alpha: 0.9),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: theme.dividerColor),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Nodes: ${filteredEntities.length}   •   ',
                                ),
                                Text(
                                  'Links: ${intelligence.relationships.length}   •   ',
                                ),
                                Text('Density: ${intelligence.networkDensity}'),
                              ],
                            ),
                          ),
                        ),

                        // Tip at bottom
                        Positioned(
                          bottom: 12,
                          left: 16,
                          child: Text(
                            'Click on any node to inspect relationship intelligence',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurface.withValues(
                                alpha: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(width: 20),

                // Entity Inspector Card
                Expanded(
                  flex: 3,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: _selectedEntity != null
                          ? _buildEntityDetailInspector(
                              theme,
                              intelligence,
                              _selectedEntity!,
                            )
                          : Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.touch_app_outlined,
                                    size: 40,
                                    color: theme.colorScheme.onSurface
                                        .withValues(alpha: 0.3),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No Entity Selected',
                                    style: theme.textTheme.titleMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: theme.colorScheme.onSurface
                                              .withValues(alpha: 0.7),
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Select any node in the graph to view intelligence details and connected ties.',
                                    textAlign: TextAlign.center,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurface
                                          .withValues(alpha: 0.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  EntityModel? _findHitEntity(Offset tap, List<EntityModel> entities) {
    final positions = _computeNodePositions(entities, const Size(700, 500));
    for (int i = 0; i < entities.length; i++) {
      final pos = positions[entities[i].id];
      if (pos != null && (pos - tap).distance <= 26) {
        return entities[i];
      }
    }
    return null;
  }

  Widget _buildEntityDetailInspector(
    ThemeData theme,
    IntelligenceProvider intelligence,
    EntityModel entity,
  ) {
    final connectedLinks = intelligence.relationships
        .where((r) => r.source == entity.id || r.target == entity.id)
        .toList();

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                entity.id,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryBlue,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _getRiskColor(entity.risk).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${entity.risk.toUpperCase()} RISK',
                  style: TextStyle(
                    color: _getRiskColor(entity.risk),
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
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            entity.type,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Text(
            'Intelligence Details:',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            entity.details.isEmpty ? 'No notes registered' : entity.details,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Associated Cases:',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: entity.cases.map((cid) {
              return Chip(
                label: Text(cid, style: const TextStyle(fontSize: 11)),
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Text(
            'Connected Ties (${connectedLinks.length}):',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: connectedLinks.length,
            separatorBuilder: (context, index) => const SizedBox(height: 6),
            itemBuilder: (context, i) {
              final link = connectedLinks[i];
              final otherId = link.source == entity.id
                  ? link.target
                  : link.source;
              return Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.dividerColor.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      otherId,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      link.type,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
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
}

// Compute radial/circular graph layout
Map<String, Offset> _computeNodePositions(
  List<EntityModel> entities,
  Size size,
) {
  final Map<String, Offset> positions = {};
  final center = Offset(size.width / 2, size.height / 2);
  final radius = math.min(size.width, size.height) * 0.35;

  for (int i = 0; i < entities.length; i++) {
    final angle = (2 * math.pi * i) / (entities.isEmpty ? 1 : entities.length);
    positions[entities[i].id] = Offset(
      center.dx + radius * math.cos(angle),
      center.dy + radius * math.sin(angle),
    );
  }
  return positions;
}

class _NetworkGraphPainter extends CustomPainter {
  final List<EntityModel> entities;
  final List<dynamic> relationships;
  final EntityModel? selectedEntity;
  final bool isDark;

  _NetworkGraphPainter({
    required this.entities,
    required this.relationships,
    required this.selectedEntity,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final actualSize = Size(
      math.max(size.width, 700),
      math.max(size.height, 500),
    );

    final positions = _computeNodePositions(entities, actualSize);

    // Draw Links
    final linePaint = Paint()
      ..color = (isDark ? Colors.white : Colors.black).withValues(alpha: 0.18)
      ..strokeWidth = 1.8
      ..style = PaintingStyle.stroke;

    final highlightLinePaint = Paint()
      ..color = AppTheme.accentCyan
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    for (final rel in relationships) {
      final p1 = positions[rel.source];
      final p2 = positions[rel.target];
      if (p1 != null && p2 != null) {
        final isHighlighted =
            selectedEntity != null &&
            (rel.source == selectedEntity!.id ||
                rel.target == selectedEntity!.id);
        canvas.drawLine(p1, p2, isHighlighted ? highlightLinePaint : linePaint);
      }
    }

    // Draw Nodes
    for (final entity in entities) {
      final pos = positions[entity.id];
      if (pos == null) continue;

      final isSelected = selectedEntity?.id == entity.id;
      final nodeColor = _getNodeColor(entity.type);

      // Node Shadow / Halo if selected
      if (isSelected) {
        final haloPaint = Paint()
          ..color = nodeColor.withValues(alpha: 0.35)
          ..style = PaintingStyle.fill;
        canvas.drawCircle(pos, 30, haloPaint);
      }

      final nodePaint = Paint()
        ..color = nodeColor
        ..style = PaintingStyle.fill;
      canvas.drawCircle(pos, isSelected ? 22 : 18, nodePaint);

      final borderPaint = Paint()
        ..color = isDark ? const Color(0xFF111827) : Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5;
      canvas.drawCircle(pos, isSelected ? 22 : 18, borderPaint);

      // Label below node
      final textSpan = TextSpan(
        text: entity.name,
        style: TextStyle(
          color: isDark ? Colors.white : const Color(0xFF0F172A),
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        ),
      );
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(pos.dx - (textPainter.width / 2), pos.dy + 24),
      );
    }
  }

  Color _getNodeColor(String type) {
    switch (type.toLowerCase()) {
      case 'person':
        return AppTheme.accentCyan;
      case 'organization':
        return AppTheme.accentPurple;
      case 'location':
        return AppTheme.accentGreen;
      case 'phone':
        return AppTheme.accentAmber;
      default:
        return AppTheme.primaryBlue;
    }
  }

  @override
  bool shouldRepaint(covariant _NetworkGraphPainter oldDelegate) {
    return oldDelegate.selectedEntity != selectedEntity ||
        oldDelegate.entities != entities ||
        oldDelegate.isDark != isDark;
  }
}
