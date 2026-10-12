"""Prueba mínima de RF-01. Ejecutar:  python tests/test_ingesta.py   (desde la carpeta sapdt/)"""
import sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sapdt.almacen import Almacen
from sapdt.ingesta import EsquemaDesconocido, IngestService

FILA = "2024;1;1;HOTEL;1;1 ESTRELLA;AMAZONAS;010000;5;50;100;{t};10,5;1;1;0;100;80;20;200;150;50;9"
ENC = "FECHA_CORTE;ANIO;MES;ID_CLASE;CLASE;ID_CAT;CAT;DEPT;UBIGEO;EST;HAB;PLZ;TNOH;TNOC;PERM;PN;PE;ARR;ARRN;ARRE;PER;PERN;PERE;EMP"

def demo():
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "oc.csv"
        buenas = "20241005;" + FILA.format(t="50,5")           # coma decimal
        mala = "20241005;" + FILA.format(t="abc")              # no numérica -> rechazada
        p.write_bytes((ENC + "\n" + buenas + "\n" + mala + "\n").encode("cp1252"))
        a = Almacen(); s = IngestService(a)
        r = s.cargar(p); s.cargar(p)                            # dos veces: no duplica (CA-4)
        assert (r["leidas"], r["cargadas"], r["rechazadas"]) == (2, 1, 1), r
        assert a.contar("ocupabilidad") == 1
        (Path(d) / "raro.csv").write_text("A;B;C\n1;2;3\n")
        try: s.cargar(Path(d) / "raro.csv"); assert False
        except EsquemaDesconocido: pass
        assert a.contar("ocupabilidad") == 1                    # rechazo total no dejó nada
    print("OK")

def demo_reparar():
    from sapdt.reparar import reparar_directorio
    base = ["20261005", "1", "1", "20123456789", "RS", "NC", "", "", "", "", "AV.", "X", "1", "", "", "", "", "010101", "AMAZONAS", "P", "D", "a@x.pe", "w.pe", "Hotel", "3 Estrellas", "1", "03-ABR-2014 05:00:00", "RL"]
    dos_correos = base[:21] + ["a@x.pe", "b@x.pe"] + base[22:]
    v, _ = reparar_directorio(dos_correos); assert len(v) == 28 and v[21] == "a@x.pe; b@x.pe"
    direccion = base[:11] + ["MZ-K", " LT 36"] + base[12:]
    v, _ = reparar_directorio(direccion); assert len(v) == 28 and v[11] == "MZ-K; LT 36"
    web = base[:21] + ["a@x.pe", "https", "//:www.x.pe/"] + base[23:]
    v, _ = reparar_directorio(web); assert v[22] == "https://www.x.pe/"
    assert reparar_directorio(base + ["?"]) is None  # 29 campos pero sin ancla válida -> se rechaza
    print("OK reparar")

if __name__ == "__main__":
    demo()
    demo_reparar()
