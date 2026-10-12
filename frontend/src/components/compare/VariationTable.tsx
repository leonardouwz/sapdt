import { ArrowDownUp, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtInt, fmtVar } from "@/domain/format";
import type { CompareRow } from "@/domain/models/comparativo";
import { cn } from "@/lib/utils";
import { NoData, Val } from "../common/states";
import { regionColorVar } from "../common/selectors";

function VarCell({ v }: { v: number | null }) {
  if (v === null) return <NoData />;
  const r = Number(v.toFixed(1));
  if (r === 0) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="size-3.5" aria-hidden /> —</span>;
  const up = r > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", up ? "text-positive" : "text-negative")}>
      <span aria-hidden>{up ? "▲" : "▼"}</span><Icon className="size-3.5" aria-hidden /> {fmtVar(v)}
    </span>
  );
}

type Key = "region" | "base" | "comp" | "vt" | "vn" | "ve";
const get = (r: CompareRow, k: Key): number | string | null =>
  ({ region: r.region.nombre, base: r.base.arribos, comp: r.comparacion.arribos, vt: r.variacion_pct.arribos, vn: r.variacion_pct.arribos_nac, ve: r.variacion_pct.arribos_ext })[k];

export function VariationTable({ rows, order }: { rows: CompareRow[]; order: string[] }) {
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: "vt", dir: -1 });
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const x = get(a, sort.k), y = get(b, sort.k);
    if (x === null) return 1; if (y === null) return -1;
    return (typeof x === "string" ? x.localeCompare(String(y), "es") : x - (y as number)) * sort.dir;
  }), [rows, sort]);
  const cols: { k: Key; label: string }[] = [
    { k: "region", label: "Región" }, { k: "base", label: "Arribos base" }, { k: "comp", label: "Arribos comparación" },
    { k: "vt", label: "Variación total %" }, { k: "vn", label: "Variación nacional %" }, { k: "ve", label: "Variación extranjera %" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            {cols.map((c) => (
              <th key={c.k} scope="col" aria-sort={sort.k === c.k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cn("py-3 pr-4 font-semibold", c.k !== "region" && "text-right")}>
                <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ k: c.k, dir: s.k === c.k ? (s.dir === 1 ? -1 : 1) : -1 }))}>
                  {c.label} <ArrowDownUp className="size-3" aria-hidden />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.region.codigo} className="border-b last:border-0 hover:bg-muted/40">
              <th scope="row" className="py-3 pr-4 text-left font-medium">
                <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: regionColorVar(order.indexOf(r.region.codigo)) }} aria-hidden />{r.region.nombre}</span>
              </th>
              <td className="py-3 pr-4 text-right"><Val v={r.base.arribos} f={fmtInt} /></td>
              <td className="py-3 pr-4 text-right"><Val v={r.comparacion.arribos} f={fmtInt} /></td>
              <td className="py-3 pr-4 text-right"><VarCell v={r.variacion_pct.arribos} /></td>
              <td className="py-3 pr-4 text-right"><VarCell v={r.variacion_pct.arribos_nac} /></td>
              <td className="py-3 pr-4 text-right"><VarCell v={r.variacion_pct.arribos_ext} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
