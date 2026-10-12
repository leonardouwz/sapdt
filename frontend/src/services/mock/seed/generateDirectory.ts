import type { CategoriaDir, ClaseDir, Establecimiento } from "@/domain/models/establecimiento";
import { REGIONS } from "@/domain/regions";
import { PROFILES, directoryCounts } from "./regions-profile";
import { intBetween, mulberry32, pick, SEED, shuffle } from "./rng";

export const FECHA_CORTE = "2026-10-05";

const COLCA_LODGE: Establecimiento = {
  id: "20311643895|COLCA LODGE|040519", ruc: "20311643895", razon_social: "COLCA LODGE SOCIEDAD ANONIMA",
  nombre_comercial: "COLCA LODGE", ubigeo: "040519", departamento_codigo: "04",
  departamento: "Arequipa", provincia: "Caylloma", distrito: "Yanque",
  clase: "Hotel", categoria: "4 Estrellas", habitaciones: 46, camas: 89,
  direccion: "VIA PUYE SN FND.", telefono: "54202587/958507109", email: "info@colca-lodge.com", web: null,
  fecha_expedicion: "2020-08-17", nro_certificado: "Certificado 003-2020-GRA/GRCET/SGT.", fecha_corte: FECHA_CORTE,
};

/** Pool exacto de combinaciones clase × categoría (suma 5 076). */
const POOL: [ClaseDir, CategoriaDir, number][] = [
  ["Resort", "5 Estrellas", 1],
  ["Apart Hotel", "5 Estrellas", 10], ["Apart Hotel", "4 Estrellas", 16], ["Apart Hotel", "3 Estrellas", 30],
  ["Hotel", "5 Estrellas", 60], ["Hotel", "4 Estrellas", 160], ["Hotel", "3 Estrellas", 1135],
  ["Hotel", "2 Estrellas", 844], ["Hotel", "1 Estrella", 200],
  ["Hostal", "3 Estrellas", 300], ["Hostal", "2 Estrellas", 1574], ["Hostal", "1 Estrella", 500],
  ["Albergue", "Sin categoría", 246],
];

const PREFIX: Record<ClaseDir, string[]> = {
  Hotel: ["HOTEL", "GRAN HOTEL", "HOTEL BOUTIQUE"],
  Hostal: ["HOSTAL", "CASA HOSPEDAJE", "HOSPEDAJE"],
  Albergue: ["ALBERGUE", "ALBERGUE TURISTICO"],
  "Apart Hotel": ["APART HOTEL"],
  Resort: ["RESORT"],
};
const NAMES = [
  "EL DORADO", "LAS PALMERAS", "SAN FRANCISCO", "LOS ANDES", "EL MIRADOR", "SOL DE ORO", "PLAZA REAL",
  "LA CASONA", "MISTI", "INTI RAYMI", "VILLA DEL SOL", "LOS PINOS", "SANTA ROSA", "EL TAMBO", "PACHAMAMA",
  "KANTU", "WAYRA", "MALLKU", "LA POSADA", "DON JUAN", "SAN MARTIN DE PORRES", "LAS VEGAS", "CONTINENTAL",
  "IMPERIAL", "PRIMAVERA", "EL VIAJERO", "LOS ROSALES", "CIELO AZUL", "LA FLORIDA", "QORI KANCHA",
];
const SOCIETY = ["S.A.C.", "E.I.R.L.", "S.R.L.", "S.A."];
const STREETS = ["AV. EJERCITO", "JR. LIMA", "CALLE MERCADERES", "AV. LA CULTURA", "JR. JUNIN", "CALLE BOLIVAR", "AV. GRAU", "JR. AYACUCHO", "CALLE SAN JUAN DE DIOS"];
const SURNAMES = ["QUISPE", "MAMANI", "HUAMAN", "FLORES", "RAMOS", "CHAVEZ", "TORRES", "VARGAS", "ROJAS", "NUÑEZ"];
const GIVEN = ["JUAN CARLOS", "MARIA ELENA", "JOSE LUIS", "ROSA", "PEDRO", "ANA LUCIA", "MIGUEL ANGEL"];

const CAPACITY: Record<CategoriaDir, [number, number]> = {
  "Sin categoría": [6, 20], "1 Estrella": [6, 15], "2 Estrellas": [8, 22],
  "3 Estrellas": [15, 40], "4 Estrellas": [30, 90], "5 Estrellas": [80, 250],
};

const upperNoAccent = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
const slug = (s: string) => upperNoAccent(s).toLowerCase().replace(/[^a-z0-9]+/g, "");

