import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChartCard, StatCard } from "@/components/common/cards";
import { RegionSelect } from "@/components/common/selectors";
import { QualityBanner, Val } from "@/components/common/states";
import { DirectoryCard } from "@/components/directory/DirectoryCard";
import { Pagination } from "@/components/directory/Pagination";
import { ExportMenu, PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { CAPACITY_WARNING_PCT, PAGE_SIZE } from "@/config/constants";
import { fmtInt } from "@/domain/format";
import { CATEGORIAS, CLASES, type CategoriaDir, type ClaseDir } from "@/domain/models/establecimiento";
import { useDirectory } from "@/features/hooks";

export const Route = createFileRoute("/directorio")({ component: Directorio });
const sel = "h-10 rounded-md border bg-card px-3 text-sm";

function Directorio() {
  const [f, setF] = useState<{ departamento?: string; clase?: ClaseDir; categoria?: CategoriaDir; q: string; page: number }>({ q: "", page: 1 });
  const set = (c: Partial<typeof f>) => setF((s) => ({ ...s, page: 1, ...c }));
  const query = { departamento: f.departamento, clase: f.clase, categoria: f.categoria, q: f.q || undefined, page: f.page, pageSize: PAGE_SIZE };
  const d = useDirectory(query);
  const a = d.data?.agregados;
  return (
    <>
      <PageHeader eyebrow="Explorador del Directorio" title="Oferta formal de hospedaje"
        description="Establecimientos con clasificación vigente según el padrón del MINCETUR. Es una foto a la fecha de corte, no una serie en el tiempo."
        actions={<ExportMenu reporte="directorio" filtros={{ departamento: f.departamento, clase: f.clase, categoria: f.categoria, q: f.q || undefined }} />} />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <RegionSelect allowAll value={f.departamento ?? ""} onChange={(c) => set({ departamento: c || undefined })} />
        <select aria-label="Clase" className={sel} value={f.clase ?? ""} onChange={(e) => set({ clase: (e.target.value || undefined) as ClaseDir | undefined })}>
          <option value="">Todas las clases</option>{CLASES.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Categoría" className={sel} value={f.categoria ?? ""} onChange={(e) => set({ categoria: (e.target.value || undefined) as CategoriaDir | undefined })}>
          <option value="">Todas las categorías</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select>
        <Input aria-label="Buscar por nombre o RUC" placeholder="Buscar por nombre o RUC" className="h-10 w-64" value={f.q} onChange={(e) => set({ q: e.target.value })} />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Establecimientos" value={<Val v={a?.establecimientos} f={fmtInt} />} />
        <StatCard label="Habitaciones" value={<Val v={a?.habitaciones} f={fmtInt} />} footer="Solo los que informan capacidad" />
        <StatCard label="Camas" value={<Val v={a?.camas} f={fmtInt} />} />
      </div>
      {a && a.pct_sin_dato_capacidad > CAPACITY_WARNING_PCT && <div className="mb-4"><QualityBanner>El {a.pct_sin_dato_capacidad.toFixed(1)} % de estos establecimientos no registra camas o habitaciones.</QualityBanner></div>}
      <ChartCard title="Resultados" query={d} isEmpty={!d.data?.items.length} emptyText="Ningún establecimiento coincide con los filtros">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{d.data?.items.map((e) => <DirectoryCard key={e.id} e={e} />)}</div>
        {d.data && <div className="mt-6"><Pagination page={d.data.page} pageSize={d.data.pageSize} total={d.data.total} onChange={(page) => setF((s) => ({ ...s, page }))} /></div>}
      </ChartCard>
    </>
  );
}
