/**
 * Hooks de casos de uso. Solo conocen los puertos (useServices); nunca el mock ni fetch.
 */
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DATA_MAX, DATA_MIN } from "@/config/constants";
import { useServices } from "@/app/providers/ServicesProvider";
import type { CompareParams } from "@/domain/models/comparativo";
import type { DirectoryQuery } from "@/domain/models/establecimiento";
import type { RegionCode } from "@/domain/models/region";
import type { ExportParams, ForecastParams, SeasonParams } from "@/services/ports";
import { queryKeys } from "./queryKeys";

export function useOffers() {
  const s = useServices();
  return useQuery({ queryKey: queryKeys.regions.all, queryFn: () => s.regions.list() });
}

export function useOffer(c: RegionCode) {
  const s = useServices();
  return useQuery({ queryKey: queryKeys.regions.one(c), queryFn: () => s.regions.getOne(c) });
}

/** Fecha de corte del directorio (para DataCoverageNote y etiquetas de vigencia). */
export function useDirectoryCutoff(): string | null {
  const q = useOffers();
  return q.data?.[0]?.oferta_actual.fecha_corte ?? null;
}

export function useSeries(regiones: RegionCode[], desde: string, hasta: string) {
  const s = useServices();
  return useQuery({
    queryKey: queryKeys.series(regiones, desde, hasta),
    queryFn: () => s.series.get({ regiones, desde, hasta }),
    placeholderData: keepPreviousData,
  });
}

/** Dashboard: último mes cerrado de la serie TT/TT (derivado, no hardcodeado). */
export function useLatestPoint(c: RegionCode) {
  const q = useSeries([c], DATA_MIN, DATA_MAX);
  const latest = useMemo(() => {
    const list = q.data?.filter((p) => p.region.codigo === c) ?? [];
    return list.length ? list[list.length - 1] : null;
  }, [q.data, c]);
  return { ...q, latest };
}

export function useSeason(p: SeasonParams, enabled = true) {
  const s = useServices();
  return useQuery({ queryKey: queryKeys.season(p), queryFn: () => s.season.get(p), enabled, placeholderData: keepPreviousData });
}

export function useForecast(p: ForecastParams) {
  const s = useServices();
  return useQuery({ queryKey: queryKeys.forecast(p), queryFn: () => s.forecast.get(p) });
}

export function useCompare(p: CompareParams | null) {
  const s = useServices();
  return useQuery({
    queryKey: p ? queryKeys.compare(p) : ["compare", "idle"],
    queryFn: () => s.compare.get(p as CompareParams),
    enabled: p !== null,
  });
}

export function useDirectory(p: DirectoryQuery) {
  const s = useServices();
  return useQuery({ queryKey: queryKeys.directory(p), queryFn: () => s.directory.search(p), placeholderData: keepPreviousData });
}

export function useExport() {
  const s = useServices();
  return useMutation({
    mutationFn: async (p: ExportParams) => {
      const { blob, filename } = await s.export.download(p);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return filename;
    },
  });
}
