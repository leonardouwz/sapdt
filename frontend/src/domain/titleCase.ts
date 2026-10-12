/** Normalización de textos de gobierno (MAYÚSCULAS) a Title Case conservando tildes y Ñ. */

const CONNECTORS = new Set([
  "de", "del", "la", "las", "los", "el", "y", "e", "o", "u", "en", "a", "al", "con", "por", "para",
]);

const CANONICAL: Record<string, string> = {
  "S.A.C.": "S.A.C.", SAC: "S.A.C.", "S.A.C": "S.A.C.",
  "S.A.": "S.A.", "S.A": "S.A.",
  "E.I.R.L.": "E.I.R.L.", EIRL: "E.I.R.L.", "E.I.R.L": "E.I.R.L.",
  "S.R.L.": "S.R.L.", SRL: "S.R.L.", "S.R.L": "S.R.L.",
  RUC: "RUC", II: "II", III: "III", IV: "IV",
  SN: "S/N", "S/N": "S/N",
  "AV.": "Av.", AV: "Av.",
  "JR.": "Jr.", JR: "Jr.",
  "URB.": "Urb.", URB: "Urb.",
  MZ: "Mz.", "MZ.": "Mz.",
  LT: "Lt.", "LT.": "Lt.",
};

const LOCALE = "es-PE";

function capitalize(word: string): string {
  return word.replace(/(^|[-(/"'])(\p{L})/gu, (_m, p: string, c: string) => p + c.toLocaleUpperCase(LOCALE));
}

export function toTitleCase(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  const words = s.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  return words
    .map((w, i) => {
      const upper = w.toLocaleUpperCase(LOCALE);
      const m = /^(.*?)([,;:]*)$/.exec(upper);
      const core = m ? m[1] : upper;
      const tail = m ? m[2] : "";
      const canon = CANONICAL[core];
      if (canon) return canon + tail;
      const lower = core.toLocaleLowerCase(LOCALE);
      if (i > 0 && CONNECTORS.has(lower)) return lower + tail;
      return capitalize(lower) + tail;
    })
    .join(" ");
}

/** Normaliza para búsqueda: sin tildes, minúsculas, espacios colapsados. */
export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
