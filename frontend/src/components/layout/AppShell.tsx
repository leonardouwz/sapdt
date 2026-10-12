import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, ChevronsLeft, ChevronsRight, GitCompareArrows, LayoutDashboard, Menu, Monitor, Moon, Mountain, Sun, TrendingUp } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DATA_MAX, DATA_MIN, DATA_SOURCE_LABEL } from "@/config/constants";
import { fmtDate, fmtMonth } from "@/domain/format";
import { useDirectoryCutoff } from "@/features/hooks";
import { useUiStore, type ThemeMode } from "@/features/ui-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard Regional", icon: LayoutDashboard },
  { to: "/tendencias", label: "Tendencias y Temporadas", icon: TrendingUp },
  { to: "/proyecciones", label: "Simulador de Proyecciones", icon: BarChart3 },
  { to: "/comparador", label: "Comparador Interregional", icon: GitCompareArrows },
  { to: "/directorio", label: "Explorador del Directorio", icon: BookOpen },
] as const;

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Mountain className="size-5" aria-hidden /></span>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-xl font-semibold tracking-tight">SAPDT</p>
          <p className="text-[11px] text-sidebar-foreground/70">Análisis y Proyección de Demanda Turística Regional</p>
        </div>
      )}
    </div>
  );
}

function NavList({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Principal">
      <ul className="space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          const link = (
            <Link
              to={to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={compact ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)]" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                compact && "justify-center px-0",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active && "text-sidebar-primary")} aria-hidden />
              {!compact && <span>{label}</span>}
            </Link>
          );
          return (
            <li key={to}>
              {compact ? <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip> : link}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ThemeSwitch({ compact }: { compact?: boolean }) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const opts: { v: ThemeMode; icon: typeof Sun; label: string }[] = [
    { v: "light", icon: Sun, label: "Claro" }, { v: "dark", icon: Moon, label: "Oscuro" }, { v: "system", icon: Monitor, label: "Sistema" },
  ];
  return (
    <div role="radiogroup" aria-label="Tema" className={cn("flex gap-1 rounded-lg bg-sidebar-accent/50 p-1", compact && "flex-col")}>
      {opts.map(({ v, icon: Icon, label }) => (
        <button key={v} type="button" role="radio" aria-checked={theme === v} aria-label={`Tema ${label}`} onClick={() => setTheme(v)}
          className={cn("flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors", theme === v ? "bg-sidebar text-sidebar-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground")}>
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

export function DataCoverageNote() {
  const cutoff = useDirectoryCutoff();
  return (
    <p className="text-[11px] leading-relaxed text-sidebar-foreground/60">
      Serie: {fmtMonth(DATA_MIN).toLowerCase()} – {fmtMonth(DATA_MAX).toLowerCase()} · Directorio: oferta al {cutoff ? fmtDate(cutoff) : "…"} · Fuente: {DATA_SOURCE_LABEL}
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* md: solo íconos · lg: completo (colapsable) */}
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground transition-[width] duration-200 md:flex md:w-20", collapsed ? "lg:w-20" : "lg:w-72")}>
        <div className="hidden lg:block">{collapsed ? <Logo compact /> : <Logo />}</div>
        <div className="lg:hidden"><Logo compact /></div>
        <div className="hidden flex-1 lg:block"><NavList compact={collapsed} /></div>
        <div className="flex-1 lg:hidden"><NavList compact /></div>
        <div className="space-y-3">
          <div className="hidden lg:block"><ThemeSwitch compact={collapsed} /></div>
          <div className="lg:hidden"><ThemeSwitch compact /></div>
          {!collapsed && <div className="hidden lg:block"><DataCoverageNote /></div>}
          <Button variant="ghost" size="sm" onClick={toggle} className="hidden w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex" aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}>
            {collapsed ? <ChevronsRight /> : <><ChevronsLeft /> Colapsar</>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
          <Logo compact />
          <span className="font-display text-lg font-semibold">SAPDT</span>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 hover:bg-sidebar-accent" aria-label="Abrir menú"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-80 flex-col gap-6 border-sidebar-border bg-sidebar p-5 text-sidebar-foreground">
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <Logo />
              <div className="flex-1"><NavList onNavigate={() => setMobileOpen(false)} /></div>
              <ThemeSwitch />
              <DataCoverageNote />
            </SheetContent>
          </Sheet>
        </header>
        <main className="bg-topo flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
