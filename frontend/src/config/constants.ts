/** Constantes únicas del dominio SAPDT. Ningún rango ni umbral se escribe fuera de aquí. */
export const DATA_MIN = "2015-01";
export const DATA_MAX = "2025-06";
export const PAGE_SIZE = 12;
export const PANDEMIC: readonly [number, number] = [2020, 2021];
export const PARTIAL_YEAR = 2025;
export const PROJECTION_BASE_FROM = "2022-01";
export const DEFAULT_REGION = "04";

export const SEASON_P_HIGH = 75;
export const SEASON_P_LOW = 25;

export const CONFIDENCE_HIGH_BELOW = 10;
export const CONFIDENCE_MID_MAX = 20;

export const CAPACITY_WARNING_PCT = 10;

export const MOVING_AVERAGE_K = 3;
export const SES_ALPHA = 0.3;
export const BACKTEST_WINDOW = 12;
export const MIN_BASE_POINTS = 24;

export const COMPARE_MIN_REGIONS = 2;
export const COMPARE_MAX_REGIONS = 5;

export const PDF_MAX_ROWS = 300;
export const SEARCH_DEBOUNCE_MS = 300;

export const DATA_SOURCE_LABEL = "MINCETUR / Plataforma Nacional de Datos Abiertos";

export const MSG_RANGE_OUT_OF_DATA =
  "El rango de fechas seleccionado no cuenta con registros consolidados. Por favor, selecciona un periodo válido (Ene 2015 - Jun 2025)";
export const MSG_RANGE_ORDER = "La fecha inicial no puede ser posterior a la final.";
export const MSG_MIN_REGIONS = "Selecciona al menos 2 regiones para comparar.";
export const MSG_MAX_REGIONS = "Puedes comparar hasta 5 regiones a la vez.";
export const MSG_VOLATILE =
  "La volatilidad histórica de esta región sugiere tomar los datos únicamente como tendencia";
export const MSG_SUSPICIOUS =
  "Valor fuera de rango (> 100 %). Dato en revisión; interprétalo con cautela.";
export const LABEL_PANDEMIC = "Periodo Atípico - Pandemia";
export const LABEL_PARTIAL = "2025 (Año Parcial)";
