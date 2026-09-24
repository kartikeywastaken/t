import '../models/analytical_flag_model.dart';
import '../models/case_model.dart';
import '../models/entity_model.dart';
import '../models/intelligence_record_model.dart';
import '../models/relationship_model.dart';
import '../models/report_model.dart';
import '../models/user_profile_model.dart';
import 'api_client.dart';

class IntelligenceRepository {
  final ApiClient apiClient;

  IntelligenceRepository({ApiClient? client})
    : apiClient = client ?? ApiClient();

  Future<UserProfileModel> login(String username, String password) async {
    final result =
        await apiClient.post('/api/auth/login', {
              'username': username.trim(),
              'password': password,
            })
            as Map<String, dynamic>;
    apiClient.authToken = result['token'] as String;
    return UserProfileModel.fromJson(result['profile'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    try {
      await apiClient.post('/api/auth/logout', {});
    } finally {
      apiClient.authToken = null;
    }
  }

  Future<List<CaseModel>> getCases() async {
    final result = await apiClient.get('/api/cases') as List<dynamic>;
    return result
        .map((item) => CaseModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<CaseModel> addCase(CaseModel value) async {
    final result = await apiClient.post('/api/cases', value.toJson());
    return CaseModel.fromJson(result as Map<String, dynamic>);
  }

  Future<void> updateCase(CaseModel value) async {
    await apiClient.put('/api/cases/${value.id}', value.toJson());
  }

  Future<List<EntityModel>> getEntities() async {
    final result = await apiClient.get('/api/entities') as List<dynamic>;
    return result
        .map((item) => EntityModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<EntityModel> addEntity(EntityModel value) async {
    final result = await apiClient.post('/api/entities', value.toJson());
    return EntityModel.fromJson(result as Map<String, dynamic>);
  }

  Future<List<RelationshipModel>> getRelationships() async {
    final result = await apiClient.get('/api/relationships') as List<dynamic>;
    return result
        .map((item) => RelationshipModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<RelationshipModel> addRelationship(RelationshipModel value) async {
    final result = await apiClient.post('/api/relationships', value.toJson());
    return RelationshipModel.fromJson(result as Map<String, dynamic>);
  }

  Future<List<AnalyticalFlagModel>> getFlags() async {
    final result = await apiClient.get('/api/flags') as List<dynamic>;
    return result
        .map(
          (item) => AnalyticalFlagModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  Future<List<IntelligenceRecordModel>> getIntelligence() async {
    final result = await apiClient.get('/api/intelligence') as List<dynamic>;
    return result
        .map(
          (item) =>
              IntelligenceRecordModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  Future<IntelligenceRecordModel> ingestIntelligence({
    required String source,
    required String type,
    required String confidence,
    required String content,
    String? caseId,
  }) async {
    final result = await apiClient.post('/api/intelligence', {
      'source': source,
      'type': type,
      'confidence': confidence,
      'content': content,
      'caseId': caseId,
    });
    return IntelligenceRecordModel.fromJson(result as Map<String, dynamic>);
  }

  Future<List<ReportModel>> getReports() async {
    final result = await apiClient.get('/api/reports') as List<dynamic>;
    return result
        .map((item) => ReportModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<ReportModel> generateReport({String? caseId}) async {
    final result = await apiClient.post('/api/reports', {'caseId': caseId});
    return ReportModel.fromJson(result as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> exportReport(String reportId) async {
    final result = await apiClient.get('/api/reports/$reportId/export');
    return result as Map<String, dynamic>;
  }

  Future<UserProfileModel> getProfile() async {
    final result = await apiClient.get('/api/profile');
    return UserProfileModel.fromJson(result as Map<String, dynamic>);
  }

  Future<UserProfileModel> updateProfile(UserProfileModel value) async {
    final result = await apiClient.put('/api/profile', value.toJson());
    return UserProfileModel.fromJson(result as Map<String, dynamic>);
  }

  Future<void> resetData() async {
    await apiClient.post('/api/admin/reset', {});
  }
}
