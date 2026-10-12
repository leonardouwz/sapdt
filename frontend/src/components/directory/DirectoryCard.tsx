import { BedDouble, Copy, FileBadge, Mail, MapPin, Phone, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { fmtInt } from "@/domain/format";
import type { Establecimiento } from "@/domain/models/establecimiento";
import { toTitleCase } from "@/domain/titleCase";
import { NoData, Val } from "../common/states";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatAddress(e: Establecimiento): { dir: string | null; rest: string } {
  const rest = [toTitleCase(e.distrito), toTitleCase(e.provincia), e.departamento].map((s) => s.trim()).filter(Boolean).join(", ");
  return { dir: e.direccion ? toTitleCase(e.direccion).replace(/,\s*$/, "") : null, rest };
}

export const splitPhones = (t: string): { label: string; href: string }[] =>
  t.split(/\/|,|\s{2,}/).map((s) => s.trim()).filter(Boolean).map((s) => ({ label: s, href: `tel:${s.replace(/[^\d+]/g, "")}` }));

const stars = (c: string) => { const n = Number.parseInt(c, 10); return Number.isFinite(n) ? n : 0; };

export function DirectoryCard({ e }: { e: Establecimiento }) {
  const { dir, rest } = formatAddress(e);
  const n = stars(e.categoria);
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      <header className="space-y-2">
        <h3 className="text-lg font-semibold leading-snug">{toTitleCase(e.nombre_comercial)}</h3>
        <p className="text-xs text-muted-foreground">{toTitleCase(e.razon_social)}</p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{e.clase}</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
            {n > 0 ? <span className="flex text-primary" aria-hidden>{Array.from({ length: n }, (_, i) => <Star key={i} className="size-3 fill-current" />)}</span> : null}
            {e.categoria}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">RUC</dt>
        <dd className="flex items-center gap-1 font-mono tabular-nums">
          {e.ruc}
          <button type="button" aria-label="Copiar RUC" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { void navigator.clipboard?.writeText(e.ruc); toast.success("RUC copiado"); }}><Copy className="size-3" /></button>
        </dd>
        <dt className="flex items-center gap-1 text-muted-foreground"><FileBadge className="size-3.5" aria-hidden />Certificado</dt>
        <dd className="break-words">{e.nro_certificado ?? <NoData />}</dd>
      </dl>

      <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span>{dir ?? <NoData />}, {rest}</span></p>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/60 p-3 text-sm">
        <div><p className="flex items-center gap-1 text-xs text-muted-foreground"><BedDouble className="size-3.5" aria-hidden />Habitaciones</p><p className="font-display text-lg"><Val v={e.habitaciones} f={fmtInt} /></p></div>
        <div><p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" aria-hidden />Camas</p><p className="font-display text-lg"><Val v={e.camas} f={fmtInt} /></p></div>
      </div>

      <div className="mt-auto space-y-1.5 border-t pt-3 text-sm">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><Phone className="size-4 text-muted-foreground" aria-label="Teléfono" />
          {e.telefono ? splitPhones(e.telefono).map((p) => <a key={p.label} href={p.href} className="text-primary underline-offset-2 hover:underline">{p.label}</a>) : <NoData />}
        </p>
        <p className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0 text-muted-foreground" aria-label="Email" />
          {e.email ? (EMAIL_RE.test(e.email) ? <a href={`mailto:${e.email}`} className="text-primary underline-offset-2 hover:underline">{e.email}</a> : <span>{e.email}</span>) : <NoData />}
        </p>
      </div>
    </article>
  );
}
