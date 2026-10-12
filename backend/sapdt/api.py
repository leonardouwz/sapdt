"""API HTTP que cumple el contrato del frontend (sus puertos en src/services/ports). Solo biblioteca estándar.
Uso:  python -m sapdt.api bd/sapdt.db [puerto]      → http://localhost:8000/api/..."""
import csv
import io
import json
import math
import sqlite3
import sys
import unicodedata
from pathlib import Path
from datetime import date
from .pdf import tabla_pdf
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

DATA_MIN, DATA_MAX = (2015, 1), (2025, 6)
PANDEMIA, PARCIAL = (2020, 2021), 2025
BASE_PROYECCION = (2022, 1)
MIN_BASE, VENTANA, K_MEDIA, ALFA = 24, 12, 3, 0.3  # mismas constantes que el frontend (config/constants.ts)
MSG_RANGO = "El rango de fechas seleccionado no cuenta con registros consolidados. Por favor, selecciona un periodo válido (Ene 2015 - Jun 2025)"
NOMBRES = dict(zip([f"{i:02d}" for i in range(1, 26)], [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín",
    "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"]))
CAMPOS = ("n_establecimientos", "n_habitaciones", "n_plazas_cama", "tnoh", "tnoc", "perm", "perm_nac", "perm_ext", "arribos",
          "arribos_nac", "arribos_ext", "pernoct", "pernoct_nac", "pernoct_ext", "empleo")


class Error(Exception):
    def __init__(self, estado, mensaje):
        self.estado, self.mensaje = estado, mensaje


# ---------- utilidades ----------
def redondear(x, d=2):  # como Math.round de JavaScript (la mitad sube), no el redondeo bancario de Python
    f = 10 ** d
    return math.floor(x * f + 0.5) / f


def periodo(texto, nombre="periodo"):
    try:
        a, m = texto.split("-")
        a, m = int(a), int(m)
        assert len(texto) == 7 and 1 <= m <= 12
        return a, m
    except Exception:
        raise Error(400, f"{nombre} inválido: se espera AAAA-MM")


def indice(p):
    return p[0] * 12 + p[1] - 1


def texto(p):
    return f"{p[0]}-{p[1]:02d}"


def sumar_meses(p, n):
    i = indice(p) + n
    return i // 12, i % 12 + 1


def validar_rango(desde, hasta):
    if not (indice(DATA_MIN) <= indice(desde) <= indice(DATA_MAX) and indice(DATA_MIN) <= indice(hasta) <= indice(DATA_MAX)):
        raise Error(400, MSG_RANGO)
    if indice(desde) > indice(hasta):
        raise Error(400, "La fecha inicial no puede ser posterior a la final.")


def region(cod):
    if cod not in NOMBRES:
        raise Error(404, f"Región {cod} no encontrada")
    return {"codigo": cod, "nombre": NOMBRES[cod]}


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def percentil(xs, p):  # interpolación lineal, igual que el frontend
    s = sorted(xs)
    r = p / 100 * (len(s) - 1)
    lo, hi = math.floor(r), math.ceil(r)
    return s[lo] + (s[hi] - s[lo]) * (r - lo)


# ---------- servicios ----------
def puntos(db, cods, desde, hasta):
    validar_rango(desde, hasta)
    out = []
    for c in cods:
        r = region(c)
        filas = db.execute(f"SELECT anio, mes, {', '.join(CAMPOS)} FROM serie_region_mes WHERE depto_cod = ? "
                           "AND anio*12+mes-1 BETWEEN ? AND ? ORDER BY anio, mes", (c, indice(desde), indice(hasta))).fetchall()
        for f in filas:
            d = dict(zip(("anio", "mes") + CAMPOS, f))
            out.append({**d, "periodo": texto((d["anio"], d["mes"])), "region": r, "atipico": d["anio"] in PANDEMIA,
                        "parcial": d["anio"] == PARCIAL, "sospechosa": any((d[k] or 0) > 100 for k in ("tnoh", "tnoc"))})
    return out


