import type { Services } from "../ports";
import { simulate } from "./latency";
import * as q from "./queries";
import { exportReport } from "./export/exportReport";

/** Implementación Mock de todos los puertos (misma firma async, mismos DTO y errores). */
export function createMockServices(): Services {
  return {
    regions: { list: () => simulate(q.listOffers), getOne: (c) => simulate(() => q.getOffer(c)) },
    series: { get: (p) => simulate(() => q.getSeries(p)) },
    season: { get: (p) => simulate(() => q.getSeason(p)) },
    forecast: { get: (p) => simulate(() => q.getForecast(p)) },
    compare: { get: (p) => simulate(() => q.getCompare(p)) },
    directory: { search: (p) => simulate(() => q.searchDirectory(p)) },
    export: { download: async (p) => { await simulate(() => null); return exportReport(p); } },
  };
}
