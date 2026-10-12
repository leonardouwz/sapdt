# Reporte de calidad de la carga (RF-01)

| Archivo | Esquema | Codif. | Leídas | Cargadas | Rechazadas | Observadas |
|---|---|---|---:|---:|---:|---:|
| Establecimientos_hospedajes_calificados.csv | directorio | cp1252 | 5091 | 5091 | 0 | 179 |
| Indicadores_ocupabilidad_2015.csv | antiguo (2015 a 2023) | cp1252 | 5731 | 5731 | 0 | 28 |
| Indicadores_ocupabilidad_2016.csv | antiguo (2015 a 2023) | cp1252 | 5720 | 5720 | 0 | 2 |
| Indicadores_ocupabilidad_2017.csv | antiguo (2015 a 2023) | cp1252 | 5813 | 5813 | 0 | 0 |
| Indicadores_ocupabilidad_2018.csv | antiguo (2015 a 2023) | cp1252 | 5896 | 5896 | 0 | 0 |
| Indicadores_ocupabilidad_2019.csv | antiguo (2015 a 2023) | cp1252 | 5901 | 5901 | 0 | 2 |
| Indicadores_ocupabilidad_2020.csv | antiguo (2015 a 2023) | cp1252 | 5502 | 5502 | 0 | 2 |
| Indicadores_ocupabilidad_2021.csv | antiguo (2015 a 2023) | cp1252 | 5980 | 5980 | 0 | 12 |
| Indicadores_ocupabilidad_2022.csv | antiguo (2015 a 2023) | cp1252 | 6017 | 6017 | 0 | 10 |
| Indicadores_ocupabilidad_2023.csv | antiguo (2015 a 2023) | cp1252 | 6111 | 6111 | 0 | 0 |
| Indicadores_ocupabilidad_2024.csv | nuevo (2024 en adelante) | cp1252 | 6151 | 6151 | 0 | 3 |
| Indicadores_ocupabilidad_2025.csv | nuevo (2024 en adelante) | cp1252 | 3068 | 3068 | 0 | 5 |

Total: 66981 leídas, 66981 cargadas, 0 rechazadas, 243 observadas.

## Establecimientos_hospedajes_calificados.csv
- Reparadas y cargadas: dirección con ';' dentro del texto, unida: 2
- Reparadas y cargadas: dos correos separados por ';', unidos: 12
- Reparadas y cargadas: dirección web con ';' en lugar de ':', corregida: 1
- Observación (se cargó marcada): camas o habitaciones vacías: 164
- Campos con vacíos (%): cama 3.2, habi 3.2, nombre_comercial 0.2, telef1 88.7, telef2 98.8, telef3 98.8, telef4 29.1, via 0.1, des_via 0.1, numero 15.1, interior 94.8, obs_domicilio 89.8, zona 76.6, des_zona 82.3, e_mail 35.5, pagina_web 72.9, nro_certificado 0.4, fecha_expedicion 0.4
- Posibles duplicados (RUC + nombre comercial + ubigeo): 25; RUC en varias filas: 223

## Indicadores_ocupabilidad_2015.csv
- Observación (se cargó marcada): tnoh fuera de 0-100: 26
- Observación (se cargó marcada): tnoc fuera de 0-100: 19

## Indicadores_ocupabilidad_2016.csv
- Observación (se cargó marcada): tnoh fuera de 0-100: 2
- Observación (se cargó marcada): tnoc fuera de 0-100: 2

## Indicadores_ocupabilidad_2019.csv
- Observación (se cargó marcada): tnoh fuera de 0-100: 2

## Indicadores_ocupabilidad_2020.csv
- Observación (se cargó marcada): tnoc fuera de 0-100: 1
- Observación (se cargó marcada): tnoh fuera de 0-100: 1

## Indicadores_ocupabilidad_2021.csv
- Observación (se cargó marcada): tnoh fuera de 0-100: 6
- Observación (se cargó marcada): tnoc fuera de 0-100: 6

## Indicadores_ocupabilidad_2022.csv
- Observación (se cargó marcada): tnoc fuera de 0-100: 3
- Observación (se cargó marcada): tnoh fuera de 0-100: 7

## Indicadores_ocupabilidad_2024.csv
- Observación (se cargó marcada): tnoc fuera de 0-100: 3
- Observación (se cargó marcada): tnoh fuera de 0-100: 1

## Indicadores_ocupabilidad_2025.csv
- Observación (se cargó marcada): tnoh fuera de 0-100: 4
- Observación (se cargó marcada): tnoc fuera de 0-100: 1