def oferta(db, cod):
    r = region(cod)
    f = db.execute("SELECT MAX(fecha_corte), COUNT(*), SUM(CASE WHEN habi IS NOT NULL AND cama IS NOT NULL THEN habi END), "
                   "SUM(CASE WHEN habi IS NOT NULL AND cama IS NOT NULL THEN cama END), "
                   "SUM(CASE WHEN habi IS NULL OR cama IS NULL THEN 1 ELSE 0 END) FROM directorio WHERE depto_cod = ?", (cod,)).fetchone()
    corte, n, hab, cam, sin = f
    return {"region": r, "oferta_actual": {"fecha_corte": corte, "establecimientos": n, "habitaciones": hab, "camas": cam,
                                           "pct_sin_dato_capacidad": redondear(sin / n * 100, 1) if n else 0}}


def temporada(db, q):
    cod = q.get("region", "")
    desde, hasta = periodo(q.get("desde", texto(DATA_MIN))), periodo(q.get("hasta", texto(DATA_MAX)))
    metrica = q.get("metrica", "arribos")
    if metrica not in ("arribos", "pernoct"):
        raise Error(400, "métrica inválida")
    excl = q.get("excluir_pandemia", "true") != "false"
    p_alta, p_baja = float(q.get("p_alta", 75)), float(q.get("p_baja", 25))
    por_mes = [[] for _ in range(12)]
    for p in puntos(db, [cod], desde, hasta):
        if (excl and p["atipico"]) or p[metrica] is None:
            continue
        por_mes[p["mes"] - 1].append(p[metrica])
    prom = [redondear(sum(v) / len(v), 1) if v else None for v in por_mes]
    disp = [v for v in prom if v is not None]
    bajo = redondear(percentil(disp, p_baja), 1) if disp else None
    alto = redondear(percentil(disp, p_alta), 1) if disp else None
    meses = [{"mes": i + 1, "valor_promedio": a,
              "nivel": None if a is None or bajo is None else "alta" if a > alto else "baja" if a < bajo else "media",
              "n_observaciones": len(por_mes[i])} for i, a in enumerate(prom)]
    return {"region": region(cod), "metrica": metrica, "desde": texto(desde), "hasta": texto(hasta), "excluye_pandemia": excl,
            "umbrales": {"p_baja": bajo, "p_alta": alto}, "meses": meses}


def pronosticar(v, h, modelo):
    if modelo == "media_movil":
        buf, out = list(v), []
        for _ in range(h):
            f = sum(buf[-K_MEDIA:]) / len(buf[-K_MEDIA:])
            out.append(f)
            buf.append(f)
        return out
    nivel = sum(v[:3]) / len(v[:3])
    for y in v:
        nivel = ALFA * y + (1 - ALFA) * nivel
    return [nivel] * h


def backtest(v, h, modelo):  # validación por origen móvil en los últimos 12 meses
    n = len(v)
    if n < MIN_BASE:
        return None
    real, pred = [], []
    for o in range(n - VENTANA, n - h + 1):
        if o < K_MEDIA:
            continue
        p = pronosticar(v[:o], h, modelo)
        real += v[o:o + h]
        pred += p[:h]
    if not real:
        return None
    mae = sum(abs(a - b) for a, b in zip(real, pred)) / len(real)
    pct = [abs(a - b) / abs(a) for a, b in zip(real, pred) if a != 0]
    return redondear(mae, 1), redondear(sum(pct) / len(pct) * 100, 1)


