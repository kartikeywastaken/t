import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:crimenet_flutter/main.dart';
import 'package:crimenet_flutter/models/case_model.dart';
import 'package:crimenet_flutter/providers/auth_provider.dart';
import 'package:crimenet_flutter/providers/intelligence_provider.dart';
import 'package:crimenet_flutter/providers/theme_provider.dart';
import 'package:crimenet_flutter/services/intelligence_repo.dart';

void main() {
  group('CrimeNet core models', () {
    test('CaseModel json serialization', () {
      final model = const CaseModel(
        id: 'CR-999',
        title: 'Test Operation',
        status: 'active',
        priority: 'high',
        summary: 'Test summary',
        entityCount: 5,
        updated: 'Just now',
      );
      final json = model.toJson();
      expect(json['id'], 'CR-999');
      expect(json['title'], 'Test Operation');

      final fromJson = CaseModel.fromJson(json);
      expect(fromJson.id, 'CR-999');
      expect(fromJson.status, 'active');
    });
  });

  testWidgets('CrimeNetApp smoke test', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final repository = IntelligenceRepository();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          Provider<IntelligenceRepository>.value(value: repository),
          ChangeNotifierProvider(
            create: (_) => AuthProvider(repository: repository),
          ),
          ChangeNotifierProvider(
            create: (_) => IntelligenceProvider(repository: repository),
          ),
        ],
        child: const CrimeNetApp(),
      ),
    );

    await tester.pump();
    expect(find.text('CRIMENET'), findsWidgets);
  });
}
