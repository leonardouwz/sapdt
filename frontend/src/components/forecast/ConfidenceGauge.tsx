import { AlertOctagon, CheckCircle2, HelpCircle, TriangleAlert } from "lucide-react";
import { MSG_VOLATILE } from "@/config/constants";
import { classifyConfidence, type ConfidenceLevel } from "@/domain/confidence";
import { cn } from "@/lib/utils";
import { InfoTip } from "../common/states";

const META: Record<ConfidenceLevel, { label: string; text: string; icon: typeof CheckCircle2; cls: string; bar: string; pos: number }> = {
  alta: { label: "Alta Confiabilidad", text: "Error porcentual mínimo. Ideal para programar contrataciones de personal.", icon: CheckCircle2, cls: "text-confidence-high border-confidence-high/40 bg-confidence-high/10", bar: "bg-confidence-high", pos: 16 },
  moderada: { label: "Confiabilidad Moderada", text: "Error regular. Planificación referencial.", icon: TriangleAlert, cls: "text-confidence-mid border-confidence-mid/40 bg-confidence-mid/10", bar: "bg-confidence-mid", pos: 50 },
  volatil: { label: "Proyección Volátil", text: "Error elevado.", icon: AlertOctagon, cls: "text-confidence-low border-confidence-low/40 bg-confidence-low/10", bar: "bg-confidence-low", pos: 84 },
};

export function ConfidenceGauge({ mape, confiable }: { mape: number | null; confiable: boolean }) {
  if (!confiable || mape === null) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
        <HelpCircle className="size-6" aria-hidden /> Historia insuficiente para estimar la confiabilidad
      </div>
    );
  }
  const level = classifyConfidence(mape);
  const m = META[level];
  const Icon = m.icon;
  return (
    <div className="space-y-5">
      <div className={cn("flex items-start gap-4 rounded-xl border p-5", m.cls)}>
        <Icon className="mt-0.5 size-8 shrink-0" aria-hidden />
        <div className="space-y-1">
          <p className="flex items-center gap-1 font-display text-2xl font-semibold text-foreground">
            {m.label}
            <InfoTip text={`Error porcentual promedio al probar este método con los últimos 12 meses: ${mape.toFixed(1)} %`} />
          </p>
          <p className="text-foreground/85">{m.text}</p>
          {level === "volatil" && <p role="alert" className="mt-2 font-medium text-foreground">{MSG_VOLATILE}</p>}
        </div>
      </div>
      <div aria-hidden className="relative">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div className="flex-1 bg-confidence-high/70" /><div className="flex-1 bg-confidence-mid/70" /><div className="flex-1 bg-confidence-low/70" />
        </div>
        <div className="absolute -top-1.5 size-5 -translate-x-1/2 rounded-full border-4 border-card shadow" style={{ left: `${m.pos}%` }}>
          <div className={cn("size-full rounded-full", m.bar)} />
        </div>
        <div className="mt-2 grid grid-cols-3 text-center text-xs text-muted-foreground">
          <span>Alta</span><span>Moderada</span><span>Volátil</span>
        </div>
      </div>
    </div>
  );
}