def proyeccion(db, q):
    cod, modelo = q.get("region", ""), q.get("modelo", "media_movil")
    h = int(q.get("horizonte", 3))
    if h not in (3, 6) or modelo not in ("media_movil", "suavizado_exp"):
        raise Error(400, "horizonte (3 o 6) o modelo inválido")
    base = [p for p in puntos(db, [cod], BASE_PROYECCION, DATA_MAX) if not p["atipico"] and p["arribos"] is not None]
    hist = [{"periodo": p["periodo"], "valor": p["arribos"]} for p in base]
    vals = [x["valor"] for x in hist]
    fut = []
    if hist:
        ult = periodo(hist[-1]["periodo"])
        fut = [{"periodo": texto(sumar_meses(ult, i + 1)), "valor": math.floor(v + 0.5)} for i, v in enumerate(pronosticar(vals, h, modelo))]
    bt = backtest(vals, h, modelo) if vals else None
    return {"region": region(cod), "modelo": modelo, "horizonte": h,
            "base": {"desde": hist[0]["periodo"] if hist else texto(BASE_PROYECCION), "hasta": hist[-1]["periodo"] if hist else texto(DATA_MAX), "excluye_pandemia": True},
            "historico": hist, "proyeccion": fut, "mae": bt[0] if bt else None, "mape": bt[1] if bt else None, "confiable": bt is not None}


def comparativo(db, q):
    cods = [c for c in q.get("regiones", "").split(",") if c]
    if not 2 <= len(cods) <= 5:
        raise Error(400, "Selecciona entre 2 y 5 regiones.")
    bd, bh, cd, ch = (periodo(q.get(k, ""), k) for k in ("base_desde", "base_hasta", "comp_desde", "comp_hasta"))
    for a, b in ((bd, bh), (cd, ch)):
        validar_rango(a, b)

    def totales(c, a, b):
        t = {k: None for k in ("arribos", "arribos_nac", "arribos_ext")}
        for p in puntos(db, [c], a, b):
            for k in t:
                if p[k] is not None:
                    t[k] = (t[k] or 0) + p[k]
        return t
    filas = []
    for c in cods:
        base, comp = totales(c, bd, bh), totales(c, cd, ch)
        var = {k: (redondear((comp[k] - base[k]) / base[k] * 100, 2) if base[k] and comp[k] is not None else None) for k in base}
        filas.append({"region": region(c), "base": base, "comparacion": comp, "variacion_pct": var})
    return {"base": {"desde": texto(bd), "hasta": texto(bh)}, "comparacion": {"desde": texto(cd), "hasta": texto(ch)}, "filas": filas}


def _categoria(c):
    return c if c and c[0].isdigit() and "Estrella" in c else "Sin categoría"


def _establecimiento(f):
    (i, ruc, rs, nc, ub, dep, prov, dist, clase, cat, hab, cama, via, dv, num, tel, mail, web, fexp, cert, corte, cod) = f
    direccion = " ".join(x for x in (via, dv, num) if x) or None
    return {"id": str(i), "ruc": ruc, "razon_social": rs or "", "nombre_comercial": nc if nc and nc.strip("-. ") else (rs or ""), "ubigeo": ub, "departamento_codigo": cod,
            "departamento": NOMBRES.get(cod, dep), "provincia": prov or "", "distrito": dist or "", "clase": clase, "categoria": _categoria(cat),
            "habitaciones": hab, "camas": cama, "direccion": direccion, "telefono": tel, "email": mail, "web": web,
            "fecha_expedicion": fexp, "nro_certificado": cert, "fecha_corte": corte}


def filtrar_directorio(db, q):
    cond, par = [], []
    for k, col in (("departamento", "depto_cod"), ("provincia", "provincia"), ("clase", "clase")):
        if q.get(k):
            cond.append(f"{col} = ?")
            par.append(q[k])
    if q.get("categoria"):
        cat = q["categoria"]
        if cat == "Sin categoría":
            cond.append("(categoria IS NULL OR categoria NOT LIKE '% Estrella%')")
        else:
            cond.append("categoria = ?")
            par.append(cat)
    filas = db.execute("SELECT id, ruc, razon_social, nombre_comercial, ubigeo, departamento, provincia, distrito, clase, categoria, habi, cama, "
                       "via, des_via, numero, telef1, e_mail, pagina_web, fecha_expedicion, nro_certificado, fecha_corte, depto_cod FROM directorio "
                       f"{'WHERE ' + ' AND '.join(cond) if cond else ''} ORDER BY nombre_comercial, id", par).fetchall()
    items = [_establecimiento(f) for f in filas]
    aguja = sin_tildes(q.get("q", ""))
    return [e for e in items if not aguja or aguja in sin_tildes(e["nombre_comercial"]) or aguja in e["ruc"]] if aguja else items


