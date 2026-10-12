import type { Region } from "./region";
import type { Metric, Period } from "./series";

export type SeasonLevel = "alta" | "media" | "baja";

export interface SeasonMonth {
  mes: number;
  valor_promedio: number | null;
  nivel: SeasonLevel | null;
  n_observaciones: number;
}

export interface SeasonResult {
  region: Region;
  metrica: Metric;
  desde: Period;
  hasta: Period;
  excluye_pandemia: boolean;
  umbrales: { p_baja: number | null; p_alta: number | null };
  meses: SeasonMonth[];
}
