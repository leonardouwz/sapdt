import { MSG_RANGE_OUT_OF_DATA, PROJECTION_BASE_FROM, DATA_MIN, DATA_MAX } from "@/config/constants";
import { compareWarnings as _cw, sumRange, validateCompareRanges, variationTotals } from "@/domain/compare";
import { buildForecast } from "@/domain/forecast";
import { ApiError } from "@/domain/models/ApiError";
import type { CompareParams, CompareResult } from "@/domain/models/comparativo";
import type { CapacityAggregates, DirectoryQuery, DirectoryResult, Establecimiento } from "@/domain/models/establecimiento";
import type { OfertaActual } from "@/domain/models/oferta";
import type { ForecastModel, ForecastResult } from "@/domain/models/proyeccion";
import type { RegionCode } from "@/domain/models/region";
import type { Metric, Period, SeriesPoint } from "@/domain/models/series";
import type { SeasonResult } from "@/domain/models/temporada";
import { comparePeriods, isRangeWithinData } from "@/domain/periods";
import { getRegion, REGIONS } from "@/domain/regions";
import { computeSeasonality } from "@/domain/seasonality";
import { round } from "@/domain/stats";
import { normalizeForSearch } from "@/domain/titleCase";
import { getDb } from "./db";
import { FECHA_CORTE } from "./seed/generateDirectory";

void _cw;

const rangeError = () => new ApiError({ status: 400, code: "RANGE_OUT_OF_DATA", message: MSG_RANGE_OUT_OF_DATA, retryable: false });
const notFound = (c: string) => new ApiError({ status: 404, code: "NOT_FOUND", message: `Región ${c} no encontrada`, retryable: false });

function regionOrThrow(c: RegionCode) {
  const r = getRegion(c);
  if (!r) throw notFound(c);
  return r;
}

export function aggregateCapacity(list: readonly Establecimiento[]): CapacityAggregates {
  const withData = list.filter((e) => e.habitaciones !== null && e.camas !== null);
  const sin = list.length - withData.length;
  return {
    establecimientos: list.length,
    habitaciones: withData.length ? withData.reduce((a, e) => a + (e.habitaciones ?? 0), 0) : null,
    camas: withData.length ? withData.reduce((a, e) => a + (e.camas ?? 0), 0) : null,
    pct_sin_dato_capacidad: list.length ? round((sin / list.length) * 100, 1) : 0,
  };
}

export function listOffers(): OfertaActual[] {
  const { directory } = getDb();
  return REGIONS.map((region) => {
    const agg = aggregateCapacity(directory.filter((e) => e.departamento_codigo === region.codigo));
    return { region, oferta_actual: { fecha_corte: FECHA_CORTE, ...agg } };
  });
}

export function getOffer(c: RegionCode): OfertaActual {
  regionOrThrow(c);
  const o = listOffers().find((x) => x.region.codigo === c);
  if (!o) throw notFound(c);
  return o;
}

export function getSeries(p: { regiones: RegionCode[]; desde: Period; hasta: Period }): SeriesPoint[] {
  if (!isRangeWithinData(p.desde, p.hasta)) throw rangeError();
  const { seriesByRegion } = getDb();
  return p.regiones.flatMap((c) => {
    regionOrThrow(c);
    return (seriesByRegion.get(c) ?? []).filter(
      (s) => comparePeriods(s.periodo, p.desde) >= 0 && comparePeriods(s.periodo, p.hasta) <= 0,
    );
  });
}

export function getSeason(p: { region: RegionCode; desde?: Period; hasta?: Period; excluirPandemia?: boolean; metrica?: Metric; p_alta?: number; p_baja?: number }): SeasonResult {
  const desde = p.desde ?? DATA_MIN;
  const hasta = p.hasta ?? DATA_MAX;
  const metrica = p.metrica ?? "arribos";
  const excl = p.excluirPandemia ?? true;
  const pts = getSeries({ regiones: [p.region], desde, hasta });
  const res = computeSeasonality(
    pts.map((s) => ({ mes: s.mes, valor: s[metrica], atipico: s.atipico })),
    { excluirPandemia: excl, pAlta: p.p_alta, pBaja: p.p_baja },
  );
  return { region: regionOrThrow(p.region), metrica, desde, hasta, excluye_pandemia: excl, ...res };
}

export function getForecast(p: { region: RegionCode; horizonte: 3 | 6; modelo: ForecastModel }): ForecastResult {
  const pts = getSeries({ regiones: [p.region], desde: PROJECTION_BASE_FROM, hasta: DATA_MAX });
  const base = pts.filter((s) => !s.atipico).map((s) => ({ periodo: s.periodo, valor: s.arribos }));
  const fc = buildForecast(base, p.horizonte, p.modelo);
  return {
    region: regionOrThrow(p.region), modelo: p.modelo, horizonte: p.horizonte,
    base: { desde: fc.historico[0]?.periodo ?? PROJECTION_BASE_FROM, hasta: fc.historico.at(-1)?.periodo ?? DATA_MAX, excluye_pandemia: true },
    ...fc,
  };
}

export function getCompare(p: CompareParams): CompareResult {
  if (!validateCompareRanges(p).ok) throw rangeError();
  if (p.regiones.length < 2 || p.regiones.length > 5) {
    throw new ApiError({ status: 400, code: "VALIDATION_ERROR", message: "Selecciona entre 2 y 5 regiones.", retryable: false });
  }
  const { seriesByRegion } = getDb();
  return {
    base: { desde: p.base_desde, hasta: p.base_hasta },
    comparacion: { desde: p.comp_desde, hasta: p.comp_hasta },
    filas: p.regiones.map((c) => {
      const pts = seriesByRegion.get(c) ?? [];
      const base = sumRange(pts, p.base_desde, p.base_hasta);
      const comparacion = sumRange(pts, p.comp_desde, p.comp_hasta);
      return { region: regionOrThrow(c), base, comparacion, variacion_pct: variationTotals(base, comparacion) };
    }),
  };
}

export function filterDirectory(q: Omit<DirectoryQuery, "page" | "pageSize">): Establecimiento[] {
  const needle = q.q ? normalizeForSearch(q.q) : "";
  return getDb().directory.filter((e) =>
    (!q.departamento || e.departamento_codigo === q.departamento) &&
    (!q.provincia || e.provincia === q.provincia) &&
    (!q.clase || e.clase === q.clase) &&
    (!q.categoria || e.categoria === q.categoria) &&
    (!needle || normalizeForSearch(e.nombre_comercial).includes(needle) || e.ruc.includes(needle)),
  );
}

export function searchDirectory(q: DirectoryQuery): DirectoryResult {
  const all = filterDirectory(q);
  const start = (q.page - 1) * q.pageSize;
  return { items: all.slice(start, start + q.pageSize), total: all.length, page: q.page, pageSize: q.pageSize, agregados: aggregateCapacity(all) };
}
