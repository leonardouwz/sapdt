"""Lectura de CSV del MINCETUR: separador ';' y codificación variable (CA-1 de RF-01)."""
import csv
from pathlib import Path

CODIFICACIONES = ("utf-8", "cp1252", "latin-1")  # latin-1 nunca falla: último recurso


def leer_csv(ruta):
    """Devuelve (codificación, encabezado, filas). Cada fila es una lista de campos sin tocar."""
    raw = Path(ruta).read_bytes()
    for enc in CODIFICACIONES:
        try:
            texto = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    filas = list(csv.reader(texto.splitlines(), delimiter=";"))
    if not filas:
        raise ValueError(f"{Path(ruta).name}: archivo vacío")
    return enc, filas[0], filas[1:]
