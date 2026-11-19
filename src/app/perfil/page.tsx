"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, UserRound } from "lucide-react";
import { toast } from "sonner";
import { getOrCreateNickname } from "@/lib/utils";
import { nextLevelInfo } from "@/lib/reputation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PerfilPage() {
  const [nick, setNick] = useState("");
  const [pushOk, setPushOk] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const points = 88;
  const info = nextLevelInfo(points);

  useEffect(() => {
    setNick(getOrCreateNickname());
    void fetch("/api/push")
      .then((r) => r.json())
      .then((d) => setPushConfigured(Boolean(d.configured)));
  }, []);

  async function togglePush() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Este navegador no soporta notificaciones push");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Permiso denegado");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    let subscription: PushSubscription | null = null;
    if (pushConfigured && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
    }
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, nickname: nick }),
    });
    const data = await res.json();
    setPushOk(true);
    toast.message(data.message);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 sm:p-8">
      <h1 className="font-display text-3xl font-bold">Perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-sky-600" />
            {nick || "…"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{info.current}</Badge>
            <Badge variant="outline">{points} puntos</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Nick anónimo guardado en este dispositivo. Con Supabase Auth (email /
            Google / anónimo) el perfil se sincroniza entre móvil y web.
          </p>
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Progreso</span>
              <span>
                {info.next
                  ? `${info.remaining} pts → ${info.next}`
                  : "Nivel máximo"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${info.progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificaciones Web Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            {pushConfigured
              ? "VAPID configurado — puedes suscribirte."
              : "Stub: sin claves VAPID. La suscripción se guarda en modo demo."}
          </p>
          <Button onClick={() => void togglePush()} variant={pushOk ? "success" : "default"}>
            {pushOk ? (
              <>
                <Bell className="h-4 w-4" /> Activadas
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" /> Activar avisos
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
