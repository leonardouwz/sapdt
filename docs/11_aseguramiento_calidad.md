# SAPDT — Plan de aseguramiento de la calidad (SQA)

Marco: **ISO/IEC 25010** para las características de calidad del producto, **ISO/IEC/IEEE 29119** como referencia para las pruebas e **IEEE 730** para la estructura del plan de SQA. El responsable de calidad es Nicolle Lozano Vega.

## 1. Objetivo
El enfoque del proyecto es la **calidad de los datos**: que ninguna fila del portal se pierda en silencio y que cada número que ve el usuario se pueda rastrear hasta el archivo original.

## 2. Modelo de calidad (ISO/IEC 25010)

| Característica | Subcaracterística | Métrica | Meta | Resultado |
|----------------|-------------------|---------|------|-----------|
| Adecuación funcional | Corrección | Filas rechazadas registradas con línea y motivo | 100 % | 100 % (0 rechazadas, 243 observadas de 66 981) |
| Adecuación funcional | Completitud | RF con criterios de aceptación verificados | 8 de 8 | 8 de 8 ([matriz](07_matriz_trazabilidad.md)) |
| Fiabilidad | Madurez | Recargar los mismos archivos no duplica filas | 0 duplicados | Cumple (`test_ingesta`) |
| Mantenibilidad | Modificabilidad | Clases existentes que se tocan para agregar un modelo de proyección | ≤ 1 | 0 (cada modelo es una clase con `predecir`) |
| Mantenibilidad | Capacidad de prueba | Pruebas que no necesitan la base real | 100 % | 100 % (SQLite en memoria y carpetas temporales) |
| Eficiencia de desempeño | Comportamiento temporal | Tiempo de `/api/series` con el histórico completo | < 2 s | Pendiente de medición formal |
| Portabilidad | Instalabilidad | Despliegue con solo variables de entorno | Sí | Cumple ([DEPLOY.md](../DEPLOY.md)) |
| Seguridad | Confidencialidad | Credenciales en el repositorio | 0 | 0; API cerrada a la interfaz con CORS |
| Usabilidad | Accesibilidad | Modo claro/oscuro y exportación legible en Excel | Sí | Cumple |

## 3. Calidad de los datos
Reglas de validación que se aplican en la carga (`backend/sapdt/validador.py`, `normalizador.py`):

| Regla | Acción si falla |
|-------|-----------------|
| Archivo con un número de columnas desconocido | Se rechaza completo, sin carga parcial |
| Valor no numérico en un campo numérico | La fila va a la tabla `rechazos` con línea y motivo |
| Tasa de ocupación (TNOH, TNOC) fuera de 0–100 % | Se carga marcada como observada |
| Pernoctaciones menores que arribos | Se carga marcada como observada |
| Camas o habitaciones vacías en el directorio | Se carga marcada; los agregados informan el % sin dato |
| Fila del directorio partida por `;` dentro del texto | Se repara solo si el resultado es verificable; si no, se rechaza |
| Región presente en una fuente y no en la otra | Se lista en el reporte de huérfanos |

Resultados de la carga real: [`backend/reporte_calidad.md`](../backend/reporte_calidad.md) y [`backend/reporte_cruce.md`](../backend/reporte_cruce.md).

## 4. Estrategia de pruebas

| Nivel | Qué cubre | Herramienta | Archivo |
|-------|-----------|-------------|---------|
| Unitarias | Normalización, reparación, modelos de proyección, percentiles, formato | `assert` de Python; Vitest | `backend/tests/test_ingesta.py`, `test_analisis.py`; `frontend/src/test/domain.test.ts` |
| Integración | Cruce sobre SQLite; API completa con base en memoria (rutas, errores 400/404, CSV y PDF) | `assert` de Python | `backend/tests/test_cruce.py`, `test_api.py` |
| Sistema | Rutas de la interfaz y datos de referencia (totales nacionales 2019 y 2024) | Vitest | `frontend/src/test/app-routing.test.tsx`, `domain.test.ts` |
| Aceptación | Criterios de aceptación de cada RF | Pruebas anteriores + revisión manual en la URL desplegada | [Matriz de trazabilidad](07_matriz_trazabilidad.md) |

Diseño de casos: particiones de equivalencia (archivo válido / esquema desconocido / valor no numérico), valores límite (región con 1 mes frente al mínimo de 24; rango de fechas fuera de los datos) y oráculos conocidos (serie periódica que debe dar MAE = 0).

## 5. Revisiones y control
- Revisión por pares de cada pull request (mínimo 1 revisor), con la lista de verificación de la [gestión de configuración](08_gestion_configuracion.md#4-control-de-cambios-pull-requests).
- Antes de cada hito: correr todas las pruebas, revisar la matriz de trazabilidad y probar a mano la versión desplegada.
- Los defectos se registran como *issues* en GitHub con la etiqueta `bug` y el RF afectado.

## 6. Defectos y pendientes conocidos

| Pendiente | Impacto | Acción |
|-----------|---------|--------|
| Prueba manual del botón "Descargar PDF" en la web | Bajo (la API ya tiene prueba automática del PDF) | Probar en la URL desplegada antes de la presentación |
| Medición formal del tiempo de respuesta (RNF-05) | Bajo | Medir `/api/series` con el histórico completo |
| Error de proyección de 10 % a 16 % (MAPE) | Medio | Se muestra junto al pronóstico; se puede probar otro modelo |
| Datos solo hasta junio de 2025 | Bajo | Se indica en la interfaz; la carga admite archivos nuevos |
