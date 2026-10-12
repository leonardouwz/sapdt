import { DATA_MAX, DATA_MIN } from "@/config/constants";
import type { SeriesPoint } from "@/domain/models/series";
import { isPandemicYear, isPartialYear, parsePeriod } from "@/domain/periods";
import { REGIONS } from "@/domain/regions";
import { round } from "@/domain/stats";
import { ARCHETYPE_SEASON, NATIONAL_NAC, PROFILES, directoryCounts } from "./regions-profile";
import { between, mulberry32, SEED } from "./rng";

export interface RawSeriesRow extends SeriesPoint {
  id_clase: string;
  id_categoria: string;
}

const IMPACT_2020 = [1, 1, 0.45, 0.02, 0.02, 0.05, 0.15, 0.2, 0.25, 0.35, 0.35, 0.4];
const IMPACT_2021 = Array.from({ length: 12 }, (_, i) => 0.3 + ((0.85 - 0.3) * i) / 11);
const impact = (anio: number, mes: number) =>
  anio === 2020 ? IMPACT_2020[mes - 1] : anio === 2021 ? IMPACT_2021[mes - 1] : 1;
const extImpact = (anio: number, mes: number) =>
  anio === 2020 ? IMPACT_2020[mes - 1] : anio === 2021 ? 0.35 + (0.45 * (mes - 1)) / 11 : 1;

const ANCHOR_AREQUIPA_2024_01 = {
  n_establecimientos: 1632, n_habitaciones: 18814, n_plazas_cama: 32600,
  tnoh: 19.57, tnoc: 16.17, perm: 1.45, perm_nac: 1.4, perm_ext: 1.71,
  arribos: 123630, arribos_nac: 103470, arribos_ext: 20160,
  pernoct: 183164, pernoct_nac: 146643, pernoct_ext: 36521, empleo: 3314,
};
const SUSPICIOUS: Record<string, number> = {
  "07|2018-03": 244.89, "15|2016-08": 112.4, "25|2025-06": 101.3,
};

export function generateSeries(): RawSeriesRow[] {
  const rng = mulberry32(SEED);
  const dir = directoryCounts();
  const rows: RawSeriesRow[] = [];
  const { anio: y0 } = parsePeriod(DATA_MIN);
  const { anio: y1, mes: lastMonth } = parsePeriod(DATA_MAX);

  for (const region of REGIONS) {
    const prof = PROFILES[region.codigo];
    const shape = ARCHETYPE_SEASON[prof.archetype];
    const shapeMean = shape.reduce((a, b) => a + b, 0) / 12;
    const norm = shape.map((s) => s / shapeMean);
    const permBase = between(rng, 1.3, 2.1);
    const tnohBase = between(rng, 18, 42);
    const tnocRatio = between(rng, 0.78, 0.86);

    for (let anio = y0; anio <= y1; anio++) {
      const months = anio === y1 ? lastMonth : 12;
      const weights = Array.from({ length: months }, (_, i) =>
        norm[i] * (1 + between(rng, -0.04, 0.04)) * impact(anio, i + 1),
      );
      const wSum = weights.reduce((a, b) => a + b, 0);
      const annual = (NATIONAL_NAC[anio] * prof.share) / 100;
      const growth = 1 + (anio - y0) * 0.012;

      for (let mes = 1; mes <= months; mes++) {
        const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
        const nac = Math.round((annual * weights[mes - 1]) / wSum);
        const ext = Math.round(
          ((nac * prof.extShare) / (1 - prof.extShare)) * extImpact(anio, mes) * (1 + between(rng, -0.05, 0.05)),
        );
        const permNac = round(permBase * (1 + between(rng, -0.04, 0.04)), 2);
        const permExt = round(permBase + 0.25, 2);
        const pernNac = Math.round(nac * permNac);
        const pernExt = Math.round(ext * permExt);
        const arribos = nac + ext;
        const pernoct = pernNac + pernExt;
        const occ = Math.max(0.02, impact(anio, mes));
        const tnoh = round(Math.min(98, tnohBase * norm[mes - 1] * occ * (1 + between(rng, -0.03, 0.03))), 2);
        const nEst = Math.round(dir[region.codigo] * 3.5 * growth);
        let point: RawSeriesRow = {
          anio, mes, periodo, region,
          n_establecimientos: nEst,
          n_habitaciones: Math.round(nEst * 11.5),
          n_plazas_cama: Math.round(nEst * 20),
          tnoh, tnoc: round(tnoh * tnocRatio, 2),
          perm: arribos > 0 ? round(pernoct / arribos, 2) : null,
          perm_nac: permNac, perm_ext: permExt,
          arribos, arribos_nac: nac, arribos_ext: ext,
          pernoct, pernoct_nac: pernNac, pernoct_ext: pernExt,
          empleo: Math.round(arribos * 0.027),
          atipico: isPandemicYear(anio), parcial: isPartialYear(anio), sospechosa: false,
          id_clase: "TT", id_categoria: "TT",
        };
        if (region.codigo === "04" && periodo === "2024-01") point = { ...point, ...ANCHOR_AREQUIPA_2024_01 };
        const sus = SUSPICIOUS[`${region.codigo}|${periodo}`];
        if (sus !== undefined) point.tnoh = sus;
        point.sospechosa = point.tnoh !== null && (point.tnoh < 0 || point.tnoh > 100);
        rows.push(point);

        // Filas de detalle (Hotel, Hostal, no clasificado): NO deben sumarse con el total.
        const parts: [string, number][] = [["01", 0.55], ["03", 0.35], ["00", 0.1]];
        for (const [clase, f] of parts) {
          const scale = (v: number | null) => (v === null ? null : Math.round(v * f));
          rows.push({
            ...point,
            id_clase: clase, id_categoria: "TT",
            arribos: scale(point.arribos), arribos_nac: scale(point.arribos_nac), arribos_ext: scale(point.arribos_ext),
            pernoct: scale(point.pernoct), pernoct_nac: scale(point.pernoct_nac), pernoct_ext: scale(point.pernoct_ext),
          });
        }
      }
    }
  }
  return rows;
}
