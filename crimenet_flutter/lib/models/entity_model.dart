class EntityModel {
  final String id;
  final String name;
  final String type; // Person, Organization, Location, Phone, Vehicle
  final String risk; // Critical, High, Medium, Low
  final List<String> cases;
  final String details;

  const EntityModel({
    required this.id,
    required this.name,
    required this.type,
    required this.risk,
    required this.cases,
    this.details = '',
  });

  factory EntityModel.fromJson(Map<String, dynamic> json) {
    return EntityModel(
      id:
          json['id'] as String? ??
          'ENT-${DateTime.now().millisecondsSinceEpoch % 1000}',
      name: json['name'] as String? ?? 'Unknown Entity',
      type: json['type'] as String? ?? 'Person',
      risk: json['risk'] as String? ?? 'Medium',
      cases:
          (json['cases'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      details: json['details'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'risk': risk,
      'cases': cases,
      'details': details,
    };
  }

  EntityModel copyWith({
    String? id,
    String? name,
    String? type,
    String? risk,
    List<String>? cases,
    String? details,
  }) {
    return EntityModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      risk: risk ?? this.risk,
      cases: cases ?? this.cases,
      details: details ?? this.details,
    );
  }
}
