"""Esquemas como DATOS (decisión del ADR-001): agregar un esquema nuevo no toca el código del normalizador.
Cada campo es (nombre_canónico, tipo). Tipos: txt, ent (entero), dec (decimal), fecha_corte, fecha_exp."""

OCUPABILIDAD = [
    ("anio", "ent"), ("mes", "ent"), ("id_clase", "txt"), ("clase", "txt"), ("id_categoria", "txt"),
    ("categoria", "txt"), ("departamento", "txt"), ("ubigeo", "txt"), ("n_establecimientos", "ent"),
    ("n_habitaciones", "ent"), ("n_plazas_cama", "ent"), ("tnoh", "dec"), ("tnoc", "dec"),
    ("perm", "dec"), ("perm_nac", "dec"), ("perm_ext", "dec"), ("arribos", "ent"), ("arribos_nac", "ent"),
    ("arribos_ext", "ent"), ("pernoct", "ent"), ("pernoct_nac", "ent"), ("pernoct_ext", "ent"), ("empleo", "ent"),
]
# Desde 2024 MINCETUR añadió FECHA_CORTE como primera columna (24 columnas en vez de 23).
OCUPABILIDAD_NUEVO = [("fecha_corte", "fecha_corte")] + OCUPABILIDAD
OCUPABILIDAD_CLAVE = ("anio", "mes", "id_clase", "id_categoria", "ubigeo")

DIRECTORIO = [
    ("fecha_corte", "fecha_corte"), ("cama", "ent"), ("habi", "ent"), ("ruc", "txt"), ("razon_social", "txt"),
    ("nombre_comercial", "txt"), ("telef1", "txt"), ("telef2", "txt"), ("telef3", "txt"), ("telef4", "txt"),
    ("via", "txt"), ("des_via", "txt"), ("numero", "txt"), ("interior", "txt"), ("obs_domicilio", "txt"),
    ("zona", "txt"), ("des_zona", "txt"), ("ubigeo", "txt"), ("departamento", "txt"), ("provincia", "txt"),
    ("distrito", "txt"), ("e_mail", "txt"), ("pagina_web", "txt"), ("clase", "txt"), ("categoria", "txt"),
    ("nro_certificado", "txt"), ("fecha_expedicion", "fecha_exp"), ("rep_legal", "txt"),
]
