"""Convierte una fila cruda en un diccionario tipado. Lo que no se puede convertir se rechaza con motivo."""
import re
from datetime import date

MESES = {"ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6, "JUL": 7, "AGO": 8,
         "SET": 9, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12}


class FilaRechazada(ValueError):
    """El mensaje es el motivo que queda en el reporte de calidad."""


def limpiar(texto):
    return " ".join(texto.replace('"', "").split())  # quita comillas y espacios de más


def _numero(valor, nombre, entero):
    v = valor.strip().replace(",", ".")  # coma decimal hasta 2024, punto en 2025
    if not v:
        return None
    try:
        n = float(v)
    except ValueError:
        raise FilaRechazada(f"valor no numérico en {nombre}: {valor.strip()[:30]!r}")
    if entero:
        if not n.is_integer():
            raise FilaRechazada(f"se esperaba entero en {nombre}: {valor.strip()[:30]!r}")
        return int(n)
    return n


def _fecha(valor, nombre):
    v = valor.strip()
    if not v:
        return None
    try:
        if re.fullmatch(r"\d{8}", v):  # 20261005
            return date(int(v[:4]), int(v[4:6]), int(v[6:])).isoformat()
        m = re.match(r"(\d{1,2})-([A-Za-z]{3})-(\d{4})", v)  # 09-MAR-2021 05:00:00
        return date(int(m[3]), MESES[m[2].upper()], int(m[1])).isoformat()
    except (TypeError, KeyError, ValueError):
        raise FilaRechazada(f"fecha ilegible en {nombre}: {v[:30]!r}")


class Normalizador:
    def __init__(self, campos):
        self.campos = campos

    def fila(self, valores):
        if len(valores) != len(self.campos):
            raise FilaRechazada(f"{len(valores)} campos en vez de {len(self.campos)}")
        out = {}
        for (nombre, tipo), v in zip(self.campos, valores):
            if tipo == "txt":
                out[nombre] = limpiar(v) or None
            elif tipo == "ent":
                out[nombre] = _numero(v, nombre, True)
            elif tipo == "dec":
                out[nombre] = _numero(v, nombre, False)
            else:
                out[nombre] = _fecha(v, nombre)
        ub = out.get("ubigeo")
        if ub is not None and not re.fullmatch(r"\d{6}", ub):
            raise FilaRechazada(f"ubigeo inválido: {ub!r}")
        if ub:
            out["depto_cod"] = ub[:2]  # clave de región para el cruce (RF-02)
        return out
