import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../models/entity_model.dart';
import '../models/relationship_model.dart';
import '../models/analytical_flag_model.dart';
import '../models/intelligence_record_model.dart';
import '../models/report_model.dart';
import '../services/intelligence_repo.dart';

class IntelligenceProvider extends ChangeNotifier {
  final IntelligenceRepository repository;

  bool _isLoading = false;
  List<CaseModel> _cases = [];
  List<EntityModel> _entities = [];
  List<RelationshipModel> _relationships = [];
  List<AnalyticalFlagModel> _flags = [];
  List<IntelligenceRecordModel> _intelligence = [];
  List<ReportModel> _reports = [];
  String? _errorMessage;

  String _searchQuery = '';
  String _selectedStatusFilter = 'all';

  IntelligenceProvider({required this.repository});

  bool get isLoading => _isLoading;
  List<CaseModel> get cases => _cases;
  List<EntityModel> get entities => _entities;
  List<RelationshipModel> get relationships => _relationships;
  List<AnalyticalFlagModel> get flags => _flags;
  List<IntelligenceRecordModel> get intelligence => _intelligence;
  List<ReportModel> get reports => _reports;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedStatusFilter => _selectedStatusFilter;

  // Key KPI stats
  int get totalCasesCount => _cases.length;
  int get activeCasesCount => _cases
      .where((c) => c.status == 'active' || c.status == 'under-investigation')
      .length;
  int get entitiesCount => _entities.length;
  int get flaggedConnectionsCount => _flags.length;

  // Network metrics
  int get networkNodes => _entities.length;
  int get networkLinks => _relationships.length;
  String get networkDensity {
    final n = networkNodes;
    if (n < 2) return '0%';
    final maxEdges = (n * (n - 1)) / 2;
    final density = (networkLinks / maxEdges) * 100;
    return '${density.toStringAsFixed(1)}%';
  }

  // Distribution
  Map<String, int> get entityTypeCounts {
    final counts = <String, int>{
      'Person': 0,
      'Organization': 0,
      'Location': 0,
      'Phone': 0,
      'Vehicle': 0,
    };
    for (final e in _entities) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
    return counts;
  }

  // Filtered lists
  List<CaseModel> get filteredCases {
    return _cases.where((c) {
      final matchesSearch =
          _searchQuery.isEmpty ||
          c.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.summary.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesStatus =
          _selectedStatusFilter == 'all' ||
          c.status.toLowerCase() == _selectedStatusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    }).toList();
  }

  List<EntityModel> get filteredEntities {
    return _entities.where((e) {
      return _searchQuery.isEmpty ||
          e.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          e.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          e.type.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          e.details.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  Future<void> loadData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        repository.getCases(),
        repository.getEntities(),
        repository.getRelationships(),
        repository.getFlags(),
        repository.getIntelligence(),
        repository.getReports(),
      ]);
      _cases = results[0] as List<CaseModel>;
      _entities = results[1] as List<EntityModel>;
      _relationships = results[2] as List<RelationshipModel>;
      _flags = results[3] as List<AnalyticalFlagModel>;
      _intelligence = results[4] as List<IntelligenceRecordModel>;
      _reports = results[5] as List<ReportModel>;
    } catch (error) {
      _errorMessage = error.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setStatusFilter(String filter) {
    _selectedStatusFilter = filter;
    notifyListeners();
  }

  Future<void> addCase(CaseModel c) async {
    final created = await repository.addCase(c);
    _cases.insert(0, created);
    notifyListeners();
  }

  Future<void> addEntity(EntityModel entity) async {
    final created = await repository.addEntity(entity);
    _entities.insert(0, created);
    notifyListeners();
  }

  Future<void> addRelationship(RelationshipModel rel) async {
    final created = await repository.addRelationship(rel);
    _relationships.add(created);
    notifyListeners();
  }

  Future<IntelligenceRecordModel> ingestIntelligence({
    required String source,
    required String type,
    required String confidence,
    required String content,
    String? caseId,
  }) async {
    final created = await repository.ingestIntelligence(
      source: source,
      type: type,
      confidence: confidence,
      content: content,
      caseId: caseId,
    );
    await loadData();
    return created;
  }

  Future<ReportModel> generateReport({String? caseId}) async {
    final created = await repository.generateReport(caseId: caseId);
    _reports.insert(0, created);
    notifyListeners();
    return created;
  }

  Future<Map<String, dynamic>> exportReport(String reportId) =>
      repository.exportReport(reportId);

  Future<void> resetData() async {
    await repository.resetData();
    await loadData();
  }
}