def capacidad(items):
    con = [e for e in items if e["habitaciones"] is not None and e["camas"] is not None]
    return {"establecimientos": len(items), "habitaciones": sum(e["habitaciones"] for e in con) if con else None,
            "camas": sum(e["camas"] for e in con) if con else None,
            "pct_sin_dato_capacidad": redondear((len(items) - len(con)) / len(items) * 100, 1) if items else 0}


def establecimientos(db, q):
    todo = filtrar_directorio(db, q)
    page, size = max(int(q.get("page", 1)), 1), min(max(int(q.get("pageSize", 12)), 1), 100)
    return {"items": todo[(page - 1) * size: page * size], "total": len(todo), "page": page, "pageSize": size, "agregados": capacidad(todo)}


def exportar(db, reporte, q):
    """CSV o PDF de los reportes (RF-07/RF-08)."""
    formato = q.get("formato", "csv")
    if formato not in ("csv", "pdf"):
        raise Error(400, "Formato no soportado; usa csv o pdf.")
    if reporte == "directorio":
        enc = ["ruc", "nombre_comercial", "razon_social", "clase", "categoria", "departamento_codigo", "departamento", "provincia", "distrito", "direccion", "habitaciones", "camas", "telefono", "email", "nro_certificado", "fecha_corte"]
        filas = [[e[k] for k in enc] for e in filtrar_directorio(db, q)]
    elif reporte == "comparador":
        r = comparativo(db, {**q, "regiones": q.get("regiones", "")})
        enc = ["region_codigo", "region", "arribos_base", "arribos_comparacion", "variacion_total_pct", "variacion_nacional_pct", "variacion_extranjera_pct"]
        filas = [[x["region"]["codigo"], x["region"]["nombre"], x["base"]["arribos"], x["comparacion"]["arribos"], x["variacion_pct"]["arribos"], x["variacion_pct"]["arribos_nac"], x["variacion_pct"]["arribos_ext"]] for x in r["filas"]]
    elif reporte == "tendencias":
        cod, metrica = q.get("region", ""), q.get("metrica", "arribos")
        desde, hasta = periodo(q.get("desde", texto(DATA_MIN))), periodo(q.get("hasta", texto(DATA_MAX)))
        sea = temporada(db, {"region": cod, "desde": texto(desde), "hasta": texto(hasta), "metrica": metrica, "excluir_pandemia": q.get("excluirPandemia", "true")})
        enc = ["periodo", "region_codigo", "region", "metrica", "valor", "atipico", "parcial", "temporada_del_mes"]
        excl = q.get("excluirPandemia", "true") != "false"
        filas = [[p["periodo"], cod, NOMBRES[cod], metrica, None if excl and p["atipico"] else p[metrica], p["atipico"], p["parcial"], sea["meses"][p["mes"] - 1]["nivel"]] for p in puntos(db, [cod], desde, hasta)]
    elif reporte == "dashboard":
        cod = q.get("region", "04")
        ult = puntos(db, [cod], DATA_MAX, DATA_MAX)[0]
        o = oferta(db, cod)["oferta_actual"]
        enc = ["indicador", "valor", "unidad"]
        filas = [["total_arribos", ult["arribos"], "personas"], ["arribos_nacionales", ult["arribos_nac"], "personas"], ["arribos_extranjeros", ult["arribos_ext"], "personas"],
                 ["total_pernoctaciones", ult["pernoct"], "noches"], ["tasa_ocupacion_habitaciones", ult["tnoh"], "%"], ["tasa_ocupacion_camas", ult["tnoc"], "%"],
                 ["establecimientos_clasificados", o["establecimientos"], "establecimientos"], ["habitaciones_totales", o["habitaciones"], "habitaciones"],
                 ["camas_totales", o["camas"], "camas"], ["pct_sin_dato_capacidad", o["pct_sin_dato_capacidad"], "%"], ["fecha_corte_directorio", None, o["fecha_corte"]]]
    else:
        raise Error(404, f"Reporte desconocido: {reporte}")
    if formato == "pdf":
        return tabla_pdf(f"SAPDT · {reporte} · {date.today():%d/%m/%Y}", enc, filas), f"sapdt_{reporte}_{date.today():%Y%m%d}.pdf"
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(enc)
    w.writerows(filas)
    return ("﻿" + buf.getvalue()).encode("utf-8"), f"sapdt_{reporte}_{date.today():%Y%m%d}.csv"


