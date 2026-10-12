import { createFileRoute } from "@tanstack/react-router";
import { Bed, BedDouble, Building2, Globe2, Moon, Percent, Users } from "lucide-react";
import { ChartCard, StatCard } from "@/components/common/cards";
import { RegionSelect } from "@/components/common/selectors";
import { QualityBanner, Val } from "@/components/common/states";
import { TrendLineChart } from "@/components/charts/charts";
import { ExportMenu, PageHeader } from "@/components/layout/PageHeader";
import { CAPACITY_WARNING_PCT, DATA_MAX, DATA_MIN } from "@/config/constants";
import { fmtDate, fmtDays, fmtInt, fmtMonthLong, fmtPct } from "@/domain/format";
import { regionName } from "@/domain/regions";
import { useLatestPoint, useOffer, useSeries } from "@/features/hooks";
import { useUiStore } from "@/features/ui-store";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const region = useUiStore((s) => s.selectedRegion);
  const setRegion = useUiStore((s) => s.setRegion);
  const { latest, ...latestQ } = useLatestPoint(region);
  const offer = useOffer(region);
  const series = useSeries([region], DATA_MIN, DATA_MAX);
  const o = offer.data?.oferta_actual;
  return (
    <>
      <PageHeader eyebrow="Dashboard Regional" title={regionName(region)}
        description={latest ? `Último mes cerrado: ${fmtMonthLong(latest.periodo)}. Oferta formal al ${o ? fmtDate(o.fecha_corte) : "…"}.` : "Indicadores del último mes disponible y oferta formal de hospedaje."}
        actions={<div className="flex items-end gap-3"><RegionSelect value={region} onChange={(c) => c && setRegion(c)} /><ExportMenu reporte="dashboard" filtros={{ region }} /></div>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de arribos" icon={<Users className="size-4" />} value={<Val v={latest?.arribos} f={fmtInt} />} footer="Personas que llegan en el mes" />
        <StatCard label="Arribos nacionales" icon={<Users className="size-4" />} value={<Val v={latest?.arribos_nac} f={fmtInt} />} />
        <StatCard label="Arribos extranjeros" icon={<Globe2 className="size-4" />} value={<Val v={latest?.arribos_ext} f={fmtInt} />} />
        <StatCard label="Pernoctaciones" icon={<Moon className="size-4" />} value={<Val v={latest?.pernoct} f={fmtInt} />} footer="Noches de estadía" />
        <StatCard label="Ocupación de habitaciones" icon={<Percent className="size-4" />} value={<Val v={latest?.tnoh} f={(n) => fmtPct(n)} />} />
        <StatCard label="Ocupación de camas" icon={<Percent className="size-4" />} value={<Val v={latest?.tnoc} f={(n) => fmtPct(n)} />} />
        <StatCard label="Permanencia promedio" icon={<BedDouble className="size-4" />} value={<Val v={latest?.perm} f={fmtDays} />} />
        <StatCard label="Establecimientos" icon={<Building2 className="size-4" />} value={<Val v={o?.establecimientos} f={fmtInt} />}
          footer={o ? <>Hab. <Val v={o.habitaciones} f={fmtInt} /> · Camas <Val v={o.camas} f={fmtInt} /> <Bed className="inline size-3.5" /></> : undefined} />
      </div>
      {o && o.pct_sin_dato_capacidad > CAPACITY_WARNING_PCT && (
        <div className="mt-4"><QualityBanner>El {o.pct_sin_dato_capacidad.toFixed(1)} % de hospedajes formales en esta región no registra capacidad en el padrón.</QualityBanner></div>
      )}
      <div className="mt-6">
        <ChartCard title="Arribos mensuales" description="Serie histórica de la región (2020–2021 marcado como periodo atípico; 2025 parcial)" query={latestQ} isEmpty={!series.data?.length}>
          <TrendLineChart points={series.data ?? []} metric="arribos" excludePandemic={false} label={`Arribos mensuales de ${regionName(region)}`} />
        </ChartCard>
      </div>
    </>
  );
}
