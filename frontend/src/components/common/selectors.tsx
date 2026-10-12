import { Check, ChevronsUpDown, MapPin, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMPARE_MAX_REGIONS, MSG_MAX_REGIONS } from "@/config/constants";
import { MONTHS_LONG } from "@/domain/format";
import type { RegionCode } from "@/domain/models/region";
import { comparePeriods, formatPeriod, isWithinDataRange, parsePeriod } from "@/domain/periods";
import { REGIONS_SORTED, regionName } from "@/domain/regions";
import { normalizeForSearch } from "@/domain/titleCase";
import { cn } from "@/lib/utils";

const accentFilter = (value: string, search: string, keywords?: string[]) =>
  normalizeForSearch([value, ...(keywords ?? [])].join(" ")).includes(normalizeForSearch(search)) ? 1 : 0;

export const regionColorVar = (i: number) => `var(--chart-${(i % 5) + 1})`;

export function RegionSelect({ value, onChange, allowAll, id }: { value: RegionCode | ""; onChange: (c: RegionCode | "") => void; allowAll?: boolean; id?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" aria-expanded={open} className="h-10 w-full justify-between bg-card sm:w-64">
          <span className="flex items-center gap-2 truncate"><MapPin className="text-primary" />{value ? regionName(value) : "Todas las regiones"}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command filter={accentFilter}>
          <CommandInput placeholder="Buscar región…" />
          <CommandList>
            <CommandEmpty>Sin coincidencias.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem value="todas" keywords={["Todas las regiones"]} onSelect={() => { onChange(""); setOpen(false); }}>
                  <Check className={cn(value === "" ? "opacity-100" : "opacity-0")} /> Todas las regiones
                </CommandItem>
              )}
              {REGIONS_SORTED.map((r) => (
                <CommandItem key={r.codigo} value={r.codigo} keywords={[r.nombre]} onSelect={() => { onChange(r.codigo); setOpen(false); }}>
                  <Check className={cn(value === r.codigo ? "opacity-100" : "opacity-0")} /> {r.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function RegionMultiSelect({ value, onChange, invalid }: { value: RegionCode[]; onChange: (v: RegionCode[]) => void; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const full = value.length >= COMPARE_MAX_REGIONS;
  const toggle = (c: RegionCode) => onChange(value.includes(c) ? value.filter((x) => x !== c) : full ? value : [...value, c]);
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} aria-invalid={invalid} className={cn("h-10 w-full justify-between bg-card", invalid && "border-negative")}>
            <span>{value.length ? `${value.length} regiones seleccionadas` : "Elegir regiones"}</span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command filter={accentFilter}>
            <CommandInput placeholder="Buscar región…" />
            {full && <p className="border-b px-3 py-2 text-xs text-warning-foreground">{MSG_MAX_REGIONS}</p>}
            <CommandList>
              <CommandEmpty>Sin coincidencias.</CommandEmpty>
              <CommandGroup>
                {REGIONS_SORTED.map((r) => {
                  const sel = value.includes(r.codigo);
                  const disabled = full && !sel;
                  return (
                    <CommandItem key={r.codigo} value={r.codigo} keywords={[r.nombre]} disabled={disabled} title={disabled ? MSG_MAX_REGIONS : undefined} onSelect={() => toggle(r.codigo)}>
                      <Check className={cn(sel ? "opacity-100" : "opacity-0")} /> {r.nombre}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <ul className="flex flex-wrap gap-2" aria-label="Regiones seleccionadas">
        {value.map((c, i) => (
          <li key={c} className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-2 pr-1 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: regionColorVar(i) }} aria-hidden />
            {regionName(c)}
            <button type="button" onClick={() => toggle(c)} aria-label={`Quitar ${regionName(c)}`} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-3" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthYear({ value, onChange, years, restrict, label, invalid }: { value: string; onChange: (p: string) => void; years: number[]; restrict: boolean; label: string; invalid?: boolean }) {
  const { anio, mes } = parsePeriod(value);
  const setMes = (m: number) => onChange(formatPeriod({ anio, mes: m }));
  const setAnio = (a: number) => {
    let p = formatPeriod({ anio: a, mes });
    if (restrict && !isWithinDataRange(p)) {
      // ajusta al mes válido más cercano dentro del año
      for (let m = 1; m <= 12; m++) { const c = formatPeriod({ anio: a, mes: m }); if (isWithinDataRange(c)) { p = c; if (m >= mes) break; } }
    }
    onChange(p);
  };
  const cls = cn("h-10 bg-card", invalid && "border-negative ring-1 ring-negative/40");
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-medium text-muted-foreground">{label}</legend>
      <div className="flex gap-2">
        <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
          <SelectTrigger className={cn(cls, "w-32")} aria-label={`${label}: mes`} aria-invalid={invalid}><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS_LONG.map((n, i) => (
              <SelectItem key={n} value={String(i + 1)} disabled={restrict && !isWithinDataRange(formatPeriod({ anio, mes: i + 1 }))}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className={cn(cls, "w-24")} aria-label={`${label}: año`} aria-invalid={invalid}><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </fieldset>
  );
}

export function MonthRangePicker({ desde, hasta, onChange, restrict = true, years, invalid, labels = ["Desde", "Hasta"] }: {
  desde: string; hasta: string; onChange: (r: { desde: string; hasta: string }) => void; restrict?: boolean; years: number[]; invalid?: boolean; labels?: [string, string];
}) {
  const orderError = comparePeriods(desde, hasta) > 0;
  return (
    <div className="flex flex-wrap gap-3">
      <MonthYear label={labels[0]} value={desde} years={years} restrict={restrict} invalid={invalid || orderError} onChange={(d) => onChange({ desde: d, hasta })} />
      <MonthYear label={labels[1]} value={hasta} years={years} restrict={restrict} invalid={invalid || orderError} onChange={(h) => onChange({ desde, hasta: h })} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 rounded-lg border bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 text-sm font-medium transition-all duration-200",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MetricToggle({ value, onChange }: { value: "arribos" | "pernoct"; onChange: (v: "arribos" | "pernoct") => void }) {
  return <Segmented label="Métrica" value={value} onChange={onChange} options={[{ value: "arribos", label: "Arribos" }, { value: "pernoct", label: "Pernoctaciones" }]} />;
}
