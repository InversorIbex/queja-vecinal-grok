import type { Metadata } from "next";
import { ComplaintDetail } from "@/components/complaints/detail-view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Queja ${id}`,
    openGraph: {
      title: `Queja en QuejasVecinales`,
      description:
        "Consulta y vota esta queja vecinal (≤10 km). Ubicación pública aproximada — sin GPS exacto.",
    },
  };
}

export default async function QuejaPage({ params }: Props) {
  const { id } = await params;
  return <ComplaintDetail id={id} />;
}
