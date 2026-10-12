"""RF-02: cruce geográfico y temporal. Clave de región = código de departamento (2 primeros dígitos del ubigeo)."""
import sqlite3
import sys
from pathlib import Path

# CA-1b: la fila "consolidada" es la que ya suma todas las clases y categorías de la región. Sumar todas da ~4x.
CONSOLIDADA = "id_clase = 'TT' AND id_categoria = 'TT'"


class SerieAmbigua(ValueError):
    """Más de una fila consolidada para el mismo departamento y mes."""


def cruzar(db):
    dup = db.execute(f"SELECT depto_cod, anio, mes, COUNT(*) FROM ocupabilidad WHERE {CONSOLIDADA} "
                     "GROUP BY 1,2,3 HAVING COUNT(*) > 1").fetchall()
    if dup:
        raise SerieAmbigua(f"{len(dup)} departamento-mes con más de una fila consolidada, ej. {dup[0]}")
    with db:  # todo o nada
        db.executescript(f"""
            DROP TABLE IF EXISTS serie_region_mes;
            CREATE TABLE serie_region_mes AS
              SELECT depto_cod, departamento, anio, mes, arribos, arribos_nac, arribos_ext, pernoct, pernoct_nac,
                     pernoct_ext, n_establecimientos, n_habitaciones, n_plazas_cama, tnoh, tnoc,
                     perm, perm_nac, perm_ext, empleo
              FROM ocupabilidad WHERE {CONSOLIDADA};
            CREATE UNIQUE INDEX ix_serie ON serie_region_mes (depto_cod, anio, mes);
            -- CA-3: indicador ESTÁTICO (foto a una fecha de corte), no es una serie
            DROP TABLE IF EXISTS directorio_por_region;
            CREATE TABLE directorio_por_region AS
              SELECT depto_cod, departamento, MAX(fecha_corte) AS fecha_corte, COUNT(*) AS n_establecimientos,
                     SUM(cama) AS total_camas, SUM(habi) AS total_habitaciones
              FROM directorio GROUP BY depto_cod, departamento;
        """)
    return reporte(db)


def reporte(db):
    q = lambda s: db.execute(s).fetchall()
    series = {r[0]: r[1] for r in q("SELECT DISTINCT depto_cod, departamento FROM serie_region_mes")}
    direc = {r[0]: r[1] for r in q("SELECT DISTINCT depto_cod, departamento FROM directorio_por_region")}
    # CA-2: nada se descarta en silencio
    sin_directorio = sorted(set(series) - set(direc))
    sin_serie = sorted(set(direc) - set(series))
    nombres_distintos = [(c, series[c], direc[c]) for c in sorted(set(series) & set(direc)) if series[c] != direc[c]]
    meses = q("SELECT depto_cod, COUNT(*), MIN(anio*100+mes), MAX(anio*100+mes) FROM serie_region_mes GROUP BY 1")
    # huecos: meses faltantes entre el primero y el último de cada región
    huecos = {}
    for c, n, ini, fin in meses:
        esperado = (fin // 100 - ini // 100) * 12 + (fin % 100 - ini % 100) + 1
        if esperado != n:
            huecos[c] = esperado - n
    return {"regiones_serie": len(series), "regiones_directorio": len(direc), "filas_serie": sum(m[1] for m in meses),
            "sin_directorio": sin_directorio, "sin_serie": sin_serie, "nombres_distintos": nombres_distintos,
            "meses_por_region": sorted({m[1] for m in meses}), "periodo": (min(m[2] for m in meses), max(m[3] for m in meses)),
            "huecos": huecos, "fecha_corte_directorio": q("SELECT MAX(fecha_corte) FROM directorio_por_region")[0][0]}


def a_markdown(r):
    ok = lambda lista: ", ".join(map(str, lista)) if lista else "ninguna"
    return "\n".join([
        "# Reporte del cruce geográfico y temporal (RF-02)", "",
        f"- Regiones en la serie mensual: {r['regiones_serie']} · en el directorio: {r['regiones_directorio']}",
        f"- Periodo: {r['periodo'][0]} a {r['periodo'][1]} (AAAAMM) · filas de la serie: {r['filas_serie']} · "
        f"meses por región: {ok(r['meses_por_region'])}",
        f"- Huecos de meses por región: {r['huecos'] or 'ninguno'}",
        f"- Huérfanos — regiones con serie pero sin directorio: {ok(r['sin_directorio'])}",
        f"- Huérfanos — regiones con directorio pero sin serie: {ok(r['sin_serie'])}",
        f"- Mismo código con nombre distinto entre fuentes: {ok(r['nombres_distintos'])}",
        f"- El directorio es una foto al {r['fecha_corte_directorio']}: se resume por región como indicador estático, no como serie.", ""])


def main(argv):
    if not argv:
        sys.exit("Uso: python -m sapdt.cruce bd/sapdt.db")
    r = cruzar(sqlite3.connect(argv[0]))
    texto = a_markdown(r)
    Path("reporte_cruce.md").write_text(texto, encoding="utf-8")
    print(texto)


if __name__ == "__main__":
    main(sys.argv[1:])
