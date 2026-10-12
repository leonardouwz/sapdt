"""Uso:  python -m sapdt.cargar CARPETA_CSV [bd/sapdt.db]   → carga todo y escribe reporte_calidad.md"""
import sys
from pathlib import Path

from .almacen import Almacen
from .ingesta import IngestService


def a_markdown(reportes, errores):
    L = ["# Reporte de calidad de la carga (RF-01)", "",
         "| Archivo | Esquema | Codif. | Leídas | Cargadas | Rechazadas | Observadas |", "|---|---|---|---:|---:|---:|---:|"]
    for r in reportes:
        L.append(f"| {r['archivo']} | {r['esquema']} | {r['codificacion']} | {r['leidas']} | {r['cargadas']} | {r['rechazadas']} | {r['observadas']} |")
    L += ["", f"Total: {sum(r['leidas'] for r in reportes)} leídas, {sum(r['cargadas'] for r in reportes)} cargadas, "
          f"{sum(r['rechazadas'] for r in reportes)} rechazadas, {sum(r['observadas'] for r in reportes)} observadas.", ""]
    for r in reportes:
        if r["reparadas"] or r["rechazos_por_motivo"] or r["observaciones"] or r["nulos_pct"]:
            L.append(f"## {r['archivo']}")
            for k, v in r["reparadas"].items():
                L.append(f"- Reparadas y cargadas: {k}: {v}")
            for k, v in r["rechazos_por_motivo"].items():
                L.append(f"- Rechazo: {k}: {v}")
            for k, v in r["observaciones"].items():
                L.append(f"- Observación (se cargó marcada): {k}: {v}")
            if r["nulos_pct"]:
                L.append("- Campos con vacíos (%): " + ", ".join(f"{k} {v}" for k, v in r["nulos_pct"].items() if v >= 0.1))
            if "posibles_duplicados" in r:
                L.append(f"- Posibles duplicados (RUC + nombre comercial + ubigeo): {r['posibles_duplicados']}; RUC en varias filas: {r['ruc_en_varias_filas']}")
            for linea, motivo, cont in r["primeros_rechazos"]:
                L.append(f"  - línea {linea}: {motivo}")
            L.append("")
    if errores:
        L += ["## Archivos rechazados por completo"] + [f"- {e}" for e in errores]
    return "\n".join(L)


def main(argv):
    if not argv:
        sys.exit(__doc__)
    carpeta, base = argv[0], (argv[1] if len(argv) > 1 else "bd/sapdt.db")
    Path(base).parent.mkdir(parents=True, exist_ok=True)
    almacen = Almacen(base)
    reportes, errores = IngestService(almacen).cargar_carpeta(carpeta)
    texto = a_markdown(reportes, errores)
    Path("reporte_calidad.md").write_text(texto, encoding="utf-8")
    print(texto)
    print(f"\nBase: {base} · ocupabilidad {almacen.contar('ocupabilidad')} filas · directorio {almacen.contar('directorio')} filas")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
