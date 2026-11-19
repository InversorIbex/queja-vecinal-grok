import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../providers/app_state.dart';
import '../widgets/demo_banner.dart';
import 'create_complaint_screen.dart';
import 'feed_screen.dart';
import 'map_screen.dart';
import 'profile_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _destinations = [
    (icon: Icons.view_list_outlined, selected: Icons.view_list, label: 'Feed'),
    (icon: Icons.map_outlined, selected: Icons.map, label: 'Mapa'),
    (icon: Icons.person_outline, selected: Icons.person, label: 'Perfil'),
  ];

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final pages = [
      const FeedScreen(),
      const MapScreen(),
      const ProfileScreen(),
    ];

    if (wide) {
      return Scaffold(
        body: Column(
          children: [
            const DemoBanner(),
            Expanded(
              child: Row(
                children: [
                  NavigationRail(
                    selectedIndex: _index,
                    onDestinationSelected: (i) => setState(() => _index = i),
                    labelType: NavigationRailLabelType.all,
                    leading: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        appName,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    destinations: [
                      for (final d in _destinations)
                        NavigationRailDestination(
                          icon: Icon(d.icon),
                          selectedIcon: Icon(d.selected),
                          label: Text(d.label),
                        ),
                    ],
                  ),
                  const VerticalDivider(width: 1),
                  Expanded(child: pages[_index]),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: _fab(context),
      );
    }

    return Scaffold(
      body: Column(
        children: [
          const DemoBanner(),
          Expanded(child: pages[_index]),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          for (final d in _destinations)
            NavigationDestination(
              icon: Icon(d.icon),
              selectedIcon: Icon(d.selected),
              label: d.label,
            ),
        ],
      ),
      floatingActionButton: _fab(context),
    );
  }

  Widget _fab(BuildContext context) {
    return FloatingActionButton.extended(
      onPressed: () async {
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const CreateComplaintScreen()),
        );
        if (context.mounted) context.read<AppState>().refreshComplaints();
      },
      icon: const Icon(Icons.add_location_alt_outlined),
      label: const Text('Subir Queja'),
    );
  }
}
