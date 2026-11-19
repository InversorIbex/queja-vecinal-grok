import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../config/env.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../providers/app_state.dart';
import '../services/geo_service.dart';
import '../widgets/geofence_map.dart';

class CreateComplaintScreen extends StatefulWidget {
  const CreateComplaintScreen({super.key});

  @override
  State<CreateComplaintScreen> createState() => _CreateComplaintScreenState();
}

class _CreateComplaintScreenState extends State<CreateComplaintScreen> {
  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _desc = TextEditingController();
  ComplaintCategory _category = ComplaintCategory.bachesCarreteras;
  AdminLevel _admin = AdminLevel.ayuntamiento;
  final List<XFile> _photos = [];
  bool _busy = false;
  String? _photoNote;
  GeoPosition? _pin;

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  Future<void> _addPhotos() async {
    final state = context.read<AppState>();
    final picked =
        await state.photos.pickPhotos(remaining: maxPhotos - _photos.length);
    setState(() => _photos.addAll(picked));
  }

  void _onMapTap(LatLng p, GeoPosition device) {
    final next = GeoPosition(lat: p.latitude, lng: p.longitude);
    final check = assertWithin10km(device, next, action: 'ubicar la queja');
    if (!check.ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(check.message ?? 'Fuera del radio de 10 km')),
      );
      return;
    }
    setState(() => _pin = next);
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    final state = context.read<AppState>();
    try {
      await state.refreshLocation();
      final device = state.userPosition ?? demoCenter;
      final pin = _pin ?? device;
      final urls = <String>[];
      for (final p in _photos) {
        urls.add(await state.photos.processAndUpload(p));
      }
      if (!Env.hasCloudinary && urls.isNotEmpty) {
        _photoNote =
            'Sin Cloudinary: las fotos se guardan localmente / data URL (demo).';
      }
      final c = await state.createComplaint(
        title: _title.text.trim(),
        description: _desc.text.trim(),
        category: _category,
        adminLevel: _admin,
        photoUrls: urls,
        pin: pin,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Queja enviada (${c.id.substring(0, 8)}…). Pin público ofuscado (~20 km). Pendiente de moderación.',
          ),
        ),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final device = state.userPosition ?? demoCenter;
    final pin = _pin ?? device;
    final landscape =
        MediaQuery.orientationOf(context) == Orientation.landscape;

    Widget mapBlock({required double height}) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: GeofenceMap(
                center: device,
                height: height,
                markers: [
                  ComplaintMapMarker(
                    lat: pin.lat,
                    lng: pin.lng,
                  ),
                ],
                onTap: (p) => _onMapTap(p, device),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'GPS (azul, no se guarda) · Toca el mapa para el pin del problema (≤10 km). '
              'El pin público se ofusca (~${(locationPrivacyRadiusM * 2 / 1000).toStringAsFixed(0)} km diámetro).',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        );

    final form = Form(
      key: _form,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Nueva queja', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'Valida tu GPS a ≤10 km del punto elegido. Tu ubicación exacta nunca se almacena ni se muestra (ni a SUPER_ADMIN).',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _title,
            decoration: const InputDecoration(
              labelText: 'Título',
              border: OutlineInputBorder(),
            ),
            maxLength: 120,
            validator: (v) =>
                (v == null || v.trim().length < 5) ? 'Mínimo 5 caracteres' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _desc,
            decoration: const InputDecoration(
              labelText: 'Descripción',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
            minLines: 4,
            maxLines: 8,
            maxLength: 2000,
            validator: (v) => (v == null || v.trim().length < 10)
                ? 'Mínimo 10 caracteres'
                : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<ComplaintCategory>(
            value: _category,
            decoration: const InputDecoration(
              labelText: 'Categoría',
              border: OutlineInputBorder(),
            ),
            items: [
              for (final e in categories.entries)
                DropdownMenuItem(value: e.key, child: Text(e.value.label)),
            ],
            onChanged: (v) => setState(() => _category = v!),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<AdminLevel>(
            value: _admin,
            decoration: const InputDecoration(
              labelText: 'Destino administrativo',
              border: OutlineInputBorder(),
            ),
            items: [
              for (final e in adminLevels.entries)
                DropdownMenuItem(value: e.key, child: Text(e.value)),
            ],
            onChanged: (v) => setState(() => _admin = v!),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text('Fotos (${_photos.length}/$maxPhotos)',
                  style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              TextButton.icon(
                onPressed: _photos.length >= maxPhotos ? null : _addPhotos,
                icon: const Icon(Icons.add_photo_alternate_outlined),
                label: const Text('Añadir'),
              ),
            ],
          ),
          if (_photos.isNotEmpty)
            SizedBox(
              height: 88,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        File(_photos[i].path),
                        width: 88,
                        height: 88,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 88,
                          height: 88,
                          color: QvColors.mist,
                          alignment: Alignment.center,
                          child: Text('${i + 1}'),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: IconButton(
                        iconSize: 18,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black54,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => setState(() => _photos.removeAt(i)),
                        icon: const Icon(Icons.close),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (_photoNote != null) ...[
            const SizedBox(height: 8),
            Text(_photoNote!, style: TextStyle(color: QvColors.alert)),
          ],
          if (!landscape) ...[
            const SizedBox(height: 16),
            SizedBox(height: 240, child: mapBlock(height: 220)),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Enviar queja'),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Subir Queja')),
      body: landscape
          ? Row(
              children: [
                Expanded(child: form),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text('GPS + pin del problema (≤10 km)',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        Expanded(child: mapBlock(height: 400)),
                      ],
                    ),
                  ),
                ),
              ],
            )
          : form,
    );
  }
}
