"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("qv_onboarded");
    if (!done) {
      router.replace("/onboarding");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-[50dvh] items-center justify-center text-sm text-slate-500">
        Cargando…
      </div>
    );
  }
  return <>{children}</>;
}
