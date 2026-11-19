import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../providers/app_state.dart';
import '../widgets/complaint_card.dart';
import 'complaint_detail_screen.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: const Text(appName),
        actions: [
          IconButton(
            tooltip: 'Actualizar ubicación',
            onPressed: () => state.refreshLocation(),
            icon: const Icon(Icons.my_location),
          ),
          IconButton(
            tooltip: 'Recargar',
            onPressed: () => state.refreshComplaints(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: const Text('Todas'),
                    selected: state.filterCategory == null,
                    onSelected: (_) => state.setFilter(null),
                  ),
                ),
                for (final e in categories.entries)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(e.value.label),
                      selected: state.filterCategory == e.key,
                      onSelected: (_) => state.setFilter(e.key),
                    ),
                  ),
              ],
            ),
          ),
          if (state.error != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(state.error!, style: const TextStyle(color: Colors.red)),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: state.refreshComplaints,
              child: state.complaints.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(child: Text('No hay quejas públicas todavía.')),
                      ],
                    )
                  : ListView.separated(
                      itemCount: state.complaints.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final c = state.complaints[i];
                        return ComplaintCard(
                          complaint: c,
                          distanceM: state.distanceTo(c),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ComplaintDetailScreen(complaintId: c.id),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
