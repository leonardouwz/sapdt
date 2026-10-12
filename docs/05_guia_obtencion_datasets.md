# Guía para obtener los datasets desde la fuente original

Objetivo: dejar los CSV originales en `C:\dev\csw\datos_crudos\` para que yo (cuando me llames desde esta laptop) pueda leerlos, perfilarlos y construir RF-01/RF-02 sobre datos reales.
Fecha de verificación de las URLs: 6-oct-2026.

> Por qué lo tienes que descargar tú: desde mi entorno (nube y shell de esta laptop) la red está restringida y los portales del Estado bloquean el acceso automático. Yo solo pude **leer el inicio** de cada archivo. Tu computadora sí puede bajarlos.

## 0. Resumen (léelo primero)

| Dataset | Fuente original | Archivos | Estado |
|---|---|---|---|
| **A. Indicadores de ocupabilidad** (el importante) | MINCETUR · DGIETA | 1 CSV por año, 2015 → 2025 (1er semestre) | **Descargados y perfilados** (11 archivos, 61 890 filas) |
| **B. Directorio de hospedajes calificados** | MINCETUR · DGPDT | 1 CSV (foto a una fecha) | **Descargado y perfilado** (5 091 filas) |
| **C. Arribos y pernoctaciones** (datosTurismo) | MINCETUR · app `datosturismo` | Visor interactivo | **Sin archivo descargable verificado** (ver §4) |

**Hallazgo que cambia el plan:** el CSV de ocupabilidad **ya trae arribos y pernoctaciones** por departamento, mes, clase y categoría (columnas `TOTAL DE ARRIBOS EN EL MES`, `TOTAL PERNOCT MES`, con desglose nacional/extranjero), además de ocupación de habitaciones y camas, permanencia y empleo. Con A + B se cubren RF-01 a RF-08; C queda como validación cruzada opcional.

## 1. Preparación (2 min)
1. Python 3.9+ instalado (`python --version` en PowerShell).
2. Carpeta del proyecto: `C:\dev\csw`. Los scripts están en `C:\dev\csw\entrega\hito1\scripts\`.
3. Los datos van a `C:\dev\csw\datos_crudos\` (la crea el script). **No los subas a GitHub** (agrega `datos_crudos/` al `.gitignore` del repositorio del proyecto).

## 2. Dataset A — Indicadores de ocupabilidad

### 2.1 Qué es
Resultado de la encuesta mensual a establecimientos de hospedaje. Una fila = año × mes × clase × categoría × departamento. Separador `;`, **coma decimal** (`19,23`).

### 2.2 URLs directas (patrón verificado)
`https://www.mincetur.gob.pe/Datos_abiertos/DGIETA/Indicadores_ocupabilidad_AAAA.csv`

| Año | Estado |
|---|---|
| 2015 → 2024 | Existen con el patrón de arriba. 2015–2023 con esquema antiguo, 2024 con esquema nuevo |
| 2025 | Publicado como **1er semestre** y en otro host: `https://datosabiertos.mincetur.gob.pe/DGIETA/Indicadores_ocupabilidad_2025_1er_semestre.csv` (enlace aportado por el equipo). Cubre enero–junio; `FECHA_CORTE` 12-may-2026. Se guarda como `Indicadores_ocupabilidad_2025.csv` |
| 2025 2.º semestre / 2026 | No hay archivo conocido; revisar el portal de vez en cuando |

### 2.3 Si otra URL da 404: sacar el enlace del portal (así se resolvió 2025)
1. Abrir `https://datosabiertos.gob.pe/dataset/indicadores-de-ocupabilidad` en el navegador.
2. En la lista de recursos, ubicar el año que falta.
3. Clic derecho en **Descargar** → *Copiar dirección del enlace* (o clic normal y guardar).
4. Guardarlo en `datos_crudos\` con el nombre `Indicadores_ocupabilidad_AAAA.csv` (el perfilador busca ese patrón).
5. Anotar la URL real en este documento.

## 3. Dataset B — Directorio de hospedajes calificados
URL directa (verificada): `https://www.mincetur.gob.pe/Datos_abiertos/DGPDT/Establecimientos_hospedajes_calificados.csv`
Separador `;`, 28 columnas, `FECHA_CORTE` = fecha de la foto (la que vi era 4-oct-2026). Codificación probable Windows-1252 (los nombres con tilde y Ñ salen corruptos si se abre como UTF-8).

