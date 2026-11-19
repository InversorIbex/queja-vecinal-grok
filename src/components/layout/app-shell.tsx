"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Plus,
  TrendingUp,
  Trophy,
  User,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useIsDesktop, useIsLandscape } from "@/hooks/use-media-query";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DemoBanner } from "@/components/layout/demo-banner";

const NAV = [
  { href: "/", label: "Mapa", icon: Map },
  { href: "/impacto", label: "Impacto", icon: TrendingUp },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const isLandscape = useIsLandscape();
  const [open, setOpen] = useState(false);
  const hideChrome =
    pathname.startsWith("/onboarding") || pathname.startsWith("/admin");

  if (hideChrome) {
    return <>{children}</>;
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="qv-shell flex min-h-dvh flex-col lg:flex-row">
      {/* Desktop / wide sidebar */}
      {isDesktop && (
        <aside className="sticky top-0 z-40 flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 px-4 py-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
          <Link href="/" className="mb-8 px-2">
            <span className="font-display text-2xl font-bold tracking-tight text-sky-700 dark:text-sky-400">
              {APP_NAME}
            </span>
            <p className="mt-1 text-xs text-slate-500">
              Móvil + web · una sola verdad
            </p>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <Link
              href="/quejas/nueva"
              className="mt-2 flex items-center gap-3 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Plus className="h-5 w-5" />
              Subir Queja
            </Link>
            <Link
              href="/admin"
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </nav>
          <div className="mt-4 px-2">
            <ThemeToggle />
          </div>
        </aside>
      )}

      {/* Mobile top bar */}
      {!isDesktop && (
        <header
          className={cn(
            "sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85",
            isLandscape ? "h-12" : "h-14"
          )}
        >
          <Link href="/" className="font-display text-lg font-bold text-sky-700 dark:text-sky-400">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Menú"
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {!isDesktop && open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white p-5 shadow-xl dark:bg-slate-950"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-xl font-bold text-sky-700 dark:text-sky-400">
                  Menú
                </span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium"
                >
                  <Icon className="h-5 w-5 text-sky-600" />
                  {label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500"
              >
                <Shield className="h-4 w-4" />
                Panel admin
              </Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <DemoBanner />
        <main
          className={cn(
            "flex-1",
            !isDesktop && "pb-24",
            !isDesktop && isLandscape && "pb-16"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav + FAB */}
      {!isDesktop && (
        <>
          <nav
            className={cn(
              "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90",
              isLandscape ? "h-14" : "h-[4.5rem]",
              "safe-bottom"
            )}
          >
            <ul className="mx-auto flex h-full max-w-lg items-center justify-around px-2">
              {NAV.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium",
                      isActive(href)
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-slate-500"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isLandscape && "h-4 w-4")} />
                    {!isLandscape && label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/quejas/nueva"
            aria-label="Subir Queja"
            className={cn(
              "fixed z-50 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-95",
              isLandscape
                ? "bottom-16 right-4 h-12 w-12"
                : "bottom-24 right-4 h-14 w-14"
            )}
          >
            <Plus className="h-7 w-7" />
          </Link>
        </>
      )}
    </div>
  );
}
