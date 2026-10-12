import { AlertTriangle, Info, RefreshCw, SearchX, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NO_DATA } from "@/domain/format";
import { cn } from "@/lib/utils";

/** Dato faltante: nunca 0. */
export function NoData({ className }: { className?: string }) {
  return (
    <span
      title="Sin datos"
      aria-label="Sin datos"
      className={cn("inline-flex items-center rounded-sm border border-dashed border-nodata/60 px-1.5 text-[0.85em] font-medium text-nodata", className)}
    >
      {NO_DATA}
    </span>
  );
}

/** Muestra el valor formateado o <NoData/>. */
export function Val<T>({ v, f, className }: { v: T | null | undefined; f: (x: T) => string; className?: string }) {
  if (v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v))) return <NoData className={className} />;
  return <span className={cn("tabular-nums", className)}>{f(v)}</span>;
}

export function InfoTip({ text, label = "Más información" }: { text: string; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

export function EmptyState({ title, description, icon: Icon = SearchX, action }: { title: string; description?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground"><Icon className="size-5" aria-hidden /></span>
      <p className="font-display text-lg">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-negative/30 bg-negative/5 px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-negative" aria-hidden />
      <p className="font-medium">No pudimos cargar esta información</p>
      {message && <p className="max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw /> Reintentar</Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ variant = "chart" }: { variant?: "chart" | "kpis" | "cards" | "matrix" | "block" }) {
  if (variant === "kpis")
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (variant === "cards")
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>;
  if (variant === "matrix")
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-busy="true">{Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>;
  if (variant === "block") return <Skeleton className="h-32 rounded-xl" aria-busy="true" />;
  return <Skeleton className="h-[320px] w-full rounded-xl" aria-busy="true" />;
}

export function QualityBanner({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

export function FlagBadge({ kind, children }: { kind: "atypical" | "partial" | "suspicious"; children: ReactNode }) {
  const cls = {
    atypical: "bg-atypical text-atypical-foreground",
    partial: "bg-partial-stripes text-foreground border border-partial/60",
    suspicious: "bg-warning/15 text-warning-foreground border border-warning/40",
  }[kind];
  const Icon = kind === "suspicious" ? AlertTriangle : Sparkles;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
      <Icon className="size-3" aria-hidden /> {children}
    </span>
  );
}
