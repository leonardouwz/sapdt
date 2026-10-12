import {
  BACKTEST_WINDOW,
  MIN_BASE_POINTS,
  MOVING_AVERAGE_K,
  SES_ALPHA,
} from "@/config/constants";
import type { ForecastModel, ValuePoint } from "./models/proyeccion";
import type { Period } from "./models/series";
import { addMonths } from "./periods";
import { exponentialSmoothing, mae, mape, movingAverage, round } from "./stats";

export function forecastValues(values: readonly number[], h: number, modelo: ForecastModel): number[] {
  return modelo === "media_movil"
    ? movingAverage(values, h, MOVING_AVERAGE_K)
    : exponentialSmoothing(values, h, SES_ALPHA);
}

/** Validación por origen móvil sobre los últimos 12 meses. null si historia insuficiente. */
export function backtest(
  values: readonly number[],
  h: number,
  modelo: ForecastModel,
): { mae: number; mape: number } | null {
  const n = values.length;
  if (n < MIN_BASE_POINTS) return null;
  const actual: number[] = [];
  const predicted: number[] = [];
  for (let o = n - BACKTEST_WINDOW; o <= n - h; o++) {
    if (o < MOVING_AVERAGE_K) continue;
    const pred = forecastValues(values.slice(0, o), h, modelo);
    for (let j = 0; j < h; j++) {
      actual.push(values[o + j]);
      predicted.push(pred[j]);
    }
  }
  if (actual.length === 0) return null;
  return { mae: round(mae(actual, predicted), 1), mape: round(mape(actual, predicted), 1) };
}

export interface ForecastComputation {
  historico: ValuePoint[];
  proyeccion: ValuePoint[];
  mae: number | null;
  mape: number | null;
  confiable: boolean;
}

export function buildForecast(
  base: readonly { periodo: Period; valor: number | null }[],
  h: number,
  modelo: ForecastModel,
): ForecastComputation {
  const historico = base.filter((p): p is ValuePoint => p.valor !== null);
  const values = historico.map((p) => p.valor);
  const last = historico.at(-1);
  const preds = values.length ? forecastValues(values, h, modelo) : [];
  const proyeccion = last
    ? preds.map((v, i) => ({ periodo: addMonths(last.periodo, i + 1), valor: Math.round(v) }))
    : [];
  const bt = backtest(values, h, modelo);
  return {
    historico,
    proyeccion,
    mae: bt?.mae ?? null,
    mape: bt?.mape ?? null,
    confiable: bt !== null,
  };
}
