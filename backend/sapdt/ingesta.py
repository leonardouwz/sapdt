"""IngestService (RF-01): lee, normaliza, valida, guarda y devuelve un reporte de calidad por carga."""
from collections import Counter
from pathlib import Path

from .esquemas import (DIRECTORIO, OCUPABILIDAD, OCUPABILIDAD_CLAVE, OCUPABILIDAD_NUEVO)
from .lectura import leer_csv
from .reparar import reparar_directorio
from .normalizador import FilaRechazada, Normalizador
from .validador import observar


class EsquemaDesconocido(ValueError):
    """Archivo con otra cantidad de columnas: se rechaza completo, sin cargar a medias (CA-2)."""


def _detectar(encabezado):
    cols = [h.strip().upper() for h in encabezado]
    if "RUC" in cols:
        return "directorio", "directorio", DIRECTORIO
    if cols[0] == "FECHA_CORTE":
        return "ocupabilidad", "nuevo (2024 en adelante)", OCUPABILIDAD_NUEVO
    return "ocupabilidad", "antiguo (2015 a 2023)", OCUPABILIDAD


class IngestService:
    def __init__(self, almacen):
        self.almacen = almacen

    def cargar(self, ruta):
        nombre = Path(ruta).name
        enc, encabezado, filas = leer_csv(ruta)
        tipo, esquema, campos = _detectar(encabezado)
        if len(encabezado) != len(campos):
            raise EsquemaDesconocido(f"{nombre}: {len(encabezado)} columnas, se esperaban {len(campos)}; no se cargó nada")
        norm = Normalizador(campos)
        buenas, rechazos, motivos, obs_motivos, vistas = [], [], Counter(), Counter(), set()
        reparadas = Counter()
        for i, valores in enumerate(filas, start=2):  # línea 1 = encabezado
            nota = None
            if tipo == "directorio" and len(valores) == len(campos) + 1 and (rep := reparar_directorio(valores)):
                valores, nota = rep
                reparadas[nota] += 1
            try:
                f = norm.fila(valores)
                if tipo == "ocupabilidad":
                    clave = tuple(f[c] for c in OCUPABILIDAD_CLAVE)
                    if clave in vistas:
                        raise FilaRechazada("clave repetida en el mismo archivo")
                    vistas.add(clave)
            except FilaRechazada as e:
                rechazos.append((i, str(e), ";".join(valores)[:300]))
                motivos[str(e).split(":")[0] if "campos" not in str(e) else "campos de más o de menos"] += 1
                continue
            obs = observar(tipo, f)
            if nota:
                obs = [f"reparada: {nota}"] + obs
            f["observacion"] = "; ".join(obs) or None
            obs_motivos.update(o for o in obs if not o.startswith("reparada"))
            buenas.append(f)
        resumen = {"esquema": esquema, "codificacion": enc, "leidas": len(filas),
                   "observadas": sum(1 for f in buenas if f["observacion"])}
        self.almacen.guardar(tipo, buenas, nombre, rechazos, resumen)
        nulos = {n: round(100 * sum(1 for f in buenas if f[n] is None) / len(buenas), 1)
                 for n, _ in campos if buenas and any(f[n] is None for f in buenas)}
        reporte = {"archivo": nombre, "tipo": tipo, **resumen, "cargadas": len(buenas), "rechazadas": len(rechazos),
                   "reparadas": dict(reparadas), "rechazos_por_motivo": dict(motivos), "observaciones": dict(obs_motivos),
                   "nulos_pct": nulos, "primeros_rechazos": rechazos[:3]}
        if tipo == "directorio":
            rep = Counter((f["ruc"], f["nombre_comercial"], f["ubigeo"]) for f in buenas)
            reporte["posibles_duplicados"] = sum(1 for v in rep.values() if v > 1)
            reporte["ruc_en_varias_filas"] = sum(1 for v in Counter(f["ruc"] for f in buenas).values() if v > 1)
        return reporte

    def cargar_carpeta(self, carpeta):
        reportes, errores = [], []
        for p in sorted(Path(carpeta).glob("*.csv")):
            try:
                reportes.append(self.cargar(p))
            except EsquemaDesconocido as e:
                errores.append(str(e))
        return reportes, errores
