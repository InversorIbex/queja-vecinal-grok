"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/layout/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppShell>{children}</AppShell>
      <Toaster richColors position="top-center" closeButton />
      <PwaRegister />
    </ThemeProvider>
  );
}
