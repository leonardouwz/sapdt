import { SEASON_P_HIGH, SEASON_P_LOW } from "@/config/constants";
import type { SeasonLevel, SeasonMonth } from "./models/temporada";
import { mean, percentile, round } from "./stats";

export interface SeasonInput {
  mes: number;
  valor: number | null;
  atipico: boolean;
}

export interface SeasonComputation {
  umbrales: { p_baja: number | null; p_alta: number | null };
  meses: SeasonMonth[];
}

/** RF-04: clasifica cada mes calendario en alta/media/baja por percentiles de los promedios mensuales. */
export function computeSeasonality(
  points: readonly SeasonInput[],
  opts: { excluirPandemia: boolean; pAlta?: number; pBaja?: number },
): SeasonComputation {
  const pAlta = opts.pAlta ?? SEASON_P_HIGH;
  const pBaja = opts.pBaja ?? SEASON_P_LOW;
  const byMonth: number[][] = Array.from({ length: 12 }, () => []);
  for (const p of points) {
    if (opts.excluirPandemia && p.atipico) continue;
    if (p.valor === null) continue;
    byMonth[p.mes - 1].push(p.valor);
  }
  const avgs = byMonth.map((vals) => (vals.length ? round(mean(vals), 1) : null));
  const available = avgs.filter((v): v is number => v !== null);
  const pLow = available.length ? round(percentile(available, pBaja), 1) : null;
  const pHigh = available.length ? round(percentile(available, pAlta), 1) : null;

  const meses: SeasonMonth[] = avgs.map((avg, i) => {
    let nivel: SeasonLevel | null = null;
    if (avg !== null && pLow !== null && pHigh !== null) {
      nivel = avg > pHigh ? "alta" : avg < pLow ? "baja" : "media";
    }
    return { mes: i + 1, valor_promedio: avg, nivel, n_observaciones: byMonth[i].length };
  });
  return { umbrales: { p_baja: pLow, p_alta: pHigh }, meses };
}
