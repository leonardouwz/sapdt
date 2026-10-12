"""Prueba mínima de la API: forma de las respuestas y errores que espera el frontend.  python tests/test_api.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sapdt.almacen import Almacen
from sapdt.api import Error, responder
from sapdt.cruce import cruzar


def demo():
    db = Almacen().db
    for t in range(60):  # 2021-01 a 2025-12 recortado a 2025-06 abajo
        a, m = 2021 + t // 12, t % 12 + 1
        if (a, m) > (2025, 6):
            break
        db.execute("INSERT INTO ocupabilidad (anio, mes, id_clase, id_categoria, ubigeo, departamento, arribos, arribos_nac, arribos_ext, pernoct, tnoh, depto_cod)"
                   " VALUES (?,?,'TT','TT','040000','AREQUIPA',?,?,?,?,?,'04')", (a, m, 1000 + m * 10 + t, 900, 100, 2000, 30.5))
        db.execute("INSERT INTO ocupabilidad (anio, mes, id_clase, id_categoria, ubigeo, departamento, arribos, depto_cod) VALUES (?,?,'01','02','040000','AREQUIPA',77,'04')", (a, m))
        db.execute("INSERT INTO ocupabilidad (anio, mes, id_clase, id_categoria, ubigeo, departamento, arribos, arribos_nac, arribos_ext, depto_cod)"
                   " VALUES (?,?,'TT','TT','080000','CUSCO',5000,4000,1000,'08')", (a, m))
    db.execute("INSERT INTO directorio (ruc, nombre_comercial, clase, categoria, habi, cama, departamento, provincia, ubigeo, depto_cod, fecha_corte) VALUES ('1','Hotel Ñandú','Hotel','3 Estrellas',10,20,'AREQUIPA','AREQUIPA','040101','04','2026-10-05')")
    db.execute("INSERT INTO directorio (ruc, nombre_comercial, clase, categoria, habi, cama, departamento, provincia, ubigeo, depto_cod, fecha_corte) VALUES ('2','Albergue X','Albergue','Sin Categoria',NULL,5,'AREQUIPA','AREQUIPA','040101','04','2026-10-05')")
    cruzar(db)
    J = lambda ruta, **q: responder(db, ruta, {k: str(v) for k, v in q.items()})[1]

    s = J("/api/series", region="04", desde="2024-01", hasta="2024-03")
    assert len(s) == 3 and s[0]["periodo"] == "2024-01" and s[0]["arribos"] == 1000 + 10 + 36 and not s[0]["atipico"]  # solo fila consolidada
    assert J("/api/series", region="04", desde="2021-01", hasta="2021-02")[0]["atipico"]
    o = J("/api/regiones/04")["oferta_actual"]
    assert o["establecimientos"] == 2 and o["habitaciones"] == 10 and o["pct_sin_dato_capacidad"] == 50.0
    t = J("/api/temporada", region="04")
    assert len(t["meses"]) == 12 and t["meses"][0]["n_observaciones"] == 4 and t["excluye_pandemia"]   # sin 2021
    p = J("/api/proyeccion", region="04", horizonte=3, modelo="media_movil")
    assert [x["periodo"] for x in p["proyeccion"]] == ["2025-07", "2025-08", "2025-09"] and p["confiable"] and p["mape"] is not None
    c = J("/api/comparativo", regiones="04,08", base_desde="2023-01", base_hasta="2023-12", comp_desde="2024-01", comp_hasta="2024-12")
    assert c["filas"][1]["variacion_pct"]["arribos"] == 0.0 and c["filas"][0]["variacion_pct"]["arribos"] > 0
    e = J("/api/establecimientos", q="nandu", page=1, pageSize=12)
    assert e["total"] == 1 and e["items"][0]["categoria"] == "3 Estrellas" and J("/api/establecimientos", categoria="Sin categoría")["total"] == 1
    datos, nombre = responder(db, "/api/export/directorio", {"formato": "csv"})[1]
    assert datos.decode("utf-8-sig").splitlines()[0].startswith("ruc,") and nombre.endswith(".csv")
    pdf, nombre = responder(db, "/api/export/directorio", {"formato": "pdf"})[1]
    assert pdf.startswith(b"%PDF-1.4") and pdf.rstrip().endswith(b"%%EOF") and nombre.endswith(".pdf")
    for ruta, q, estado in (("/api/series", {"region": "04", "desde": "2010-01", "hasta": "2024-01"}, 400), ("/api/regiones/99", {}, 404),
                            ("/api/comparativo", {"regiones": "04", "base_desde": "2023-01", "base_hasta": "2023-02", "comp_desde": "2024-01", "comp_hasta": "2024-02"}, 400),
                            ("/api/export/dashboard", {"formato": "docx"}, 400)):
        try: responder(db, ruta, q); assert False, ruta
        except Error as err: assert err.estado == estado, (ruta, err.estado)
    print("OK api")

if __name__ == "__main__":
    demo()
