"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    icon: MapPin,
    title: "Reporta lo que ves",
    body: "Baches, farolas, basura… publica una queja desde el lugar, con fotos y sin registro obligatorio.",
  },
  {
    icon: ShieldCheck,
    title: "Solo vecinos cercanos",
    body: "Para crear, votar o comentar debes estar a ≤10 km. Así evitamos spam y reforzamos la confianza.",
  },
  {
    icon: Smartphone,
    title: "Móvil y web, siempre a punto",
    body: "Usa la PWA en el móvil o la web en el ordenador. Misma cuenta, mismos datos, sincronizados al instante.",
  },
];

export function OnboardingFlow() {
  const [i, setI] = useState(0);
  const router = useRouter();
  const slide = SLIDES[i];
  const Icon = slide.icon;

  function finish() {
    localStorage.setItem("qv_onboarded", "1");
    router.replace("/");
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-orange-50 px-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />

      <p className="font-display mb-2 text-3xl font-bold text-sky-700 dark:text-sky-400">
        {APP_NAME}
      </p>
      <p className="mb-10 text-sm text-slate-500">{APP_TAGLINE}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="flex max-w-md flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
            <Icon className="h-10 w-10" />
          </div>
          <h1 className="font-display text-2xl font-bold">{slide.title}</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{slide.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex gap-2">
        {SLIDES.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-8 bg-sky-600" : "w-2 bg-slate-300 dark:bg-slate-600"
            }`}
          />
        ))}
      </div>

      <div className="mt-8 flex w-full max-w-sm gap-3">
        {i < SLIDES.length - 1 ? (
          <>
            <Button variant="ghost" className="flex-1" onClick={finish}>
              Saltar
            </Button>
            <Button className="flex-1" onClick={() => setI((x) => x + 1)}>
              Siguiente
            </Button>
          </>
        ) : (
          <Button className="w-full" size="lg" onClick={finish}>
            Empezar
          </Button>
        )}
      </div>
    </div>
  );
}
