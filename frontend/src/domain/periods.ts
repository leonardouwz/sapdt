import { DATA_MAX, DATA_MIN, PANDEMIC, PARTIAL_YEAR } from "@/config/constants";
import type { Period } from "./models/series";

/** Los periodos se manejan como enteros {anio, mes}; nunca con new Date("YYYY-MM"). */
export interface YearMonth {
  anio: number;
  mes: number;
}

const RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isValidPeriod = (p: string): boolean => RE.test(p);

export function parsePeriod(p: Period): YearMonth {
  const m = RE.exec(p);
  if (!m) throw new Error(`Periodo inválido: ${p}`);
  return { anio: Number(m[1]), mes: Number(m[2]) };
}

export const formatPeriod = ({ anio, mes }: YearMonth): Period =>
  `${anio}-${String(mes).padStart(2, "0")}`;

export const periodIndex = (p: Period): number => {
  const { anio, mes } = parsePeriod(p);
  return anio * 12 + (mes - 1);
};

export const periodFromIndex = (i: number): Period =>
  formatPeriod({ anio: Math.floor(i / 12), mes: (i % 12) + 1 });

export const comparePeriods = (a: Period, b: Period): number => periodIndex(a) - periodIndex(b);

export const rangeLength = (desde: Period, hasta: Period): number =>
  periodIndex(hasta) - periodIndex(desde) + 1;

export const addMonths = (p: Period, n: number): Period => periodFromIndex(periodIndex(p) + n);

export function periodsBetween(desde: Period, hasta: Period): Period[] {
  const out: Period[] = [];
  for (let i = periodIndex(desde); i <= periodIndex(hasta); i++) out.push(periodFromIndex(i));
  return out;
}

export const isPandemicYear = (anio: number): boolean => anio >= PANDEMIC[0] && anio <= PANDEMIC[1];
export const isPartialYear = (anio: number): boolean => anio === PARTIAL_YEAR;

export const isWithinDataRange = (p: Period): boolean =>
  isValidPeriod(p) && comparePeriods(p, DATA_MIN) >= 0 && comparePeriods(p, DATA_MAX) <= 0;

export const isRangeWithinData = (desde: Period, hasta: Period): boolean =>
  isWithinDataRange(desde) && isWithinDataRange(hasta);

/** ¿El rango [desde, hasta] toca algún mes del año dado? */
export function rangeTouchesYear(desde: Period, hasta: Period, anio: number): boolean {
  const a = parsePeriod(desde).anio;
  const b = parsePeriod(hasta).anio;
  return anio >= a && anio <= b;
}

export const rangeTouchesPandemic = (desde: Period, hasta: Period): boolean =>
  rangeTouchesYear(desde, hasta, PANDEMIC[0]) || rangeTouchesYear(desde, hasta, PANDEMIC[1]);

export const rangeTouchesPartial = (desde: Period, hasta: Period): boolean =>
  rangeTouchesYear(desde, hasta, PARTIAL_YEAR);

/** Fecha de hoy en clave compacta YYYYMMDD (para nombres de archivo). */
export function todayCompact(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function todayIso(now: Date = new Date()): string {
  const c = todayCompact(now);
  return `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
}
