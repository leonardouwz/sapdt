"""Genera los CSV de RF-03, RF-04 y RF-05 para las 25 regiones.  python -m sapdt.reportes bd/sapdt.db [salidas]"""
import sqlite3
import sys
from pathlib import Path

from .analisis import MODELOS, exportar_csv, proyectar, temporada, comparar


def main(base, destino="salidas"):
    db = sqlite3.connect(base)
    Path(destino).mkdir(exist_ok=True)
    regiones = db.execute("SELECT DISTINCT depto_cod, departamento FROM serie_region_mes ORDER BY 1").fetchall()
    proy, evaluacion, temp = [], [], []
    for cod, nombre in regiones:
        mejor = None
        for m in MODELOS:  # se elige el modelo con menor error en el tramo de validación
            res, fut = proyectar(db, cod, m, 6)
            evaluacion.append((cod, nombre, m, round(res["mae"]), round(res["mape"], 1), "sí" if res["confiable"] else "no"))
            if mejor is None or res["mape"] < mejor[0]["mape"]:
                mejor = (res, fut)
        proy += [(cod, nombre, mejor[0]["modelo"], a, mm, v, round(mejor[0]["mape"], 1)) for a, mm, v in mejor[1]]
        out, _ = temporada(db, cod)
        temp += [(cod, nombre, a, mm, v, c) for a, mm, v, c in out]
    exportar_csv(f"{destino}/proyeccion.csv", ["cod", "region", "modelo", "anio", "mes", "arribos_proyectados", "mape_pct"], proy)
    exportar_csv(f"{destino}/evaluacion_modelos.csv", ["cod", "region", "modelo", "mae", "mape_pct", "confiable"], evaluacion)
    exportar_csv(f"{destino}/temporada.csv", ["cod", "region", "anio", "mes", "arribos", "temporada"], temp)
    nombres = dict(regiones)
    comp = [(c, nombres[c], t, a, v) for c, t, a, v in comparar(db, [r[0] for r in regiones], (2024, 1), (2024, 12))]
    exportar_csv(f"{destino}/comparativo_2024.csv", ["cod", "region", "total_2024", "total_2023", "variacion_pct"], comp)
    # resumen por modelo
    for m in MODELOS:
        mp = [e[4] for e in evaluacion if e[2] == m]
        print(f"{m}: MAPE promedio {sum(mp)/len(mp):.1f}% (mejor en {sum(1 for p in proy if p[2]==m)//6} regiones)")
    print("Archivos en", destino)


if __name__ == "__main__":
    main(*sys.argv[1:])
