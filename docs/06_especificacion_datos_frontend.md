# SAPDT — Especificación de datos para el frontend

Proyecto: Sistema de Análisis y Proyección de Demanda Turística Regional · Curso: Calidad de Software
Fecha: 6-oct-2026 · Base: `datos_crudos/` + `02_perfilado_datasets.md` + `01_catalogo_requisitos_final.md`

**Propósito.** Contrato entre el modelo de datos consolidado (frente de datos, RF-01/RF-02) y el frontend ya construido. Todo lo marcado **[Verificado]** se comprobó contra los archivos reales. Lo marcado **[Propuesta]** es un diseño a acordar: no vi el código del frontend, así que los endpoints y formatos JSON deben contrastarse con lo que ya espera.

---

## 1. Resumen: qué datos hay y para qué sirve cada uno

| Dataset | Archivo(s) | Granularidad | Uso en el frontend |
|---|---|---|---|
| **Serie de ocupabilidad** | `Indicadores_ocupabilidad_2015…2025.csv` (11 archivos, 61 890 filas) | departamento × mes (× clase × categoría) | RF-03, 04, 05, 07, 08 (gráficos, temporadas, comparativos, proyección) |
| **Directorio de hospedajes** | `Establecimientos_hospedajes_calificados.csv` (5 076 filas válidas) | establecimiento, foto al 5-oct-2026 | RF-06 (exploración) y oferta por región (RF-02) |

- Cobertura de la serie: **25 departamentos × 126 meses (ene-2015 → jun-2025)**, panel completo sin huecos. **2025 es parcial (6 meses)**.
- El directorio **no es una serie temporal**: es una foto (`fecha_corte`). Mostrarlo siempre como "oferta actual".
- **Clave de región para unir ambos: código de departamento de 2 dígitos** (`"04"` = Arequipa), nunca el nombre.

---

## 2. Catálogo de regiones (clave de cruce) [Verificado]

25 códigos, mismos nombres en ambos datasets. `codigo` = 2 primeros dígitos del UBIGEO.

| codigo | nombre | codigo | nombre | codigo | nombre |
|---|---|---|---|---|---|
| 01 | Amazonas | 10 | Huánuco | 19 | Pasco |
| 02 | Áncash | 11 | Ica | 20 | Piura |
| 03 | Apurímac | 12 | Junín | 21 | Puno |
| 04 | Arequipa | 13 | La Libertad | 22 | San Martín |
| 05 | Ayacucho | 14 | Lambayeque | 23 | Tacna |
| 06 | Cajamarca | 15 | Lima | 24 | Tumbes |
| 07 | Callao | 16 | Loreto | 25 | Ucayali |
| 08 | Cusco | 17 | Madre de Dios | | |
| 09 | Huancavelica | 18 | Moquegua | | |

Reglas para el frontend:
- Mostrar nombre en "Title Case"; las fuentes lo traen en MAYÚSCULAS. Respetar tildes (Áncash, Apurímac, Huánuco, Junín, San Martín).
- "Lima" **incluye** sus provincias; "Callao" es región aparte. No inventar "Lima Metropolitana".
- En la serie, `ubigeo` siempre termina en `0000` (nivel departamento). En el directorio llega a nivel distrito (6 dígitos reales, p. ej. `040519`).

---

## 3. Dataset A — Serie de ocupabilidad (modelo canónico)

### 3.1 Archivos crudos: dos esquemas [Verificado]

| Años | Columnas | Encabezados | Decimal |
|---|---|---|---|
| 2015–2023 | 23 | `AÑO;MES;CLASE;DESCRIPCIÓN CLASE;CATEGORÍA;…` | coma (`19,93`) |
| 2024 | 24 | `FECHA_CORTE;ANIO;MES;ID_CLASE;CLASE;…` | coma |
| 2025 | 24 | igual que 2024 | **punto** (`12.46`) |

