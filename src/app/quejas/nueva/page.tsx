import type { Metadata } from "next";
import { CreateComplaintForm } from "@/components/complaints/create-form";

export const metadata: Metadata = {
  title: "Subir Queja",
};

export default function NuevaQuejaPage() {
  return <CreateComplaintForm />;
}
