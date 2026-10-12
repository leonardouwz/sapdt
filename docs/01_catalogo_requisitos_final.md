# SAPDT — Catálogo de requisitos funcionales (versión para el Hito 1)

Proyecto: Sistema de Análisis y Proyección de Demanda Turística Regional · Curso: Calidad de Software
Estado: **cerrado con datos reales** (perfilado del 6-oct-2026, ver `02_perfilado_datasets.md`).

Balance exigido: 3 alta · 3 media · 2 baja complejidad = 8 requisitos.

| ID | Nombre | Complejidad | Prioridad | Sprint | Fuente de datos | Responsable |
|----|--------|-------------|-----------|--------|-----------------|-------------|
| RF-01 | Ingesta y consolidación de datasets heterogéneos | Alta | Must | 1 | Ocupabilidad (2015–2025) + directorio | Frente datos |
| RF-02 | Cruce geográfico y temporal | Alta | Must | 1 | Series + directorio | Frente datos |
| RF-03 | Proyección de demanda a 3–6 meses | Alta | Must | 2 | Series consolidadas | Frente análisis |
| RF-04 | Detección de temporada alta/media/baja | Media | Must | 2 | Series consolidadas | Frente análisis |
| RF-05 | Reportes comparativos entre regiones | Media | Should | 2 | Series consolidadas | Frente producto |
| RF-06 | Filtrado y exploración del directorio | Media | Should | 2 | Directorio | Frente producto |
| RF-07 | Visualización de series históricas | Baja | Should | 2 | Series consolidadas | Frente producto |
| RF-08 | Exportación de reportes (CSV/PDF) | Baja | Could | 2 | Salidas de RF-03..05 | Frente producto |

## Detalle con criterios de aceptación (verificables)

### RF-01 — Ingesta y consolidación (Alta)
Lee los archivos crudos, normaliza delimitador, codificación, nombres de columna y esquema por año, y deja un modelo consolidado.
- CA-1: acepta el directorio con separador `;` y codificación Latin-1/CP1252 sin generar caracteres corruptos en nombres (CAMANÁ, JUNÍN, ÁNCASH, SAN ROMÁN).
- CA-2: reconoce los dos esquemas de ocupabilidad (23 columnas hasta 2023; 24 desde 2024 con `FECHA_CORTE`) y los lleva a nombres canónicos; si un archivo trae otra cantidad de columnas, lo rechaza con mensaje claro (no carga a medias).
- CA-2b: convierte el decimal (coma hasta 2024, punto en 2025) y registra valores no numéricos como rechazos.
- CA-3: genera un reporte de calidad por carga: filas leídas, filas rechazadas, nulos por columna.
- CA-4: reejecutar la misma carga no duplica registros (idempotencia).

### RF-02 — Cruce geográfico y temporal (Alta)
Une series regionales/mensuales con el directorio de establecimientos (puntual, foto a una fecha de corte).
- CA-1: la clave de región es el código de departamento (2 primeros dígitos del UBIGEO: `010000`→`01`, `040519`→`04`); el nombre solo se usa para mostrar.
- CA-1b: las series por departamento usan únicamente las filas consolidadas; una prueba falla si se suma más de una fila por departamento-mes (sumar todas las filas da 4× el total, verificado).
- CA-2: toda región sin correspondencia queda listada en un reporte de huérfanos, no se descarta en silencio.
- CA-3: el directorio se trata como snapshot (tiene `FECHA_CORTE`); la agregación por región (conteo de establecimientos, suma de camas/habitaciones) se declara explícitamente como indicador estático y no como serie.

### RF-03 — Proyección de demanda (Alta)
Pronóstico de arribos por región a 3–6 meses con modelo simple intercambiable.
- CA-1: ofrece al menos promedio móvil y suavizado exponencial.
- CA-2: calcula MAE y MAPE sobre un tramo de validación (hold-out de los últimos 6–12 meses).
- CA-3: marca como "no confiable" una región con menos de 24 meses de historia (los 25 departamentos tienen 126 meses, así que la regla protege futuras cargas).

