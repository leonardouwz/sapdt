import type { ReactNode } from "react";
import { isApiError } from "@/domain/models/ApiError";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, InfoTip, LoadingSkeleton } from "./states";

export function StatCard({ label, info, value, footer, icon, className }: { label: string; info?: string; value: ReactNode; footer?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <article className={cn("flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5", className)}>
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        {info && <InfoTip text={info} label={`Definición: ${label}`} />}
      </header>
      <div className="font-display text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</div>
      {footer && <div className="text-sm text-muted-foreground">{footer}</div>}
    </article>
  );
}

interface QueryLike { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown; isFetching?: boolean }

/** Bloque con su propio estado de carga / error / vacío. */
export function ChartCard({ title, description, query, isEmpty, emptyText, skeleton = "chart", actions, children, id, className }: {
  title: string; description?: ReactNode; query?: QueryLike; isEmpty?: boolean; emptyText?: string;
  skeleton?: "chart" | "matrix" | "block" | "kpis"; actions?: ReactNode; children: ReactNode; id?: string; className?: string;
}) {
  let body: ReactNode = children;
  if (query?.isPending) body = <LoadingSkeleton variant={skeleton} />;
  else if (query?.isError) body = <ErrorState message={isApiError(query.error) ? query.error.message : undefined} onRetry={() => void query.refetch()} />;
  else if (isEmpty) body = <EmptyState title={emptyText ?? "Sin información para mostrar"} />;
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-card md:p-6", className)} aria-live="polite">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold md:text-xl">{title}</h2>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        <div className="flex items-center gap-2">
          {query?.isFetching && !query.isPending && <span className="size-2 animate-pulse rounded-full bg-primary" aria-label="Actualizando" />}
          {actions}
        </div>
      </header>
      <div id={id}>{body}</div>
    </section>
  );
}
