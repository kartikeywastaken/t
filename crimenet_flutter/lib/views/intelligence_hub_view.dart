import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/intelligence_provider.dart';
import '../theme/app_theme.dart';

class IntelligenceHubView extends StatefulWidget {
  const IntelligenceHubView({super.key});

  @override
  State<IntelligenceHubView> createState() => _IntelligenceHubViewState();
}

class _IntelligenceHubViewState extends State<IntelligenceHubView> {
  final _contentController = TextEditingController();
  String _sourceType = 'Financial Intelligence';
  String _confidence = 'High';
  String? _caseId;
  bool _submitting = false;

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _addIntelligence() async {
    if (_contentController.text.trim().isEmpty || _submitting) return;
    setState(() => _submitting = true);
    try {
      final result = await context
          .read<IntelligenceProvider>()
          .ingestIntelligence(
            source: _sourceType,
            type: 'Investigator Submission',
            confidence: _confidence,
            content: _contentController.text.trim(),
            caseId: _caseId,
          );
      _contentController.clear();
      if (mounted) {
        final extracted = result.extractedEntityIds.length;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Ingested ${result.id}; $extracted linked entities${result.flagged ? ' and a risk flag' : ''} detected.',
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Ingestion failed: $error')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final provider = context.watch<IntelligenceProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Intelligence Hub',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Multi-source intelligence ingestion with automated entity and relationship extraction',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.bolt,
                        color: theme.colorScheme.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'New Intelligence Ingestion',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _sourceType,
                          decoration: const InputDecoration(
                            labelText: 'Intelligence Source',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'Financial Intelligence',
                              child: Text('Financial Intelligence'),
                            ),
                            DropdownMenuItem(
                              value: 'Telecom Intercepts',
                              child: Text('Telecom Intercepts'),
                            ),
                            DropdownMenuItem(
                              value: 'Physical Surveillance',
                              child: Text('Physical Surveillance'),
                            ),
                            DropdownMenuItem(
                              value: 'Human Informant',
                              child: Text('Human Informant'),
                            ),
                            DropdownMenuItem(
                              value: 'Open Source Intelligence',
                              child: Text('OSINT'),
                            ),
                          ],
                          onChanged: (value) => setState(
                            () => _sourceType = value ?? _sourceType,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _confidence,
                          decoration: const InputDecoration(
                            labelText: 'Confidence Level',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'High',
                              child: Text('High Confidence'),
                            ),
                            DropdownMenuItem(
                              value: 'Medium',
                              child: Text('Medium Confidence'),
                            ),
                            DropdownMenuItem(
                              value: 'Low',
                              child: Text('Low Confidence'),
                            ),
                          ],
                          onChanged: (value) => setState(
                            () => _confidence = value ?? _confidence,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String?>(
                          initialValue: _caseId,
                          decoration: const InputDecoration(
                            labelText: 'Link to Case',
                          ),
                          items: [
                            const DropdownMenuItem<String?>(
                              value: null,
                              child: Text('Unassigned'),
                            ),
                            ...provider.cases.map(
                              (item) => DropdownMenuItem<String?>(
                                value: item.id,
                                child: Text(item.id),
                              ),
                            ),
                          ],
                          onChanged: (value) => setState(() => _caseId = value),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _contentController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Intelligence Summary & Raw Data',
                      hintText:
                          'Enter observations, named persons, phone numbers, vehicles, locations, organizations, or transaction details...',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton.icon(
                      onPressed: _submitting ? null : _addIntelligence,
                      icon: _submitting
                          ? const SizedBox.square(
                              dimension: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send_rounded, size: 16),
                      label: const Text('Ingest & Analyze'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'LIVE INTELLIGENCE STREAM',
            style: theme.textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 14),
          if (provider.isLoading)
            const Center(child: CircularProgressIndicator())
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: provider.intelligence.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = provider.intelligence[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
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
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      item.id,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                        color: AppTheme.primaryBlue,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Flexible(
                                    child: Text(
                                      item.source,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodyMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                  ),
                                  if (item.caseId != null)
                                    Padding(
                                      padding: const EdgeInsets.only(left: 8),
                                      child: Chip(
                                        label: Text(
                                          item.caseId!,
                                          style: const TextStyle(fontSize: 10),
                                        ),
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                if (item.flagged)
                                  const Padding(
                                    padding: EdgeInsets.only(right: 8),
                                    child: Icon(
                                      Icons.warning_amber,
                                      color: AppTheme.accentAmber,
                                      size: 18,
                                    ),
                                  ),
                                Text(
                                  '${item.confidence} Confidence',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.accentGreen,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  item.time,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurface
                                        .withValues(alpha: 0.5),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          item.content,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(
                              alpha: 0.85,
                            ),
                          ),
                        ),
                        if (item.extractedEntityIds.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 10),
                            child: Text(
                              'Extracted: ${item.extractedEntityIds.join(', ')}',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: theme.colorScheme.primary,
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
    );
  }
}
