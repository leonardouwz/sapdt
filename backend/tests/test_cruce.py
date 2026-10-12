"""Prueba mínima de RF-02.  python tests/test_cruce.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sapdt.almacen import Almacen
from sapdt.cruce import SerieAmbigua, cruzar


def fila(a, clase, cat, depto, arribos, ub="010000", ic=None):
    return (a, 1, clase, cat, ub, depto, arribos, ub[:2])


def demo():
    a = Almacen(); d = a.db
    ins = "INSERT INTO ocupabilidad (anio, mes, id_clase, id_categoria, ubigeo, departamento, arribos, depto_cod) VALUES (?,?,?,?,?,?,?,?)"
    # Amazonas: consolidada 100 + una fila de hotel 60 (no debe sumarse). Cusco: serie sin directorio (huérfano)
    d.executemany(ins, [(2024, 1, "TT", "TT", "010000", "AMAZONAS", 100, "01"), (2024, 1, "01", "02", "010000", "AMAZONAS", 60, "01"),
                        (2024, 1, "TT", "TT", "080000", "CUSCO", 500, "08")])
    d.execute("INSERT INTO directorio (fecha_corte, cama, habi, ubigeo, departamento, depto_cod) VALUES ('2026-10-05', 10, 5, '010101', 'AMAZONAS', '01')")
    d.execute("INSERT INTO directorio (fecha_corte, cama, habi, ubigeo, departamento, depto_cod) VALUES ('2026-10-05', 4, 2, '250101', 'UCAYALI', '25')")
    r = cruzar(d)
    assert d.execute("SELECT arribos FROM serie_region_mes WHERE depto_cod='01'").fetchone()[0] == 100  # CA-1b
    assert r["sin_directorio"] == ["08"] and r["sin_serie"] == ["25"]                                    # CA-2
    d.execute("INSERT INTO ocupabilidad (anio, mes, id_clase, id_categoria, ubigeo, departamento, arribos, depto_cod) VALUES (2024,1,'TT','TT','010001','AMAZONAS',1,'01')")
    try: cruzar(d); assert False
    except SerieAmbigua: pass
    print("OK cruce")

if __name__ == "__main__":
    demo()