def responder(db, ruta, q):
    """Devuelve ('json', objeto) o ('csv', (bytes, nombre))."""
    partes = [p for p in ruta.split("/") if p]
    if partes[:1] != ["api"] or len(partes) < 2:
        raise Error(404, "Ruta no encontrada")
    rec = partes[1]
    if rec == "regiones":
        return "json", [oferta(db, c) for c in NOMBRES] if len(partes) == 2 else oferta(db, partes[2])
    if rec == "series":
        cods = [c for c in q.get("region", "").split(",") if c]
        if not cods:
            raise Error(400, "Falta la región")
        return "json", puntos(db, cods, periodo(q.get("desde", texto(DATA_MIN))), periodo(q.get("hasta", texto(DATA_MAX))))
    if rec == "temporada":
        return "json", temporada(db, q)
    if rec == "proyeccion":
        return "json", proyeccion(db, q)
    if rec == "comparativo":
        return "json", comparativo(db, q)
    if rec == "establecimientos":
        return "json", establecimientos(db, q)
    if rec == "export" and len(partes) == 3:
        return "csv", exportar(db, partes[2], q)
    raise Error(404, "Ruta no encontrada")


class Manejador(BaseHTTPRequestHandler):
    base = None

    def do_GET(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        try:
            db = sqlite3.connect(Path(self.base).resolve().as_uri() + "?mode=ro", uri=True)  # solo lectura: la API nunca modifica los datos
            try:
                tipo, cuerpo = responder(db, u.path, q)
            finally:
                db.close()
            if tipo == "json":
                self._enviar(200, json.dumps(cuerpo, ensure_ascii=False).encode(), "application/json; charset=utf-8")
            else:
                datos, nombre = cuerpo
                self._enviar(200, datos, "application/pdf" if nombre.endswith(".pdf") else "text/csv; charset=utf-8", f'attachment; filename="{nombre}"')
        except Error as e:
            self._enviar(e.estado, json.dumps({"error": e.mensaje}, ensure_ascii=False).encode(), "application/json; charset=utf-8")
        except (ValueError, sqlite3.Error) as e:
            self._enviar(400 if isinstance(e, ValueError) else 500, json.dumps({"error": "Solicitud inválida" if isinstance(e, ValueError) else "Error interno"}).encode(), "application/json")

    def do_OPTIONS(self):
        self._enviar(204, b"", "text/plain")

    def _enviar(self, estado, datos, tipo, descarga=None):
        self.send_response(estado)
        self.send_header("Content-Type", tipo)
        self.send_header("Access-Control-Allow-Origin", "*")  # ponytail: abierto para desarrollo local; restringir al dominio del frontend al desplegar
        self.send_header("Access-Control-Expose-Headers", "Content-Disposition")
        if descarga:
            self.send_header("Content-Disposition", descarga)
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def log_message(self, *a):
        pass


def main(argv):
    if not argv:
        sys.exit(__doc__)
    Manejador.base = argv[0]
    puerto = int(argv[1]) if len(argv) > 1 else 8000
    print(f"API SAPDT en http://localhost:{puerto}/api  (base: {argv[0]})")
    ThreadingHTTPServer(("127.0.0.1", puerto), Manejador).serve_forever()


if __name__ == "__main__":
    main(sys.argv[1:])
