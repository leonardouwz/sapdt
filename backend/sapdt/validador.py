"""Reglas de dominio (RNF-01). Una regla rota NO borra la fila: queda marcada como observación y se reporta."""


def _ocupabilidad(f):
    obs = []
    if f["arribos"] is not None and f["pernoct"] is not None and f["pernoct"] < f["arribos"]:
        obs.append("pernoctaciones menores que arribos")
    for c in ("tnoh", "tnoc"):
        if f[c] is not None and not 0 <= f[c] <= 100:
            obs.append(f"{c} fuera de 0-100")
    for c, v in f.items():
        if isinstance(v, (int, float)) and not isinstance(v, bool) and v < 0 and c not in ("anio", "mes"):
            obs.append(f"valor negativo en {c}")
    return obs


def _directorio(f):
    return ["camas o habitaciones vacías"] if f["cama"] is None or f["habi"] is None else []


REGLAS = {"ocupabilidad": _ocupabilidad, "directorio": _directorio}


def observar(tipo, fila):
    return REGLAS[tipo](fila)
