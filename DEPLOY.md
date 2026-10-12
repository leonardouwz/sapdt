# Despliegue en Google Cloud Run

Dos servicios, según el diagrama de componentes: **API REST** (con la base SQLite incluida, solo lectura) y **Dashboard web**.
Desviación justificada del diagrama: en vez de Cloud SQL se usa SQLite empaquetada en el contenedor, porque los datos son de solo lectura (14 MB) y así no hay costo mensual de base de datos.

## Antes de empezar (una sola vez)
```
gcloud auth login
gcloud config set project TU_PROYECTO
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 1. Desplegar la API
```
cd backend
gcloud run deploy sapdt-api --source . --region us-central1 --allow-unauthenticated --memory 256Mi
```
Al terminar muestra la URL, por ejemplo `https://sapdt-api-xxxx.us-central1.run.app`. Prueba: `<URL>/api/regiones/04`.

## 2. Desplegar la interfaz
Crea `frontend/.env.production` (la URL de la API no es un secreto):
```
VITE_DATA_SOURCE=http
VITE_API_BASE_URL=https://sapdt-api-xxxx.us-central1.run.app/api
```
```
cd ../frontend
gcloud run deploy sapdt-web --source . --region us-central1 --allow-unauthenticated --memory 512Mi
```

## 3. Cerrar el acceso de la API a la interfaz
Con la URL que dio `sapdt-web`:
```
gcloud run services update sapdt-api --region us-central1 --update-env-vars ALLOWED_ORIGIN=https://sapdt-web-xxxx.us-central1.run.app
```

## Actualizar datos
Regenerar `backend/bd/sapdt.db` (ver `README.md`), hacer commit y repetir el paso 1.
