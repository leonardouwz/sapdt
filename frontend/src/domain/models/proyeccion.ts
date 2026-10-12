import type { Region } from "./region";
import type { Period } from "./series";

export type ForecastModel = "media_movil" | "suavizado_exp";

export interface ValuePoint {
  periodo: Period;
  valor: number;
}

export interface ForecastResult {
  region: Region;
  modelo: ForecastModel;
  horizonte: 3 | 6;
  base: { desde: Period; hasta: Period; excluye_pandemia: boolean };
  historico: ValuePoint[];
  proyeccion: ValuePoint[];
  mae: number | null;
  mape: number | null;
  confiable: boolean;
}
