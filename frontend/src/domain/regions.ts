import type { Region, RegionCode } from "./models/region";
import { normalizeForSearch } from "./titleCase";

/** Catálogo de las 25 regiones. Clave de cruce = código de 2 dígitos. */
export const REGIONS: readonly Region[] = [
  { codigo: "01", nombre: "Amazonas" },
  { codigo: "02", nombre: "Áncash" },
  { codigo: "03", nombre: "Apurímac" },
  { codigo: "04", nombre: "Arequipa" },
  { codigo: "05", nombre: "Ayacucho" },
  { codigo: "06", nombre: "Cajamarca" },
  { codigo: "07", nombre: "Callao" },
  { codigo: "08", nombre: "Cusco" },
  { codigo: "09", nombre: "Huancavelica" },
  { codigo: "10", nombre: "Huánuco" },
  { codigo: "11", nombre: "Ica" },
  { codigo: "12", nombre: "Junín" },
  { codigo: "13", nombre: "La Libertad" },
  { codigo: "14", nombre: "Lambayeque" },
  { codigo: "15", nombre: "Lima" },
  { codigo: "16", nombre: "Loreto" },
  { codigo: "17", nombre: "Madre de Dios" },
  { codigo: "18", nombre: "Moquegua" },
  { codigo: "19", nombre: "Pasco" },
  { codigo: "20", nombre: "Piura" },
  { codigo: "21", nombre: "Puno" },
  { codigo: "22", nombre: "San Martín" },
  { codigo: "23", nombre: "Tacna" },
  { codigo: "24", nombre: "Tumbes" },
  { codigo: "25", nombre: "Ucayali" },
];

const BY_CODE = new Map(REGIONS.map((r) => [r.codigo, r]));

export const REGIONS_SORTED: readonly Region[] = [...REGIONS].sort((a, b) =>
  a.nombre.localeCompare(b.nombre, "es"),
);

export const isRegionCode = (c: string): boolean => BY_CODE.has(c);
export const getRegion = (c: RegionCode): Region | undefined => BY_CODE.get(c);
export const regionName = (c: RegionCode): string => BY_CODE.get(c)?.nombre ?? c;
export const regionSlug = (c: RegionCode): string =>
  normalizeForSearch(regionName(c)).replace(/\s+/g, "-");
