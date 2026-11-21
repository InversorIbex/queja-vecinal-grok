import type { Metadata } from "next";
import { ComplaintDetail } from "@/components/complaints/detail-view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Queja ${id}`,
    openGraph: {
      title: `Queja en QuejasVecinales`,
      description: "Consulta la queja. Para decir si sigue o está arreglada hay que estar a 1 km.",
    },
  };
}

export default async function QuejaPage({ params }: Props) {
  const { id } = await params;
  return <ComplaintDetail id={id} />;
}
