"""Reparación de filas del directorio con UN campo de más (15 filas en la foto del 5-oct-2026).
Causa: el portal usa ';' como separador pero algunas filas traen ';' dentro de un texto.
Solo se repara si el resultado cumple las anclas (ubigeo de 6 dígitos y departamento en mayúsculas); si no, se rechaza."""
import re

I_UBIGEO, I_EMAIL, I_WEB = 17, 21, 22  # posiciones en la fila de 28 campos (esquemas.DIRECTORIO)


def _ok(v):
    return len(v) == 28 and re.fullmatch(r"\d{6}", v[I_UBIGEO].strip()) and v[I_UBIGEO + 1].strip().isupper()


def reparar_directorio(v):
    """Devuelve (fila_de_28_campos, descripción) o None si no hay reparación segura."""
    if len(v) != 29:
        return None
    # Caso 1: el ';' está antes del ubigeo (dirección: "MZ-K; LT 36")
    if not re.fullmatch(r"\d{6}", v[I_UBIGEO].strip()):
        # el texto cortado deja el trozo siguiente con un espacio al inicio (" LT 36"): ese es el candidato
        orden = sorted(range(10, I_UBIGEO), key=lambda i: not (v[i + 1][:1].isspace() and v[i + 1].strip()))
        for i in orden:  # une el campo i con el siguiente
            w = v[:i] + [v[i].rstrip() + "; " + v[i + 1].strip()] + v[i + 2:]
            if _ok(w):
                return w, "dirección con ';' dentro del texto, unida"
        return None
    # Caso 2: el ';' está después del ubigeo
    if v[I_WEB].strip().lower() in ("http", "https"):  # "https;//:www.x" -> "https://www.x"
        w = v[:I_WEB] + [v[I_WEB].strip() + "://" + v[I_WEB + 1].lstrip("/: ")] + v[I_WEB + 2:]
        desc = "dirección web con ';' en lugar de ':', corregida"
    elif "@" in v[I_EMAIL] and "@" in v[I_EMAIL + 1]:  # dos correos separados por ';'
        w = v[:I_EMAIL] + [v[I_EMAIL].strip() + "; " + v[I_EMAIL + 1].strip()] + v[I_EMAIL + 2:]
        desc = "dos correos separados por ';', unidos"
    else:
        return None
    return (w, desc) if _ok(w) else None
