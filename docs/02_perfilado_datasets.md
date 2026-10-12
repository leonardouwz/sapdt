# Sprint 0 — Perfilado de datasets (estado real)

Qué logré verificar y qué no. No marco como verificado nada que no vi.

## Resumen

Datos reales descargados por el equipo el 6-oct-2026 en `C:\dev\csw\datos_crudos\` y perfilados con los scripts de `scripts/` (salida completa reproducible con `python analisis_exploratorio.py`).

| Dataset | Archivos | Filas | Estado |
|---------|----------|-------|--------|
| Indicadores de ocupabilidad (MINCETUR/DGIETA) | 11 (2015 → 1er semestre 2025) | 61 890 | **Perfilado completo** |
| Directorio de hospedajes calificados (MINCETUR/DGPDT) | 1 (`FECHA_CORTE` 5-oct-2026) | 5 091 (5 076 válidas + 15 con campos de más) | **Perfilado completo** |
| Arribos y pernoctaciones (datosTurismo) | — | — | **Cubierto por ocupabilidad**; visor sin descarga verificada |

Nota de consistencia: 61 890 filas coincide con la cifra que reporta un proyecto de terceros (OcupaPeru) para los mismos archivos.

## 1. Directorio de hospedajes — lo que sí se observó

URL: `https://www.mincetur.gob.pe/Datos_abiertos/DGPDT/Establecimientos_hospedajes_calificados.csv`

- **Delimitador: punto y coma (`;`)**, no coma. Confirma la sospecha del borrador.
- **28 columnas**: `FECHA_CORTE, CAMA, HABI, RUC, RAZON_SOCIAL, NOMBRE_COMERCIAL, TELEF1..TELEF4, VIA, DES_VIA, NUMERO, INTERIOR, OBS_DOMICILIO, ZONA, DES_ZONA, UBIGEO, DEPARTAMENTO, PROVINCIA, DISTRITO, E_MAIL, PAGINA_WEB, CLASE, CATEGORIA, NRO_CERTIFICADO, FECHA_EXPEDICION, REP_LEGAL`.
- **Es una foto a una fecha**: `FECHA_CORTE` = `20261005` (5-oct-2026) en las 5 076 filas válidas (el día anterior vi `20261004`: el archivo se actualiza a diario). No hay historia mensual aquí. Implicancia: sirve para oferta actual por región, no para serie temporal.
- **Clase** vista: Hotel, Hostal, Albergue, Apart Hotel, Resort. **Categoría** vista: 1 a 5 Estrellas y "Sin Categoria".
- **UBIGEO de 6 dígitos**; los 2 primeros identifican el departamento (04 = Arequipa, 08 = Cusco, 11 = Ica, 07 = Callao…). Es la mejor clave para el cruce regional.

### Problemas de calidad de datos detectados (insumo directo para RF-01/RF-02)

| # | Hallazgo | Evidencia | Tratamiento propuesto |
|---|----------|-----------|----------------------|
| D1 | Posible codificación no UTF-8 (caracteres corruptos en Ñ y tildes: CAMANÁ, JUNÍN, ÁNCASH) | Aparecen como `�` al leer | Probar `cp1252`/`latin-1`; verificar con el archivo real |
| D2 | `CAMA` y `HABI` vacíos | **3,2 %** de las filas válidas (164 establecimientos) | Tratar como nulo; no sumar como cero; reportar % por región |
| D3 | Fechas con mes en español abreviado y hora | `09-MAR-2021 05:00:00` | Parser con mapa ENE/ABR/AGO/DIC…; columna a `date` |
| D4 | `NRO_CERTIFICADO` es texto libre con formatos distintos | `02`, `165-14`, `Certificado Nro. 052-2022-GRA/GRCET/SGT.`, `CERTIFICADO N° 559-2022` | Conservar como texto; no usar como clave |
| D5 | Un mismo RUC con varios establecimientos | **223 RUC** aparecen en más de una fila | La clave del establecimiento no es el RUC; usar RUC + nombre comercial + UBIGEO |
| D6 | Registros duplicados o casi duplicados | **25** combinaciones (RUC, nombre comercial, UBIGEO) repetidas; además caso "ACUARIO" (Arequipa) con distinto RUC y mismo teléfono/certificado | Regla de detección de duplicados + reporte |
| D7 | Texto con espacios extra, comillas y basura | `"ETERNO INTI"`, `""KEYLA'S CLUB`, `IVANKAA HOSTEL TRAVEL E.I.R.L.      ` | `strip()`, quitar comillas, colapsar espacios |
| D8 | Separador `;` dentro de un campo | **15 filas con 29 campos en vez de 28** (p. ej. `Lao Loi Tai Ieong; CALLAO`); también un tabulador en `Derrama Magisterial` | Rechazar con motivo o repararlas con regla (unir los campos de más en `RAZON_SOCIAL`); decisión del equipo |
| D9 | Correos y webs inválidos o mezclados | `hotelelmolino996966647` (sin @), `admin@…` en `PAGINA_WEB` | No son críticos para el análisis; excluir de validaciones fuertes |
| D10 | Nombres de región con grafías distintas | `PROV. CONST. DEL CALLAO` en provincia; "Lima" incluye Lima provincias | Cruzar por UBIGEO, no por nombre |
| D11 | Consistencia `DEPARTAMENTO` ↔ `UBIGEO` | **Verificada**: cada código de 2 dígitos tiene un solo nombre (25 códigos) | Mantener la regla como validación |
| D12 | Categoría `0` (1 fila) y categoría `Albergue` (16 filas) en la columna de estrellas | Detectado al perfilar | Normalizar a "Sin categoría" y revisar |

