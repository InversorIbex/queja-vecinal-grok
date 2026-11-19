import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../config/constants.dart';
import '../config/theme.dart';
import '../models/models.dart';

class ComplaintCard extends StatelessWidget {
  const ComplaintCard({
    super.key,
    required this.complaint,
    this.distanceM,
    this.onTap,
  });

  final Complaint complaint;
  final double? distanceM;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final cat = categories[complaint.category]!;
    final date = DateFormat('d MMM', 'es').format(complaint.createdAt);
    final statusColor = switch (complaint.status) {
      ComplaintStatus.resolved => QvColors.resolved,
      ComplaintStatus.approved => QvColors.trust,
      ComplaintStatus.pending => QvColors.alert,
      ComplaintStatus.rejected => Colors.grey,
    };

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Color(cat.color),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    cat.label,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: Color(cat.color),
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
                Text(
                  statusLabels[complaint.status]!,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              complaint.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              complaint.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withOpacity(0.72),
                  ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.thumb_up_alt_outlined,
                    size: 14, color: QvColors.trust),
                const SizedBox(width: 4),
                Text('${complaint.votesReal}'),
                const SizedBox(width: 12),
                Icon(Icons.thumb_down_alt_outlined,
                    size: 14, color: QvColors.alert),
                const SizedBox(width: 4),
                Text('${complaint.votesFake}'),
                const SizedBox(width: 12),
                Icon(Icons.check_circle_outline,
                    size: 14, color: QvColors.resolved),
                const SizedBox(width: 4),
                Text('${complaint.votesResolved}'),
                const Spacer(),
                if (distanceM != null)
                  Text(
                    distanceM! < 1000
                        ? '${distanceM!.round()} m'
                        : '${(distanceM! / 1000).toStringAsFixed(1)} km',
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                const SizedBox(width: 8),
                Text(date, style: Theme.of(context).textTheme.labelSmall),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
