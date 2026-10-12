"""Prueba mínima de RF-03..06 y 08.  python tests/test_analisis.py"""
import csv, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sapdt.almacen import Almacen
from sapdt.analisis import buscar_directorio, comparar, exportar_csv, proyectar, temporada


def base():
    d = Almacen().db
    d.execute("CREATE TABLE serie_region_mes (depto_cod, departamento, anio, mes, arribos, arribos_nac, arribos_ext, pernoct)")
    for dep in ("01", "02"):
        for t in range(36):  # 3 años; mes 12 siempre alto (1000), el resto 100+10*mes; la región 02 vale el doble
            a, m = 2022 + t // 12, t % 12 + 1
            v = (1000 if m == 12 else 100 + 10 * m) * (2 if dep == "02" else 1)
            d.execute("INSERT INTO serie_region_mes VALUES (?,?,?,?,?,?,?,?)", (dep, "R" + dep, a, m, v, v, 0, v))
    d.execute("INSERT INTO serie_region_mes VALUES ('03','R03',2024,12,5,5,0,5)")  # solo 1 mes -> no confiable
    return d


def demo():
    d = base()
    res, fut = proyectar(d, "01", "estacional_ingenuo", 6)
    assert fut[0] == (2025, 1, 110) and res["confiable"] and res["mae"] == 0     # repite el patrón anual
    assert fut[-1][:2] == (2025, 6)
    assert proyectar(d, "03", "promedio_movil", 3)[0]["confiable"] is False      # RF-03 CA-3
    assert "mape" in proyectar(d, "01", "suavizado_exponencial")[0]
    out, tipico = temporada(d, "01")
    assert tipico[12] == "alta" and tipico[1] == "baja"                          # RF-04
    f = comparar(d, ["01", "02"], (2024, 1), (2024, 12))
    assert f[1][1] == 2 * f[0][1] and f[0][3] == 0.0                             # total y variación vs año anterior
    for malo in (lambda: comparar(d, ["01"], (2024, 1), (2024, 2)), lambda: comparar(d, ["01", "02"], (2030, 1), (2030, 2)),
                 lambda: comparar(d, ["01", "02"], (2024, 5), (2024, 2))):
        try: malo(); assert False
        except ValueError: pass                                                  # RF-05 CA-1
    d.execute("CREATE TABLE IF NOT EXISTS x(a)")
    for r in [("A", "HOTEL", "3 Estrellas", 10, 20), ("B", "HOTEL", "2 Estrellas", None, 5), ("C", "HOSTAL", "3 Estrellas", 4, 8)]:
        d.execute("INSERT INTO directorio (nombre_comercial, clase, categoria, habi, cama, departamento, provincia) VALUES (?,?,?,?,?, 'CUSCO','CUSCO')", r)
    _, ind = buscar_directorio(d, departamento="cusco", clase="Hotel")
    assert ind == {"establecimientos": 2, "habitaciones": 10, "camas": 25, "sin_dato_camas_o_habitaciones": 1}
    assert buscar_directorio(d, clase="Hotel", categoria="3 Estrellas")[1]["establecimientos"] == 1
    with tempfile.TemporaryDirectory() as t:                                     # RF-08: reabre con las mismas filas
        p = Path(t) / "x.csv"; exportar_csv(p, ["a", "b"], fut)
        assert len(list(csv.reader(open(p, encoding="utf-8-sig")))) == 1 + len(fut)
    print("OK analisis")

if __name__ == "__main__":
    demo()
