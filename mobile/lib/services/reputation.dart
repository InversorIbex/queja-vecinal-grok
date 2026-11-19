import '../config/constants.dart';
import '../models/models.dart';

ReputationLevel levelFromPoints(int points) {
  var level = ReputationLevel.novato;
  for (final t in reputationThresholds) {
    if (points >= t.min) level = t.level;
  }
  return level;
}

({ReputationLevel current, ReputationLevel? next, int remaining, double progress})
    nextLevelInfo(int points) {
  final current = levelFromPoints(points);
  final idx = reputationThresholds.indexWhere((t) => t.level == current);
  if (idx < 0 || idx >= reputationThresholds.length - 1) {
    return (current: current, next: null, remaining: 0, progress: 100);
  }
  final next = reputationThresholds[idx + 1];
  final prevMin = reputationThresholds[idx].min;
  final span = next.min - prevMin;
  final progress = ((points - prevMin) / span * 100).clamp(0, 100).toDouble();
  return (
    current: current,
    next: next.level,
    remaining: (next.min - points).clamp(0, next.min),
    progress: progress,
  );
}
