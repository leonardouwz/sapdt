/** Variables de entorno. Cambiar a la API real = VITE_DATA_SOURCE=http + VITE_API_BASE_URL. */
export const env = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? "mock") as "mock" | "http",
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api",
  mockLatencyMs: Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 400),
  mockFailRate: Number(import.meta.env.VITE_MOCK_FAIL_RATE ?? 0),
};
