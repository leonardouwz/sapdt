import type { Services } from "../ports";
import { createHttpClient } from "./httpClient";
import * as m from "./mappers";

/** Adaptadores HTTP: implementados pero no usados por defecto (VITE_DATA_SOURCE=http los activa). */
export function createHttpServices(baseUrl: string): Services {
  const http = createHttpClient(baseUrl);
  return {
    regions: {
      list: async () => (await http.getJson<m.RawOferta[]>("/regiones")).map(m.mapOferta),
      getOne: async (c) => m.mapOferta(await http.getJson<m.RawOferta>(`/regiones/${c}`)),
    },
    series: {
      get: async (p) => (await http.getJson<m.RawSeriesPoint[]>("/series", { region: p.regiones, desde: p.desde, hasta: p.hasta, metrica: p.metrica })).map(m.mapSeriesPoint),
    },
    season: {
      get: async (p) => m.mapSeason(await http.getJson<m.RawSeason>("/temporada", { region: p.region, desde: p.desde, hasta: p.hasta, excluir_pandemia: p.excluirPandemia, metrica: p.metrica, p_alta: p.p_alta, p_baja: p.p_baja })),
    },
    forecast: { get: async (p) => m.mapForecast(await http.getJson<m.RawForecast>("/proyeccion", { ...p })) },
    compare: { get: async (p) => m.mapCompare(await http.getJson<m.RawCompare>("/comparativo", { ...p })) },
    directory: { search: async (p) => m.mapDirectory(await http.getJson<m.RawDirectory>("/establecimientos", { ...p })) },
    export: {
      download: async (p) => {
        const params: Record<string, string> = { formato: p.formato };
        for (const [k, v] of Object.entries(p.filtros)) if (v !== undefined && v !== null && k !== "chartId") params[k] = Array.isArray(v) ? v.join(",") : String(v);
        const r = await http.getBlob(`/export/${p.reporte}`, params);
        return { blob: r.blob, filename: r.filename ?? `sapdt_${p.reporte}.${p.formato}` };
      },
    },
  };
}
