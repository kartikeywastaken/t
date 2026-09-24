class IntelligenceRecordModel {
  final String id;
  final String source;
  final String type;
  final String confidence;
  final String content;
  final String? caseId;
  final String time;
  final DateTime? createdAt;
  final List<String> extractedEntityIds;
  final bool flagged;

  const IntelligenceRecordModel({
    required this.id,
    required this.source,
    required this.type,
    required this.confidence,
    required this.content,
    required this.time,
    this.createdAt,
    this.caseId,
    this.extractedEntityIds = const [],
    this.flagged = false,
  });

  factory IntelligenceRecordModel.fromJson(Map<String, dynamic> json) {
    return IntelligenceRecordModel(
      id: json['id']?.toString() ?? '',
      source: json['source']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      confidence: json['confidence']?.toString() ?? 'Medium',
      content: json['content']?.toString() ?? '',
      caseId: json['caseId']?.toString(),
      time: json['time']?.toString() ?? 'Recent',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      extractedEntityIds: (json['extractedEntityIds'] as List<dynamic>? ?? [])
          .map((value) => value.toString())
          .toList(),
      flagged: json['flagged'] == true,
    );
  }
}
