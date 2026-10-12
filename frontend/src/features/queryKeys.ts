import type { CompareParams } from "@/domain/models/comparativo";
import type { DirectoryQuery } from "@/domain/models/establecimiento";
import type { ForecastParams, SeasonParams } from "@/services/ports";

export const queryKeys = {
  regions: { all: ["regions"] as const, one: (c: string) => ["regions", c] as const },
  series: (regiones: string[], desde: string, hasta: string) => ["series", regiones.join(","), desde, hasta] as const,
  season: (p: SeasonParams) => ["season", p] as const,
  forecast: (p: ForecastParams) => ["forecast", p] as const,
  compare: (p: CompareParams) => ["compare", p] as const,
  directory: (p: DirectoryQuery) => ["directory", p] as const,
};
