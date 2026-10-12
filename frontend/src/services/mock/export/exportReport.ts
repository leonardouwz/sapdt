import { CAPACITY_WARNING_PCT, DATA_MAX, DATA_MIN, LABEL_PANDEMIC, LABEL_PARTIAL, PDF_MAX_ROWS } from "@/config/constants";
import { NO_DATA, fmtDate, fmtDays, fmtInt, fmtMonth, fmtMonthLong, fmtMonthName, fmtNoData, fmtPct, fmtVar } from "@/domain/format";
import type { CategoriaDir, ClaseDir } from "@/domain/models/establecimiento";
import type { Metric } from "@/domain/models/series";
import { rangeTouchesPandemic, rangeTouchesPartial, todayCompact } from "@/domain/periods";
import { regionName, regionSlug } from "@/domain/regions";
import { toTitleCase } from "@/domain/titleCase";
import type { ExportParams } from "../../ports";
import * as q from "../queries";
import { FECHA_CORTE } from "../seed/generateDirectory";
import { toCsv } from "./csv";
import { buildPdf } from "./pdf";

const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const coverage = `Serie ${fmtMonth(DATA_MIN).toLowerCase()} – ${fmtMonth(DATA_MAX).toLowerCase()} · Directorio al ${fmtDate(FECHA_CORTE)}`;
const LEVEL: Record<string, string> = { alta: "Temporada Alta", media: "Temporada Media", baja: "Temporada Baja" };

