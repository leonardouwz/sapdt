import type { CompareParams, CompareTotals } from "./models/comparativo";
import type { Period, SeriesPoint } from "./models/series";
import { comparePeriods, isRangeWithinData, rangeLength } from "./periods";
import { round } from "./stats";

export interface RangeValidation {
  baseOut: boolean;
  compOut: boolean;
  ok: boolean;
}

export function validateCompareRanges(p: Omit<CompareParams, "regiones">): RangeValidation {
  const baseOut = !isRangeWithinData(p.base_desde, p.base_hasta);
  const compOut = !isRangeWithinData(p.comp_desde, p.comp_hasta);
  return { baseOut, compOut, ok: !baseOut && !compOut };
}

export function compareWarnings(p: Omit<CompareParams, "regiones">) {
  return {
    differentLength:
      rangeLength(p.base_desde, p.base_hasta) !== rangeLength(p.comp_desde, p.comp_hasta),
    identical: p.base_desde === p.comp_desde && p.base_hasta === p.comp_hasta,
  };
}

const sumNullable = (vals: (number | null)[]): number | null => {
  const present = vals.filter((v): v is number => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
};

/** Suma de filas TT/TT de una región en el rango. */
export function sumRange(points: readonly SeriesPoint[], desde: Period, hasta: Period): CompareTotals {
  const inRange = points.filter(
    (p) => comparePeriods(p.periodo, desde) >= 0 && comparePeriods(p.periodo, hasta) <= 0,
  );
  return {
    arribos: sumNullable(inRange.map((p) => p.arribos)),
    arribos_nac: sumNullable(inRange.map((p) => p.arribos_nac)),
    arribos_ext: sumNullable(inRange.map((p) => p.arribos_ext)),
  };
}

export function variationPct(base: number | null, comp: number | null): number | null {
  if (base === null || comp === null || base === 0) return null;
  return round(((comp - base) / base) * 100, 2);
}

export function variationTotals(base: CompareTotals, comp: CompareTotals): CompareTotals {
  return {
    arribos: variationPct(base.arribos, comp.arribos),
    arribos_nac: variationPct(base.arribos_nac, comp.arribos_nac),
    arribos_ext: variationPct(base.arribos_ext, comp.arribos_ext),
  };
}
