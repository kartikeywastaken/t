class CaseModel {
  final String id;
  final String title;
  final String status; // active, under-investigation, closed, archived
  final String priority; // critical, high, medium, low
  final String summary;
  final int entityCount;
  final String updated;

  const CaseModel({
    required this.id,
    required this.title,
    required this.status,
    required this.priority,
    required this.summary,
    required this.entityCount,
    required this.updated,
  });

  factory CaseModel.fromJson(Map<String, dynamic> json) {
    return CaseModel(
      id:
          json['id'] as String? ??
          'CR-${DateTime.now().millisecondsSinceEpoch % 1000}',
      title: json['title'] as String? ?? 'Untitled Case',
      status: (json['status'] as String? ?? 'active').toLowerCase(),
      priority: (json['priority'] as String? ?? 'medium').toLowerCase(),
      summary: json['summary'] as String? ?? '',
      entityCount: (json['entityCount'] as num?)?.toInt() ?? 0,
      updated: json['updated'] as String? ?? 'Just now',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'priority': priority,
      'summary': summary,
      'entityCount': entityCount,
      'updated': updated,
    };
  }

  CaseModel copyWith({
    String? id,
    String? title,
    String? status,
    String? priority,
    String? summary,
    int? entityCount,
    String? updated,
  }) {
    return CaseModel(
      id: id ?? this.id,
      title: title ?? this.title,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      summary: summary ?? this.summary,
      entityCount: entityCount ?? this.entityCount,
      updated: updated ?? this.updated,
    );
  }
}
