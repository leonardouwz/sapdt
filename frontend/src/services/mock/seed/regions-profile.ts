import type { RegionCode } from "@/domain/models/region";

export type Archetype = "A" | "B" | "C" | "D";

export interface RegionProfile {
  share: number; // % del total nacional
  archetype: Archetype;
  extShare: number; // participación de extranjeros (0-1)
  nullCapacityRate: number;
  provinces: { nombre: string; distritos: { nombre: string; ubigeo?: string }[] }[];
}

const P = (nombre: string, ...d: string[]) => ({ nombre, distritos: d.map((x) => ({ nombre: x })) });

export const PROFILES: Record<RegionCode, RegionProfile> = {
  "01": { share: 2, archetype: "D", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Chachapoyas", "Chachapoyas", "Leimebamba"), P("Bagua", "Bagua", "Aramango"), P("Utcubamba", "Bagua Grande")] },
  "02": { share: 4.5, archetype: "C", extShare: 0.07, nullCapacityRate: 0.02, provinces: [P("Huaraz", "Huaraz", "Independencia"), P("Huari", "Chavín de Huántar"), P("Santa", "Chimbote", "Nuevo Chimbote"), P("Yungay", "Yungay")] },
  "03": { share: 1.5, archetype: "A", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Abancay", "Abancay", "Tamburco"), P("Andahuaylas", "Andahuaylas", "Talavera")] },
  "04": {
    share: 2.5, archetype: "A", extShare: 0.163, nullCapacityRate: 0,
    provinces: [
      { nombre: "Arequipa", distritos: [{ nombre: "Arequipa", ubigeo: "040101" }, { nombre: "Yanahuara", ubigeo: "040126" }, { nombre: "Cayma", ubigeo: "040103" }, { nombre: "Cerro Colorado", ubigeo: "040104" }, { nombre: "Miraflores", ubigeo: "040110" }] },
      { nombre: "Caylloma", distritos: [{ nombre: "Chivay", ubigeo: "040501" }, { nombre: "Yanque", ubigeo: "040519" }, { nombre: "Cabanaconde", ubigeo: "040504" }, { nombre: "Majes", ubigeo: "040520" }] },
      { nombre: "Islay", distritos: [{ nombre: "Mollendo", ubigeo: "040701" }, { nombre: "Mejía", ubigeo: "040704" }] },
      { nombre: "Camaná", distritos: [{ nombre: "Camaná", ubigeo: "040201" }] },
    ],
  },
  "05": { share: 2.5, archetype: "A", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Huamanga", "Ayacucho", "Carmen Alto", "Quinua"), P("Lucanas", "Puquio")] },
  "06": { share: 4, archetype: "C", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Cajamarca", "Cajamarca", "Baños del Inca"), P("Jaén", "Jaén"), P("Chota", "Chota")] },
  "07": { share: 2.5, archetype: "C", extShare: 0.2, nullCapacityRate: 0.02, provinces: [P("Callao", "Callao", "Bellavista", "La Perla", "La Punta"), P("Ventanilla", "Ventanilla", "Mi Perú")] },
  "08": { share: 8, archetype: "A", extShare: 0.38, nullCapacityRate: 0.02, provinces: [P("Cusco", "Cusco", "Wanchaq", "Santiago", "San Jerónimo"), P("Urubamba", "Urubamba", "Machupicchu", "Ollantaytambo"), P("Calca", "Pisac", "Calca")] },
  "09": { share: 1, archetype: "A", extShare: 0.04, nullCapacityRate: 0.14, provinces: [P("Huancavelica", "Huancavelica", "Ascensión"), P("Tayacaja", "Pampas")] },
  "10": { share: 3, archetype: "C", extShare: 0.04, nullCapacityRate: 0.02, provinces: [P("Huánuco", "Huánuco", "Amarilis"), P("Leoncio Prado", "Rupa-Rupa")] },
  "11": { share: 4.5, archetype: "B", extShare: 0.12, nullCapacityRate: 0.02, provinces: [P("Ica", "Ica", "La Tinguiña"), P("Pisco", "Paracas", "Pisco"), P("Nasca", "Nasca")] },
  "12": { share: 5, archetype: "C", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Huancayo", "Huancayo", "El Tambo"), P("Chanchamayo", "La Merced", "San Ramón"), P("Tarma", "Tarma")] },
  "13": { share: 5.5, archetype: "B", extShare: 0.06, nullCapacityRate: 0.02, provinces: [P("Trujillo", "Trujillo", "Víctor Larco Herrera", "Huanchaco"), P("Pacasmayo", "Pacasmayo")] },
  "14": { share: 4, archetype: "B", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Chiclayo", "Chiclayo", "José Leonardo Ortiz", "Pimentel"), P("Lambayeque", "Lambayeque")] },
  "15": { share: 24, archetype: "C", extShare: 0.28, nullCapacityRate: 0.02, provinces: [P("Lima", "Miraflores", "San Isidro", "Barranco", "Lima", "Santiago de Surco"), P("Huaral", "Huaral"), P("Cañete", "San Vicente de Cañete", "Asia"), P("Huaura", "Huacho")] },
  "16": { share: 3, archetype: "D", extShare: 0.12, nullCapacityRate: 0.13, provinces: [P("Maynas", "Iquitos", "Punchana", "Belén"), P("Alto Amazonas", "Yurimaguas")] },
  "17": { share: 1.5, archetype: "D", extShare: 0.4, nullCapacityRate: 0.02, provinces: [P("Tambopata", "Tambopata", "Las Piedras"), P("Manu", "Manu")] },
  "18": { share: 1.5, archetype: "B", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Mariscal Nieto", "Moquegua", "Samegua"), P("Ilo", "Ilo")] },
  "19": { share: 1.5, archetype: "C", extShare: 0.04, nullCapacityRate: 0.02, provinces: [P("Pasco", "Chaupimarca", "Yanacancha"), P("Oxapampa", "Oxapampa", "Villa Rica")] },
  "20": { share: 5, archetype: "B", extShare: 0.07, nullCapacityRate: 0.02, provinces: [P("Piura", "Piura", "Castilla"), P("Talara", "Máncora", "Pariñas"), P("Sullana", "Sullana")] },
  "21": { share: 3.5, archetype: "A", extShare: 0.2, nullCapacityRate: 0.13, provinces: [P("Puno", "Puno", "Chucuito"), P("San Román", "Juliaca"), P("Yunguyo", "Yunguyo")] },
  "22": { share: 3.5, archetype: "D", extShare: 0.06, nullCapacityRate: 0.02, provinces: [P("San Martín", "Tarapoto", "La Banda de Shilcayo"), P("Moyobamba", "Moyobamba"), P("Rioja", "Nueva Cajamarca")] },
  "23": { share: 2.5, archetype: "B", extShare: 0.08, nullCapacityRate: 0.02, provinces: [P("Tacna", "Tacna", "Gregorio Albarracín", "Pocollay"), P("Tarata", "Tarata")] },
  "24": { share: 1.5, archetype: "B", extShare: 0.12, nullCapacityRate: 0.02, provinces: [P("Tumbes", "Tumbes", "Corrales"), P("Contralmirante Villar", "Zorritos"), P("Zarumilla", "Aguas Verdes")] },
  "25": { share: 2, archetype: "D", extShare: 0.05, nullCapacityRate: 0.02, provinces: [P("Coronel Portillo", "Callería", "Yarinacocha"), P("Padre Abad", "Padre Abad")] },
};

export const ARCHETYPE_SEASON: Record<Archetype, number[]> = {
  A: [0.78, 0.78, 0.85, 0.95, 1.0, 1.15, 1.35, 1.38, 1.15, 1.0, 0.8, 0.81],
  B: [1.3, 1.25, 1.15, 0.9, 0.8, 0.78, 0.95, 0.85, 0.8, 0.85, 0.95, 1.4],
  C: [0.95, 0.92, 0.95, 0.98, 1.0, 1.0, 1.12, 1.05, 1.0, 1.0, 0.98, 1.1],
  D: [0.85, 0.82, 0.85, 0.9, 0.95, 1.05, 1.3, 1.3, 1.2, 1.0, 0.88, 0.9],
};

export const NATIONAL_NAC: Record<number, number> = {
  2015: 47.9e6, 2016: 50.6e6, 2017: 51.9e6, 2018: 55.4e6, 2019: 63.2e6, 2020: 36.4e6,
  2021: 47.8e6, 2022: 53.3e6, 2023: 53.0e6, 2024: 57.6e6, 2025: 30.0e6,
};

const KNOWN_DIR: Record<RegionCode, number> = { "15": 960, "08": 496, "06": 416, "04": 403, "14": 381 };
export const DIRECTORY_TOTAL = 5076;

/** Conteos del directorio por región: conocidos + reparto proporcional (resto mayor). */
export function directoryCounts(): Record<RegionCode, number> {
  const out: Record<RegionCode, number> = { ...KNOWN_DIR };
  const known = Object.values(KNOWN_DIR).reduce((a, b) => a + b, 0);
  const rest = DIRECTORY_TOTAL - known;
  const others = Object.keys(PROFILES).filter((c) => !(c in KNOWN_DIR));
  const shareSum = others.reduce((a, c) => a + PROFILES[c].share, 0);
  const raw = others.map((c) => ({ c, v: Math.max(15, (rest * PROFILES[c].share) / shareSum) }));
  let assigned = 0;
  raw.forEach((r) => { out[r.c] = Math.floor(r.v); assigned += out[r.c]; });
  const byRemainder = [...raw].sort((a, b) => (b.v % 1) - (a.v % 1));
  for (let i = 0; assigned < rest; i++, assigned++) out[byRemainder[i % byRemainder.length].c]++;
  return out;
}
