class RelationshipModel {
  final String source;
  final String target;
  final String type; // Financial, Communication, Association, Family, Logistics
  final String confidence; // High, Medium, Low
  final String notes;

  const RelationshipModel({
    required this.source,
    required this.target,
    required this.type,
    this.confidence = 'High',
    this.notes = '',
  });

  factory RelationshipModel.fromJson(Map<String, dynamic> json) {
    return RelationshipModel(
      source: json['source'] as String? ?? '',
      target: json['target'] as String? ?? '',
      type: json['type'] as String? ?? 'Association',
      confidence: json['confidence'] as String? ?? 'High',
      notes: json['notes'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'source': source,
      'target': target,
      'type': type,
      'confidence': confidence,
      'notes': notes,
    };
  }
}
