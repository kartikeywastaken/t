class ReportModel {
  final String id;
  final String title;
  final String caseId;
  final String author;
  final String date;
  final String type;
  final String status;

  const ReportModel({
    required this.id,
    required this.title,
    required this.caseId,
    required this.author,
    required this.date,
    required this.type,
    required this.status,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) => ReportModel(
    id: json['id']?.toString() ?? '',
    title: json['title']?.toString() ?? 'Intelligence Report',
    caseId: json['caseId']?.toString() ?? 'All',
    author: json['author']?.toString() ?? '',
    date: json['date']?.toString() ?? '',
    type: json['type']?.toString() ?? '',
    status: json['status']?.toString() ?? 'Finalized',
  );
}
