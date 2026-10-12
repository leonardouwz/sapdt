import type { CompareParams, CompareResult } from "@/domain/models/comparativo";
import type { DirectoryQuery, DirectoryResult } from "@/domain/models/establecimiento";
import type { OfertaActual } from "@/domain/models/oferta";
import type { ForecastModel, ForecastResult } from "@/domain/models/proyeccion";
import type { RegionCode } from "@/domain/models/region";
import type { Metric, Period, SeriesPoint } from "@/domain/models/series";
import type { SeasonResult } from "@/domain/models/temporada";

/** Puertos: correspondencia 1:1 con los endpoints HTTP del backend. */
export interface RegionsApi {
  list(): Promise<OfertaActual[]>; // GET /api/regiones
  getOne(codigo: RegionCode): Promise<OfertaActual>; // GET /api/regiones/{codigo}
}
export interface SeriesApi {
  get(p: { regiones: RegionCode[]; desde: Period; hasta: Period; metrica?: Metric }): Promise<SeriesPoint[]>; // GET /api/series
}
export interface SeasonParams {
  region: RegionCode; desde?: Period; hasta?: Period; excluirPandemia?: boolean; metrica?: Metric; p_alta?: number; p_baja?: number;
}
export interface SeasonApi { get(p: SeasonParams): Promise<SeasonResult> } // GET /api/temporada
export interface ForecastParams { region: RegionCode; horizonte: 3 | 6; modelo: ForecastModel }
export interface ForecastApi { get(p: ForecastParams): Promise<ForecastResult> } // GET /api/proyeccion
export interface CompareApi { get(p: CompareParams): Promise<CompareResult> } // GET /api/comparativo
export interface DirectoryApi { search(p: DirectoryQuery): Promise<DirectoryResult> } // GET /api/establecimientos

export type ReportKind = "dashboard" | "tendencias" | "comparador" | "directorio";
export interface ExportParams { reporte: ReportKind; formato: "csv" | "pdf"; filtros: Record<string, unknown> }
export interface ExportApi { download(p: ExportParams): Promise<{ blob: Blob; filename: string }> } // GET /api/export/{reporte}

export interface Services {
  regions: RegionsApi;
  series: SeriesApi;
  season: SeasonApi;
  forecast: ForecastApi;
  compare: CompareApi;
  directory: DirectoryApi;
  export: ExportApi;
}