Todos: separador `;`, codificación **Windows-1252**, saltos CRLF. En el esquema de 2015–2023 las columnas `CLASE`/`CATEGORÍA` son los **códigos** y `DESCRIPCIÓN …` el texto; en 2024+ `ID_CLASE`/`ID_CATEGORIA` son códigos y `CLASE`/`CATEGORIA` el texto. El pipeline los lleva a los nombres canónicos de abajo, así que **el frontend nunca ve el esquema crudo**.

### 3.2 Esquema canónico (tabla `serie_ocupabilidad`)

| Campo canónico | Tipo | Crudo 2015–23 | Crudo 2024+ | Descripción |
|---|---|---|---|---|
| `anio` | int | AÑO | ANIO | 2015–2025 |
| `mes` | int 1–12 | MES (`"01"`) | MES | Convertir a entero |
| `id_clase` | str | CLASE | ID_CLASE | `00,01,02,03,05,14,16,TT` |
| `clase` | str | DESCRIPCIÓN CLASE | CLASE | Texto de la clase |
| `id_categoria` | str | CATEGORÍA | ID_CATEGORIA | `00,01–05,12,13,TT` |
| `categoria` | str | DESCRIPCIÓN CATEGORÍA | CATEGORIA | Texto de la categoría |
| `departamento` | str | DEPARTAMENTO | DEPARTAMENTO | Nombre (solo para mostrar) |
| `ubigeo` | str(6) | UBIGEO | ID_UBIGEO | `"040000"`; guardar como **texto** (el cero inicial importa) |
| `n_establecimientos` | int | NÚMERO DE ESTABLECIMIENTO | NUMERO_ESTABLECIMIENTOS | |
| `n_habitaciones` | int | NÚMERO DE HABITACIONES | NUMERO_HABITACIONES | |
| `n_plazas_cama` | int | NÚMERO DE PLAZAS-CAMA | NUMERO_PLAZAS_CAMA | |
| `tnoh` | float % | TNOH EN EL MES(%) | PORCENTAJE_TNOH | Tasa neta de ocupación de **habitaciones** |
| `tnoc` | float % | TNOC EN EL MES(%) | PORCENTAJE_TNOC | Tasa neta de ocupación de **camas** |
| `perm` / `perm_nac` / `perm_ext` | float (días) | PROM PERMANENCIA… | PROMEDIO_PERMANENCIA… | Permanencia promedio total / nacional / extranjero |
| `arribos` / `arribos_nac` / `arribos_ext` | int | TOTAL DE ARRIBOS… | TOTAL_ARRIBOS… | Huéspedes que llegan en el mes |
| `pernoct` / `pernoct_nac` / `pernoct_ext` | int | TOTAL PERNOCT… | TOTAL_PERNOCT… | Noches de estadía |
| `empleo` | int | TOTAL EMPLEO EN EL MES | TOTAL_EMPLEO | Personal ocupado |
| `fecha_corte` | date \| null | — | FECHA_CORTE (`20260330`) | Solo 2024–2025; `null` antes |

Clave única: (`anio`, `mes`, `id_clase`, `id_categoria`, `ubigeo`).

### 3.3 Dominios (para filtros y leyendas) [Verificado]

`id_clase`: `00` No clasificado · `01` Hotel · `02` Apart Hotel · `03` Hostal · `05` Albergue · `14` Resort · `16` Ecolodge · **`TT` Todas consolidadas**
`id_categoria`: `00` No categorizado · `01` 1 estrella · `02` 2 · `03` 3 · `04` 4 · `05` 5 estrellas · `12` Albergue · `13` Ecolodge · **`TT` Todas consolidadas**

### 3.4 ⚠️ Regla crítica: jerarquía de totales [Verificado]

El archivo mezcla detalle y totales. **Sumar todas las filas da 4× el total real.**

> **Para cualquier gráfico, comparativo, temporada o proyección por departamento usar SOLO filas con `id_clase='TT'` y `id_categoria='TT'`.**
> Usar filas de detalle (clase/categoría concretas) únicamente para desgloses explícitos (p. ej. "por categoría").

