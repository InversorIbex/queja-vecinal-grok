/**
 * Filtro de insultos y tacos para quejas y comentarios.
 * El texto que sale hacia un ayuntamiento tiene que poder leerse en un registro oficial.
 */

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "€": "e",
};

const WORDS = new Set([
  "puta",
  "puto",
  "putos",
  "putas",
  "cabron",
  "cabrona",
  "cabrones",
  "cabronazo",
  "gilipollas",
  "gilipolla",
  "hijoputa",
  "hijaputa",
  "hdp",
  "subnormal",
  "retrasado",
  "retrasada",
  "imbecil",
  "idiota",
  "estupido",
  "estupida",
  "mamon",
  "mamona",
  "capullo",
  "capulla",
  "zorra",
  "maricon",
  "maricona",
  "marica",
  "cono",
  "joder",
  "mierda",
  "hostia",
  "ostia",
  "polla",
  "pollas",
  "cojones",
  "cojon",
  "follar",
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "pendejo",
  "pendeja",
  "boludo",
  "boluda",
  "pelotudo",
  "mierdas",
]);

const PHRASES = [
  "hijo de puta",
  "hija de puta",
  "hijo de la gran puta",
  "me cago en",
  "vete a la mierda",
  "que te den",
  "te den por",
];

export const TONE_MESSAGE =
  "No podemos publicar eso. Quita los insultos o los tacos y describe el problema: así la administración puede leerlo.";

function fold(value: string): string {
  const mapped = value
    .toLowerCase()
    .replace(/[013457@$€]/g, (ch) => LEET[ch] ?? ch)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return mapped.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Junta letras sueltas: "p u t a" → "puta". */
function joinSpacedLetters(input: string): string {
  let current = input;
  let previous = "";
  while (current !== previous) {
    previous = current;
    current = current.replace(/\b([a-z])\s+(?=[a-z]\b)/g, "$1");
  }
  return current;
}

function hits(text: string): boolean {
  if (!text) return false;
  for (const phrase of PHRASES) {
    if (text.includes(phrase)) return true;
  }
  for (const token of text.split(" ")) {
    if (!token) continue;
    const collapsed = token.replace(/(.)\1{2,}/g, "$1");
    if (WORDS.has(token) || WORDS.has(collapsed)) return true;
  }
  return false;
}

export function inspectTone(text: string): { ok: true } | { ok: false; message: string } {
  const folded = fold(text);
  if (hits(folded) || hits(joinSpacedLetters(folded))) {
    return { ok: false, message: TONE_MESSAGE };
  }
  return { ok: true };
}