### RF-04 — Temporada alta/baja (Media)
- CA-1: clasifica cada mes-región por percentiles (≥P75 alta, ≤P25 baja, resto media), parámetros configurables.
- CA-2: 2020–2021 se marca como periodo atípico (arribos nacionales −42,4 % en 2020 y −24,4 % en 2021 frente a 2019); el 2025 se trata como parcial (6 meses).

### RF-05 — Reportes comparativos (Media)
- CA-1: el usuario elige 2 o más regiones y un rango de fechas; el sistema valida que el rango exista en los datos.
- CA-2: muestra variación porcentual y total del periodo por región.

### RF-06 — Exploración del directorio (Media)
- CA-1: filtros por departamento, provincia, clase (Hotel, Hostal, Albergue, Apart Hotel, Resort) y categoría (1 a 5 estrellas, "Sin Categoria").
- CA-2: muestra indicadores agregados por zona: cantidad de establecimientos y suma de habitaciones/camas (considerando que `CAMA` y `HABI` vienen vacíos en parte de los registros).

### RF-07 — Visualización de series (Baja)
- CA-1: gráfico de línea de arribos y pernoctaciones por región y mes con selector de rango de años.

### RF-08 — Exportación (Baja)
- CA-1: exporta temporada, comparativos y proyecciones a CSV (Must) y PDF (Could).

## Requisitos no funcionales (para sostener el enfoque de calidad del proyecto)
Apoyados en ISO/IEC 25010, que es lo que el curso pide citar.

| ID | Característica 25010 | Requisito medible |
|----|----------------------|-------------------|
| RNF-01 | Adecuación funcional / corrección de datos | 100% de filas rechazadas quedan registradas con motivo; reglas de dominio activas: pernoctaciones ≥ arribos, TNOH entre 0 y 100 % (hoy 49 filas sospechosas) |
| RNF-02 | Mantenibilidad (modificabilidad) | Agregar un modelo de proyección o un formato de exportación toca ≤ 1 clase existente |
| RNF-03 | Mantenibilidad (capacidad de prueba) | Servicios de dominio probables sin BD ni archivos (dobles) |
| RNF-04 | Fiabilidad | El pipeline es idempotente y no deja cargas parciales |
| RNF-05 | Eficiencia | Consulta de una serie regional < 2 s con el histórico completo |
| RNF-06 | Portabilidad | Despliegue reproducible en la nube con variables de entorno, sin credenciales en el repo |

## Trazabilidad (requisito → caso de uso → componente → prueba)

| RF | Caso de uso | Componente | Prueba mínima |
|----|-------------|------------|---------------|
| RF-01 | CU-01 Cargar datos | IngestService + Normalizer | Archivo con esquema de otro año; archivo con encoding erróneo |
| RF-02 | CU-02 Consolidar y cruzar | JoinService | Región sin correspondencia aparece en huérfanos |
| RF-03 | CU-03 Ver proyección | ForecastService + ForecastModel | Test aislado con repositorio en memoria |
| RF-04 | CU-04 Consultar temporada | SeasonClassifier | Serie sintética con percentiles conocidos |
| RF-05 | CU-05 Comparar regiones | ReportService | Rango inválido rechazado |
| RF-06 | CU-06 Explorar directorio | DirectoryQuery | Filtro combinado departamento+categoría |
| RF-07 | CU-07 Ver series | Dashboard | Selector de rango devuelve solo ese rango |
| RF-08 | CU-08 Exportar | ReportFormat | CSV reabre con las mismas filas |

## Cambios respecto al borrador anterior
- Se añadieron criterios de aceptación y RNF; el catálogo sigue siendo de 8 RF con balance 3-3-2.
- RF-02 declara explícitamente que el directorio es una foto a una fecha, no una serie temporal.
