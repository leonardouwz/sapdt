# SAPDT — Carga y unificación de datos (RF-01)

Lee los archivos abiertos del MINCETUR (ocupabilidad 2015–2025 y directorio de hospedajes), los unifica en una base SQLite y genera un reporte de calidad.

## Uso
```
python -m sapdt.cargar ..\datos_crudos            # base en bd\sapdt.db
python -m sapdt.cargar ..\datos_crudos otra\ruta.db
python tests\test_ingesta.py                       # prueba rápida
```
Solo usa la biblioteca estándar de Python (3.10 o más). Volver a cargar no duplica filas.

## Qué hace con cada archivo
| Situación | Qué pasa |
|---|---|
| Codificación utf-8 o cp1252, separador `;` | Se detecta sola |
| Ocupabilidad con 23 columnas (hasta 2023) o 24 (desde 2024, trae FECHA_CORTE) | Se detecta por el encabezado |
| Coma o punto decimal | Se acepta ambos |
| Fecha `09-MAR-2021 05:00:00` o `20261005` | Se guarda como AAAA-MM-DD |
| Archivo con otro número de columnas | Se rechaza completo, no se carga nada |
| Fila con valor no numérico o ubigeo inválido | Se rechaza y queda en la tabla `rechazos` con línea y motivo |
| Tasa de ocupación fuera de 0–100, pernoctaciones menores que arribos, camas o habitaciones vacías | Se carga marcada en la columna `observacion` |

## Reparación de filas del directorio (15 filas con un campo de más)
El portal separa campos con `;`, pero 15 filas traen un `;` dentro de un texto y quedan con 29 campos en vez de 28. Se reparan solo si el resultado cumple las anclas (ubigeo de 6 dígitos seguido del departamento en mayúsculas); si no, se rechazan como antes.

| Caso | Ejemplo (línea del archivo) | Reparación |
|---|---|---|
| Dos correos separados por `;` | 2260, 2862, 3365, 3753, 3930, 4514, 4516, 4619, 4757, 4768, 4828, 5008 | Se unen en un campo: `a@x.com; b@x.com` |
| Dirección web con `;` en lugar de `:` | 2911 (`https;//:www...`) | Se corrige a `https://www...` |
| Dirección cortada por `;` | 1980, 4261 | Se une el trozo cortado con el anterior: `... MZ-K; LT 36, 37, 38` |

Cada fila reparada queda con `observacion = "reparada: ..."` y el reporte de calidad indica cuántas fueron por cada caso. El texto original sigue en el archivo fuente; nada se inventa, solo se vuelve a unir lo que el `;` separó.

## Si algo falla al abrir la base
SQLite no siempre funciona sobre carpetas sincronizadas o montadas; si da `disk I/O error`, usar una ruta local normal (por ejemplo `C:\dev\sapdt\backend\bd\sapdt.db`).

## RF-02 — Cruce por región y mes
```
python -m sapdt.cruce bd\sapdt.db     # crea las tablas serie_region_mes y directorio_por_region, y escribe reporte_cruce.md
```
- **Clave de región:** los 2 primeros dígitos del ubigeo (`010000` → `01`). El nombre solo se usa para mostrar.
- **Serie mensual (`serie_region_mes`):** usa solo la fila consolidada de cada departamento y mes (clase `TT` y categoría `TT`). Sumar todas las filas daría unas 4 veces el total. Si hubiera más de una consolidada para el mismo departamento y mes, el cruce se detiene con un error y no crea nada.
- **Directorio por región (`directorio_por_region`):** cuenta establecimientos y suma camas y habitaciones. Es una foto a la fecha de corte, no una serie en el tiempo.
- **Huérfanos:** el reporte lista regiones que están en una fuente y no en la otra, nombres distintos para el mismo código y meses faltantes. Nada se descarta en silencio.
- Prueba: `python tests\test_cruce.py`.

## RF-03 a RF-06 y RF-08 — Análisis y reportes (`sapdt/analisis.py`)
```
python -m sapdt.reportes bd\sapdt.db salidas    # escribe 4 CSV en la carpeta salidas
python tests\test_analisis.py
```
| Requisito | Función | Qué hace |
|---|---|---|
| RF-03 | `proyectar` | Pronostica 1 a 12 meses con 3 modelos intercambiables (promedio móvil, suavizado exponencial, estacional ingenuo). Calcula MAE y MAPE contra los últimos 12 meses reales. Marca «no confiable» si la región tiene menos de 24 meses. |
| RF-04 | `temporada` | Clasifica cada mes como alta (desde el percentil 75), baja (hasta el 25) o media; los umbrales son configurables. 2020 y 2021 salen como «atípico» y no definen los umbrales. También da la temporada típica de cada mes del año. |
| RF-05 | `comparar` | Total del periodo por región y variación contra el periodo anterior de igual largo. Rechaza menos de 2 regiones, rango al revés o fuera de los datos. |
| RF-06 | `buscar_directorio` | Filtros combinables por departamento, provincia, clase y categoría. Da cantidad de establecimientos, habitaciones y camas, y cuántos no tienen ese dato. |
| RF-08 | `exportar_csv` | CSV con tildes que abre bien en Excel. Los reportes también salen en PDF sencillo (tabla de texto, hasta 500 filas; el CSV trae todo). |

Para agregar un modelo de proyección basta una clase nueva con el método `predecir` y una línea en `MODELOS`. Los datos llegan hasta junio de 2025, así que las proyecciones empiezan en julio de 2025.

## API y interfaz web
```
iniciar.bat     # abre la API en http://127.0.0.1:8000/api y la interfaz web (npm run dev)
```
La API (`sapdt/api.py`, solo biblioteca estándar) abre la base en modo solo lectura y responde lo que pide la interfaz: `/regiones`, `/series`, `/temporada`, `/proyeccion`, `/comparativo`, `/establecimientos` y `/export/{reporte}` (`formato=csv` o `formato=pdf`). Para usar los datos simulados otra vez, arrancar la interfaz sin las dos variables `VITE_...`.
Prueba: `python tests\test_api.py`. Comprobado con Chromium contra los datos reales (5 pantallas); `iniciar.bat` no se probó en Windows.
