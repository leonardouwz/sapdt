# SAPDT — Sistema de Análisis y Proyección de Demanda Turística Regional

Proyecto de Calidad de Software (Universidad La Salle, 2026-VIII). Usa datos abiertos de MINCETUR
(ocupabilidad de hospedajes 2015–jun 2025 y directorio de establecimientos calificados).

## En la nube (Google Cloud Run)
- Interfaz: https://sapdt-web-606560700752.us-central1.run.app
- API: https://sapdt-api-606560700752.us-central1.run.app/api/regiones/04

Cómo se desplegó: ver `DEPLOY.md`.

## Carpetas
| Carpeta | Contenido |
|---|---|
| `backend/` | Carga, cruce y análisis de datos (Python, solo biblioteca estándar), API y pruebas. Ver `backend/LEEME.md`. |
| `backend/bd/sapdt.db` | Base de datos ya cargada con los datos reales. |
| `backend/datos_crudos/` | Archivos CSV originales descargados del portal. |
| `frontend/` | Interfaz web (React / TanStack Start). |
| `docs/` | Documentos del Hito 1 (requisitos, perfilado de datos, cronograma, diagramas). |

## Probar en local (Windows)
Requiere Python 3 y Node.js. Doble clic en `iniciar.bat`: abre la API (puerto 8000) y la interfaz (http://127.0.0.1:5199).

## Pruebas
```
cd backend
python -m tests.test_ingesta
python -m tests.test_cruce
python -m tests.test_analisis
python -m tests.test_api
cd ..\frontend
npm install --legacy-peer-deps
npx vitest run
```

## Volver a cargar los datos
```
cd backend
python -m sapdt.cargar datos_crudos bd\sapdt.db
python -m sapdt.cruce bd\sapdt.db
```