export function generateDirectory(): Establecimiento[] {
  const rng = mulberry32(SEED + 7);
  const counts = directoryCounts();
  const pool: [ClaseDir, CategoriaDir][] = [];
  POOL.forEach(([c, k, n]) => { for (let i = 0; i < n; i++) pool.push([c, k]); });
  shuffle(rng, pool);

  // Posición del primer registro de Arequipa: reservar un Hotel 4★ para Colca Lodge.
  let arequipaStart = 0;
  for (const r of REGIONS) { if (r.codigo === "04") break; arequipaStart += counts[r.codigo]; }
  const idx = pool.findIndex(([c, k]) => c === "Hotel" && k === "4 Estrellas");
  [pool[idx], pool[arequipaStart]] = [pool[arequipaStart], pool[idx]];

  const out: Establecimiento[] = [];
  const rucs: string[] = [];
  let cursor = 0;
  for (const region of REGIONS) {
    const prof = PROFILES[region.codigo];
    const n = counts[region.codigo];
    const regionRecords: Establecimiento[] = [];
    for (let i = 0; i < n; i++, cursor++) {
      if (region.codigo === "04" && i === 0) { regionRecords.push(COLCA_LODGE); continue; }
      const [clase, categoria] = pool[cursor];
      const pIdx = Math.floor(rng() * prof.provinces.length);
      const prov = prof.provinces[pIdx];
      const dIdx = Math.floor(rng() * prov.distritos.length);
      const dist = prov.distritos[dIdx];
      const ubigeo = dist.ubigeo ?? `${region.codigo}${String(pIdx + 1).padStart(2, "0")}${String(dIdx + 1).padStart(2, "0")}`;
      const natural = rng() < 0.3;
      let ruc: string;
      if (rucs.length > 10 && rng() < 0.04) ruc = pick(rng, rucs);
      else { ruc = `${natural ? "10" : "20"}${String(intBetween(rng, 100000000, 999999999))}`; rucs.push(ruc); }
      const base = rng() < 0.4 ? upperNoAccent(dist.nombre) : pick(rng, NAMES);
      const nombre = `${pick(rng, PREFIX[clase])} ${base}${rng() < 0.08 ? " II" : ""}`;
      const razon = natural
        ? `${pick(rng, SURNAMES)} ${pick(rng, SURNAMES)} ${pick(rng, GIVEN)}`
        : `${nombre} ${pick(rng, SOCIETY)}`;
      const [lo, hi] = CAPACITY[categoria];
      const hab = clase === "Resort" ? 120 : intBetween(rng, lo, hi);
      const camas = Math.round(hab * (1.6 + rng() * 0.5));
      const nullCap = rng() < prof.nullCapacityRate;
      const r = rng();
      const telefono = rng() < 0.08 ? null
        : r < 0.7 ? `9${intBetween(rng, 10000000, 99999999)}`
        : r < 0.9 ? `${intBetween(rng, 41, 84)}${intBetween(rng, 200000, 299999)}/9${intBetween(rng, 10000000, 99999999)}`
        : `9${intBetween(rng, 10000000, 99999999)}, 9${intBetween(rng, 10000000, 99999999)}`;
      const er = rng();
      const email = er < 0.25 ? null : er < 0.28 ? `reservas.${slug(base)}` : `${pick(rng, ["info", "reservas", "contacto"])}@${slug(base)}${pick(rng, [".com", ".pe", "@gmail.com"]).replace(/^@/, "")}`.replace(/@(.+)gmail\.com$/, "$1@gmail.com");
      const year = intBetween(rng, 2012, 2026);
      const fecha = rng() < 0.03 ? null : `${year}-${String(intBetween(rng, 1, year === 2026 ? 9 : 12)).padStart(2, "0")}-${String(intBetween(rng, 1, 28)).padStart(2, "0")}`;
      const dr = rng();
      const direccion = dr < 0.02 ? null
        : dr < 0.15 ? `MZ ${pick(rng, ["A", "B", "C", "D", "F"])} LT ${intBetween(rng, 1, 30)} URB. ${pick(rng, NAMES)}`
        : dr < 0.22 ? `VIA ${upperNoAccent(prov.nombre)} SN`
        : `${pick(rng, STREETS)} ${intBetween(rng, 100, 1999)}`;
      regionRecords.push({
        id: `${ruc}|${nombre}|${ubigeo}`, ruc, razon_social: razon, nombre_comercial: nombre, ubigeo,
        departamento_codigo: region.codigo, departamento: region.nombre, provincia: prov.nombre, distrito: dist.nombre,
        clase, categoria,
        habitaciones: nullCap ? null : hab, camas: nullCap ? null : camas,
        direccion, telefono, email, web: rng() < 0.73 ? null : `www.${slug(base)}.com`,
        fecha_expedicion: fecha,
        nro_certificado: rng() < 0.05 ? null : `Certificado ${String(intBetween(rng, 1, 450)).padStart(3, "0")}-${fecha?.slice(0, 4) ?? year}-GR${region.codigo}/DIRCETUR`,
        fecha_corte: FECHA_CORTE,
      });
    }
    if (region.codigo === "04") calibrateArequipa(regionRecords, rng);
    out.push(...regionRecords);
  }
  return out;
}

/** Arequipa: exactamente 46 sin capacidad; 7 498 habitaciones y 13 609 camas con dato. */
function calibrateArequipa(recs: Establecimiento[], rng: () => number) {
  const candidates = recs.slice(1).map((_, i) => i + 1);
  shuffle(rng, candidates);
  const nulls = new Set(candidates.slice(0, 46));
  nulls.forEach((i) => { recs[i] = { ...recs[i], habitaciones: null, camas: null }; });
  const withData = recs.map((_, i) => i).filter((i) => i > 0 && !nulls.has(i));
  const fit = (key: "habitaciones" | "camas", target: number) => {
    const sum = withData.reduce((a, i) => a + (recs[i][key] ?? 0), 0);
    const f = target / sum;
    let acc = 0;
    withData.forEach((i, j) => {
      const v = j === withData.length - 1 ? target - acc : Math.max(1, Math.round((recs[i][key] ?? 1) * f));
      recs[i] = { ...recs[i], [key]: v };
      acc += v;
    });
  };
  fit("habitaciones", 7498 - 46);
  fit("camas", 13609 - 89);
}
