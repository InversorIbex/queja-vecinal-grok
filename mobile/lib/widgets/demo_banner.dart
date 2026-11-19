import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/theme.dart';
import '../providers/app_state.dart';

class DemoBanner extends StatelessWidget {
  const DemoBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final demo = context.watch<AppState>().demoMode;
    if (!demo) return const SizedBox.shrink();
    return Material(
      color: QvColors.alert.withOpacity(0.15),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              const Icon(Icons.science_outlined, color: QvColors.alert, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Modo demo: sin Supabase. Los datos no se sincronizan con la web.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: QvColors.alert,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
