import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChartCard } from "@/components/common/cards";
import { MetricToggle, MonthRangePicker, RegionSelect, Segmented } from "@/components/common/selectors";
import { TrendLineChart } from "@/components/charts/charts";
import { ExportMenu, PageHeader } from "@/components/layout/PageHeader";
import { SeasonMatrix } from "@/components/season/SeasonMatrix";
import { DATA_MAX, DATA_MIN } from "@/config/constants";
import { comparePeriods } from "@/domain/periods";
import { regionName } from "@/domain/regions";
import type { Metric } from "@/domain/models/series";
import { useSeason, useSeries } from "@/features/hooks";
import { useUiStore } from "@/features/ui-store";

export const Route = createFileRoute("/tendencias")({ component: Tendencias });
const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

function Tendencias() {
  const region = useUiStore((s) => s.selectedRegion);
  const setRegion = useUiStore((s) => s.setRegion);
  const [metrica, setMetrica] = useState<Metric>("arribos");
  const [range, setRange] = useState({ desde: DATA_MIN, hasta: DATA_MAX });
  const [excl, setExcl] = useState(true);
  const valid = comparePeriods(range.desde, range.hasta) <= 0;
  const series = useSeries([region], range.desde, range.hasta);
  const season = useSeason({ region, desde: range.desde, hasta: range.hasta, metrica, excluirPandemia: excl }, valid);
  return (
    <>
      <PageHeader eyebrow="Tendencias y Temporadas" title={`Tendencias de ${regionName(region)}`}
        description="Evolución mensual y semáforo de temporadas alta, media y baja, calculado con los promedios de cada mes del año."
        actions={<ExportMenu reporte="tendencias" filtros={{ region, metrica, desde: range.desde, hasta: range.hasta, excluirPandemia: excl }} disabled={!valid} />} />
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <RegionSelect value={region} onChange={(c) => c && setRegion(c)} />
        <MetricToggle value={metrica} onChange={setMetrica} />
        <MonthRangePicker desde={range.desde} hasta={range.hasta} onChange={setRange} years={YEARS} />
        <Segmented label="Pandemia" value={excl ? "si" : "no"} onChange={(v) => setExcl(v === "si")} options={[{ value: "si", label: "Excluir 2020-2021" }, { value: "no", label: "Incluir 2020-2021" }]} />
      </div>
      <div className="space-y-6">
        <ChartCard title={metrica === "arribos" ? "Arribos mensuales" : "Pernoctaciones mensuales"} query={series} isEmpty={!series.data?.length}>
          <TrendLineChart points={series.data ?? []} metric={metrica} excludePandemic={excl} label={`Serie de ${regionName(region)}`} />
        </ChartCard>
        <ChartCard title="Semáforo de estacionalidad" description="Alta: por encima del percentil 75 de los promedios mensuales; baja: por debajo del 25." query={season} skeleton="matrix" isEmpty={!season.data}>
          {season.data && <SeasonMatrix meses={season.data.meses} excluded={season.data.excluye_pandemia} />}
        </ChartCard>
      </div>
    </>
  );
}
