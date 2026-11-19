import 'package:flutter_test/flutter_test.dart';
import 'package:quejas_vecinales/models/models.dart';
import 'package:quejas_vecinales/services/geo_service.dart';

void main() {
  test('Haversine: mismo punto = 0 m', () {
    const p = GeoPosition(lat: 40.4168, lng: -3.7038);
    expect(haversineMeters(p, p), closeTo(0, 0.01));
  });

  test('within10km: punto cercano en Madrid', () {
    const a = GeoPosition(lat: 40.4168, lng: -3.7038);
    const b = GeoPosition(lat: 40.42, lng: -3.70);
    expect(within10km(a, b), isTrue);
  });

  test('within10km: Barcelona desde Madrid > 10 km', () {
    const madrid = GeoPosition(lat: 40.4168, lng: -3.7038);
    const bcn = GeoPosition(lat: 41.3874, lng: 2.1686);
    expect(within10km(madrid, bcn), isFalse);
    final check = assertWithin10km(madrid, bcn, action: 'votar');
    expect(check.ok, isFalse);
    expect(check.message, contains('10 km'));
  });
}