export async function exportReport(p: ExportParams): Promise<{ blob: Blob; filename: string }> {
  const f = p.filtros;
  let slug = "multi";
  let blob: Blob;

  if (p.reporte === "dashboard") {
    const region = str(f.region, "04");
    slug = regionSlug(region);
    const pts = q.getSeries({ regiones: [region], desde: DATA_MIN, hasta: DATA_MAX });
    const last = pts.at(-1);
    const o = q.getOffer(region).oferta_actual;
    const rows: [string, number | null, string][] = [
      ["total_arribos", last?.arribos ?? null, "personas"],
      ["arribos_nacionales", last?.arribos_nac ?? null, "personas"],
      ["arribos_extranjeros", last?.arribos_ext ?? null, "personas"],
      ["total_pernoctaciones", last?.pernoct ?? null, "noches"],
      ["tasa_ocupacion_habitaciones", last?.tnoh ?? null, "%"],
      ["tasa_ocupacion_camas", last?.tnoc ?? null, "%"],
      ["establecimientos_clasificados", o.establecimientos, "establecimientos"],
      ["habitaciones_totales", o.habitaciones, "habitaciones"],
      ["camas_totales", o.camas, "camas"],
      ["pct_sin_dato_capacidad", o.pct_sin_dato_capacidad, "%"],
    ];
    if (p.formato === "csv") {
      blob = toCsv(["indicador", "valor", "unidad"], [...rows, ["fecha_corte_directorio", null, o.fecha_corte] as [string, null, string]]);
    } else {
      blob = await buildPdf({
        title: "Dashboard Regional", coverage,
        filtros: `Región: ${regionName(region)} · Último mes cerrado: ${last ? fmtMonthLong(last.periodo) : NO_DATA}`,
        sections: [
          { heading: `Indicadores — ${last ? fmtMonthLong(last.periodo) : NO_DATA}`, table: { head: ["Indicador", "Valor"], body: [
            ["Total de arribos", fmtNoData(last?.arribos, fmtInt)],
            ["Arribos nacionales", fmtNoData(last?.arribos_nac, fmtInt)],
            ["Arribos extranjeros", fmtNoData(last?.arribos_ext, fmtInt)],
            ["Total de pernoctaciones", fmtNoData(last?.pernoct, fmtInt)],
            ["Tasa neta de ocupación de habitaciones", fmtNoData(last?.tnoh, (n) => fmtPct(n))],
            ["Tasa neta de ocupación de camas", fmtNoData(last?.tnoc, (n) => fmtPct(n))],
            ["Permanencia promedio", fmtNoData(last?.perm, fmtDays)],
          ] } },
          { heading: `Oferta formal al ${fmtDate(o.fecha_corte)}`, table: { head: ["Indicador", "Valor"], body: [
            ["Establecimientos clasificados", fmtInt(o.establecimientos)],
            ["Habitaciones totales", fmtNoData(o.habitaciones, fmtInt)],
            ["Camas totales disponibles", fmtNoData(o.camas, fmtInt)],
          ] } },
          ...(o.pct_sin_dato_capacidad > CAPACITY_WARNING_PCT ? [{ lines: [`Nota: El ${o.pct_sin_dato_capacidad.toFixed(1)}% de hospedajes formales en esta región no registra capacidad en el padrón`] }] : []),
        ],
      });
    }
  } else if (p.reporte === "tendencias") {
    const region = str(f.region, "04");
    slug = regionSlug(region);
    const desde = str(f.desde, DATA_MIN), hasta = str(f.hasta, DATA_MAX);
    const metrica = (str(f.metrica, "arribos") as Metric);
    const excl = f.excluirPandemia !== false;
    const pts = q.getSeries({ regiones: [region], desde, hasta });
    const season = q.getSeason({ region, desde, hasta, metrica, excluirPandemia: excl });
    const levelOf = (mes: number) => season.meses[mes - 1].nivel;
    const metricLabel = metrica === "arribos" ? "Arribos" : "Pernoctaciones";
    if (p.formato === "csv") {
      blob = toCsv(["periodo", "region_codigo", "region", "metrica", "valor", "atipico", "parcial", "temporada_del_mes"],
        pts.map((s) => [s.periodo, region, regionName(region), metrica, excl && s.atipico ? null : s[metrica], s.atipico, s.parcial, levelOf(s.mes)]));
    } else {
      blob = await buildPdf({
        title: "Tendencias y Temporadas", coverage,
        filtros: `Región: ${regionName(region)} · Métrica: ${metricLabel} · Rango: ${fmtMonth(desde)} – ${fmtMonth(hasta)} · ${excl ? "Excluye 2020-2021" : "Incluye 2020-2021"}`,
        sections: [
          { heading: `${metricLabel} mensuales — ${regionName(region)}`, chartElementId: str(f.chartId) || undefined,
            lines: [rangeTouchesPandemic(desde, hasta) ? `${LABEL_PANDEMIC}${excl ? " (excluido)" : ""}` : "", rangeTouchesPartial(desde, hasta) ? LABEL_PARTIAL : ""].filter(Boolean) },
          { heading: "Semáforo de estacionalidad", table: { head: ["Mes", "Promedio", "Temporada", "Años"], body: season.meses.map((m) => [
            fmtMonthName(m.mes), fmtNoData(m.valor_promedio, fmtInt), m.nivel ? LEVEL[m.nivel] : NO_DATA, String(m.n_observaciones),
          ]) } },
        ],
      });
    }
  } else if (p.reporte === "comparador") {
    const regiones = Array.isArray(f.regiones) ? (f.regiones as string[]) : [];
    const params = { regiones, base_desde: str(f.base_desde), base_hasta: str(f.base_hasta), comp_desde: str(f.comp_desde), comp_hasta: str(f.comp_hasta) };
    const r = q.getCompare(params);
    if (p.formato === "csv") {
      blob = toCsv(["region_codigo", "region", "arribos_base", "arribos_comparacion", "variacion_total_pct", "variacion_nacional_pct", "variacion_extranjera_pct"],
        r.filas.map((x) => [x.region.codigo, x.region.nombre, x.base.arribos, x.comparacion.arribos, x.variacion_pct.arribos, x.variacion_pct.arribos_nac, x.variacion_pct.arribos_ext]));
    } else {
      const notes: string[] = [];
      if (rangeTouchesPandemic(params.base_desde, params.base_hasta) || rangeTouchesPandemic(params.comp_desde, params.comp_hasta)) notes.push("Incluye periodo atípico (2020-2021)");
      if (rangeTouchesPartial(params.base_desde, params.base_hasta) || rangeTouchesPartial(params.comp_desde, params.comp_hasta)) notes.push("Incluye 2025 (Año Parcial)");
      blob = await buildPdf({
        title: "Comparador Interregional", coverage,
        filtros: `Regiones: ${r.filas.map((x) => x.region.nombre).join(", ")} · Base: ${fmtMonth(params.base_desde)} – ${fmtMonth(params.base_hasta)} · Comparación: ${fmtMonth(params.comp_desde)} – ${fmtMonth(params.comp_hasta)}`,
        sections: [
          { heading: "Arribos nacionales y extranjeros", chartElementId: str(f.chartId) || undefined, lines: notes },
          { heading: "Variación porcentual", table: { head: ["Región", "Arribos base", "Arribos comparación", "Var. total", "Var. nacional", "Var. extranjera"], body: r.filas.map((x) => [
            x.region.nombre, fmtNoData(x.base.arribos, fmtInt), fmtNoData(x.comparacion.arribos, fmtInt),
            fmtNoData(x.variacion_pct.arribos, (n) => fmtVar(n)), fmtNoData(x.variacion_pct.arribos_nac, (n) => fmtVar(n)), fmtNoData(x.variacion_pct.arribos_ext, (n) => fmtVar(n)),
          ]) } },
        ],
      });
    }
  } else {
    const dep = str(f.departamento) || undefined;
    if (dep) slug = regionSlug(dep);
    const list = q.filterDirectory({ departamento: dep, clase: (str(f.clase) || undefined) as ClaseDir | undefined, categoria: (str(f.categoria) || undefined) as CategoriaDir | undefined, q: str(f.q) || undefined });
    if (p.formato === "csv") {
      blob = toCsv(["ruc", "nombre_comercial", "razon_social", "clase", "categoria", "departamento_codigo", "departamento", "provincia", "distrito", "direccion", "habitaciones", "camas", "telefono", "email", "nro_certificado", "fecha_corte"],
        list.map((e) => [e.ruc, toTitleCase(e.nombre_comercial), toTitleCase(e.razon_social), e.clase, e.categoria, e.departamento_codigo, e.departamento, toTitleCase(e.provincia), toTitleCase(e.distrito), e.direccion ? toTitleCase(e.direccion) : null, e.habitaciones, e.camas, e.telefono, e.email, e.nro_certificado, e.fecha_corte]));
    } else {
      const shown = list.slice(0, PDF_MAX_ROWS);
      blob = await buildPdf({
        title: "Explorador del Directorio", coverage,
        filtros: `Región: ${dep ? regionName(dep) : "Todas las regiones"} · Clase: ${str(f.clase) || "Todas"} · Categoría: ${str(f.categoria) || "Todas"}${str(f.q) ? ` · Búsqueda: "${str(f.q)}"` : ""}`,
        sections: [{
          heading: `Oferta formal al ${fmtDate(FECHA_CORTE)} — ${fmtInt(list.length)} establecimientos`,
          lines: list.length > PDF_MAX_ROWS ? [`Se muestran las primeras ${PDF_MAX_ROWS} de ${fmtInt(list.length)}; usa CSV para el total`] : [],
          table: { head: ["Nombre comercial", "RUC", "Clase", "Categoría", "Ubicación", "Hab.", "Camas"], body: shown.map((e) => [
            toTitleCase(e.nombre_comercial), e.ruc, e.clase, e.categoria, `${toTitleCase(e.distrito)}, ${e.departamento}`,
            fmtNoData(e.habitaciones, fmtInt), fmtNoData(e.camas, fmtInt),
          ]) },
        }],
      });
    }
  }
  return { blob, filename: `sapdt_${p.reporte}_${slug}_${todayCompact()}.${p.formato}` };
}
