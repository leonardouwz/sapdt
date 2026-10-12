import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isApiError } from "@/domain/models/ApiError";
import { useExport } from "@/features/hooks";
import type { ReportKind } from "@/services/ports";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export function ExportMenu({ reporte, filtros, disabled }: { reporte: ReportKind; filtros: Record<string, unknown>; disabled?: boolean }) {
  const mut = useExport();
  const run = (formato: "csv" | "pdf") =>
    mut.mutate({ reporte, formato, filtros }, {
      onSuccess: (f) => toast.success("Descarga lista", { description: f }),
      onError: (e) => toast.error("No se pudo generar el archivo", { description: isApiError(e) ? e.message : undefined }),
    });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled || mut.isPending} className="h-10">
          {mut.isPending ? <Loader2 className="animate-spin" /> : <Download />} Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onSelect={() => run("pdf")} className="items-start gap-3 py-2">
          <FileText className="mt-0.5" />
          <div><p className="font-medium">Descargar PDF</p><p className="text-xs text-muted-foreground">Reporte ejecutivo listo para imprimir</p></div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run("csv")} className="items-start gap-3 py-2">
          <FileSpreadsheet className="mt-0.5" />
          <div><p className="font-medium">Descargar CSV</p><p className="text-xs text-muted-foreground">Datos limpios para Excel o BI</p></div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
