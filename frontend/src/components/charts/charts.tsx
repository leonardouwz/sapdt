import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LABEL_PANDEMIC, LABEL_PARTIAL } from "@/config/constants";
import { NO_DATA, fmtCompact, fmtInt, fmtMonth } from "@/domain/format";
import type { CompareRow } from "@/domain/models/comparativo";
import type { ForecastResult } from "@/domain/models/proyeccion";
import type { SeriesPoint, Metric } from "@/domain/models/series";

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const tipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--popover-foreground)", fontSize: 12 };

interface TrendRow { periodo: string; valor: number | null; atipico: boolean; parcial: boolean }

export function TrendLineChart({ points, metric, excludePandemic, label }: { points: SeriesPoint[]; metric: Metric; excludePandemic: boolean; label: string }) {
  const data: TrendRow[] = points.map((p) => ({ periodo: p.periodo, valor: excludePandemic && p.atipico ? null : p[metric], atipico: p.atipico, parcial: p.parcial }));
  const pand = data.filter((d) => d.atipico);
  const part = data.filter((d) => d.parcial);
  const ticks = data.filter((d) => d.periodo.endsWith("-01")).map((d) => d.periodo);
  return (
    <figure aria-label={label}>
      <div className="h-[340px] min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            {pand.length > 0 && (
              <ReferenceArea x1={pand[0].periodo} x2={pand[pand.length - 1].periodo} fill="var(--atypical)" fillOpacity={0.7}
                label={{ value: `${LABEL_PANDEMIC}${excludePandemic ? " (excluido)" : ""}`, position: "insideTop", fill: "var(--atypical-foreground)", fontSize: 11 }} />
            )}
            {part.length > 0 && (
              <ReferenceArea x1={part[0].periodo} x2={part[part.length - 1].periodo} fill="var(--partial)" fillOpacity={0.18} stroke="var(--partial)" strokeDasharray="3 3"
                label={{ value: LABEL_PARTIAL, position: "top", fill: "var(--foreground)", fontSize: 11 }} />
            )}
            <XAxis dataKey="periodo" ticks={ticks} tickFormatter={(p: string) => p.slice(0, 4)} {...axis} tickLine={false} />
            <YAxis tickFormatter={fmtCompact} {...axis} width={64} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tipStyle} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
              labelFormatter={(p) => { const d = data.find((x) => x.periodo === p); return `${fmtMonth(String(p))}${d?.atipico ? " · Atípico" : ""}${d?.parcial ? " · Año parcial" : ""}`; }}
              formatter={(v) => [typeof v === "number" ? fmtInt(v) : NO_DATA, metric === "arribos" ? "Arribos" : "Pernoctaciones"]} />
            <Line type="monotone" dataKey="valor" stroke="var(--primary)" strokeWidth={2.25} dot={false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-primary" aria-hidden /> Serie mensual</span>
        <span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-atypical" aria-hidden /> {LABEL_PANDEMIC}</span>
        <span className="flex items-center gap-2"><span className="bg-partial-stripes size-3 rounded-sm border border-partial" aria-hidden /> {LABEL_PARTIAL}</span>
      </figcaption>
    </figure>
  );
}

export function ForecastChart({ result }: { result: ForecastResult }) {
  const last = result.historico.at(-1);
  const data = [
    ...result.historico.map((h) => ({ periodo: h.periodo, real: h.valor as number | null, proj: h.periodo === last?.periodo ? h.valor : (null as number | null) })),
    ...result.proyeccion.map((p) => ({ periodo: p.periodo, real: null, proj: p.valor })),
  ];
  const ticks = data.filter((d) => d.periodo.endsWith("-01") || d.periodo.endsWith("-07")).map((d) => d.periodo);
  return (
    <figure aria-label={`Proyección de arribos para ${result.region.nombre}`}>
      <div className="h-[340px] min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            {last && result.proyeccion.length > 0 && (
              <ReferenceArea x1={last.periodo} x2={result.proyeccion.at(-1)!.periodo} fill="var(--projection)" fillOpacity={0.08}
                label={{ value: "Proyección", position: "insideTop", fill: "var(--projection)", fontSize: 12, fontWeight: 600 }} />
            )}
            <XAxis dataKey="periodo" ticks={ticks} tickFormatter={(p: string) => fmtMonth(p)} {...axis} tickLine={false} />
            <YAxis tickFormatter={fmtCompact} {...axis} width={64} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tipStyle} labelFormatter={(p) => fmtMonth(String(p))}
              formatter={(v, name) => [typeof v === "number" ? fmtInt(v) : NO_DATA, name === "real" ? "Real" : "Proyectado"]} />
            <Line dataKey="real" stroke="var(--series-nacional)" strokeWidth={2.25} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line dataKey="proj" stroke="var(--projection)" strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 3.5, fill: "var(--projection)" }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-series-nacional" aria-hidden /> Real (línea continua)</span>
        <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-projection" aria-hidden /> Proyectado (línea punteada)</span>
      </figcaption>
      <ul className="sr-only">{result.proyeccion.map((p) => <li key={p.periodo}>{fmtMonth(p.periodo)}: {fmtInt(p.valor)} arribos proyectados</li>)}</ul>
    </figure>
  );
}

export function GroupedArrivalsBarChart({ rows, period }: { rows: CompareRow[]; period: "base" | "comparacion" }) {
  const data = rows.map((r) => ({ region: r.region.nombre, nac: r[period].arribos_nac, ext: r[period].arribos_ext }));
  return (
    <figure aria-label="Arribos nacionales y extranjeros por región">
      <div className="h-[340px] min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }} barGap={4}>
            <defs>
              <pattern id="stripe-ext" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--series-extranjero)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--card)" strokeWidth="2" strokeOpacity={0.5} />
              </pattern>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="region" {...axis} tickLine={false} />
            <YAxis tickFormatter={fmtCompact} {...axis} width={64} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tipStyle} cursor={{ fill: "var(--muted)" }} formatter={(v, n) => [typeof v === "number" ? fmtInt(v) : NO_DATA, n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="nac" name="Nacionales" fill="var(--series-nacional)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="ext" name="Extranjeros" fill="url(#stripe-ext)" stroke="var(--series-extranjero)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