El detalle no siempre suma el total (217 de 3 150 casos, 6,9 %, sobre todo Lima y Callao; diferencia −0,4 % a +1,7 %). Es una limitación conocida: **el total manda**.

### 3.5 Reglas de calidad que el frontend debe respetar

| Regla | Qué hacer en la UI |
|---|---|
| `tnoh` fuera de 0–100 % (49 filas, 0,08 %; máx. 244,89) | Viene marcada `sospechosa=true` [Propuesta]. No graficar sin filtrar; mostrar con aviso |
| 2020–2021 periodo atípico (arribos nacionales: 2019 = 63,2 M; 2020 = 36,4 M, −42,4 %; 2021 = 47,8 M) | Sombrear/etiquetar "Pandemia"; excluir por defecto de temporadas y de la base de proyección |
| 2025 parcial (ene–jun) | No comparar como año completo; rotular "2025 (ene–jun)" |
| Pernoctaciones ≥ arribos siempre | Si llegara un registro que lo viole, es rechazo, no dato |
| Sin nulos en campos numéricos | Si aparece `null`, tratarlo como dato faltante, **no como 0** |

Valores de referencia (arribos nacionales, suma de departamentos, TT/TT): 2015 47,9 M · 2016 50,6 M · 2017 51,9 M · 2018 55,4 M · 2019 63,2 M · 2020 36,4 M · 2021 47,8 M · 2022 53,3 M · 2023 53,0 M · 2024 57,6 M · 2025 (ene–jun) 30,0 M. **Útiles como prueba de aceptación de la integración** (si el frontend muestra otra cifra, está sumando mal).

### 3.6 Ejemplo real (Arequipa, enero 2024, TT/TT)

```json
{
  "anio": 2024, "mes": 1, "periodo": "2024-01",
  "region": { "codigo": "04", "nombre": "Arequipa" },
  "n_establecimientos": 1632, "n_habitaciones": 18814, "n_plazas_cama": 32600,
  "tnoh": 19.57, "tnoc": 16.17,
  "perm": 1.45, "perm_nac": 1.4, "perm_ext": 1.71,
  "arribos": 123630, "arribos_nac": 103470, "arribos_ext": 20160,
  "pernoct": 183164, "pernoct_nac": 146643, "pernoct_ext": 36521,
  "empleo": 3314,
  "atipico": false, "parcial": false, "sospechosa": false
}
```

Campos `periodo`, `region`, `atipico`, `parcial`, `sospechosa` son **derivados** [Propuesta] (los calcula el backend; no existen en el crudo).

---

## 4. Dataset B — Directorio de hospedajes (modelo canónico)

### 4.1 Archivo crudo [Verificado]
`;` como separador · Windows-1252 · CRLF · 28 columnas · **5 091 líneas: 5 076 válidas + 15 con 29 campos** (un `;` dentro de `RAZON_SOCIAL`). `fecha_corte` = `20261005`; el archivo se actualiza a diario.

### 4.2 Esquema canónico (tabla `establecimiento`)

Campos que **el frontend debe consumir**:

| Campo canónico | Tipo | Crudo | Notas |
|---|---|---|---|
| `id` | str | derivado | RUC + nombre comercial + ubigeo (el RUC solo **no** es único) |
| `ruc` | str(11) | RUC | Texto. 223 RUC aparecen en varios establecimientos |
| `razon_social` | str | RAZON_SOCIAL | `strip`, sin comillas |
| `nombre_comercial` | str | NOMBRE_COMERCIAL | Nombre a mostrar en listados |
| `ubigeo` | str(6) | UBIGEO | Distrito |
| `departamento_codigo` | str(2) | `UBIGEO[:2]` | **Clave de cruce** con la serie |
| `departamento` / `provincia` / `distrito` | str | DEPARTAMENTO / PROVINCIA / DISTRITO | Para mostrar |
| `clase` | enum | CLASE | `Hotel, Hostal, Albergue, Apart Hotel, Resort` |
| `categoria` | enum | CATEGORIA | `1 Estrella … 5 Estrellas, Sin categoría` (ver 4.3) |
| `habitaciones` | int \| null | HABI | Nulo en 3,2 % (164 filas). **No tratar como 0** |
| `camas` | int \| null | CAMA | ídem |
| `direccion` | str | VIA + DES_VIA + NUMERO (+ INTERIOR, ZONA, DES_ZONA) | Concatenación para mostrar |
| `telefono` | str \| null | TELEF1…4 | Texto libre (`54202587/958507109`); mostrar tal cual |
| `email` / `web` | str \| null | E_MAIL / PAGINA_WEB | Pueden venir inválidos; no validar fuerte. `web` vacío en 73 % |
| `fecha_expedicion` | date \| null | FECHA_EXPEDICION | Origen `17-AGO-2020 05:00:00` (mes en español); convertir a ISO `2020-08-17` |
| `nro_certificado` | str \| null | NRO_CERTIFICADO | Texto libre, **no usar como clave** |
| `fecha_corte` | date | FECHA_CORTE | Igual para todas las filas |

