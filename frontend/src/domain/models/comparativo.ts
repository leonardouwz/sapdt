import type { Region, RegionCode } from "./region";
import type { Period } from "./series";

export interface CompareParams {
  regiones: RegionCode[];
  base_desde: Period;
  base_hasta: Period;
  comp_desde: Period;
  comp_hasta: Period;
}

export interface CompareTotals {
  arribos: number | null;
  arribos_nac: number | null;
  arribos_ext: number | null;
}

export interface CompareRow {
  region: Region;
  base: CompareTotals;
  comparacion: CompareTotals;
  variacion_pct: CompareTotals;
}

export interface CompareResult {
  base: { desde: Period; hasta: Period };
  comparacion: { desde: Period; hasta: Period };
  filas: CompareRow[];
}
