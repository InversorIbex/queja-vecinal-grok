import 'dart:convert';
import 'dart:io';

import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';

import '../config/constants.dart';
import '../config/env.dart';

class PhotoService {
  final _picker = ImagePicker();

  Future<List<XFile>> pickPhotos({int remaining = maxPhotos}) async {
    if (remaining <= 0) return [];
    final files = await _picker.pickMultiImage(
      imageQuality: 85,
      maxWidth: 1600,
    );
    return files.take(remaining).toList();
  }

  Future<XFile?> takePhoto() => _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1600,
      );

  /// Comprime ≤800 KB y sube a Cloudinary si hay preset; si no, data URL / path local.
  Future<String> processAndUpload(XFile file) async {
    final compressed = await _compress(file);
    if (Env.hasCloudinary) {
      return _uploadCloudinary(compressed);
    }
    // Demo / sin Cloudinary: data URL corta o path
    final bytes = await compressed.readAsBytes();
    if (bytes.lengthInBytes > 200 * 1024) {
      return compressed.path;
    }
    final b64 = base64Encode(bytes);
    final mime = compressed.mimeType ?? 'image/jpeg';
    return 'data:$mime;base64,$b64';
  }

  Future<XFile> _compress(XFile file) async {
    final dir = await getTemporaryDirectory();
    final target =
        '${dir.path}/qv_${DateTime.now().millisecondsSinceEpoch}.jpg';
    var quality = 80;
    XFile? out;
    while (quality >= 30) {
      final result = await FlutterImageCompress.compressAndGetFile(
        file.path,
        target,
        quality: quality,
        minWidth: 1280,
        minHeight: 1280,
      );
      if (result == null) break;
      final len = await result.length();
      out = result;
      if (len <= maxPhotoBytes) break;
      quality -= 15;
    }
    return out ?? file;
  }

  Future<String> _uploadCloudinary(XFile file) async {
    final uri = Uri.parse(
      'https://api.cloudinary.com/v1_1/${Env.cloudinaryCloudName}/image/upload',
    );
    final req = http.MultipartRequest('POST', uri)
      ..fields['upload_preset'] = Env.cloudinaryUploadPreset
      ..files.add(await http.MultipartFile.fromPath('file', file.path));
    final res = await req.send();
    final body = await res.stream.bytesToString();
    if (res.statusCode >= 300) {
      throw Exception('Error Cloudinary (${res.statusCode}): $body');
    }
    final json = jsonDecode(body) as Map<String, dynamic>;
    return json['secure_url'] as String;
  }

  Future<bool> fileExists(String path) async {
    if (path.startsWith('http') || path.startsWith('data:')) return true;
    return File(path).exists();
  }
}
