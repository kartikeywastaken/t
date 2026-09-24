class UserProfileModel {
  final String firstName;
  final String lastName;
  final String email;
  final String designation;
  final String role;
  final String badgeNumber;
  final String profileImage;

  const UserProfileModel({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.designation,
    required this.role,
    this.badgeNumber = 'INV-8492',
    this.profileImage = '',
  });

  String get displayName => '$firstName $lastName'.trim().isEmpty
      ? 'System Analyst'
      : '$firstName $lastName'.trim();
  String get initials {
    final f = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'S';
    final l = lastName.isNotEmpty ? lastName[0].toUpperCase() : 'A';
    return '$f$l';
  }

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      firstName: json['firstName'] as String? ?? 'System',
      lastName: json['lastName'] as String? ?? 'Analyst',
      email: json['email'] as String? ?? 'analyst@crimenet.com',
      designation: json['designation'] as String? ?? 'Senior Investigator',
      role: json['role'] as String? ?? 'Administrator',
      badgeNumber: json['badgeNumber'] as String? ?? 'INV-8492',
      profileImage: json['profileImage'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'designation': designation,
      'role': role,
      'badgeNumber': badgeNumber,
      'profileImage': profileImage,
    };
  }

  UserProfileModel copyWith({
    String? firstName,
    String? lastName,
    String? email,
    String? designation,
    String? role,
    String? badgeNumber,
    String? profileImage,
  }) {
    return UserProfileModel(
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      designation: designation ?? this.designation,
      role: role ?? this.role,
      badgeNumber: badgeNumber ?? this.badgeNumber,
      profileImage: profileImage ?? this.profileImage,
    );
  }
}
