/** Estadística pura (sin dependencias). */

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return Number.NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Percentil con interpolación lineal (método "linear", igual que numpy por defecto). */
export function percentile(xs: readonly number[], p: number): number {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const rank = (p / 100) * (s.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return s[lo] + (s[hi] - s[lo]) * (rank - lo);
}

/** Pronóstico por promedio móvil de k; recursivo para horizontes > 1. */
export function movingAverage(values: readonly number[], h: number, k: number): number[] {
  const buf = [...values];
  const out: number[] = [];
  for (let i = 0; i < h; i++) {
    const f = mean(buf.slice(-k));
    out.push(f);
    buf.push(f);
  }
  return out;
}

/** Suavizado exponencial simple. Nivel inicial = media de los 3 primeros valores. Pronóstico plano. */
export function exponentialSmoothing(values: readonly number[], h: number, alpha: number): number[] {
  if (values.length === 0) return [];
  let level = mean(values.slice(0, 3));
  for (const y of values) level = alpha * y + (1 - alpha) * level;
  return Array.from({ length: h }, () => level);
}

export function mae(actual: readonly number[], predicted: readonly number[]): number {
  return mean(actual.map((a, i) => Math.abs(a - predicted[i])));
}

export function mape(actual: readonly number[], predicted: readonly number[]): number {
  const terms: number[] = [];
  actual.forEach((a, i) => {
    if (a !== 0) terms.push(Math.abs(a - predicted[i]) / Math.abs(a));
  });
  return mean(terms) * 100;
}

export const round = (n: number, d = 2): number => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
