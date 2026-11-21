import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad",
};

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
        Privacidad
      </h1>
      <p>
        QuejasVecinales sirve para contar un problema en la calle. La web y la app de Android
        usan los mismos datos.
      </p>
      <p>
        La ubicación del teléfono se usa para colocar el punto y, si estás a 1 km, para decir si
        la queja sigue o ya está arreglada. No se publica un marcador de dónde estás tú.
      </p>
      <p>
        Cada queja lleva al menos una foto. La imagen se guarda en Cloudinary y puede verse en la
        ficha y en el correo que el moderador envía a la administración. El texto de la queja se
        guarda en la base de datos del proyecto.
      </p>
      <p>
        El correo de respuesta es opcional. El apodo se crea en el propio dispositivo. No hay
        cuenta obligatoria.
      </p>
      <p>
        <Link href="/" className="font-semibold text-sky-700">
          Volver al mapa
        </Link>
      </p>
    </article>
  );
}
