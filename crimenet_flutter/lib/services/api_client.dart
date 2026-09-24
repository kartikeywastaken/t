import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  String baseUrl;
  final Duration timeout;
  String? authToken;

  ApiClient({
    this.baseUrl = 'https://t-production-80a2.up.railway.app',
    this.timeout = const Duration(seconds: 15),
  });

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  dynamic _decode(http.Response response, String operation) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    }
    var detail = response.body;
    try {
      final body = jsonDecode(response.body);
      detail = body is Map
          ? (body['detail']?.toString() ?? response.body)
          : response.body;
    } catch (_) {}
    throw Exception('$operation failed: $detail');
  }

  Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.get(uri, headers: _headers).timeout(timeout);
    return _decode(response, 'GET $endpoint');
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http
        .post(uri, headers: _headers, body: jsonEncode(data))
        .timeout(timeout);
    return _decode(response, 'POST $endpoint');
  }

  Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http
        .put(uri, headers: _headers, body: jsonEncode(data))
        .timeout(timeout);
    return _decode(response, 'PUT $endpoint');
  }

  Future<dynamic> delete(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.delete(uri, headers: _headers).timeout(timeout);
    return _decode(response, 'DELETE $endpoint');
  }
}
