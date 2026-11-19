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

  Future<GeoPosition> getCurrentPosition({bool allowDemoFallback = true}) async {
    final ok = await ensurePermission();
    if (!ok) {
      if (allowDemoFallback) return demoCenter;
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
    } catch (_) {
      if (allowDemoFallback) return demoCenter;
      rethrow;
    }
  }
}
