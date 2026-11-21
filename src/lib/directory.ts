import type { AdminLevel, ComplaintCategory } from "@/types";

/**
 * Buzones publicados por la propia administración.
 * Si no hay correo, el nombre y la web sí se rellenan: el admin pega el buzón
 * una vez y las siguientes quejas de ese territorio salen solas.
 */

export interface Office {
  name: string;
  email?: string;
  web?: string;
}

export function foldPlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CCAA: Record<string, Office> = {
  madrid: {
    name: "Comunidad de Madrid",
    email: "atencionalciudadano@012.madrid.org",
    web: "https://www.comunidad.madrid/atencion-ciudadano",
  },
  galicia: {
    name: "Xunta de Galicia",
    email: "012@xunta.gal",
    web: "https://www.xunta.gal",
  },
  andalucia: {
    name: "Junta de Andalucía",
    web: "https://www.juntadeandalucia.es",
  },
  cataluna: {
    name: "Generalitat de Catalunya",
    web: "https://web.gencat.cat",
  },
  valencia: {
    name: "Generalitat Valenciana",
    web: "https://www.gva.es",
  },
  euskadi: {
    name: "Gobierno Vasco",
    web: "https://www.euskadi.eus",
  },
  cyl: {
    name: "Junta de Castilla y León",
    web: "https://www.jcyl.es",
  },
  clm: {
    name: "Junta de Comunidades de Castilla-La Mancha",
    web: "https://www.castillalamancha.es",
  },
  murcia: {
    name: "Región de Murcia",
    web: "https://www.carm.es",
  },
  extremadura: {
    name: "Junta de Extremadura",
    web: "https://www.juntaex.es",
  },
  aragon: {
    name: "Gobierno de Aragón",
    web: "https://www.aragon.es",
  },
  asturias: {
    name: "Gobierno del Principado de Asturias",
    web: "https://www.asturias.es",
  },
  baleares: {
    name: "Govern de les Illes Balears",
    web: "https://www.caib.es",
  },
  canarias: {
    name: "Gobierno de Canarias",
    web: "https://www.gobiernodecanarias.org",
  },
  cantabria: {
    name: "Gobierno de Cantabria",
    web: "https://www.cantabria.es",
  },
  navarra: {
    name: "Gobierno de Navarra",
    web: "https://www.navarra.es",
  },
  rioja: {
    name: "Gobierno de La Rioja",
    web: "https://www.larioja.org",
  },
  ceuta: { name: "Ciudad de Ceuta", web: "https://www.ceuta.es" },
  melilla: { name: "Ciudad de Melilla", web: "https://www.melilla.es" },
};

const CCAA_ALIASES: [string, string][] = [
  ["castilla y leon", "cyl"],
  ["castilla la mancha", "clm"],
  ["pais vasco", "euskadi"],
  ["euskadi", "euskadi"],
  ["vasco", "euskadi"],
  ["catalunya", "cataluna"],
  ["cataluna", "cataluna"],
  ["catalonia", "cataluna"],
  ["valenciana", "valencia"],
  ["balear", "baleares"],
  ["canaria", "canarias"],
  ["asturias", "asturias"],
  ["navarra", "navarra"],
  ["rioja", "rioja"],
  ["murcia", "murcia"],
  ["extremadura", "extremadura"],
  ["andaluc", "andalucia"],
  ["aragon", "aragon"],
  ["cantabria", "cantabria"],
  ["galicia", "galicia"],
  ["madrid", "madrid"],
  ["ceuta", "ceuta"],
  ["melilla", "melilla"],
];

const DIPUTACIONES: Record<string, Office> = {
  "a coruna": {
    name: "Diputación de A Coruña",
    email: "rexistro.informacion@dacoruna.gal",
    web: "https://www.dacoruna.gal",
  },
  coruna: {
    name: "Diputación de A Coruña",
    email: "rexistro.informacion@dacoruna.gal",
    web: "https://www.dacoruna.gal",
  },
  "la coruna": {
    name: "Diputación de A Coruña",
    email: "rexistro.informacion@dacoruna.gal",
    web: "https://www.dacoruna.gal",
  },
};

const STATE_OFFICES: Partial<Record<ComplaintCategory, Office>> = {
  carreteras_estatales: {
    name: "Ministerio de Transportes y Movilidad Sostenible",
    web: "https://www.transportes.gob.es",
  },
  costas: {
    name: "Ministerio para la Transición Ecológica y el Reto Demográfico",
    web: "https://www.miteco.gob.es",
  },
};

const STATE_DEFAULT: Office = {
  name: "Administración General del Estado",
  web: "https://administracion.gob.es",
};

export function ccaaKeyFrom(raw: string): string | null {
  const folded = foldPlace(raw);
  if (!folded) return null;
  for (const [needle, key] of CCAA_ALIASES) {
    if (folded.includes(needle)) return key;
  }
  return null;
}

export function ccaaOffice(raw: string): Office | null {
  const key = ccaaKeyFrom(raw);
  if (!key) return null;
  return CCAA[key] ?? null;
}

export interface RoutedOffice {
  name: string;
  email: string | null;
  web: string | null;
  key: string;
}

export function directoryOffice(input: {
  level: AdminLevel;
  category: ComplaintCategory;
  municipio: string;
  provincia: string;
  comunidad: string;
}): RoutedOffice {
  if (input.level === "ayuntamiento") {
    const place = input.municipio.trim();
    const key = `ayto:${foldPlace(place) || "desconocido"}`;
    return {
      key,
      name: place ? `Ayuntamiento de ${place}` : "Ayuntamiento (municipio sin identificar)",
      email: null,
      web: null,
    };
  }

  if (input.level === "provincia") {
    const place = input.provincia.trim() || input.comunidad.trim();
    const folded = foldPlace(place);
    const known = DIPUTACIONES[folded];
    return {
      key: `dip:${folded || "desconocida"}`,
      name: known?.name ?? (place ? `Diputación de ${place}` : "Diputación provincial"),
      email: known?.email ?? null,
      web: known?.web ?? null,
    };
  }

  if (input.level === "comunidad") {
    const office = ccaaOffice(input.comunidad) ?? ccaaOffice(input.provincia);
    const keyName = ccaaKeyFrom(input.comunidad) ?? (foldPlace(input.comunidad) || "desconocida");
    return {
      key: `ccaa:${keyName}`,
      name: office?.name ?? (input.comunidad ? `Gobierno de ${input.comunidad}` : "Comunidad autónoma"),
      email: office?.email ?? null,
      web: office?.web ?? null,
    };
  }

  const office = STATE_OFFICES[input.category] ?? STATE_DEFAULT;
  return {
    key: `estado:${input.category}`,
    name: office.name,
    email: office.email ?? null,
    web: office.web ?? null,
  };
}
