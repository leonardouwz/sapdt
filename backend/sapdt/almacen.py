"""Almacén SQLite. Todo SQL usa parámetros (resuelve el hallazgo del SQL armado con texto)."""
import sqlite3

from .esquemas import DIRECTORIO, OCUPABILIDAD, OCUPABILIDAD_CLAVE

_SQL = {"ent": "INTEGER", "dec": "REAL", "txt": "TEXT", "fecha_corte": "TEXT", "fecha_exp": "TEXT"}


def _cols(campos):  # los nombres salen de esquemas.py, nunca del usuario
    return [(n, _SQL[t]) for n, t in campos if n != "fecha_corte" or campos is DIRECTORIO]


class Almacen:
    def __init__(self, ruta=":memory:"):
        self.db = sqlite3.connect(ruta)
        oc = ", ".join(f"{n} {t}" for n, t in _cols(OCUPABILIDAD))
        dr = ", ".join(f"{n} {t}" for n, t in _cols(DIRECTORIO))
        self.db.executescript(f"""
            CREATE TABLE IF NOT EXISTS ocupabilidad ({oc}, depto_cod TEXT, fecha_corte TEXT, observacion TEXT,
                fuente TEXT, PRIMARY KEY ({", ".join(OCUPABILIDAD_CLAVE)}));
            CREATE TABLE IF NOT EXISTS directorio (id INTEGER PRIMARY KEY AUTOINCREMENT, {dr}, depto_cod TEXT,
                observacion TEXT, fuente TEXT);
            CREATE TABLE IF NOT EXISTS cargas (id INTEGER PRIMARY KEY AUTOINCREMENT, archivo TEXT, tipo TEXT,
                esquema TEXT, codificacion TEXT, leidas INTEGER, cargadas INTEGER, rechazadas INTEGER,
                observadas INTEGER, en TEXT DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS rechazos (carga_id INTEGER, linea INTEGER, motivo TEXT, contenido TEXT);
        """)

    def guardar(self, tipo, filas, fuente, rechazos, resumen):
        """Una carga es todo o nada: si algo falla, no queda nada a medias (RNF-04)."""
        with self.db:
            if tipo == "ocupabilidad":
                cols = [n for n, _ in _cols(OCUPABILIDAD)] + ["depto_cod", "fecha_corte", "observacion", "fuente"]
                self.db.executemany(
                    f"INSERT OR REPLACE INTO ocupabilidad ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})",
                    [[f.get(c) for c in cols[:-1]] + [fuente] for f in filas])  # reejecutar no duplica (CA-4)
            else:
                cols = [n for n, _ in _cols(DIRECTORIO)] + ["depto_cod", "observacion", "fuente"]
                for corte in {f["fecha_corte"] for f in filas}:  # foto: se reemplaza la misma fecha de corte
                    self.db.execute("DELETE FROM directorio WHERE fecha_corte = ? AND fuente = ?", (corte, fuente))
                self.db.executemany(
                    f"INSERT INTO directorio ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})",
                    [[f.get(c) for c in cols[:-1]] + [fuente] for f in filas])
            self.db.execute("DELETE FROM rechazos WHERE carga_id IN (SELECT id FROM cargas WHERE archivo = ?)", (fuente,))
            self.db.execute("DELETE FROM cargas WHERE archivo = ?", (fuente,))
            cid = self.db.execute(
                "INSERT INTO cargas (archivo, tipo, esquema, codificacion, leidas, cargadas, rechazadas, observadas)"
                " VALUES (?,?,?,?,?,?,?,?)",
                (fuente, tipo, resumen["esquema"], resumen["codificacion"], resumen["leidas"], len(filas),
                 len(rechazos), resumen["observadas"])).lastrowid
            self.db.executemany("INSERT INTO rechazos VALUES (?,?,?,?)", [(cid, *r) for r in rechazos])

    def contar(self, tabla):
        return self.db.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]  # tabla fija, no del usuario
