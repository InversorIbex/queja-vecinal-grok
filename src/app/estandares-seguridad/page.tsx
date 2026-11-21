import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Estándares de seguridad infantil",
  description:
    "Estándares publicados de QuejasVecinales contra la explotación y el abuso sexual infantil (EASI / CSAE).",
};

export default function EstandaresSeguridadPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
        Estándares contra la explotación y el abuso sexual infantil
      </h1>
      <p>Última actualización: 21 de noviembre de 2026.</p>
      <p>
        Estos son los estándares publicados de la aplicación{" "}
        <strong>QuejasVecinales barrio</strong> (nombre en Google Play) y del servicio{" "}
        <strong>QuejasVecinales</strong>, paquete <strong>es.quejasvecinales.app</strong>. Cubren
        la web y la app de Android, que usan los mismos datos. Prohíben la explotación y el abuso
        sexual infantil (EASI), en inglés child sexual abuse and exploitation (CSAE), y el
        material de abuso sexual infantil, en inglés child sexual abuse material (CSAM).
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Qué está prohibido
      </h2>
      <p>
        QuejasVecinales sirve para señalar problemas de la calle: baches, basura, farolas,
        aceras y otros desperfectos del espacio público. No es un servicio para contactar con
        menores ni para intercambiar imágenes de personas.
      </p>
      <p>Queda prohibido crear, subir, pedir o difundir cualquier contenido o conducta que:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>explote, abuse o ponga en peligro sexual a una persona menor de edad;</li>
        <li>
          sea material de abuso sexual infantil (CSAM), incluidas fotos, vídeos o imágenes
          generadas por ordenador de un menor en una conducta sexual explícita;
        </li>
        <li>
          prepare o capte a un menor con fin sexual (grooming), lo chantajee con imágenes
          íntimas (sextortion) o lo ofrezca o trafique con fin sexual;
        </li>
        <li>sexualice a un menor o muestre a un menor de forma que facilite su explotación.</li>
      </ul>
      <p>
        Una foto de un menor en un contexto sexual no es una queja vecinal y no se publicará. Si
        una persona está en peligro inmediato, hay que avisar al 112 o a la policía, no usar esta
        web.
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Qué hacemos si aparece
      </h2>
      <p>
        Toda queja pasa por moderación antes de publicarse. Si tenemos conocimiento real de
        material de abuso sexual infantil o de una conducta de las descritas arriba:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>no se publica y, si ya estuviera visible, se retira;</li>
        <li>se bloquea a quien lo haya enviado, en la medida en que el servicio lo permita;</li>
        <li>
          se conserva solo lo imprescindible para la denuncia y se comunica a las Fuerzas y
          Cuerpos de Seguridad del Estado (Policía Nacional o Guardia Civil) o al Ministerio
          Fiscal, y, cuando la ley o Google Play lo exijan, al National Center for Missing &amp;
          Exploited Children (NCMEC) o a la autoridad equivalente.
        </li>
      </ul>
      <p>
        El servicio cumple la legislación española de protección de menores y las normas de
        Google Play sobre seguridad infantil. Estos estándares se aplican aunque la app no esté
        dirigida a niños.
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Cómo avisarnos
      </h2>
      <p>
        El punto de contacto de seguridad infantil es el correo del desarrollador que figura en
        la ficha de Google Play de QuejasVecinales barrio. Ese contacto puede atender un aviso de
        Google Play sobre contenido EASI / CSAE y actuar según estos estándares.
      </p>
      <p>
        Desde la app o la web, en Perfil, está el enlace a esta página y a la política de
        privacidad. Si ves una queja o un comentario que encaje en lo prohibido, escribe a ese
        correo e indica el código de seguimiento (QV-······) o el enlace de la ficha. No reenvíes
        el material.
      </p>

      <p className="flex flex-wrap gap-4">
        <Link href="/privacidad" className="font-semibold text-sky-700">
          Política de privacidad
        </Link>
        <Link href="/" className="font-semibold text-sky-700">
          Volver al mapa
        </Link>
      </p>
    </article>
  );
}
