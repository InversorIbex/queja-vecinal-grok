import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../models/models.dart';
import '../providers/app_state.dart';
import '../widgets/geofence_map.dart';
import 'complaint_detail_screen.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final center = state.userPosition ?? demoCenter;
    final landscape = MediaQuery.orientationOf(context) == Orientation.landscape;

    final map = GeofenceMap(
      center: center,
      height: landscape
          ? MediaQuery.sizeOf(context).height - 120
          : MediaQuery.sizeOf(context).height * 0.55,
      markers: [
        for (final c in state.complaints)
          ComplaintMapMarker(
            lat: c.lat,
            lng: c.lng,
            resolved: c.status == ComplaintStatus.resolved,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ComplaintDetailScreen(complaintId: c.id),
              ),
            ),
          ),
      ],
    );

    final list = ListView.builder(
      itemCount: state.complaints.length,
      itemBuilder: (_, i) {
        final c = state.complaints[i];
        final d = state.distanceTo(c);
        return ListTile(
          leading: Icon(
            Icons.location_on,
            color: c.status == ComplaintStatus.resolved
                ? const Color(0xFF2A9D8F)
                : const Color(0xFFE85D04),
          ),
          title: Text(c.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text(
            d == null
                ? categories[c.category]!.label
                : '${categories[c.category]!.label} · ${(d / 1000).toStringAsFixed(1)} km',
          ),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ComplaintDetailScreen(complaintId: c.id),
            ),
          ),
        );
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mapa'),
        actions: [
          IconButton(
            onPressed: () => state.refreshLocation(),
            icon: const Icon(Icons.my_location),
          ),
        ],
      ),
      body: landscape
          ? Row(
              children: [
                Expanded(flex: 3, child: Padding(padding: const EdgeInsets.all(12), child: map)),
                Expanded(flex: 2, child: list),
              ],
            )
          : Column(
              children: [
                Padding(padding: const EdgeInsets.all(12), child: map),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Círculo azul = radio de 10 km desde tu ubicación'),
                  ),
                ),
                Expanded(child: list),
              ],
            ),
    );
  }
}
