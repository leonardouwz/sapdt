import type { Establecimiento } from "@/domain/models/establecimiento";
import type { RegionCode } from "@/domain/models/region";
import type { SeriesPoint } from "@/domain/models/series";
import { generateDirectory } from "./seed/generateDirectory";
import { generateSeries, type RawSeriesRow } from "./seed/generateSeries";

/** Regla de jerarquía de totales: solo filas TT/TT. */
export const isTotalRow = (r: { id_clase: string; id_categoria: string }): boolean =>
  r.id_clase === "TT" && r.id_categoria === "TT";

export interface MockDb {
  rawSeries: RawSeriesRow[];
  seriesByRegion: Map<RegionCode, SeriesPoint[]>;
  directory: Establecimiento[];
}

let db: MockDb | null = null;

/** Singleton perezoso: se genera una sola vez, en la primera consulta. */
export function getDb(): MockDb {
  if (db) return db;
  const rawSeries = generateSeries();
  const seriesByRegion = new Map<RegionCode, SeriesPoint[]>();
  for (const row of rawSeries) {
    if (!isTotalRow(row)) continue;
    const { id_clase: _c, id_categoria: _k, ...point } = row;
    const list = seriesByRegion.get(point.region.codigo) ?? [];
    list.push(point);
    seriesByRegion.set(point.region.codigo, list);
  }
  db = { rawSeries, seriesByRegion, directory: generateDirectory() };
  return db;
}
