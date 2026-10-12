import { Flame, Leaf, Minus, CircleDashed } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtInt, fmtMonthNameLong } from "@/domain/format";
import type { SeasonLevel, SeasonMonth } from "@/domain/models/temporada";
import { cn } from "@/lib/utils";
import { NoData } from "../common/states";

export const SEASON_META: Record<SeasonLevel, { label: string; icon: typeof Flame; cls: string; def: string }> = {
  alta: { label: "Temporada Alta", icon: Flame, cls: "border-season-high/50 bg-season-high/12 text-season-high", def: "Meses por encima del percentil 75." },
  media: { label: "Temporada Media", icon: Minus, cls: "border-season-mid/50 bg-season-mid/12 text-season-mid", def: "Meses intermedios." },
  baja: { label: "Temporada Baja", icon: Leaf, cls: "border-season-low/50 bg-season-low/12 text-season-low", def: "Meses por debajo del percentil 25." },
};

export function SeasonMatrix({ meses, excluded }: { meses: SeasonMonth[]; excluded: boolean }) {
  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-label="Semáforo de estacionalidad">
        {meses.map((m) => {
          const meta = m.nivel ? SEASON_META[m.nivel] : null;
          const Icon = meta?.icon ?? CircleDashed;
          return (
            <li key={m.mes}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={cn("flex h-full w-full flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-transform duration-150 hover:-translate-y-0.5", meta ? meta.cls : "border-dashed text-muted-foreground")}>
                    <span className="flex w-full items-center justify-between text-sm font-semibold text-foreground">
                      {fmtMonthNameLong(m.mes)} <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="font-display text-lg tabular-nums text-foreground">{m.valor_promedio === null ? <NoData /> : fmtInt(m.valor_promedio)}</span>
                    <span className="text-xs font-semibold">{meta ? meta.label : "Sin datos"}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Promedio de {m.n_observaciones} años en el rango</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2 border-t pt-4 text-sm">
        <div className="flex flex-wrap gap-4">
          {(Object.keys(SEASON_META) as SeasonLevel[]).map((k) => {
            const { label, icon: Icon, def } = SEASON_META[k];
            return <span key={k} className="flex items-center gap-2"><Icon className={cn("size-4", SEASON_META[k].cls.split(" ").at(-1))} aria-hidden /><strong>{label}</strong><span className="text-muted-foreground">— {def}</span></span>;
          })}
        </div>
        <p className="text-xs text-muted-foreground">Calculado con los meses del rango seleccionado{excluded ? ", excluyendo 2020-2021" : ""}.</p>
      </div>
    </div>
  );
}
