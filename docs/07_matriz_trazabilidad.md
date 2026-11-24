# SAPDT — Matriz de trazabilidad de requisitos (Hito 2)

Cada requisito del [catálogo](01_catalogo_requisitos_final.md) se sigue hasta el código que lo implementa y la prueba automática que lo verifica. Las pruebas del backend son funciones `demo()` con `assert` (sin dependencias); las del frontend usan Vitest.

Cómo correr todas las pruebas: ver la sección **Pruebas** del [README](../README.md#pruebas).

## 1. Requisito → caso de uso → código → prueba

| RF | Complejidad | Caso de uso | Backend (Python) | API REST | Frontend (pantalla) | Prueba automática | Estado |
|----|-------------|-------------|------------------|----------|---------------------|-------------------|--------|
| RF-01 Ingesta y consolidación | Alta | CU-01 Cargar datos | `sapdt/ingesta.py` (`IngestService`), `normalizador.py`, `validador.py`, `reparar.py`, `lectura.py`, `esquemas.py`, `almacen.py`, `cargar.py` | — (proceso por lotes) | — | `tests/test_ingesta.py` (`demo`, `demo_reparar`) | Pasa |
| RF-02 Cruce geográfico y temporal | Alta | CU-02 Consolidar y cruzar | `sapdt/cruce.py` (`cruzar`, `reporte`) | `/api/regiones`, `/api/regiones/{cod}` | Dashboard (`routes/index.tsx`) | `tests/test_cruce.py`; `tests/test_api.py` (oferta por región) | Pasa |
| RF-03 Proyección 3–6 meses | Alta | CU-03 Ver proyección | `sapdt/analisis.py` (`proyectar`, `PromedioMovil`, `SuavizadoExponencial`, `EstacionalIngenuo`); `api.py` (`pronosticar`, `backtest`) | `/api/proyeccion` | Simulador (`routes/proyecciones.tsx`, `domain/forecast.ts`, `domain/confidence.ts`) | `tests/test_analisis.py`; `tests/test_api.py`; `src/test/domain.test.ts` ("confidence bounds") | Pasa |
| RF-04 Temporada alta/media/baja | Media | CU-04 Consultar temporada | `sapdt/analisis.py` (`temporada`); `api.py` (`temporada`, `percentil`) | `/api/temporada` | Tendencias (`routes/tendencias.tsx`, `components/season/SeasonMatrix.tsx`, `domain/seasonality.ts`) | `tests/test_analisis.py`; `tests/test_api.py`; `domain.test.ts` ("percentile linear", "season s/d") | Pasa |
| RF-05 Comparativos entre regiones | Media | CU-05 Comparar regiones | `sapdt/analisis.py` (`comparar`); `api.py` (`comparativo`, `validar_rango`) | `/api/comparativo` | Comparador (`routes/comparador.tsx`, `components/compare/VariationTable.tsx`, `domain/compare.ts`) | `tests/test_analisis.py` (rango inválido); `tests/test_api.py`; `domain.test.ts` ("variation null on base 0") | Pasa |
| RF-06 Exploración del directorio | Media | CU-06 Explorar directorio | `sapdt/analisis.py` (`buscar_directorio`); `api.py` (`filtrar_directorio`, `capacidad`) | `/api/establecimientos` | Directorio (`routes/directorio.tsx`, `components/directory/*`) | `tests/test_analisis.py` (filtro clase + categoría); `tests/test_api.py` | Pasa |
| RF-07 Series históricas | Baja | CU-07 Ver series | `sapdt/analisis.py` (`serie`); `api.py` (`puntos`) | `/api/series` | Dashboard y Tendencias (`components/charts/charts.tsx`) | `tests/test_api.py` (rango y marca de atípico); `domain.test.ts` ("periods") | Pasa |
| RF-08 Exportación CSV/PDF | Baja | CU-08 Exportar | `sapdt/analisis.py` (`exportar_csv`); `sapdt/pdf.py` (`tabla_pdf`); `api.py` (`exportar`) | `/api/export/{reporte}` | Botones de exportación (`services/mock/export/*`) | `tests/test_analisis.py` (CSV reabre igual); `tests/test_api.py` (cabecera CSV, PDF válido) | Pasa (CSV y PDF; botón "Descargar PDF" verificado a mano el 24-nov-2026) |

## 2. Criterio de aceptación → verificación

| RF | Criterio | Cómo se verifica |
|----|----------|------------------|
| RF-01 | CA-1 codificación Latin-1/CP1252 sin caracteres corruptos | Carga real: [`reporte_calidad.md`](../backend/reporte_calidad.md) detecta `cp1252` en los 13 archivos |
| RF-01 | CA-2 dos esquemas (23/24 columnas); otro esquema se rechaza completo | `test_ingesta.demo`: archivo `raro.csv` lanza error y no deja filas |
| RF-01 | CA-2b coma/punto decimal; no numérico → rechazo | `test_ingesta.demo`: `50,5` se carga, `abc` se rechaza |
| RF-01 | CA-3 reporte de calidad por carga | `cargar.py` genera `reporte_calidad.md` (66 981 leídas, 0 rechazadas, 243 observadas) |
| RF-01 | CA-4 idempotencia | `test_ingesta.demo`: cargar dos veces deja 1 fila |
| RF-01 | Reparación verificable de filas partidas | `test_ingesta.demo_reparar`: 3 casos reparados, 1 sin ancla rechazado |
| RF-02 | CA-1b solo filas consolidadas por departamento-mes | `test_cruce.demo`: Amazonas suma 100, no 160 |
| RF-02 | CA-2 huérfanos listados | `test_cruce.demo`: `sin_directorio == ["08"]`, `sin_serie == ["25"]`; [`reporte_cruce.md`](../backend/reporte_cruce.md) |
| RF-03 | CA-1 al menos dos modelos | `test_analisis.demo`: promedio móvil, suavizado exponencial y estacional ingenuo |
| RF-03 | CA-2 MAE y MAPE sobre hold-out | `test_analisis.demo` (`mae == 0` en serie periódica, `mape` presente); `test_api.demo` |
| RF-03 | CA-3 < 24 meses → "no confiable" | `test_analisis.demo`: región `03` con 1 mes da `confiable is False` |
| RF-04 | CA-1 percentiles P75/P25 | `test_analisis.demo`: mes 12 = alta, mes 1 = baja |
| RF-04 | CA-2 2020–2021 atípico | `test_api.demo`: serie 2021 marcada `atipico`; temporada `excluye_pandemia` |
| RF-05 | CA-1 rango validado | `test_analisis.demo` (`ValueError`); `test_api.demo` (errores 400/404 por ruta) |
| RF-05 | CA-2 variación % y total | `test_analisis.demo`; `test_api.demo` (`variacion_pct`) |
| RF-06 | CA-1 filtros combinados | `test_analisis.demo` (Hotel + 3 Estrellas); `test_api.demo` ("Sin categoría") |
| RF-06 | CA-2 agregados con vacíos | `test_analisis.demo`: `sin_dato_camas_o_habitaciones == 1`; `test_api.demo`: `pct_sin_dato_capacidad == 50` |
| RF-07 | CA-1 selector de rango | `test_api.demo`: `/api/series` con `desde`/`hasta` devuelve solo ese rango |
| RF-08 | CA-1 CSV y PDF | `test_analisis.demo` (CSV reabre con las mismas filas); `test_api.demo` (`%PDF-1.4` … `%%EOF`) |

## 3. Requisitos no funcionales (ISO/IEC 25010)

| RNF | Característica | Evidencia |
|-----|----------------|-----------|
| RNF-01 | Adecuación funcional (corrección de datos) | Tabla de rechazos con línea y motivo; 243 filas observadas registradas en `reporte_calidad.md` |
| RNF-02 | Modificabilidad | Cada modelo de proyección es una clase con `predecir` (`analisis.py`); agregar uno no cambia las demás |
| RNF-03 | Capacidad de prueba | Todas las pruebas usan SQLite en memoria o carpetas temporales, sin la base real |
| RNF-04 | Fiabilidad | Carga idempotente y transaccional (`test_ingesta.demo`) |
| RNF-05 | Eficiencia | Base de 14 MB con índice único `ix_serie` (región, año, mes); pendiente medir formalmente el tiempo de `/api/series` contra el umbral de 2 s |
| RNF-06 | Portabilidad | Despliegue solo con variables de entorno (`HOST`, `PORT`, `ALLOWED_ORIGIN`); ver [arquitectura](09_arquitectura_nube.md) |

## 4. Resultado de la última ejecución
Fecha: 24-nov-2026, sobre `main` con los cambios del Prototipo (PR #3). Las mismas baterías corren en GitHub Actions en cada push y pull request.

```
python -m tests.test_ingesta   → OK · OK reparar
python -m tests.test_cruce     → OK cruce
python -m tests.test_analisis  → OK analisis
python -m tests.test_api       → OK api
cd frontend && npx vitest run  → 3 archivos, 15 pruebas pasadas
```
