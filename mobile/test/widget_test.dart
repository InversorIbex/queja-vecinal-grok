import 'package:flutter_test/flutter_test.dart';
import 'package:quejas_vecinales/config/constants.dart';

void main() {
  test('Constantes de negocio', () {
    expect(appName, 'QuejasVecinales');
    expect(maxDistanceM, 10000);
    expect(maxPhotos, 4);
    expect(categories.length, 7);
  });
}
