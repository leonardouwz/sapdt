import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtInt } from "@/domain/format";

export function Pagination({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages])).filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav aria-label="Paginación" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground" aria-live="polite">Mostrando {fmtInt(from)}–{fmtInt(to)} de {fmtInt(total)}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft /></Button>
        {nums.map((n, i) => (
          <span key={n} className="flex items-center">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Button variant={n === page ? "default" : "ghost"} className="size-10 p-0" aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)}>{n}</Button>
          </span>
        ))}
        <Button variant="outline" size="icon" className="size-10" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Página siguiente"><ChevronRight /></Button>
      </div>
    </nav>
  );
}
