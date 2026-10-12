import type { Region } from "./region";

export type Period = string; // 'YYYY-MM'
export type Metric = "arribos" | "pernoct";

/** Punto mensual de la serie. Solo filas TT/TT (total clase / total categoría). */
export interface SeriesPoint {
  anio: number;
  mes: number;
  periodo: Period;
  region: Region;
  n_establecimientos: number | null;
  n_habitaciones: number | null;
  n_plazas_cama: number | null;
  tnoh: number | null;
  tnoc: number | null;
  perm: number | null;
  perm_nac: number | null;
  perm_ext: number | null;
  arribos: number | null;
  arribos_nac: number | null;
  arribos_ext: number | null;
  pernoct: number | null;
  pernoct_nac: number | null;
  pernoct_ext: number | null;
  empleo: number | null;
  atipico: boolean;
  parcial: boolean;
  sospechosa: boolean;
}
