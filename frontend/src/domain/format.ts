import { parsePeriod } from "./periods";
import type { Period } from "./models/series";

export const NO_DATA = "s/d";

export const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;
export const MONTHS_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const intFmt = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });

export const fmtInt = (n: number): string => intFmt.format(Math.round(n));
export const fmtDecimal = (n: number, d = 2): string => n.toFixed(d);
export const fmtPct = (n: number, d = 2): string => `${n.toFixed(d)} %`;
export const fmtDays = (n: number): string => `${n.toFixed(2)} días`;

/** Variación con signo explícito: +9.3 % / −4.1 % (signo menos tipográfico). */
export function fmtVar(n: number, d = 1): string {
  const r = Number(n.toFixed(d));
  if (r === 0) return `${(0).toFixed(d)} %`;
  return `${r > 0 ? "+" : "−"}${Math.abs(r).toFixed(d)} %`;
}

export function fmtCompact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
  if (a >= 1e3) return `${Math.round(n / 1e3)} mil`;
  return String(Math.round(n));
}

export const fmtMonthName = (mes: number): string => MONTHS_SHORT[mes - 1];
export const fmtMonthNameLong = (mes: number): string => MONTHS_LONG[mes - 1];

export function fmtMonth(p: Period): string {
  const { anio, mes } = parsePeriod(p);
  return `${MONTHS_SHORT[mes - 1]} ${anio}`;
}

export function fmtMonthLong(p: Period): string {
  const { anio, mes } = parsePeriod(p);
  return `${MONTHS_LONG[mes - 1]} ${anio}`;
}

/** '2026-10-05' -> '05-Oct-2026' */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${MONTHS_SHORT[Number(m) - 1]}-${y}`;
}

/** Aplica un formateador o devuelve 's/d'. Nunca convierte null en 0. */
export function fmtNoData<T>(v: T | null | undefined, f: (v: T) => string): string {
  if (v === null || v === undefined) return NO_DATA;
  if (typeof v === "number" && !Number.isFinite(v)) return NO_DATA;
  return f(v);
}

export const isMissing = (v: unknown): v is null | undefined =>
  v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));
