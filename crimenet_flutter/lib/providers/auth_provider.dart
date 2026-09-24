import 'package:flutter/material.dart';
import '../models/user_profile_model.dart';
import '../services/intelligence_repo.dart';

class AuthProvider extends ChangeNotifier {
  final IntelligenceRepository repository;

  bool _isAuthenticated = false;
  String? _errorMessage;
  UserProfileModel _profile = const UserProfileModel(
    firstName: "System",
    lastName: "Analyst",
    email: "analyst@crimenet.com",
    designation: "Senior Investigator",
    role: "Administrator",
    badgeNumber: "INV-8492",
  );

  bool get isAuthenticated => _isAuthenticated;
  UserProfileModel get profile => _profile;
  String? get errorMessage => _errorMessage;

  AuthProvider({required this.repository});

  Future<bool> login(String username, String password) async {
    _errorMessage = null;
    try {
      _profile = await repository.login(username, password);
      _isAuthenticated = true;
      notifyListeners();
      return true;
    } catch (error) {
      _isAuthenticated = false;
      _errorMessage = error.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await repository.logout();
    _isAuthenticated = false;
    notifyListeners();
  }

  Future<void> updateProfile(UserProfileModel newProfile) async {
    _profile = await repository.updateProfile(newProfile);
    notifyListeners();
  }
}
