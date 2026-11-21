"use client";

import { useParams } from "next/navigation";
import { SeguimientoPanel } from "@/components/complaints/seguimiento-panel";

export default function SeguimientoCodePage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  return <SeguimientoPanel initialCode={code} />;
}