Campos del crudo que **no** se exponen: `REP_LEGAL` (dato personal, innecesario), `OBS_DOMICILIO`, `INTERIOR`, `ZONA`/`DES_ZONA` por separado.

### 4.3 Normalización requerida antes de exponer [Verificado]

| Hallazgo | Regla |
|---|---|
| Categoría `"0"` (1 fila) y `"Albergue"` (16 filas) en la columna de estrellas | Mapear a **"Sin categoría"** |
| `"Sin Categoria"` (sin tilde, 229 filas) | Normalizar a `"Sin categoría"` |
| Texto con espacios extra, comillas, mayúsculas variadas | `strip`, colapsar espacios, quitar comillas |
| Duplicados (25 combinaciones RUC+nombre+ubigeo) | Se deduplican en el pipeline; el frontend no los ve |
| 15 filas con 29 campos | Decisión del equipo: reparar o rechazar; en ambos casos quedan en el reporte de calidad |

Distribución real: 2 399 Hotel · 2 374 Hostal · 246 Albergue · 56 Apart Hotel · 1 Resort. Estrellas: 2 Estrellas 2 418 · 3 Estrellas 1 465 · 1 Estrella 700 · Sin categoría 229 (+17 normalizadas) · 4 Estrellas 176 · 5 Estrellas 71. Mayor oferta: Lima 960, Cusco 496, Cajamarca 416, Arequipa 403, Lambayeque 381.

### 4.4 Ejemplo real

```json
{
  "id": "20311643895|COLCA LODGE|040519",
  "ruc": "20311643895",
  "razon_social": "COLCA LODGE SOCIEDAD ANONIMA",
  "nombre_comercial": "COLCA LODGE",
  "ubigeo": "040519",
  "departamento_codigo": "04",
  "departamento": "Arequipa", "provincia": "Caylloma", "distrito": "Yanque",
  "clase": "Hotel", "categoria": "4 Estrellas",
  "habitaciones": 46, "camas": 89,
  "direccion": "VIA PUYE SN FND.",
  "telefono": "54202587/958507109",
  "email": "info@colca-lodge.com", "web": null,
  "fecha_expedicion": "2020-08-17",
  "nro_certificado": "Certificado 003-2020-GRA/GRCET/SGT.",
  "fecha_corte": "2026-10-05"
}
```

> Nota: el directorio identifica la clase por **texto** (`Hotel`) y la serie por **código** (`01`). Si el filtro de clase se comparte entre RF-06 y RF-07, mapear `Hotel↔01`, `Hostal↔03`, `Albergue↔05`, `Apart Hotel↔02`, `Resort↔14`.

---

## 5. Indicador cruzado por región (salida de RF-02) [Propuesta]

El directorio se agrega por `departamento_codigo` y se une a la serie por ese mismo código. Es un indicador **estático**, no una serie.

```json
{
  "region": { "codigo": "04", "nombre": "Arequipa" },
  "oferta_actual": {
    "fecha_corte": "2026-10-05",
    "establecimientos": 403,
    "habitaciones": 7498, "camas": 13609,
    "pct_sin_dato_capacidad": 11.4
  }
}
```

