import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChartCard } from "@/components/common/cards";
import { MonthRangePicker, RegionMultiSelect } from "@/components/common/selectors";
import { GroupedArrivalsBarChart } from "@/components/charts/charts";
import { VariationTable } from "@/components/compare/VariationTable";
import { ExportMenu, PageHeader } from "@/components/layout/PageHeader";
import { COMPARE_MIN_REGIONS, MSG_MIN_REGIONS } from "@/config/constants";
import { validateCompareRanges } from "@/domain/compare";
import { fmtMonth } from "@/domain/format";
import { comparePeriods } from "@/domain/periods";
import { useCompare } from "@/features/hooks";

export const Route = createFileRoute("/comparador")({ component: Comparador });
const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

function Comparador() {
  const [regiones, setRegiones] = useState<string[]>(["04", "08", "15"]);
  const [base, setBase] = useState({ desde: "2023-01", hasta: "2023-12" });
  const [comp, setComp] = useState({ desde: "2024-01", hasta: "2024-12" });
  const p = { regiones, base_desde: base.desde, base_hasta: base.hasta, comp_desde: comp.desde, comp_hasta: comp.hasta };
  const ok = regiones.length >= COMPARE_MIN_REGIONS && comparePeriods(base.desde, base.hasta) <= 0 && comparePeriods(comp.desde, comp.hasta) <= 0 && validateCompareRanges(p).ok;
  const q = useCompare(ok ? p : null);
  return (
    <>
      <PageHeader eyebrow="Comparador Interregional" title="Compara regiones entre dos periodos"
        description="Elige de 2 a 5 regiones, un periodo base y otro de comparación. Se muestran los arribos y su variación porcentual."
        actions={<ExportMenu reporte="comparador" filtros={p} disabled={!ok} />} />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div><RegionMultiSelect value={regiones} onChange={setRegiones} invalid={regiones.length < COMPARE_MIN_REGIONS} />{regiones.length < COMPARE_MIN_REGIONS && <p className="mt-2 text-sm text-negative">{MSG_MIN_REGIONS}</p>}</div>
        <MonthRangePicker desde={base.desde} hasta={base.hasta} onChange={setBase} years={YEARS} labels={["Base desde", "Base hasta"]} />
        <MonthRangePicker desde={comp.desde} hasta={comp.hasta} onChange={setComp} years={YEARS} labels={["Comparación desde", "Comparación hasta"]} />
      </div>
      <div className="space-y-6">
        <ChartCard title="Variación de arribos" description={`Base ${fmtMonth(base.desde)} – ${fmtMonth(base.hasta)} · Comparación ${fmtMonth(comp.desde)} – ${fmtMonth(comp.hasta)}`} query={ok ? q : undefined} isEmpty={!ok || !q.data?.filas.length} emptyText="Completa los filtros para comparar">
          {q.data && <VariationTable rows={q.data.filas} order={regiones} />}
        </ChartCard>
        {q.data && <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Periodo base"><GroupedArrivalsBarChart rows={q.data.filas} period="base" /></ChartCard>
          <ChartCard title="Periodo de comparación"><GroupedArrivalsBarChart rows={q.data.filas} period="comparacion" /></ChartCard>
        </div>}
      </div>
    </>
  );
}
