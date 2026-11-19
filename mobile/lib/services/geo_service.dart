import 'dart:math' as math;

import 'package:geolocator/geolocator.dart';

import '../config/constants.dart';
import '../models/models.dart';

const _earthRadiusM = 6371000.0;

double haversineMeters(GeoPosition a, GeoPosition b) {
  final dLat = _toRad(b.lat - a.lat);
  final dLng = _toRad(b.lng - a.lng);
  final lat1 = _toRad(a.lat);
  final lat2 = _toRad(b.lat);
  final h = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1) * math.cos(lat2) * math.sin(dLng / 2) * math.sin(dLng / 2);
  return 2 * _earthRadiusM * math.asin(math.min(1, math.sqrt(h)));
}

bool within10km(GeoPosition a, GeoPosition b) =>
    haversineMeters(a, b) <= maxDistanceM;

class GeoCheck {
  const GeoCheck._({
    required this.ok,
    required this.distanceM,
    this.message,
  });

  final bool ok;
  final double distanceM;
  final String? message;

  factory GeoCheck.ok(double distanceM) =>
      GeoCheck._(ok: true, distanceM: distanceM);

  factory GeoCheck.fail(double distanceM, String action) => GeoCheck._(
        ok: false,
        distanceM: distanceM,
        message:
            'Estás a ${(distanceM / 1000).toFixed(1)} km. Debes estar a ≤10 km para $action.',
      );
}

GeoCheck assertWithin10km(
  GeoPosition user,
  GeoPosition target, {
  String action = 'realizar esta acción',
}) {
  final d = haversineMeters(user, target);
  if (d > maxDistanceM) return GeoCheck.fail(d, action);
  return GeoCheck.ok(d);
}

/// Pin público ofuscado: punto uniforme en disco de radio ~10 km (diámetro ~20 km).
/// [seed] (p. ej. id de queja) hace el punto estable/reproducible.
GeoPosition obfuscateLocation(
  GeoPosition center, {
  String? seed,
  double radiusM = locationPrivacyRadiusM,
}) {
  final u = seed == null ? math.Random().nextDouble() : _seededUnit(seed, 0);
  final v = seed == null ? math.Random().nextDouble() : _seededUnit(seed, 1);
  final r = radiusM * math.sqrt(u);
  final theta = 2 * math.pi * v;
  final northM = r * math.cos(theta);
  final eastM = r * math.sin(theta);
  final dLat = (northM / _earthRadiusM) * (180 / math.pi);
  final cosLat = math.cos(center.lat * math.pi / 180);
  final dLng =
      (eastM / (_earthRadiusM * math.max(0.01, cosLat))) * (180 / math.pi);
  return GeoPosition(
    lat: (center.lat + dLat).clamp(-90.0, 90.0),
    lng: _wrapLng(center.lng + dLng),
  );
}

double _seededUnit(String seed, int lane) {
  var h = 0x811c9dc5 ^ (lane * 0x9e3779b9);
  for (final cu in seed.codeUnits) {
    h ^= cu;
    h = (h * 0x01000193) & 0xffffffff;
  }
  h ^= h >> 16;
  h = (h * 0x7feb352d) & 0xffffffff;
  h ^= h >> 15;
  h = (h * 0x846ca68b) & 0xffffffff;
  h ^= h >> 16;
  return (h & 0xffffffff) / 0x100000000;
}

double _wrapLng(double lng) {
  var x = ((lng + 180) % 360 + 360) % 360 - 180;
  if (x == -180) return 180;
  return x;
}

extension on double {
  String toFixed(int n) => toStringAsFixed(n);
}

double _toRad(double d) => d * math.pi / 180;

class GeoService {
  Future<bool> ensurePermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return false;
    }
    final enabled = await Geolocator.isLocationServiceEnabled();
    return enabled;
  }

  /// Device GPS only. Never invents a town (Madrid/etc.) — callers must
  /// treat a thrown error as "no position" so the 10 km circle is not misplaced.
  Future<GeoPosition> getCurrentPosition({
    bool allowDemoFallback = false,
  }) async {
    final ok = await ensurePermission();
    if (!ok) {
      if (allowDemoFallback) return mapDefaultCenter;
      throw Exception(
        'Permiso de ubicación denegado. Actívalo para crear o votar quejas.',
      );
    }
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      return GeoPosition(
        lat: pos.latitude,
        lng: pos.longitude,
        accuracy: pos.accuracy,
      );
    } catch (e) {
      if (allowDemoFallback) return mapDefaultCenter;
      rethrow;
    }
  }
}
