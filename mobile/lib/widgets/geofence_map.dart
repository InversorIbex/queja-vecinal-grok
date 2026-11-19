import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../models/models.dart';

class GeofenceMap extends StatelessWidget {
  const GeofenceMap({
    super.key,
    required this.center,
    this.markers = const [],
    this.showGeofence = true,
    this.height = 280,
    this.onTap,
    this.interactive = true,
  });

  final GeoPosition center;
  final List<ComplaintMapMarker> markers;
  final bool showGeofence;
  final double height;
  final void Function(LatLng)? onTap;
  final bool interactive;

  @override
  Widget build(BuildContext context) {
    final c = LatLng(center.lat, center.lng);
    return SizedBox(
      height: height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: FlutterMap(
          options: MapOptions(
            initialCenter: c,
            initialZoom: 12.2,
            interactionOptions: InteractionOptions(
              flags: interactive
                  ? InteractiveFlag.all
                  : InteractiveFlag.none,
            ),
            onTap: onTap == null ? null : (_, p) => onTap!(p),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'es.quejasvecinales.app',
            ),
            if (showGeofence)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: c,
                    radius: maxDistanceM,
                    useRadiusInMeter: true,
                    color: QvColors.trust.withOpacity(0.12),
                    borderColor: QvColors.trust.withOpacity(0.55),
                    borderStrokeWidth: 2,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                if (showGeofence)
                  Marker(
                    point: c,
                    width: 36,
                    height: 36,
                    child: const Icon(Icons.my_location, color: QvColors.trust),
                  ),
                ...markers.map(
                  (m) => Marker(
                    point: LatLng(m.lat, m.lng),
                    width: 40,
                    height: 40,
                    child: GestureDetector(
                      onTap: m.onTap,
                      child: Icon(
                        Icons.location_on,
                        color: m.resolved ? QvColors.resolved : QvColors.alert,
                        size: 36,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ComplaintMapMarker {
  const ComplaintMapMarker({
    required this.lat,
    required this.lng,
    this.resolved = false,
    this.onTap,
  });

  final double lat;
  final double lng;
  final bool resolved;
  final VoidCallback? onTap;
}
