/**
 * Anti-Corruption Layer: único punto editable si los nombres de campos del backend difieren del contrato §4.
 * Hoy el contrato coincide 1:1, por eso los mappers son identidades tipadas.
 */
import type { CompareResult } from "@/domain/models/comparativo";
import type { DirectoryResult } from "@/domain/models/establecimiento";
import type { OfertaActual } from "@/domain/models/oferta";
import type { ForecastResult } from "@/domain/models/proyeccion";
import type { SeriesPoint } from "@/domain/models/series";
import type { SeasonResult } from "@/domain/models/temporada";

export type RawOferta = OfertaActual;
export type RawSeriesPoint = SeriesPoint;
export type RawSeason = SeasonResult;
export type RawForecast = ForecastResult;
export type RawCompare = CompareResult;
export type RawDirectory = DirectoryResult;

export const mapOferta = (r: RawOferta): OfertaActual => r;
export const mapSeriesPoint = (r: RawSeriesPoint): SeriesPoint => r;
export const mapSeason = (r: RawSeason): SeasonResult => r;
export const mapForecast = (r: RawForecast): ForecastResult => r;
export const mapCompare = (r: RawCompare): CompareResult => r;
export const mapDirectory = (r: RawDirectory): DirectoryResult => r;