(Valores reales de Arequipa sin deduplicar. `habitaciones`/`camas` son suma sobre registros con dato; la UI debe mostrar `pct_sin_dato_capacidad` como advertencia.)

Ojo: `n_establecimientos` de la **serie** (p. ej. 1 632 en Arequipa, ene-2024) **no coincide** con el conteo del **directorio** (403): la encuesta mensual cubre más establecimientos que los clasificados/categorizados. No rotularlos con el mismo nombre en la UI.

---

## 6. Contrato de consumo por requisito [Propuesta — acordar con el frontend]

| RF | Vista | Endpoint sugerido | Parámetros | Devuelve |
|---|---|---|---|---|
| RF-07 | Series históricas | `GET /api/series` | `region` (1+ códigos), `desde`, `hasta` (`YYYY-MM`), `metrica` (`arribos\|pernoct\|…`) | Lista de puntos `{periodo, region, valor, atipico, parcial}` (solo TT/TT) |
| RF-05 | Comparativo | `GET /api/comparativo` | `regiones` (≥2), `desde`, `hasta` | Total y variación % por región; **400** si el rango no existe en los datos |
| RF-04 | Temporada | `GET /api/temporada` | `region`, `p_alta` (def. 75), `p_baja` (def. 25) | `{periodo, nivel: alta\|media\|baja}` |
| RF-03 | Proyección | `GET /api/proyeccion` | `region`, `horizonte` (3–6), `modelo` (`media_movil\|suavizado_exp`) | Puntos proyectados + `mae`, `mape`, `confiable` |
| RF-06 | Directorio | `GET /api/establecimientos` | `departamento`, `provincia`, `clase`, `categoria`, paginación | Lista + indicadores agregados |
| RF-02 | Oferta por región | `GET /api/regiones` | — | Catálogo de las 25 regiones + `oferta_actual` |
| RF-08 | Exportación | `GET /api/export/{reporte}` | `formato=csv\|pdf` + los filtros del reporte | Archivo |

Convenciones sugeridas: períodos `YYYY-MM`; `region` siempre como código de 2 dígitos; números como número JSON (no cadena con coma decimal); `null` explícito para dato faltante; errores con `{ "error": "mensaje claro" }`.

---

## 7. Checklist de integración (para tu compañera)

1. El selector de regiones usa los **25 códigos** de §2, no cadenas de nombre.
2. Toda serie por región se pide/filtra con **TT/TT**. Prueba: la suma nacional de 2019 debe dar ≈ **63,2 M** arribos (si da ≈ 253 M, está sumando 4×).
3. Decimales: la API entrega números reales (punto); el frontend no debe parsear comas.
4. 2020–2021 y 2025 se etiquetan (`atipico`, `parcial`) en gráficos y comparativos.
5. `habitaciones`, `camas` y `tnoh` pueden ser `null`/sospechosos: la UI muestra "s/d" o un aviso, nunca 0.
6. El directorio se rotula "Oferta al 5-oct-2026" (usar `fecha_corte`).
7. Las tildes y la Ñ se muestran correctas (el crudo es Windows-1252; si se ve `�`, el backend decodificó mal).
8. Rango de fechas válido: **2015-01 → 2025-06** (ampliar si se publica el 2.º semestre de 2025).

## 8. Pendientes / decisiones abiertas

- Confirmar con quien tiene el frontend los **nombres de campos y rutas** que ya espera; ajustar §6 o los alias del backend.
- Decidir tratamiento de las 15 filas con 29 campos (reparar vs. rechazar) — afecta el conteo del directorio (5 076 vs. 5 091).
- Arribos/pernoctaciones de datosTurismo (visor) no se verificaron como idénticos a la serie de ocupabilidad; la serie de ocupabilidad es la fuente única por ahora.
- Los agregados de §5 se calcularon sobre el crudo sin deduplicar; recalcular tras la deduplicación del pipeline.
