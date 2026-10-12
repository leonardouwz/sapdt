"""RF-03 proyección, RF-04 temporada, RF-05 comparativo, RF-06 directorio, RF-08 exportación CSV.
Leen las tablas que deja el cruce (RF-02). Los modelos son intercambiables: cualquier objeto con predecir(valores, meses)."""
import csv
import statistics
from collections import Counter

ATIPICOS = (2020, 2021)  # pandemia (RF-04 CA-2)
MIN_MESES = 24           # RF-03 CA-3


class PromedioMovil:
    def __init__(self, ventana=3):
        self.ventana = ventana

    def predecir(self, v, meses):
        cola = v[-self.ventana:]
        return [sum(cola) / len(cola)] * meses


class SuavizadoExponencial:
    def __init__(self, alfa=0.5):
        self.alfa = alfa

    def predecir(self, v, meses):
        nivel = v[0]
        for x in v[1:]:
            nivel = self.alfa * x + (1 - self.alfa) * nivel
        return [nivel] * meses


class EstacionalIngenuo:  # repite lo ocurrido en los últimos 12 meses (captura la temporada)
    def predecir(self, v, meses):
        ult = v[-12:]
        return [ult[i % len(ult)] for i in range(meses)]


MODELOS = {"promedio_movil": PromedioMovil, "suavizado_exponencial": SuavizadoExponencial, "estacional_ingenuo": EstacionalIngenuo}


def serie(db, depto, campo="arribos"):
    """[(anio, mes, valor)] ordenada. campo viene de una lista fija, nunca del usuario."""
    assert campo in ("arribos", "arribos_nac", "arribos_ext", "pernoct")
    f = db.execute(f"SELECT anio, mes, {campo} FROM serie_region_mes WHERE depto_cod = ? ORDER BY anio, mes", (depto,)).fetchall()
    if not f:
        raise ValueError(f"región sin datos: {depto}")
    return f


def _mas_meses(anio, mes, n):
    t = anio * 12 + mes - 1 + n
    return t // 12, t % 12 + 1


def proyectar(db, depto, modelo="estacional_ingenuo", meses=6, validacion=12):
    if not 1 <= meses <= 12:
        raise ValueError("meses debe estar entre 1 y 12")
    s = serie(db, depto)
    vals = [v or 0 for _, _, v in s]
    m = MODELOS[modelo]()
    resumen = {"depto": depto, "modelo": modelo, "meses_historia": len(vals), "confiable": len(vals) >= MIN_MESES}
    if len(vals) > validacion + 12:  # hold-out: se entrena sin los últimos meses y se compara contra lo real
        real, pred = vals[-validacion:], m.predecir(vals[:-validacion], validacion)
        err = [abs(r - p) for r, p in zip(real, pred)]
        resumen["mae"] = sum(err) / len(err)
        pct = [e / r for e, r in zip(err, real) if r]
        resumen["mape"] = 100 * sum(pct) / len(pct) if pct else None
    ult = s[-1]
    futuro = [_mas_meses(ult[0], ult[1], i + 1) for i in range(meses)]
    return resumen, [(a, mm, round(p)) for (a, mm), p in zip(futuro, m.predecir(vals, meses))]


def temporada(db, depto, p_alta=75, p_baja=25, excluir=ATIPICOS):
    """Clasifica cada mes por percentiles de la propia región; los años atípicos no definen los umbrales y salen como 'atípico'."""
    s = serie(db, depto)
    normales = [v for a, _, v in s if a not in excluir and v is not None]
    q = statistics.quantiles(normales, n=100, method="inclusive")
    alta, baja = q[p_alta - 1], q[p_baja - 1]
    out = [(a, m, v, "atípico" if a in excluir else "alta" if v >= alta else "baja" if v <= baja else "media") for a, m, v in s]
    tipico = {mes: Counter(c for a, mm, _, c in out if mm == mes and c != "atípico").most_common(1)[0][0] for mes in range(1, 13)
              if any(mm == mes and c != "atípico" for a, mm, _, c in out)}
    return out, tipico


def comparar(db, deptos, desde, hasta):
    """desde/hasta = (anio, mes). Devuelve total del periodo y variación % contra el periodo anterior de igual largo."""
    if len(set(deptos)) < 2:
        raise ValueError("elige al menos 2 regiones")
    t = lambda p: p[0] * 12 + p[1] - 1
    if t(desde) > t(hasta):
        raise ValueError("el rango está al revés")
    ini, fin = db.execute("SELECT MIN(anio*12+mes-1), MAX(anio*12+mes-1) FROM serie_region_mes").fetchone()
    if t(desde) < ini or t(hasta) > fin:
        raise ValueError("el rango no existe en los datos")
    largo = t(hasta) - t(desde) + 1
    suma = lambda d, a, b: db.execute("SELECT SUM(arribos) FROM serie_region_mes WHERE depto_cod = ? AND anio*12+mes-1 BETWEEN ? AND ?", (d, a, b)).fetchone()[0]
    filas = []
    for d in deptos:
        total, antes = suma(d, t(desde), t(hasta)), (suma(d, t(desde) - largo, t(desde) - 1) if t(desde) - largo >= ini else None)
        filas.append((d, total, antes, round(100 * (total - antes) / antes, 1) if antes else None))
    return filas


def buscar_directorio(db, departamento=None, provincia=None, clase=None, categoria=None):
    """Filtros combinables (RF-06). Devuelve (filas, indicadores). Los valores van como parámetros, no pegados al SQL."""
    cond, par = [], []
    for col, val in (("departamento", departamento), ("provincia", provincia), ("clase", clase), ("categoria", categoria)):
        if val:
            cond.append(f"UPPER({col}) = UPPER(?)")
            par.append(val)
    donde = ("WHERE " + " AND ".join(cond)) if cond else ""
    filas = db.execute(f"SELECT ruc, nombre_comercial, departamento, provincia, distrito, clase, categoria, habi, cama FROM directorio {donde} ORDER BY nombre_comercial", par).fetchall()
    ind = {"establecimientos": len(filas), "habitaciones": sum(f[7] or 0 for f in filas), "camas": sum(f[8] or 0 for f in filas),
           "sin_dato_camas_o_habitaciones": sum(1 for f in filas if f[7] is None or f[8] is None)}  # CA-2: los vacíos se declaran
    return filas, ind


def exportar_csv(ruta, encabezado, filas):
    with open(ruta, "w", newline="", encoding="utf-8-sig") as f:  # utf-8-sig: Excel abre bien tildes y ñ
        w = csv.writer(f)
        w.writerow(encabezado)
        w.writerows(filas)