## 4. Dataset C — Arribos y pernoctaciones (datosTurismo)
Página: `https://datosturismo.mincetur.gob.pe/appdatosTurismo/Content3.html` ("Arribo Pernoctación Oferta Hotelera"). Es un visor por capítulos basado en la misma encuesta mensual a hospedajes.
- No encontré un enlace de descarga directa; los CSV de A contienen las mismas magnitudes.
- Si el curso exige explícitamente "tres datasets", usar C como **validación**: tomar 3–4 cifras (p. ej. arribos de Arequipa en un mes) del visor y compararlas con A. Esa comparación es una evidencia de calidad (RNF-01). No verifiqué que coincidan.

## 5. Ejecución

En PowerShell:
```powershell
cd C:\dev\csw\entrega\hito1\scripts
python descargar_datasets.py
python perfilar_ocupabilidad.py
python perfilar_directorio.py ..\..\..\datos_crudos\Establecimientos_hospedajes_calificados.csv
python analisis_exploratorio.py
```
`descargar_datasets.py` (ya incluye la URL de 2025) imprime por archivo: estado, tamaño, codificación, nº de columnas y encabezado. Resultado real: 23 columnas hasta 2023 y 24 desde 2024.

Si el script falla por red/antivirus/proxy, descarga a mano desde el navegador con las URLs de arriba y deja los archivos con **esos mismos nombres** en `datos_crudos\`.

Después, llámame desde esta laptop y dime "ya están los datos": los leo directamente de `C:\dev\csw\datos_crudos` y actualizo el perfilado y el catálogo con cifras reales.

## 6. Trampas ya detectadas (las trata RF-01/RF-02)

| # | Trampa | Qué hacer |
|---|---|---|
| T1 | **Cambio de esquema en 2024**: columnas renombradas (`AÑO`→`ANIO`, `TNOH EN EL MES(%)`→`PORCENTAJE_TNOH`…), `CLASE` pasó de código a descripción, y aparece `FECHA_CORTE` | Mapeo por posición a nombres canónicos (ya hecho en `perfilar_ocupabilidad.py`) |
| T2 | **Separador decimal inconsistente**: coma hasta 2024 (`19,23`) y **punto en 2025** (`12.46`) | Aceptar ambos antes de convertir; nunca `float()` directo |
| T3 | **Jerarquía de totales**: hay filas por (clase, categoría) concretas y filas `TT` consolidadas por clase, por categoría y global. Sumar todas las filas da 4× el total (comprobado: razón 2,00 entre todas las filas y solo las de categoría `TT`) | Para series por departamento usar **solo la fila (clase `TT`, categoría `TT`)**. El detalle no siempre suma el total (217 de 3 150 casos, sobre todo Lima y Callao, hasta 1,7 %) |
| T4 | `UBIGEO` en ocupabilidad es de departamento (`010000`); en el directorio es de distrito (`040519`) | Cruzar por los **2 primeros dígitos** |
| T5 | Tildes y Ñ (`ÁNCASH`, `JUNÍN`) | Comparar sin tildes o por UBIGEO |
| T6 | 2020–2021 (pandemia) y 2025 con solo 6 meses | Marcar como periodo atípico / parcial en RF-03 y RF-04 |
| T8 | Codificación **Windows-1252** en todos los archivos (no UTF-8) | Abrir con `cp1252`; el perfilador y los scripts ya lo hacen |
| T7 | El directorio es una foto a una fecha, no una serie | Solo indicador de oferta actual |

## 7. Fuentes consultadas
- Portal: `datosabiertos.gob.pe/dataset/indicadores-de-ocupabilidad`
- Encabezados leídos directamente de los CSV de MINCETUR (2015, 2016, 2020, 2022, 2023, 2024) y del directorio.
- `github.com/jpaima/OcupaPeru` (proyecto de terceros): indica 11 archivos 2015–jun 2025 y que MINCETUR renombró las columnas en 2024. Es dato de terceros; lo confirmé solo en parte (el cambio de 2024 sí lo vi).
