class AnalyticalFlagModel {
  final String id;
  final String title;
  final String description;
  final String severity; // HIGH, MEDIUM, REVIEW, LOW
  final String detectedAt;

  const AnalyticalFlagModel({
    required this.id,
    required this.title,
    required this.description,
    required this.severity,
    required this.detectedAt,
  });

  factory AnalyticalFlagModel.fromJson(Map<String, dynamic> json) {
    return AnalyticalFlagModel(
      id:
          json['id'] as String? ??
          'FLG-${DateTime.now().millisecondsSinceEpoch % 100}',
      title: json['title'] as String? ?? 'Flagged Activity',
      description: json['description'] as String? ?? '',
      severity: (json['severity'] as String? ?? 'MEDIUM').toUpperCase(),
      detectedAt: json['detectedAt'] as String? ?? 'Recent',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'severity': severity,
      'detectedAt': detectedAt,
    };
  }
}