Distribución real del directorio: 2 399 Hotel, 2 374 Hostal, 246 Albergue, 56 Apart Hotel, 1 Resort. Mayor oferta: Lima 960, Cusco 496, Cajamarca 416, Arequipa 403, Lambayeque 381. Teléfonos y web son los campos más vacíos (TELEF1 88,8 %, PAGINA_WEB 73,0 %), irrelevantes para el análisis.

## 2. Indicadores de ocupabilidad — resultados reales

**Cobertura:** 11 archivos, 25 departamentos, 126 meses (ene-2015 → jun-2025) → **panel completo de 3 150 combinaciones año-mes-departamento, sin huecos**. Los archivos de 2015 a 2024 tienen 12 meses; 2025 solo 6 (`FECHA_CORTE` 12-may-2026).

**Esquemas:** 23 columnas (2015–2023) y 24 (2024–2025, con `FECHA_CORTE`). Cero filas con número de campos incorrecto. Codificación **Windows-1252** en todos.

**Clases** (`id_clase`): 00 No clasificado, 01 Hotel, 02 Apart Hotel, 03 Hostal, 05 Albergue, 14 Resort, 16 Ecolodge, `TT` consolidadas.

**Vacíos:** 0,0 % en los 15 campos numéricos. Sin negativos. Sin claves repetidas. Pernoctaciones ≥ arribos en todas las filas. Sin ceros en los totales.

### Hallazgos que afectan el diseño

| # | Hallazgo (verificado con los datos) | Tratamiento |
|---|---|---|
| O1 | **Separador decimal**: coma en 2015–2024 (p. ej. `19,23`), **punto en 2025** (`12.46`) | Aceptar ambos; fijar la regla en RF-01 |
| O2 | **Jerarquía de totales**: sumar todas las filas da **4×** el total (24 de 25 departamentos exactamente 4,0; uno 3,97) porque se mezclan detalle y filas `TT` por clase, por categoría y global | Series por departamento = solo la fila (`TT`,`TT`) |
| O3 | El detalle no siempre suma el total: **217 de 3 150** casos (6,9 %), sobre todo Lima (126) y Callao (84); diferencia relativa de −0,4 % a +1,7 % | Usar el total; documentar la diferencia como limitación (posible supresión de categorías) |
| O4 | **TNOH fuera de 0–100 %**: 49 filas (0,08 %), de 100,32 a 244,89; 26 son de 2015; típicamente pocos establecimientos (p. ej. Callao, clase hotel 2 estrellas, 2 establecimientos) | Marcar como sospechosas, no descartar; no usar TNOH sin filtro |
| O5 | **Efecto pandemia**: arribos nacionales 2019 = 63,2 M; 2020 = 36,4 M (**−42,4 %**); 2021 = 47,8 M (−24,4 % vs 2019); 2022 = 53,3 M | Marcar 2020–2021 como periodo atípico en RF-03/RF-04 |
| O6 | **2025 parcial** (6 meses): 30,0 M arribos | No comparar año completo; usar solo para tendencia reciente |
| O7 | El mismo código de departamento (2 dígitos del UBIGEO) existe en ocupabilidad y directorio: **25 de 25 coinciden, mismos nombres** | Cruce por código de departamento sin huérfanos |

Arribos nacionales por año (suma de departamentos, fila TT,TT): 2015 47,9 M · 2016 50,6 M · 2017 51,9 M · 2018 55,4 M · 2019 63,2 M · 2020 36,4 M · 2021 47,8 M · 2022 53,3 M · 2023 53,0 M · 2024 57,6 M · 2025 (ene–jun) 30,0 M.

## 3. Arribos y pernoctaciones (datosTurismo)

El visor `datosturismo.mincetur.gob.pe/appdatosTurismo/Content3.html` muestra arribos, pernoctaciones y oferta hotelera de la misma encuesta mensual. No encontré enlace de descarga. Decisión: **A cubre RF-03/04/05**; C se usa como validación cruzada de 3–4 cifras (evidencia de calidad). No se verificó que ambas fuentes coincidan.

**Riesgo restante:** el 2025 solo llega a junio; si se publica el 2.º semestre habrá que reincorporarlo. El Plan B (BCRP) ya no es necesario para la serie mensual.

## 3.1 Estado
Perfilado completado el 6-oct-2026. Para repetirlo: `05_guia_obtencion_datasets.md` §5.

## 4. Decisión de diseño que ya se puede tomar
Cruzar por **UBIGEO de departamento (2 dígitos)** y no por nombre de región. Esto evita D10 y se refleja en los criterios de aceptación de RF-02. Las series regionales salen del dataset de ocupabilidad (que ya trae arribos y pernoctaciones); el directorio aporta la oferta.
