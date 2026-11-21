import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos recoge QuejasVecinales, para qué se usan y con quién se comparten.",
};

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
        Política de privacidad
      </h1>
      <p>Última actualización: 21 de noviembre de 2026.</p>
      <p>
        QuejasVecinales es un servicio para contar problemas de la calle. La web y la app de
        Android usan los mismos datos. Esta página explica qué se guarda y para qué.
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Quién es el responsable
      </h2>
      <p>
        El responsable es quien publica QuejasVecinales. Para pedir acceso, rectificación o
        supresión, escribe al correo del desarrollador que figura en Google Play e indica el
        código de seguimiento de la queja, si lo tienes.
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Qué datos se recogen
      </h2>
      <p>Al usar el servicio se pueden guardar estos datos:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          El texto de la queja: título, descripción, categoría y, si hace falta, el detalle de
          «Otra cosa».
        </li>
        <li>
          El punto del problema: coordenadas, calle, barrio y municipio cuando se pueden
          identificar, y un enlace al mapa.
        </li>
        <li>
          Al menos una foto, y hasta cuatro. Si el almacén de imágenes no la acepta, la foto se
          guarda junto con la queja.
        </li>
        <li>
          La ubicación del teléfono en el momento de publicar, votar o comentar. Sirve para
          colocar el punto y para comprobar, a 1 km, si la queja sigue o ya está arreglada. No se
          publica un marcador de dónde estás tú.
        </li>
        <li>
          Un apodo anónimo creado en el dispositivo. No hace falta cuenta ni nombre real.
        </li>
        <li>Un correo de respuesta, solo si lo escribes. Es opcional.</li>
        <li>
          Comentarios, votos y el código de seguimiento. La dirección IP se usa un momento para
          limitar abusos y no se guarda como un perfil.
        </li>
        <li>
          Si activas los avisos, el identificador de notificaciones de ese dispositivo.
        </li>
      </ul>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Para qué se usan
      </h2>
      <p>
        Los datos sirven para publicar la queja, localizarla, moderarla y, si procede, enviarla a
        la administración competente: ayuntamiento, diputación, comunidad autónoma o Gobierno. El
        correo a la administración incluye el texto, el sitio, el enlace al mapa y las fotos con
        enlace público. El correo de respuesta solo se incluye si lo dejaste.
      </p>
      <p>
        La calle y el barrio se obtienen a partir de las coordenadas del punto. Esa consulta se
        hace para que la queja sea más fácil de encontrar, no para seguirte.
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Con quién se comparten
      </h2>
      <p>Los datos se comparten solo para prestar el servicio:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>La base de datos del proyecto, donde se guardan las quejas.</li>
        <li>El almacén de imágenes, donde se guardan las fotos aceptadas.</li>
        <li>
          La administración a la que el moderador envía la queja, y el servicio de correo usado
          para ese envío.
        </li>
        <li>
          Quien consulte el mapa o la ficha pública ve el texto, el punto, las fotos y el apodo.
          El correo de respuesta no se muestra en la ficha pública.
        </li>
      </ul>
      <p>No se venden los datos ni se usan para publicidad de terceros.</p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Cuánto tiempo se conservan
      </h2>
      <p>
        La queja, las fotos y los comentarios se conservan mientras el problema siga publicado o
        haga falta para el seguimiento. Puedes pedir que se borre una queja tuya indicando el
        código de seguimiento. El apodo permanece en tu dispositivo hasta que borras los datos del
        navegador o de la app.
      </p>

      <h2 className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
        Tus opciones
      </h2>
      <p>
        La ubicación y las fotos se piden porque sin ellas la queja no se puede enviar. El correo
        de respuesta y los avisos son opcionales. Puedes dejar de usar el servicio cuando quieras.
      </p>

      <p className="flex flex-wrap gap-4">
        <Link href="/estandares-seguridad" className="font-semibold text-sky-700">
          Estándares de seguridad infantil
        </Link>
        <Link href="/" className="font-semibold text-sky-700">
          Volver al mapa
        </Link>
      </p>
    </article>
  );
}
