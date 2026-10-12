# Despliegue en Google Cloud Run

Dos servicios, según el diagrama de componentes: **API REST** (con la base SQLite incluida, solo lectura) y **Dashboard web**.
Desviación justificada del diagrama: en vez de Cloud SQL se usa SQLite empaquetada en el contenedor, porque los datos son de solo lectura (14 MB) y así no hay costo mensual de base de datos.

## Servicios desplegados
Proyecto `sapdt-lasalle`, región `us-central1`:
- Interfaz (`sapdt-web`): https://sapdt-web-606560700752.us-central1.run.app
- API (`sapdt-api`): https://sapdt-api-606560700752.us-central1.run.app

## Antes de empezar (una sola vez)
```
gcloud auth login
gcloud config set project sapdt-lasalle
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```
En un proyecto nuevo, la cuenta de servicio que compila no trae permisos y el primer despliegue falla con `PERMISSION_DENIED`. Se arregla una vez (el número es el del proyecto):
```
gcloud projects add-iam-policy-binding sapdt-lasalle --member="serviceAccount:606560700752-compute@developer.gserviceaccount.com" --role="roles/run.builder"
```

## 1. Desplegar la API
```
cd backend
gcloud run deploy sapdt-api --source . --region us-central1 --allow-unauthenticated --memory 256Mi
```
Al terminar muestra la URL. Prueba: https://sapdt-api-606560700752.us-central1.run.app/api/regiones/04

## 2. Desplegar la interfaz
`frontend/.env.production` ya está en el repositorio (la URL de la API no es un secreto):
```
VITE_DATA_SOURCE=http
VITE_API_BASE_URL=https://sapdt-api-606560700752.us-central1.run.app/api
```
```
cd ../frontend
gcloud run deploy sapdt-web --source . --region us-central1 --allow-unauthenticated --memory 512Mi
```

## 3. Cerrar el acceso de la API a la interfaz
Con la URL que dio `sapdt-web`:
```
gcloud run services update sapdt-api --region us-central1 --update-env-vars ALLOWED_ORIGIN=https://sapdt-web-606560700752.us-central1.run.app
```

## Actualizar datos
Regenerar `backend/bd/sapdt.db` (ver `README.md`), hacer commit y repetir el paso 1.
