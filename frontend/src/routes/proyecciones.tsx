import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChartCard, StatCard } from "@/components/common/cards";
import { RegionSelect, Segmented } from "@/components/common/selectors";
import { Val } from "@/components/common/states";
import { ForecastChart } from "@/components/charts/charts";
import { ConfidenceGauge } from "@/components/forecast/ConfidenceGauge";
import { PageHeader } from "@/components/layout/PageHeader";
import { fmtInt, fmtMonth } from "@/domain/format";
import type { ForecastModel } from "@/domain/models/proyeccion";
import { regionName } from "@/domain/regions";
import { useForecast } from "@/features/hooks";
import { useUiStore } from "@/features/ui-store";

export const Route = createFileRoute("/proyecciones")({ component: Proyecciones });

function Proyecciones() {
  const region = useUiStore((s) => s.selectedRegion);
  const setRegion = useUiStore((s) => s.setRegion);
  const [horizonte, setH] = useState<3 | 6>(6);
  const [modelo, setModelo] = useState<ForecastModel>("media_movil");
  const q = useForecast({ region, horizonte, modelo });
  const r = q.data;
  return (
    <>
      <PageHeader eyebrow="Simulador de Proyecciones" title={`Proyección de arribos — ${regionName(region)}`}
        description="Estimación a 3 o 6 meses a partir de 2022, sin los meses de pandemia. La confianza sale de probar el método con los últimos 12 meses." />
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <RegionSelect value={region} onChange={(c) => c && setRegion(c)} />
        <Segmented label="Horizonte" value={String(horizonte) as "3" | "6"} onChange={(v) => setH(Number(v) as 3 | 6)} options={[{ value: "3", label: "3 meses" }, { value: "6", label: "6 meses" }]} />
        <Segmented label="Método" value={modelo} onChange={setModelo} options={[{ value: "media_movil", label: "Promedio móvil" }, { value: "suavizado_exp", label: "Suavizado exponencial" }]} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Arribos reales y proyectados" query={q} isEmpty={!r?.historico.length}>
          {r && <ForecastChart result={r} />}
        </ChartCard>
        <div className="space-y-4">
          <ChartCard title="Confianza" query={q} skeleton="block">{r && <ConfidenceGauge mape={r.mape} confiable={r.confiable} />}</ChartCard>
          <StatCard label="Error absoluto medio" value={<Val v={r?.mae} f={fmtInt} />} footer="Arribos de diferencia promedio en la prueba" />
          <StatCard label="Error porcentual medio" value={<Val v={r?.mape} f={(n) => `${n.toFixed(1)} %`} />} />
        </div>
      </div>
      {r && (
        <ChartCard className="mt-6" title="Valores proyectados">
          <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{r.proyeccion.map((p) => <li key={p.periodo} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{fmtMonth(p.periodo)}</p><p className="font-display text-lg tabular-nums">{fmtInt(p.valor)}</p></li>)}</ul>
        </ChartCard>
      )}
    </>
  );
}
